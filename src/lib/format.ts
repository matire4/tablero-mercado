// Formato de números y fechas para la UI, siempre es-AR. Funciones puras.

const ars = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const pct = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1, signDisplay: 'exceptZero' });

export const formatArs = (n: number) => `$ ${ars.format(n)}`;
export const formatNumber = (n: number) => ars.format(n);
/** "+0,3 %", "−0,4 %", "0,0 %". Signo tipográfico, no guion. */
export const formatPct = (n: number) => `${pct.format(n).replace('-', '−')} %`;

const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];

/** "vie 25/09 18:00" en hora Argentina. */
export function formatCierre(iso: string): string {
  const d = new Date(iso);
  const art = new Date(d.getTime() - 3 * 60 * 60 * 1000);
  const dd = String(art.getUTCDate()).padStart(2, '0');
  const mm = String(art.getUTCMonth() + 1).padStart(2, '0');
  const hh = String(art.getUTCHours()).padStart(2, '0');
  const mi = String(art.getUTCMinutes()).padStart(2, '0');
  return `${DIAS[art.getUTCDay()]} ${dd}/${mm} ${hh}:${mi}`;
}

/** "25/09" de un ISO. */
export function formatDia(iso: string): string {
  const d = new Date(iso);
  const art = new Date(d.getTime() - 3 * 60 * 60 * 1000);
  return `${String(art.getUTCDate()).padStart(2, '0')}/${String(art.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** "hace 4 min", "hace 3 h", "hace 2 días". `now` se pasa para poder testear. */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const diffMin = Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 60000));
  if (diffMin < 1) return 'recién';
  if (diffMin < 60) return `hace ${diffMin} min`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'hace 1 día' : `hace ${d} días`;
}

/** Texto para el usuario según el tipo de error del proveedor. */
export const ERROR_TEXT: Record<string, string> = {
  timeout: 'El proveedor no respondió a tiempo.',
  'rate-limited': 'El proveedor limitó las consultas por ahora.',
  upstream: 'El proveedor devolvió un error.',
  empty: 'El proveedor no devolvió datos.',
  invalid: 'La respuesta del proveedor no se pudo leer.',
};
