// Adaptador GNews → NewsItem[]. Formato real verificado en src/lib/fixtures/raw/gnews-search.json.
// Presupuesto (docs/arquitectura.md §10): plan gratis, 100 requests/día; una búsqueda por idioma, cache 45 min → 64/día.

import { fetchJson } from '../fetch-json';
import { fail, ok } from '../result';
import type { NewsItem, NewsSources, NewsTopic, Result } from '../types';

export const GNEWS_URL = 'https://gnews.io/api/v4/search';
export const GNEWS_REVALIDATE = 2700; // 45 min
export const GNEWS_MAX = 10;

/** Búsquedas fijas. `lang` acepta un solo valor por request (verificado en la doc). */
export const SEARCHES: Array<{ lang: 'es' | 'en'; q: string; country?: string }> = [
  { lang: 'es', country: 'ar', q: 'dólar OR BCRA OR inflación OR "riesgo país" OR Fed OR mercados OR bonos OR Merval' },
  // Internacional (cambio del 29/09): la versión `Argentina AND (…)` traía 4 notas con la más nueva de 19 días.
  // Formato verificado con curl en raw/gnews-search-en-v2.json (GNews acepta los paréntesis anidados).
  { lang: 'en', q: 'Fed OR "Federal Reserve" OR "Wall Street" OR "emerging markets" OR IMF OR (Argentina AND (peso OR inflation OR bonds OR debt OR "central bank"))' },
];

/**
 * Asignación de tema por palabra clave en el título. Orden = prioridad: la primera que matchea gana.
 * Una nota que no matchea NINGÚN tema se descarta (decisión del 28/09: el tablero muestra solo los temas fijos;
 * antes `mercados` era comodín y entraban notas de política o cultura). `mercados` requiere palabras explícitas.
 * Es una aproximación, documentada como tal; no afirma relación causal entre noticia y precio.
 */
export const TOPIC_RULES: Array<{ topic: NewsTopic; pattern: RegExp }> = [
  { topic: 'riesgo-pais', pattern: /riesgo pa[ií]s|country risk/i },
  { topic: 'bcra', pattern: /\bbcra\b|banco central|central bank|reservas|\bbanks?\b/i },
  // Sensible a mayúsculas y sin "Fed up": en inglés "fed up" (harto) entraba como Fed (29/09, crudo en-v2).
  { topic: 'fed', pattern: /\bFed\b(?! up\b)|FED\b|[Rr]eserva [Ff]ederal|Federal Reserve|Powell/ },
  { topic: 'inflacion', pattern: /inflaci[oó]n|inflation|\bipc\b|\bcpi\b|precios al consumidor/i },
  { topic: 'dolar', pattern: /d[oó]lar|dollar|\bpeso\b|\bblue\b|\bmep\b|\bccl\b|cepo|brecha|tipo de cambio/i },
  { topic: 'mercados', pattern: /merval|wall street|\bbolsa\b|acciones|\bbonos?\b|\bstocks?\b|\bbonds?\b|\bs&p\b|nasdaq|\bfmi\b|\bimf\b|mercados? financieros?|markets?\b|\bdebt\b|investors|\brates?\b|\bdeuda\b/i },
];

export function assignTopic(title: string): NewsTopic | null {
  for (const rule of TOPIC_RULES) if (rule.pattern.test(title)) return rule.topic;
  return null;
}

interface GNewsArticle {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
  lang: string;
  source: { name: string };
}

function isArticle(x: unknown): x is GNewsArticle {
  if (typeof x !== 'object' || x === null) return false;
  const a = x as Record<string, unknown>;
  const s = a.source as Record<string, unknown> | undefined;
  return (
    typeof a.id === 'string' &&
    typeof a.title === 'string' &&
    typeof a.url === 'string' &&
    typeof a.publishedAt === 'string' &&
    typeof a.lang === 'string' &&
    typeof s === 'object' && s !== null && typeof s.name === 'string'
  );
}

export function normalizeNews(raw: unknown, lang: 'es' | 'en'): Result<NewsItem[]> {
  if (typeof raw !== 'object' || raw === null || !Array.isArray((raw as { articles?: unknown }).articles)) {
    return fail('invalid', 'GNews: se esperaba { articles: [...] }');
  }
  const items: NewsItem[] = [];
  for (const a of (raw as { articles: unknown[] }).articles) {
    if (!isArticle(a)) continue;
    const topic = assignTopic(a.title);
    if (!topic) continue; // fuera de los temas fijos
    items.push({
      id: a.id,
      title: a.title,
      source: a.source.name,
      publishedAt: a.publishedAt,
      url: a.url,
      lang,
      topic,
    });
  }
  return ok(items); // lista vacía es "sin datos", no error
}

export function buildUrl(search: (typeof SEARCHES)[number], apiKey: string): string {
  // in=title: que GNews matchee las palabras solo en el título, el mismo campo que filtra assignTopic (verificado en la doc).
  const params = new URLSearchParams({ q: search.q, lang: search.lang, in: 'title', max: String(GNEWS_MAX), apikey: apiKey });
  if (search.country) params.set('country', search.country);
  return `${GNEWS_URL}?${params.toString()}`;
}

/** Título normalizado para comparar: minúsculas, sin acentos ni signos. */
const normTitle = (t: string) => t.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, ' ').trim();

/**
 * Saca notas repetidas: la misma nota publicada por dos medios suele llegar con el título idéntico
 * o con un agregado ("EXCLUSIVE-…", "… (1)"). Si un título normalizado contiene al otro, es la misma.
 * Conserva la primera (la lista llega ordenada por fecha descendente).
 */
export function dedupeByTitle(items: NewsItem[]): NewsItem[] {
  const seen: string[] = [];
  return items.filter((n) => {
    const k = normTitle(n.title);
    if (seen.some((s) => s.includes(k) || k.includes(s))) return false;
    seen.push(k);
    return true;
  });
}

export interface NewsResult {
  items: NewsItem[];
  /** Si ok < total, la lista está incompleta y el route handler no la deja cachear. `failed`: qué búsqueda y de qué tipo. */
  sources: NewsSources;
}

/** Resultado de una búsqueda, con su idioma para poder decir cuál falló. */
export interface SearchResult {
  lang: 'es' | 'en';
  res: Result<NewsItem[]>;
}

/** Tapa la API key si un mensaje de error llegara a traer la URL (p. ej. un error de Node al armar la request). */
export const redactKey = (text: string) => text.replace(/apikey=[^&\s]*/gi, 'apikey=***');

/** Espera entre búsquedas. GNews plan gratis devolvió 429 a requests simultáneas (28/09). */
export const GNEWS_DELAY_MS = 1000;

/**
 * Corre las búsquedas fijas EN SECUENCIA, con una pausa entre ellas, y mezcla los resultados por fecha descendente.
 * Falla solo si fallan todas; si falla alguna, `sources.ok < sources.total` y queda en `sources.failed`.
 * Cada búsqueda que falla escribe UNA línea con console.error (idioma, tipo y mensaje; nunca la URL: lleva la API key).
 */
export async function fetchNews(apiKey: string | undefined, delayMs = GNEWS_DELAY_MS): Promise<Result<NewsResult>> {
  if (!apiKey) return fail('upstream', 'Falta NEWS_API_KEY en el server');
  const results: SearchResult[] = [];
  for (const [i, s] of SEARCHES.entries()) {
    if (i > 0 && delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    const raw = await fetchJson<unknown>(buildUrl(s, apiKey), { revalidate: GNEWS_REVALIDATE });
    const res = raw.ok ? normalizeNews(raw.data, s.lang) : raw;
    if (!res.ok) console.error(`[news] búsqueda en ${s.lang} falló: ${res.error.kind} · ${redactKey(res.error.message)}`);
    results.push({ lang: s.lang, res });
  }
  return mergeNews(results);
}

/**
 * Junta los resultados de cada búsqueda: ordena por fecha descendente y saca repetidas.
 * Falla solo si fallan todas (devuelve el primer error). La usa también el modo mock (ahí `failed` va vacío).
 */
export function mergeNews(results: SearchResult[]): Result<NewsResult> {
  const okOnes: NewsItem[][] = [];
  const failed: NewsSources['failed'] = [];
  for (const { lang, res } of results) {
    if (res.ok) okOnes.push(res.data);
    else failed.push({ lang, kind: res.error.kind });
  }
  if (okOnes.length === 0) return results[0].res as Result<never>;
  const items = dedupeByTitle(okOnes.flat().sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)));
  return ok({ items, sources: { ok: okOnes.length, total: results.length, failed } });
}
