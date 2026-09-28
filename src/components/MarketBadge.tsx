import type { MarketStatus } from '@/lib/types';
import { formatCierre, relativeTime } from '@/lib/format';

/** Píldora del encabezado: abierto (punto lleno + "hace X") o cerrado (punto hueco + último cierre). */
export function MarketBadge({ market, fetchedAt, now }: { market: MarketStatus; fetchedAt: string; now: Date }) {
  if (market.isOpen) {
    return (
      <div className="pill" role="status">
        <span className="pill-dot" />
        <span style={{ fontWeight: 500 }}>Mercado abierto</span>
        <span className="muted">· datos de {relativeTime(fetchedAt, now)}</span>
      </div>
    );
  }
  return (
    <div className="pill" role="status">
      <span className="pill-dot closed" />
      <span style={{ fontWeight: 500 }}>Mercado cerrado</span>
      <span className="muted">· último cierre {formatCierre(market.lastCloseAt)}</span>
    </div>
  );
}
