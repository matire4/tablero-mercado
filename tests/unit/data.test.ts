import { describe, expect, it } from 'vitest';
import { configFromEnv, getHistory, getNews, getQuotes, type DataConfig } from '../../src/lib/data';

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
  it('blue 30 días: serie recortada y brecha superpuesta', async () => {
    const r = await getHistory('blue', 30, mock('normal'));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.series.length).toBeGreaterThanOrEqual(30);
    expect(r.data.series.every((p) => p.date >= '2026-08-29' && p.date <= '2026-09-28')).toBe(true);
    expect(r.data.gapSeries?.length).toBe(r.data.series.length);
  });
  it('oficial y riesgo país: sin serie de brecha (H1-3)', async () => {
    const o = await getHistory('oficial', 7, mock('normal'));
    const rp = await getHistory('riesgo-pais', 7, mock('normal'));
    expect(o.ok && o.data.gapSeries).toBeNull();
    expect(rp.ok && rp.data.gapSeries).toBeNull();
  });
  it('rango 7 en viernes-cerrado recorta con la fecha del fixture', async () => {
    const r = await getHistory('mep', 7, mock('viernes-cerrado'));
    expect(r.ok && r.data.series[r.data.series.length - 1].date).toBe('2026-09-25');
  });
});

describe('getNews en modo mock', () => {
  it('devuelve las notas del fixture que entran en los temas fijos', async () => {
    const r = await getNews(mock('normal'));
    expect(r.ok && r.data.items.length).toBeGreaterThan(0);
    expect(r.ok && r.data.sources).toEqual({ ok: 1, total: 1 });
    expect(r.ok && r.data.items.every((n) => typeof n.topic === 'string')).toBe(true);
  });
});
