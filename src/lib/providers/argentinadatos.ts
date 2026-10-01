// Adaptador ArgentinaDatos: riesgo país (último y serie), históricos de dólar, feriados.
// Formatos reales verificados en src/lib/fixtures/raw/argdatos-*.json. Paths confirmados en la doc del proveedor.

import { fetchJson } from '../fetch-json';
import { fail, ok } from '../result';
import type { AssetId, HistoryPoint, Quote, Result } from '../types';

export const ARGDATOS_BASE = 'https://api.argentinadatos.com/v1';
export const REVALIDATE_ULTIMO = 60;
export const REVALIDATE_HISTORICO = 86400;
export const REVALIDATE_FERIADOS = 86400;

/** activo propio → casa en ArgentinaDatos (histórico de dólares). */
const ASSET_TO_CASA: Record<Exclude<AssetId, 'riesgo-pais'>, string> = {
  oficial: 'oficial',
  blue: 'blue',
  mep: 'bolsa',
  tarjeta: 'tarjeta',
};

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;
const isIsoDate = (x: unknown): x is string => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x);

// ---------- Riesgo país ----------

export function normalizeRiesgoUltimo(raw: unknown): Result<Quote> {
  if (!isRecord(raw) || typeof raw.valor !== 'number' || !isIsoDate(raw.fecha)) {
    return fail('invalid', 'Riesgo país: se esperaba { valor: number, fecha: YYYY-MM-DD }');
  }
  return ok({
    asset: 'riesgo-pais',
    label: 'Riesgo país',
    unit: 'puntos',
    buy: null,
    sell: raw.valor,
    changePct: null,
    gapVsOficial: null,
    // El proveedor da solo la fecha: se fija a medianoche hora Argentina y se marca sin hora.
    updatedAt: `${raw.fecha}T00:00:00-03:00`,
    updatedAtHasTime: false,
    source: 'ArgentinaDatos',
  });
}

export async function fetchRiesgoUltimo(): Promise<Result<Quote>> {
  const res = await fetchJson<unknown>(`${ARGDATOS_BASE}/finanzas/indices/riesgo-pais/ultimo`, { revalidate: REVALIDATE_ULTIMO });
  return res.ok ? normalizeRiesgoUltimo(res.data) : res;
}

// ---------- Históricos ----------

/** Serie normalizada + cuántos elementos del proveedor se descartaron por formato (hallazgo #9 de QA). */
export interface Historico {
  points: HistoryPoint[];
  skipped: number;
}

/**
 * Serie de riesgo país ({ valor, fecha }) o de dólar ({ compra, venta, fecha }) → puntos + descartados.
 * `skipped` cuenta sobre TODA la lista del proveedor, no sobre un rango: un elemento inválido puede no tener fecha legible.
 */
export function parseHistorico(raw: unknown, valueField: 'venta' | 'valor'): Result<Historico> {
  if (!Array.isArray(raw)) return fail('invalid', 'Histórico: se esperaba una lista');
  const points: HistoryPoint[] = [];
  for (const item of raw) {
    if (!isRecord(item) || !isIsoDate(item.fecha) || typeof item[valueField] !== 'number') continue;
    points.push({ date: item.fecha, value: item[valueField] as number });
  }
  // Lista vacía = el proveedor no tiene datos (fetchJson ya la corta antes; esto queda por las dudas).
  // Lista con elementos pero ningún punto válido = cambió el formato: es un error, no "sin datos" (hallazgo #8 de QA).
  if (raw.length === 0) return fail('empty', 'Histórico vacío');
  if (points.length === 0) return fail('invalid', 'Histórico: ningún elemento con el formato esperado');
  return ok({ points, skipped: raw.length - points.length });
}

/** Igual que `parseHistorico`, solo los puntos: para quien no necesita el conteo (tests de formato, fixtures). */
export function normalizeHistorico(raw: unknown, valueField: 'venta' | 'valor'): Result<HistoryPoint[]> {
  const res = parseHistorico(raw, valueField);
  return res.ok ? ok(res.data.points) : res;
}

export function historicoUrl(asset: AssetId): string {
  return asset === 'riesgo-pais'
    ? `${ARGDATOS_BASE}/finanzas/indices/riesgo-pais`
    : `${ARGDATOS_BASE}/cotizaciones/dolares/${ASSET_TO_CASA[asset]}`;
}

/** Trae la serie COMPLETA (0,4-0,5 MB) con cache de 24 h. El recorte por fecha lo hace lib/data.ts. */
export async function fetchHistorico(asset: AssetId): Promise<Result<Historico>> {
  const res = await fetchJson<unknown>(historicoUrl(asset), { revalidate: REVALIDATE_HISTORICO });
  return res.ok ? parseHistorico(res.data, asset === 'riesgo-pais' ? 'valor' : 'venta') : res;
}

// ---------- Feriados ----------

export function normalizeFeriados(raw: unknown): Result<string[]> {
  if (!Array.isArray(raw)) return fail('invalid', 'Feriados: se esperaba una lista');
  const fechas = raw.filter((f) => isRecord(f) && isIsoDate(f.fecha)).map((f) => (f as { fecha: string }).fecha);
  if (fechas.length === 0) return fail('empty', 'Feriados sin fechas válidas');
  return ok(fechas);
}

export async function fetchFeriados(year: number): Promise<Result<string[]>> {
  const res = await fetchJson<unknown>(`${ARGDATOS_BASE}/feriados/${year}`, { revalidate: REVALIDATE_FERIADOS });
  return res.ok ? normalizeFeriados(res.data) : res;
}
