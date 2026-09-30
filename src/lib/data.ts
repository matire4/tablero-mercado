// Orquestador de la capa de datos. Los route handlers solo llaman a estas tres funciones.
// Elige modo mock o real, pide en paralelo, calcula brecha y variación, arma las respuestas.
// Nunca lanza: toda falla de proveedor viaja como Result dentro de la respuesta.

import { addDays } from './business-days';
import { brechaSeries, calcBrecha } from './brecha';
import { calcChangePct } from './change';
import { getMarketStatus, toArgentinaTime } from './market-status';
import { fail, ok } from './result';
import type { AssetId, HistoryPoint, HistoryResponse, MarketStatus, NewsResponse, Quote, QuotesResponse, Result } from './types';
import { fetchDolares, normalizeDolares } from './providers/dolarapi';
import { fetchFeriados, fetchHistorico, fetchRiesgoUltimo, normalizeHistorico, normalizeRiesgoUltimo } from './providers/argentinadatos';
import { fetchNews, mergeNews, normalizeNews } from './providers/news';

import feriadosFixture from './fixtures/feriados.json';
import newsFixture from './fixtures/news.json';
import quotesNormal from './fixtures/quotes-normal.json';
import quotesSinOficial from './fixtures/quotes-sin-oficial.json';
import quotesViernesCerrado from './fixtures/quotes-viernes-cerrado.json';
import historyBlue from './fixtures/history-blue.json';
import historyBolsa from './fixtures/history-bolsa.json';
import historyOficial from './fixtures/history-oficial.json';
import historyTarjeta from './fixtures/history-tarjeta.json';
import historyRiesgo from './fixtures/history-riesgo-pais.json';

export const ASSETS: AssetId[] = ['blue', 'mep', 'oficial', 'tarjeta', 'riesgo-pais'];
const PARALELOS: AssetId[] = ['blue', 'mep', 'tarjeta'];
export const HISTORY_DAYS = 90;

// ---------- Configuración por entorno ----------

export type MockScenario = 'normal' | 'viernes-cerrado' | 'sin-oficial';

const QUOTE_FIXTURES: Record<MockScenario, { now: string; dolarapi: unknown; riesgoUltimo: unknown }> = {
  normal: quotesNormal,
  'viernes-cerrado': quotesViernesCerrado,
  'sin-oficial': quotesSinOficial,
};

const HISTORY_FIXTURES: Record<AssetId, unknown> = {
  blue: historyBlue,
  mep: historyBolsa,
  oficial: historyOficial,
  tarjeta: historyTarjeta,
  'riesgo-pais': historyRiesgo,
};

export interface DataConfig {
  mock: boolean;
  scenario: MockScenario;
  newsApiKey: string | undefined;
}

export function configFromEnv(env: NodeJS.ProcessEnv = process.env): DataConfig {
  const scenario = env.MOCK_SCENARIO as MockScenario | undefined;
  return {
    mock: env.USE_MOCK_DATA === 'true',
    scenario: scenario && scenario in QUOTE_FIXTURES ? scenario : 'normal',
    newsApiKey: env.NEWS_API_KEY,
  };
}

/** En modo mock el reloj es el del fixture; en modo real, el del server. */
function nowFor(cfg: DataConfig): Date {
  return cfg.mock ? new Date(QUOTE_FIXTURES[cfg.scenario].now) : new Date();
}

// ---------- Fuentes (mock o real) ----------

async function loadHolidays(cfg: DataConfig, now: Date): Promise<{ holidays: string[]; source: MarketStatus['holidaysSource'] }> {
  const fromFixture = { holidays: feriadosFixture.map((f) => f.fecha), source: 'fallback-fixture' as const };
  if (cfg.mock) return { ...fromFixture, source: 'live' }; // en mock el fixture ES la fuente
  const res = await fetchFeriados(Number(toArgentinaTime(now).date.slice(0, 4)));
  return res.ok ? { holidays: res.data, source: 'live' } : fromFixture;
}

async function loadHistorico(cfg: DataConfig, asset: AssetId): Promise<Result<HistoryPoint[]>> {
  if (cfg.mock) return normalizeHistorico(HISTORY_FIXTURES[asset], asset === 'riesgo-pais' ? 'valor' : 'venta');
  return fetchHistorico(asset);
}

async function loadQuotesRaw(cfg: DataConfig): Promise<Record<AssetId, Result<Quote>>> {
  if (cfg.mock) {
    const fx = QUOTE_FIXTURES[cfg.scenario];
    return { ...normalizeDolares(fx.dolarapi), 'riesgo-pais': normalizeRiesgoUltimo(fx.riesgoUltimo) };
  }
  const [dolares, riesgo] = await Promise.all([fetchDolares(), fetchRiesgoUltimo()]);
  return { ...dolares, 'riesgo-pais': riesgo };
}

// ---------- API pública ----------

export async function getQuotes(cfg: DataConfig = configFromEnv()): Promise<QuotesResponse> {
  const now = nowFor(cfg);
  const [{ holidays, source }, quotes, historicos] = await Promise.all([
    loadHolidays(cfg, now),
    loadQuotesRaw(cfg),
    Promise.all(ASSETS.map((a) => loadHistorico(cfg, a))),
  ]);
  const historicoDe = Object.fromEntries(ASSETS.map((a, i) => [a, historicos[i]])) as Record<AssetId, Result<HistoryPoint[]>>;

  const oficial = quotes.oficial;
  for (const asset of ASSETS) {
    const q = quotes[asset];
    if (!q.ok) continue;

    // Variación del día: contra la última entrada del histórico anterior a la fecha del dato (lib/change.ts).
    const hist = historicoDe[asset];
    const date = q.data.updatedAtHasTime ? toArgentinaTime(new Date(q.data.updatedAt)).date : q.data.updatedAt.slice(0, 10);
    q.data.changePct = hist.ok ? calcChangePct({ date, value: q.data.sell }, hist.data) : null;

    // Brecha (feature 1): solo paralelos, solo si el oficial vino.
    if (PARALELOS.includes(asset)) {
      q.data.gapVsOficial = oficial.ok ? calcBrecha(q.data.sell, oficial.data.sell) : null;
    }
  }

  return {
    quotes,
    market: getMarketStatus(now, holidays, source),
    fetchedAt: now.toISOString(),
    mock: cfg.mock,
  };
}

export async function getHistory(asset: AssetId, range: 7 | 30 | 90, cfg: DataConfig = configFromEnv()): Promise<Result<HistoryResponse>> {
  const now = nowFor(cfg);
  const today = toArgentinaTime(now).date;
  const desde = addDays(today, -range);
  const recorte = (serie: HistoryPoint[]) => serie.filter((p) => p.date >= desde && p.date <= today);

  const needsOficial = PARALELOS.includes(asset);
  const [{ holidays, source }, serie, oficial] = await Promise.all([
    loadHolidays(cfg, now),
    loadHistorico(cfg, asset),
    needsOficial ? loadHistorico(cfg, 'oficial') : Promise.resolve(fail<HistoryPoint[]>('empty', 'no aplica')),
  ]);
  const market = getMarketStatus(now, holidays, source);
  // Serie vacía del proveedor = "sin datos para este período" (H0-6), no error. Los demás errores siguen siendo error.
  // fetchJson no cambia: para cotizaciones, vacío sigue siendo error (H0-5).
  if (!serie.ok) {
    return serie.error.kind === 'empty' ? ok({ asset, range, series: [], gapSeries: null, market }) : serie;
  }

  const series = recorte(serie.data);
  const gapSeries = needsOficial && oficial.ok ? brechaSeries(series, recorte(oficial.data)) : null;

  return ok({ asset, range, series, gapSeries, market });
}

export type { NewsResponse };

/**
 * En modo mock las noticias tienen su propio reloj: el momento en que se bajaron los crudos (`newsFixture.now`),
 * no el del escenario de cotizaciones. Así "publicada hace X h" es verdadero respecto de cuando se capturaron
 * y ninguna nota queda en el futuro. El panel de noticias no depende del estado de mercado.
 */
export async function getNews(cfg: DataConfig = configFromEnv()): Promise<Result<NewsResponse>> {
  if (cfg.mock) {
    const res = mergeNews([
      { lang: 'es', res: normalizeNews(newsFixture.es, 'es') },
      { lang: 'en', res: normalizeNews(newsFixture.en, 'en') },
    ]);
    return res.ok ? ok({ ...res.data, fetchedAt: newsFixture.now, mock: true }) : res;
  }
  const res = await fetchNews(cfg.newsApiKey);
  return res.ok ? ok({ ...res.data, fetchedAt: new Date().toISOString(), mock: false }) : res;
}
