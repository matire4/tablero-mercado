// GET /api/history/[asset]?range=7|30|90 → Result<HistoryResponse>. Siempre HTTP 200 salvo parámetros inválidos (400).

import { ASSETS, getHistory } from '@/lib/data';
import type { AssetId } from '@/lib/types';

export const dynamic = 'force-dynamic';

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

export async function GET(request: Request, { params }: { params: Promise<{ asset: string }> }) {
  const { asset } = await params;
  const rangeParam = Number(new URL(request.url).searchParams.get('range') ?? '30');

  if (!ASSETS.includes(asset as AssetId)) {
    return Response.json({ error: `asset inválido: ${asset}` }, { status: 400 });
  }
  if (!RANGES.includes(rangeParam as Range)) {
    return Response.json({ error: `range inválido: ${rangeParam}. Válidos: ${RANGES.join(', ')}` }, { status: 400 });
  }

  const body = await getHistory(asset as AssetId, rangeParam as Range);
  return Response.json(body, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': body.ok ? 'public, s-maxage=3600, stale-while-revalidate=3600' : 'no-store',
    },
  });
}
