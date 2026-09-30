// Hueco detectado en QA (30/09): fetchDolares con el proveedor caído no tenía test.
// Criterio H0-5: si DolarAPI falla, las CUATRO tarjetas de dólar llevan el error (ninguna queda "cargando" ni con valor viejo).
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { DOLARAPI_URL, fetchDolares } from '../../src/lib/providers/dolarapi';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const ASSETS = ['oficial', 'blue', 'mep', 'tarjeta'] as const;

describe('fetchDolares con el proveedor caído (H0-5)', () => {
  it('HTTP 429 → rate-limited en las cuatro casas', async () => {
    server.use(http.get(DOLARAPI_URL, () => new HttpResponse(null, { status: 429 })));
    const res = await fetchDolares();
    for (const a of ASSETS) expect(res[a]).toMatchObject({ ok: false, error: { kind: 'rate-limited' } });
  });

  it('lista vacía → empty en las cuatro casas', async () => {
    server.use(http.get(DOLARAPI_URL, () => HttpResponse.json([])));
    const res = await fetchDolares();
    for (const a of ASSETS) expect(res[a]).toMatchObject({ ok: false, error: { kind: 'empty' } });
  });
});
