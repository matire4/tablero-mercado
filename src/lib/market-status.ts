// Estado "mercado cerrado": ventana única lunes a viernes 10-18 hs Argentina + feriados nacionales.
// Función pura: recibe `now` y los feriados; no lee el reloj ni hace fetch.
// Argentina no tiene horario de verano, así que la hora local es UTC-3 fijo.

import { isBusinessDay, isWeekend, previousBusinessDay } from './business-days';
import type { MarketStatus } from './types';

export const ART_OFFSET_HOURS = -3;
export const MARKET_OPEN_HOUR = 10;
export const MARKET_CLOSE_HOUR = 18;

/** Fecha (YYYY-MM-DD) y hora decimal en Argentina para un instante dado. */
export function toArgentinaTime(now: Date): { date: string; hour: number } {
  const shifted = new Date(now.getTime() + ART_OFFSET_HOURS * 60 * 60 * 1000);
  return {
    date: shifted.toISOString().slice(0, 10),
    hour: shifted.getUTCHours() + shifted.getUTCMinutes() / 60,
  };
}

/** 18:00 hora Argentina de un día dado, en ISO UTC. */
function closeOf(date: string): string {
  return `${date}T${String(MARKET_CLOSE_HOUR - ART_OFFSET_HOURS).padStart(2, '0')}:00:00.000Z`;
}

export function getMarketStatus(
  now: Date,
  holidays: string[],
  holidaysSource: MarketStatus['holidaysSource'] = 'live',
): MarketStatus {
  const { date, hour } = toArgentinaTime(now);

  if (isWeekend(date)) {
    return { isOpen: false, reason: 'weekend', lastCloseAt: closeOf(previousBusinessDay(date, holidays)), holidaysSource };
  }
  if (!isBusinessDay(date, holidays)) {
    return { isOpen: false, reason: 'holiday', lastCloseAt: closeOf(previousBusinessDay(date, holidays)), holidaysSource };
  }
  if (hour < MARKET_OPEN_HOUR) {
    return { isOpen: false, reason: 'outside-hours', lastCloseAt: closeOf(previousBusinessDay(date, holidays)), holidaysSource };
  }
  if (hour >= MARKET_CLOSE_HOUR) {
    return { isOpen: false, reason: 'outside-hours', lastCloseAt: closeOf(date), holidaysSource };
  }
  return { isOpen: true, reason: 'open', lastCloseAt: closeOf(previousBusinessDay(date, holidays)), holidaysSource };
}
