// Brecha cambiaria (feature 1). Dos funciones puras, ejecutadas solo en el server (lib/data.ts).
// La UI recibe el número hecho y solo lo dibuja; nunca lo calcula.

import type { HistoryPoint } from './types';

/** ((paralelo − oficial) / oficial) × 100, redondeado a un decimal. */
export function calcBrecha(paraleloSell: number, oficialSell: number): number {
  return Math.round(((paraleloSell - oficialSell) / oficialSell) * 1000) / 10;
}

/** Join por fecha; fechas sin contraparte se descartan. Mantiene el orden de `paralelo`. */
export function brechaSeries(paralelo: HistoryPoint[], oficial: HistoryPoint[]): HistoryPoint[] {
  const oficialPorFecha = new Map(oficial.map((p) => [p.date, p.value]));
  const out: HistoryPoint[] = [];
  for (const p of paralelo) {
    const o = oficialPorFecha.get(p.date);
    if (o !== undefined && o !== 0) out.push({ date: p.date, value: calcBrecha(p.value, o) });
  }
  return out;
}
