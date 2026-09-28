import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { normalizeDolares } from '../../src/lib/providers/dolarapi';
import { normalizeFeriados, normalizeHistorico, normalizeRiesgoUltimo } from '../../src/lib/providers/argentinadatos';
import { assignTopic, fetchNews, GNEWS_URL, normalizeNews } from '../../src/lib/providers/news';
import dolares from '../../src/lib/fixtures/raw/dolarapi-dolares.json';
import riesgoUltimo from '../../src/lib/fixtures/raw/argdatos-riesgo-ultimo.json';
import feriados from '../../src/lib/fixtures/raw/argdatos-feriados.json';
import historyBlue from '../../src/lib/fixtures/history-blue.json';
import historyRiesgo from '../../src/lib/fixtures/history-riesgo-pais.json';
import gnews from '../../src/lib/fixtures/raw/gnews-search.json';

describe('DolarAPI → Quote', () => {
  it('mapea las 4 casas del alcance con la respuesta real; bolsa → mep', () => {
    const q = normalizeDolares(dolares);
    expect(q.blue).toMatchObject({ ok: true, data: { sell: 1560, buy: 1540, label: 'Dólar blue', unit: 'ARS', updatedAtHasTime: true } });
    expect(q.mep).toMatchObject({ ok: true, data: { sell: 1557.3, label: 'Dólar MEP' } });
    expect(q.oficial).toMatchObject({ ok: true, data: { sell: 1545 } });
    expect(q.tarjeta).toMatchObject({ ok: true, data: { sell: 2008.5, updatedAt: '2026-09-28T10:00:00.000Z' } });
    expect(Object.keys(q).sort()).toEqual(['blue', 'mep', 'oficial', 'tarjeta']);
  });
  it('casa ausente → empty solo para ese activo', () => {
    const q = normalizeDolares(dolares.filter((d) => d.casa !== 'oficial'));
    expect(q.oficial).toMatchObject({ ok: false, error: { kind: 'empty' } });
    expect(q.blue.ok).toBe(true);
  });
  it('respuesta que no es lista → invalid para todos', () => {
    const q = normalizeDolares({ mensaje: 'mantenimiento' });
    expect(q.blue).toMatchObject({ ok: false, error: { kind: 'invalid' } });
  });
  it('item con campos de tipo incorrecto se ignora', () => {
    const q = normalizeDolares([{ casa: 'blue', compra: '1540', venta: 1560, fechaActualizacion: 'x' }]);
    expect(q.blue.ok).toBe(false);
  });
});

describe('ArgentinaDatos', () => {
  it('riesgo país último con la respuesta real: sin hora', () => {
    expect(normalizeRiesgoUltimo(riesgoUltimo)).toMatchObject({
      ok: true,
      data: { asset: 'riesgo-pais', sell: 609, buy: null, unit: 'puntos', updatedAt: '2026-09-25T00:00:00-03:00', updatedAtHasTime: false },
    });
  });
  it('riesgo país con forma incorrecta → invalid', () => {
    expect(normalizeRiesgoUltimo({ valor: '609' })).toMatchObject({ ok: false, error: { kind: 'invalid' } });
  });
  it('histórico de dólar usa venta; de riesgo país usa valor', () => {
    const b = normalizeHistorico(historyBlue, 'venta');
    const r = normalizeHistorico(historyRiesgo, 'valor');
    expect(b.ok && b.data[b.data.length - 1]).toEqual({ date: '2026-09-28', value: 1560 });
    expect(r.ok && r.data[r.data.length - 1]).toEqual({ date: '2026-09-25', value: 609 });
  });
  it('histórico sin puntos válidos → empty', () => {
    expect(normalizeHistorico([{ fecha: 'ayer', venta: 1 }], 'venta')).toMatchObject({ ok: false, error: { kind: 'empty' } });
  });
  it('feriados → lista de fechas', () => {
    const f = normalizeFeriados(feriados);
    expect(f.ok && f.data).toContain('2026-10-12');
    expect(f.ok && f.data.length).toBe(19);
  });
});

describe('GNews', () => {
  it('asignación de tema: prioridad riesgo país > BCRA > Fed > inflación > dólar > mercados', () => {
    expect(assignTopic('El riesgo país cae tras la baja del dólar')).toBe('riesgo-pais');
    expect(assignTopic('El BCRA compró dólares y bajó la inflación esperada')).toBe('bcra');
    expect(assignTopic('La Fed mantiene tasas; el dólar reacciona')).toBe('fed');
    expect(assignTopic('Inflación de septiembre: qué pasa con el dólar')).toBe('inflacion');
    expect(assignTopic('Dólar blue hoy: a cuánto cotiza')).toBe('dolar');
    expect(assignTopic('Wall Street cierra mixto')).toBe('mercados');
  });
  it('normaliza la respuesta real', () => {
    const n = normalizeNews(gnews, 'es');
    expect(n.ok && n.data.length).toBe(10);
    expect(n.ok && n.data[0]).toMatchObject({ source: 'Clarin', lang: 'es', publishedAt: '2026-09-27T07:00:06Z', topic: 'dolar' });
  });
  it('sin articles → invalid; articles vacío → ok con lista vacía (sin datos, no error)', () => {
    expect(normalizeNews({ totalArticles: 0 }, 'es')).toMatchObject({ ok: false, error: { kind: 'invalid' } });
    expect(normalizeNews({ totalArticles: 0, articles: [] }, 'es')).toEqual({ ok: true, data: [] });
  });

  describe('fetchNews con MSW', () => {
    const server = setupServer();
    beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
    afterEach(() => server.resetHandlers());
    afterAll(() => server.close());

    it('sin key → upstream, sin llamar al proveedor', async () => {
      expect(await fetchNews(undefined)).toMatchObject({ ok: false, error: { kind: 'upstream' } });
    });
    it('una búsqueda falla con 429 y la otra responde → ok con lo que hay', async () => {
      server.use(
        http.get(GNEWS_URL, ({ request }) =>
          new URL(request.url).searchParams.get('lang') === 'en' ? new HttpResponse(null, { status: 429 }) : HttpResponse.json(gnews),
        ),
      );
      const res = await fetchNews('clave-de-prueba');
      expect(res.ok && res.data.length).toBe(10);
      expect(res.ok && res.data.every((n) => n.lang === 'es')).toBe(true);
    });
    it('las dos fallan → error', async () => {
      server.use(http.get(GNEWS_URL, () => new HttpResponse(null, { status: 429 })));
      expect(await fetchNews('clave-de-prueba')).toMatchObject({ ok: false, error: { kind: 'rate-limited' } });
    });
    it('mezcla ordenada por fecha descendente', async () => {
      server.use(http.get(GNEWS_URL, () => HttpResponse.json(gnews)));
      const res = await fetchNews('clave-de-prueba');
      const fechas = res.ok ? res.data.map((n) => n.publishedAt) : [];
      expect(fechas.length).toBe(20);
      expect([...fechas].sort().reverse()).toEqual(fechas);
    });
  });
});
