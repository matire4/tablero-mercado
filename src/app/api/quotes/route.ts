// GET /api/quotes → QuotesResponse. Siempre HTTP 200; el estado por activo viaja en el body.
// Cache: la Data Cache de Next (fetch con revalidate) más el CDN de Vercel vía Cache-Control.
// Si algún activo falló, no-store: no queremos que el CDN retenga un error 60 segundos.

import { getQuotes } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  const body = await getQuotes();
  const allOk = Object.values(body.quotes).every((q) => q.ok);
  return Response.json(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': allOk && !body.mock ? 'public, s-maxage=60, stale-while-revalidate=300' : 'no-store',
    },
  });
}
