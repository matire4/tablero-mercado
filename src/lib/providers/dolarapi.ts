// Adaptador DolarAPI → Quote (sin changePct ni gapVsOficial: esos los completa lib/data.ts).
// Formato real verificado en src/lib/fixtures/raw/dolarapi-dolares.json.

import { fetchJson } from '../fetch-json';
import { fail, ok } from '../result';
import type { AssetId, Quote, Result } from '../types';

// Path verificado con curl el 28/09/2026: /v1/dolares → 200; /api/dolares → 404 (la doc muestra los dos).
export const DOLARAPI_URL = 'https://dolarapi.com/v1/dolares';
export const DOLARAPI_REVALIDATE = 60;

/** Forma mínima que necesitamos de cada elemento de la respuesta. */
export interface DolarApiItem {
  casa: string;
  compra: number;
  venta: number;
  fechaActualizacion: string;
}

export type DolarAssetId = Exclude<AssetId, 'riesgo-pais'>;

/** casa del proveedor → activo propio. Las casas que no están acá se ignoran. */
export const CASA_TO_ASSET: Record<string, DolarAssetId> = {
  oficial: 'oficial',
  blue: 'blue',
  bolsa: 'mep',
  tarjeta: 'tarjeta',
};

export const DOLAR_LABELS: Record<DolarAssetId, string> = {
  oficial: 'Dólar oficial',
  blue: 'Dólar blue',
  mep: 'Dólar MEP',
  tarjeta: 'Dólar tarjeta',
};

function isDolarApiItem(x: unknown): x is DolarApiItem {
  if (typeof x !== 'object' || x === null) return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.casa === 'string' &&
    typeof o.compra === 'number' &&
    typeof o.venta === 'number' &&
    typeof o.fechaActualizacion === 'string'
  );
}

/** Normaliza una respuesta ya obtenida (real o fixture) a un Result por activo. */
export function normalizeDolares(raw: unknown): Record<DolarAssetId, Result<Quote>> {
  const out = {} as Record<DolarAssetId, Result<Quote>>;
  for (const asset of Object.values(CASA_TO_ASSET)) {
    out[asset] = fail('empty', `DolarAPI no devolvió la casa de ${DOLAR_LABELS[asset]}`);
  }
  if (!Array.isArray(raw)) {
    for (const asset of Object.values(CASA_TO_ASSET)) out[asset] = fail('invalid', 'DolarAPI: la respuesta no es una lista');
    return out;
  }
  for (const item of raw) {
    if (!isDolarApiItem(item)) continue;
    const asset = CASA_TO_ASSET[item.casa];
    if (!asset) continue;
    out[asset] = ok({
      asset,
      label: DOLAR_LABELS[asset],
      unit: 'ARS',
      buy: item.compra,
      sell: item.venta,
      changePct: null,
      gapVsOficial: null,
      updatedAt: item.fechaActualizacion,
      updatedAtHasTime: true,
      source: 'DolarAPI',
    });
  }
  return out;
}

export async function fetchDolares(): Promise<Record<DolarAssetId, Result<Quote>>> {
  const res = await fetchJson<unknown>(DOLARAPI_URL, { revalidate: DOLARAPI_REVALIDATE });
  if (!res.ok) {
    const out = {} as Record<DolarAssetId, Result<Quote>>;
    for (const asset of Object.values(CASA_TO_ASSET)) out[asset] = res;
    return out;
  }
  return normalizeDolares(res.data);
}
