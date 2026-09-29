import type { AssetId, MarketStatus, Quote, Result } from '@/lib/types';
import { ERROR_TEXT, formatArs, formatCierre, formatDia, formatNumber, formatPct, relativeTime } from '@/lib/format';

const LABELS: Record<AssetId, string> = {
  blue: 'Blue', mep: 'MEP', oficial: 'Oficial', tarjeta: 'Tarjeta', 'riesgo-pais': 'Riesgo país',
};
const SOURCES: Record<AssetId, string> = {
  blue: 'DolarAPI', mep: 'DolarAPI', oficial: 'DolarAPI', tarjeta: 'DolarAPI', 'riesgo-pais': 'ArgentinaDatos',
};

interface Props {
  asset: AssetId;
  result: Result<Quote> | null; // null = cargando
  market: MarketStatus | null;
  now: Date;
  index: number;
}

/** Una tarjeta decide su propio estado: carga, error o dato (abierto / cerrado). */
export function QuoteCard({ asset, result, market, now, index }: Props) {
  const style = { '--i': index } as React.CSSProperties;

  if (result === null) {
    return (
      <div className="card glass" style={style} aria-busy="true">
        <div className="card-head"><b style={{ color: 'var(--fg-3)' }}>{LABELS[asset]}</b><span>Cargando…</span></div>
        <div className="skeleton big" />
        <div className="skeleton" style={{ width: '45%' }} />
        <div className="skeleton" style={{ width: '35%' }} />
      </div>
    );
  }

  if (!result.ok) {
    return (
      <div className="card glass error" style={style} role="alert">
        <div className="card-head"><b>{LABELS[asset]}</b><span>{SOURCES[asset]}</span></div>
        <div className="card-error-title">No pudimos obtener este dato</div>
        <div className="card-meta secondary">{ERROR_TEXT[result.error.kind] ?? result.error.message} Se reintenta cada minuto.</div>
        <div className="card-time">No se muestra ningún valor anterior ni estimado.</div>
      </div>
    );
  }

  const q = result.data;
  const isRiesgo = asset === 'riesgo-pais';
  const closed = market ? !market.isOpen : false;

  const changeText = q.changePct === null
    ? 'variación no disponible'
    : `${formatPct(q.changePct)} ${isRiesgo ? 'vs rueda anterior' : closed ? 'en la rueda' : 'hoy'}`;

  const timeText = !q.updatedAtHasTime
    ? `dato del ${formatDia(q.updatedAt)}`
    : closed && market
      ? `último cierre ${formatCierre(market.lastCloseAt)}`
      : relativeTime(q.updatedAt, now);

  // Anclas del tutorial (Tutorial.tsx): solo la tarjeta Blue con dato.
  const isBlue = asset === 'blue';

  return (
    <div className="card glass" style={style} data-tutorial={isBlue ? 'valor' : undefined}>
      <div className="card-head"><b>{LABELS[asset]}</b><span>{SOURCES[asset]}</span></div>
      <div className="card-value">
        {isRiesgo ? <>{formatNumber(q.sell)} <small>pts</small></> : formatArs(q.sell)}
      </div>
      <div className="card-meta secondary">
        {changeText}
        {q.buy !== null && <> · compra {formatNumber(q.buy)}</>}
      </div>
      {asset === 'oficial' && <span className="chip neutral">Referencia para la brecha</span>}
      {isRiesgo && <span className="chip neutral">Sin brecha</span>}
      {!isRiesgo && asset !== 'oficial' && (
        q.gapVsOficial === null
          ? <span className="chip neutral" data-tutorial={isBlue ? 'brecha' : undefined}>Brecha no disponible</span>
          : <span className="chip" data-tutorial={isBlue ? 'brecha' : undefined}>Brecha {formatPct(q.gapVsOficial)}</span>
      )}
      <div className="card-time">{timeText}</div>
    </div>
  );
}
