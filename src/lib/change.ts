// Variación del día de una cotización.
//
// Regla (cerrada el 28/09/2026): se compara el valor actual contra la ÚLTIMA entrada del histórico
// con fecha ANTERIOR a la fecha del dato actual.
//
// Por qué así y no "contra el día hábil anterior": en ArgentinaDatos la entrada de fecha D es una foto
// tomada en D, no el cierre de D. En oficial y MEP la entrada del sábado ya trae el cierre del viernes.
// Comparar un lunes contra el viernes inventaría un movimiento que no ocurrió; comparar contra el
// domingo (que ya lleva el cierre real) da 0 %, que es la verdad. Para series de solo días hábiles
// (riesgo país) la misma regla equivale a "contra la rueda anterior". Detalle en docs/arquitectura.md §8.

import type { HistoryPoint } from './types';

/**
 * @param current  valor actual y la fecha (YYYY-MM-DD) a la que corresponde
 * @param history  serie diaria, cualquier orden; se ignoran entradas con fecha >= current.date
 * @returns variación porcentual con un decimal, o null si no hay dato anterior o el anterior es 0
 */
export function calcChangePct(current: HistoryPoint, history: HistoryPoint[]): number | null {
  let previous: HistoryPoint | undefined;
  for (const p of history) {
    if (p.date < current.date && (!previous || p.date > previous.date)) previous = p;
  }
  if (!previous || previous.value === 0) return null;
  return Math.round(((current.value - previous.value) / previous.value) * 1000) / 10;
}
