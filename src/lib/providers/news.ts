// Adaptador GNews → NewsItem[]. Formato real verificado en src/lib/fixtures/raw/gnews-search.json.
// Presupuesto (docs/arquitectura.md §10): plan gratis, 100 requests/día; una búsqueda por idioma, cache 45 min → 64/día.

import { fetchJson } from '../fetch-json';
import { fail, ok } from '../result';
import type { NewsItem, NewsTopic, Result } from '../types';

export const GNEWS_URL = 'https://gnews.io/api/v4/search';
export const GNEWS_REVALIDATE = 2700; // 45 min
export const GNEWS_MAX = 10;

/** Búsquedas fijas. `lang` acepta un solo valor por request (verificado en la doc). */
export const SEARCHES: Array<{ lang: 'es' | 'en'; q: string; country?: string }> = [
  { lang: 'es', country: 'ar', q: 'dólar OR BCRA OR inflación OR "riesgo país" OR Fed OR mercados' },
  { lang: 'en', q: '"Argentina" AND (peso OR "central bank" OR inflation OR "country risk" OR Fed OR markets)' },
];

/**
 * Asignación de tema por palabra clave en el título. Orden = prioridad: la primera que matchea gana.
 * Una nota que no matchea NINGÚN tema se descarta (decisión del 28/09: el tablero muestra solo los temas fijos;
 * antes `mercados` era comodín y entraban notas de política o cultura). `mercados` requiere palabras explícitas.
 * Es una aproximación, documentada como tal; no afirma relación causal entre noticia y precio.
 */
export const TOPIC_RULES: Array<{ topic: NewsTopic; pattern: RegExp }> = [
  { topic: 'riesgo-pais', pattern: /riesgo pa[ií]s|country risk/i },
  { topic: 'bcra', pattern: /\bbcra\b|banco central|central bank|reservas/i },
  { topic: 'fed', pattern: /\bfed\b|reserva federal|federal reserve|powell/i },
  { topic: 'inflacion', pattern: /inflaci[oó]n|inflation|\bipc\b|\bcpi\b|precios al consumidor/i },
  { topic: 'dolar', pattern: /d[oó]lar|dollar|\bpeso\b|\bblue\b|\bmep\b|\bccl\b|cepo|brecha|tipo de cambio/i },
  { topic: 'mercados', pattern: /merval|wall street|\bbolsa\b|acciones|\bbonos?\b|\bstocks?\b|\bbonds?\b|\bs&p\b|nasdaq|\bfmi\b|\bimf\b|mercados? financieros?|markets?\b/i },
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
  const params = new URLSearchParams({ q: search.q, lang: search.lang, max: String(GNEWS_MAX), apikey: apiKey });
  if (search.country) params.set('country', search.country);
  return `${GNEWS_URL}?${params.toString()}`;
}

export interface NewsResult {
  items: NewsItem[];
  /** Cuántas búsquedas salieron bien. Si ok < total, la lista está incompleta y el route handler no la deja cachear. */
  sources: { ok: number; total: number };
}

/** Espera entre búsquedas. GNews plan gratis devolvió 429 a requests simultáneas (28/09). */
export const GNEWS_DELAY_MS = 1000;

/**
 * Corre las búsquedas fijas EN SECUENCIA, con una pausa entre ellas, y mezcla los resultados por fecha descendente.
 * Falla solo si fallan todas; si falla alguna, `sources.ok < sources.total`.
 */
export async function fetchNews(apiKey: string | undefined, delayMs = GNEWS_DELAY_MS): Promise<Result<NewsResult>> {
  if (!apiKey) return fail('upstream', 'Falta NEWS_API_KEY en el server');
  const results: Result<NewsItem[]>[] = [];
  for (const [i, s] of SEARCHES.entries()) {
    if (i > 0 && delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    const res = await fetchJson<unknown>(buildUrl(s, apiKey), { revalidate: GNEWS_REVALIDATE });
    results.push(res.ok ? normalizeNews(res.data, s.lang) : res);
  }
  const okOnes = results.filter((r): r is Extract<Result<NewsItem[]>, { ok: true }> => r.ok);
  if (okOnes.length === 0) return results[0] as Result<never>;
  const items = okOnes.flatMap((r) => r.data).sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  return ok({ items, sources: { ok: okOnes.length, total: SEARCHES.length } });
}
