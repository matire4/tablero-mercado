// Tipos propios del tablero. Los adaptadores traducen cada proveedor a esto; la UI solo conoce esto.

export type AssetId = 'blue' | 'mep' | 'oficial' | 'tarjeta' | 'riesgo-pais';

export type ErrorKind = 'timeout' | 'rate-limited' | 'upstream' | 'empty' | 'invalid';

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: { kind: ErrorKind; message: string } };

export interface Quote {
  asset: AssetId;
  label: string;
  unit: 'ARS' | 'puntos';
  buy: number | null;
  sell: number;
  changePct: number | null;
  gapVsOficial: number | null;
  updatedAt: string;
  updatedAtHasTime: boolean;
  source: 'DolarAPI' | 'ArgentinaDatos';
}

export type MarketReason = 'open' | 'weekend' | 'holiday' | 'outside-hours';

export interface MarketStatus {
  isOpen: boolean;
  reason: MarketReason;
  /** ISO del último cierre: 18:00 hora Argentina del último día hábil ya cerrado. */
  lastCloseAt: string;
  holidaysSource: 'live' | 'fallback-fixture';
}

export interface QuotesResponse {
  quotes: Record<AssetId, Result<Quote>>;
  market: MarketStatus;
  fetchedAt: string;
  mock: boolean;
}

/** Un punto de una serie diaria. `date` en YYYY-MM-DD. */
export interface HistoryPoint {
  date: string;
  value: number;
}

export interface HistoryResponse {
  asset: AssetId;
  range: 7 | 30 | 90;
  series: HistoryPoint[];
  gapSeries: HistoryPoint[] | null;
  market: MarketStatus;
}

export type NewsTopic = 'dolar' | 'bcra' | 'fed' | 'inflacion' | 'riesgo-pais' | 'mercados';

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  url: string;
  lang: 'es' | 'en';
  topic: NewsTopic;
}
