// Única fuente de verdad sobre qué es un día hábil en Argentina.
// Funciones puras: reciben la lista de feriados (YYYY-MM-DD) como parámetro, no hacen fetch.
// Las fechas son strings YYYY-MM-DD y se tratan como días calendario, sin zona horaria.

const DAY_MS = 24 * 60 * 60 * 1000;

function toUtcDate(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  return toIsoDate(new Date(toUtcDate(date).getTime() + days * DAY_MS));
}

export function isWeekend(date: string): boolean {
  const dow = toUtcDate(date).getUTCDay(); // 0 = domingo, 6 = sábado
  return dow === 0 || dow === 6;
}

export function isBusinessDay(date: string, holidays: string[]): boolean {
  return !isWeekend(date) && !holidays.includes(date);
}

/** Último día hábil estrictamente anterior a `date`. */
export function previousBusinessDay(date: string, holidays: string[]): string {
  let d = addDays(date, -1);
  while (!isBusinessDay(d, holidays)) d = addDays(d, -1);
  return d;
}
