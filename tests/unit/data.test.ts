import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { configFromEnv, getHistory, getNews, getQuotes, type DataConfig } from '../../src/lib/data';
import { ARGDATOS_BASE, historicoUrl } from '../../src/lib/providers/argentinadatos';
import feriadosRaw from '../../src/lib/fixtures/raw/argdatos-feriados.json';
import historyBlue from '../../src/lib/fixtures/history-blue.json';
import historyOficial from '../../src/lib/fixtures/history-oficial.json';

const mock = (scenario: DataConfig['scenario']): DataConfig => ({ mock: true, scenario, newsApiKey: undefined });
const env = (vars: Record<string, string>) => vars as unknown as NodeJS.ProcessEnv;

describe('configFromEnv', () => {
  it('lee las variables y cae a normal si el escenario no existe', () => {
    expect(configFromEnv(env({ USE_MOCK_DATA: 'true', MOCK_SCENARIO: 'sin-oficial' }))).toMatchObject({ mock: true, scenario: 'sin-oficial' });
    expect(configFromEnv(env({ USE_MOCK_DATA: 'true', MOCK_SCENARIO: 'otro' })).scenario).toBe('normal');
    expect(configFromEnv(env({})).mock).toBe(false);
  });
});

describe('getQuotes en modo mock', () => {
  it('normal: 5 activos ok, brecha y variación calculadas, mercado abierto, mock: true', async () => {
    const r = await getQuotes(mock('normal'));
    expect(r.mock).toBe(true);
    expect(r.market).toMatchObject({ isOpen: true, reason: 'open' });
    for (const a of ['blue', 'mep', 'oficial', 'tarjeta', 'riesgo-pais'] as const) expect(r.quotes[a].ok).toBe(true);
    const blue = r.quotes.blue.ok ? r.quotes.blue.data : null;
    expect(blue?.gapVsOficial).toBe(1); // 1560 vs 1545
    expect(blue?.changePct).toBe(0); // lunes vs domingo, mismo valor
    const oficial = r.quotes.oficial.ok ? r.quotes.oficial.data : null;
    expect(oficial?.gapVsOficial).toBeNull();
    const riesgo = r.quotes['riesgo-pais'].ok ? r.quotes['riesgo-pais'].data : null;
    expect(riesgo?.changePct).toBe(5.4); // 609 vs 578
    expect(riesgo?.gapVsOficial).toBeNull();
  });

  it('sin-oficial: el oficial falla, la brecha queda null y el precio de los demás sigue (H1-4)', async () => {
    const r = await getQuotes(mock('sin-oficial'));
    expect(r.quotes.oficial).toMatchObject({ ok: false, error: { kind: 'empty' } });
    const blue = r.quotes.blue.ok ? r.quotes.blue.data : null;
    expect(blue?.sell).toBe(1560);
    expect(blue?.gapVsOficial).toBeNull();
    expect(blue?.changePct).toBe(0); // la variación no depende del oficial
  });

  it('viernes-cerrado: mercado cerrado con el reloj del fixture, brecha sobre últimos valores (H1-5)', async () => {
    const r = await getQuotes(mock('viernes-cerrado'));
    expect(r.market).toMatchObject({ isOpen: false, reason: 'outside-hours', lastCloseAt: '2026-09-25T21:00:00.000Z' });
    expect(r.fetchedAt).toBe('2026-09-25T22:30:00.000Z');
    const blue = r.quotes.blue.ok ? r.quotes.blue.data : null;
    expect(blue?.gapVsOficial).toBe(1.3); // 1560 vs 1540 del 25/09
  });
});

describe('getHistory en modo mock', () => {
  it('blue 30 días: exactamente 30 fechas (30/08 a 28/09) y brecha superpuesta', async () => {
    const r = await getHistory('blue', 30, mock('normal'));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    // blue tiene un dato por día calendario: 30 días = 30 puntos. Antes del 30/09 daba 31 (hallazgo #4 de QA).
    expect(r.data.series.length).toBe(30);
    expect(r.data.series[0].date).toBe('2026-08-30');
    expect(r.data.series[r.data.series.length - 1].date).toBe('2026-09-28');
    expect(r.data.gapSeries?.length).toBe(r.data.series.length);
  });
  it('oficial y riesgo país: sin serie de brecha (H1-3)', async () => {
    const o = await getHistory('oficial', 7, mock('normal'));
    const rp = await getHistory('riesgo-pais', 7, mock('normal'));
    expect(o.ok && o.data.gapSeries).toBeNull();
    expect(rp.ok && rp.data.gapSeries).toBeNull();
  });
  it('rango 7 en viernes-cerrado recorta con la fecha del fixture: 7 fechas, del 19/09 al 25/09', async () => {
    const r = await getHistory('mep', 7, mock('viernes-cerrado'));
    if (!r.ok) throw new Error('se esperaba ok');
    expect(r.data.series[0].date).toBe('2026-09-19');
    expect(r.data.series[r.data.series.length - 1].date).toBe('2026-09-25');
  });
});

describe('getHistory en modo real con MSW (H0-6)', () => {
  const real: DataConfig = { mock: false, scenario: 'normal', newsApiKey: undefined };
  const server = setupServer();
  beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  // getHistory('blue') pide también el oficial (brecha) y los feriados (estado de mercado): esas dos responden bien.
  const conBlue = (blue: () => Response) =>
    server.use(
      http.get(historicoUrl('blue'), blue),
      http.get(historicoUrl('oficial'), () => HttpResponse.json(historyOficial)),
      http.get(`${ARGDATOS_BASE}/feriados/:year`, () => HttpResponse.json(feriadosRaw)),
    );

  it('ArgentinaDatos devuelve [] → ok con serie vacía y sin brecha ("sin datos", no error)', async () => {
    conBlue(() => HttpResponse.json([]));
    const r = await getHistory('blue', 30, real);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.series).toEqual([]);
    expect(r.data.gapSeries).toBeNull(); // aunque el oficial tenga datos
  });
  it('ArgentinaDatos devuelve 500 → sigue siendo error', async () => {
    conBlue(() => new HttpResponse(null, { status: 500 }));
    expect(await getHistory('blue', 30, real)).toMatchObject({ ok: false, error: { kind: 'upstream' } });
  });
  it('ArgentinaDatos cambia el formato (renombra fecha) → error invalid, no "sin datos" (hallazgo #8)', async () => {
    conBlue(() => HttpResponse.json([{ casa: 'blue', compra: 1, venta: 2, fechaRenombrada: '2026-09-28' }]));
    expect(await getHistory('blue', 30, real)).toMatchObject({ ok: false, error: { kind: 'invalid' } });
  });
  it('blue bien y oficial con 500 → ok, sin serie de brecha y gapUnavailable: true (hallazgo #10)', async () => {
    server.use(
      http.get(historicoUrl('blue'), () => HttpResponse.json(historyBlue)),
      http.get(historicoUrl('oficial'), () => new HttpResponse(null, { status: 500 })),
      http.get(`${ARGDATOS_BASE}/feriados/:year`, () => HttpResponse.json(feriadosRaw)),
    );
    const r = await getHistory('blue', 30, real);
    expect(r).toMatchObject({ ok: true, data: { gapSeries: null, gapUnavailable: true } });
  });
  it('blue con la mitad de los venta en null → ok, skippedPoints > 0 y una línea [history] en el log (hallazgo #9)', async () => {
    const roto = historyBlue.map((p, i) => (i % 2 === 0 ? { ...p, venta: null } : p));
    conBlue(() => HttpResponse.json(roto));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const r = await getHistory('blue', 30, real);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.data.skippedPoints).toBe(Math.ceil(historyBlue.length / 2));
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toBe(`[history] blue: ${r.data.skippedPoints} puntos descartados por formato`);
    } finally {
      warn.mockRestore();
    }
  });
  it('blue bien y oficial con la mitad de los venta en null → los descartados del oficial cuentan en skippedPoints y salen en el log (hallazgo #11)', async () => {
    const oficialRoto = historyOficial.map((p, i) => (i % 2 === 0 ? { ...p, venta: null } : p));
    server.use(
      http.get(historicoUrl('blue'), () => HttpResponse.json(historyBlue)),
      http.get(historicoUrl('oficial'), () => HttpResponse.json(oficialRoto)),
      http.get(`${ARGDATOS_BASE}/feriados/:year`, () => HttpResponse.json(feriadosRaw)),
    );
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const r = await getHistory('blue', 30, real);
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      const descartados = Math.ceil(historyOficial.length / 2);
      expect(r.data.skippedPoints).toBe(descartados); // blue no tiene descartados: es todo del oficial
      expect(r.data.gapUnavailable).toBe(false);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toBe(`[history] oficial (brecha de blue): ${descartados} puntos descartados por formato`);
    } finally {
      warn.mockRestore();
    }
  });
  it('oficial como activo con puntos inválidos → avisa por su propia serie, una sola línea (hallazgo #11)', async () => {
    const oficialRoto = historyOficial.map((p, i) => (i % 2 === 0 ? { ...p, venta: null } : p));
    server.use(
      http.get(historicoUrl('oficial'), () => HttpResponse.json(oficialRoto)),
      http.get(`${ARGDATOS_BASE}/feriados/:year`, () => HttpResponse.json(feriadosRaw)),
    );
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const r = await getHistory('oficial', 30, real);
      expect(r).toMatchObject({ ok: true, data: { skippedPoints: Math.ceil(historyOficial.length / 2), gapUnavailable: false } });
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toBe(`[history] oficial: ${Math.ceil(historyOficial.length / 2)} puntos descartados por formato`);
    } finally {
      warn.mockRestore();
    }
  });
  it('oficial: la brecha no aplica → gapUnavailable: false (H1-3)', async () => {
    server.use(
      http.get(historicoUrl('oficial'), () => HttpResponse.json(historyOficial)),
      http.get(`${ARGDATOS_BASE}/feriados/:year`, () => HttpResponse.json(feriadosRaw)),
    );
    expect(await getHistory('oficial', 30, real)).toMatchObject({ ok: true, data: { gapSeries: null, gapUnavailable: false } });
  });
});

describe('getNews en modo mock', () => {
  it('devuelve notas en español y en inglés, dentro de los temas fijos', async () => {
    const r = await getNews(mock('normal'));
    if (!r.ok) throw new Error('se esperaba ok');
    expect(r.data.mock).toBe(true);
    expect(r.data.sources).toEqual({ ok: 2, total: 2, failed: [] });
    expect(r.data.items.some((n) => n.lang === 'es')).toBe(true);
    expect(r.data.items.some((n) => n.lang === 'en')).toBe(true);
    expect(r.data.items.every((n) => typeof n.topic === 'string')).toBe(true);
  });
  it('usa el reloj de la captura: ninguna nota queda en el futuro, sea cual sea el escenario', async () => {
    for (const s of ['normal', 'viernes-cerrado', 'sin-oficial'] as const) {
      const r = await getNews(mock(s));
      if (!r.ok) throw new Error('se esperaba ok');
      expect(r.data.fetchedAt).toBe('2026-09-29T09:32:00.000Z');
      expect(r.data.items.every((n) => n.publishedAt <= r.data.fetchedAt)).toBe(true);
    }
  });
});
