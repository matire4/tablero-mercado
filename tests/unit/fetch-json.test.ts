import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { delay, http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { fetchJson } from '../../src/lib/fetch-json';

const URL = 'https://proveedor.test/datos';
const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('fetchJson', () => {
  it('respuesta válida → ok con el JSON', async () => {
    server.use(http.get(URL, () => HttpResponse.json([{ a: 1 }])));
    expect(await fetchJson(URL, { revalidate: 60 })).toEqual({ ok: true, data: [{ a: 1 }] });
  });

  it('timeout → kind timeout', async () => {
    server.use(http.get(URL, async () => { await delay(500); return HttpResponse.json([]); }));
    const res = await fetchJson(URL, { revalidate: 60, timeoutMs: 50 });
    expect(res).toMatchObject({ ok: false, error: { kind: 'timeout' } });
  });

  it('HTTP 429 → kind rate-limited', async () => {
    server.use(http.get(URL, () => new HttpResponse(null, { status: 429 })));
    expect(await fetchJson(URL, { revalidate: 60 })).toMatchObject({ ok: false, error: { kind: 'rate-limited' } });
  });

  it('HTTP 500 → kind upstream', async () => {
    server.use(http.get(URL, () => new HttpResponse('boom', { status: 500 })));
    expect(await fetchJson(URL, { revalidate: 60 })).toMatchObject({ ok: false, error: { kind: 'upstream', message: 'HTTP 500' } });
  });

  it('body vacío → kind empty', async () => {
    server.use(http.get(URL, () => new HttpResponse('', { status: 200 })));
    expect(await fetchJson(URL, { revalidate: 60 })).toMatchObject({ ok: false, error: { kind: 'empty' } });
  });

  it('lista vacía → kind empty', async () => {
    server.use(http.get(URL, () => HttpResponse.json([])));
    expect(await fetchJson(URL, { revalidate: 60 })).toMatchObject({ ok: false, error: { kind: 'empty' } });
  });

  it('JSON inválido → kind invalid', async () => {
    server.use(http.get(URL, () => new HttpResponse('<html>mantenimiento</html>', { status: 200 })));
    expect(await fetchJson(URL, { revalidate: 60 })).toMatchObject({ ok: false, error: { kind: 'invalid' } });
  });

  it('el cuerpo se corta a mitad de lectura → upstream, nunca lanza (bug del 28/09)', async () => {
    server.use(http.get(URL, () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('[{"a":'));
          controller.error(new Error('conexión cortada'));
        },
      });
      return new HttpResponse(stream, { status: 200, headers: { 'Content-Type': 'application/json' } });
    }));
    const res = await fetchJson(URL, { revalidate: 60 });
    expect(res.ok).toBe(false);
  });

  it('falla de red → kind upstream, nunca lanza', async () => {
    server.use(http.get(URL, () => HttpResponse.error()));
    expect(await fetchJson(URL, { revalidate: 60 })).toMatchObject({ ok: false, error: { kind: 'upstream' } });
  });
});
