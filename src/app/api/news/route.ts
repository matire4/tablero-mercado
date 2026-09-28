// GET /api/news → Result<{ items, fetchedAt }>. Siempre HTTP 200. Cache 45 min (presupuesto de GNews, arquitectura.md §10).

import { getNews } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  const body = await getNews();
  return Response.json(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': body.ok ? 'public, s-maxage=2700, stale-while-revalidate=2700' : 'no-store',
    },
  });
}
