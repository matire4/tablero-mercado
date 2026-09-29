'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { AssetId, HistoryPoint, HistoryResponse, Result } from '@/lib/types';
import { linearScale, monotonePath, nearestIndex, niceTicks, padDomain } from '@/lib/chart';
import { ERROR_TEXT, formatNumber, formatPct } from '@/lib/format';

const ASSETS: Array<{ id: AssetId; label: string }> = [
  { id: 'blue', label: 'Blue' }, { id: 'mep', label: 'MEP' }, { id: 'oficial', label: 'Oficial' },
  { id: 'tarjeta', label: 'Tarjeta' }, { id: 'riesgo-pais', label: 'Riesgo país' },
];
const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

// Geometría fija en unidades del viewBox; el ancho real lo da el contenedor.
const PAD = { left: 8, right: 52, top: 12, bottom: 22 };
const PRICE_H = 200;
const GAP_H = 96;
const GAP_SEP = 26;

const fmtDate = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

export function HistoryChart() {
  const [asset, setAsset] = useState<AssetId>('blue');
  const [range, setRange] = useState<Range>(30);
  const [data, setData] = useState<Result<HistoryResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [hover, setHover] = useState<number | null>(null);
  const [width, setWidth] = useState(640);
  const boxRef = useRef<HTMLDivElement>(null);
  const gradId = useId();

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(280, Math.floor(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setHover(null);
    fetch(`/api/history/${asset}?range=${range}`, { signal: ctrl.signal })
      .then((r) => r.json() as Promise<Result<HistoryResponse>>)
      .then((body) => { setData(body); setLoading(false); })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        setData({ ok: false, error: { kind: 'upstream', message: 'No se pudo conectar' } });
        setLoading(false);
      });
    return () => ctrl.abort();
  }, [asset, range]);

  const isRiesgo = asset === 'riesgo-pais';
  const unit = isRiesgo ? 'pts' : '$';
  const series: HistoryPoint[] = data?.ok ? data.data.series : [];
  const gapSeries: HistoryPoint[] | null = data?.ok ? data.data.gapSeries : null;
  const hasGap = !!gapSeries && gapSeries.length > 0;
  const totalH = PAD.top + PRICE_H + (hasGap ? GAP_SEP + GAP_H : 0) + PAD.bottom;

  // Escalas
  const x0 = PAD.left, x1 = width - PAD.right;
  const xOf = (i: number) => (series.length <= 1 ? (x0 + x1) / 2 : x0 + (i / (series.length - 1)) * (x1 - x0));
  const [pMin, pMax] = padDomain(series.map((p) => p.value));
  const yPrice = linearScale(pMin, pMax, PAD.top + PRICE_H, PAD.top);
  const priceTicks = niceTicks(pMin, pMax, 3);

  const gapTop = PAD.top + PRICE_H + GAP_SEP;
  const gapByDate = new Map((gapSeries ?? []).map((p) => [p.date, p.value]));
  const gapVals = series.map((p) => gapByDate.get(p.date)).filter((v): v is number => v !== undefined);
  const [gMin, gMax] = hasGap ? padDomain([...gapVals, 0]) : [0, 1];
  const yGap = linearScale(gMin, gMax, gapTop + GAP_H, gapTop);
  const gapTicks = hasGap ? niceTicks(gMin, gMax, 2) : [];

  const pricePts: Array<[number, number]> = series.map((p, i) => [xOf(i), yPrice(p.value)]);
  const gapPts: Array<[number, number]> = series
    .map((p, i) => [i, gapByDate.get(p.date)] as const)
    .filter((t): t is readonly [number, number] => t[1] !== undefined)
    .map(([i, v]) => [xOf(i), yGap(v)]);
  const pricePath = monotonePath(pricePts);
  const areaPath = pricePts.length > 1 ? `${pricePath}L${x1},${PAD.top + PRICE_H}L${x0},${PAD.top + PRICE_H}Z` : '';
  const gapPath = monotonePath(gapPts);

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    if (series.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;
    setHover(nearestIndex(px, x0, x1, series.length));
  }

  const h = hover !== null && series[hover] ? { p: series[hover], gap: gapByDate.get(series[hover].date), x: xOf(hover) } : null;
  const last = series[series.length - 1];
  const summary = last
    ? `${ASSETS.find((a) => a.id === asset)?.label}, últimos ${range} días: de ${formatNumber(series[0].value)} a ${formatNumber(last.value)} ${unit}.`
    : '';

  return (
    <section className="glass chart" aria-label="Evolución">
      <div className="chart-controls">
        <div className="pills" role="tablist" aria-label="Activo">
          {ASSETS.map((a) => (
            <button key={a.id} role="tab" aria-selected={asset === a.id} className={`pill-btn ${asset === a.id ? 'active' : ''}`} onClick={() => setAsset(a.id)}>{a.label}</button>
          ))}
        </div>
        <div className="segmented" role="tablist" aria-label="Período">
          {RANGES.map((r) => (
            <button key={r} role="tab" aria-selected={range === r} className={`seg-btn ${range === r ? 'active' : ''}`} onClick={() => setRange(r)}>{r} d</button>
          ))}
        </div>
      </div>

      <div ref={boxRef} className="chart-box" style={{ minHeight: totalH }}>
        {loading && <div className="chart-state" aria-busy="true"><div className="skeleton" style={{ width: '40%' }} /><div className="skeleton" style={{ width: '70%' }} /></div>}

        {!loading && data && !data.ok && (
          <div className="chart-state error" role="alert">
            <b>No pudimos obtener el histórico</b>
            <span className="secondary">{ERROR_TEXT[data.error.kind] ?? data.error.message}</span>
          </div>
        )}

        {!loading && data?.ok && series.length === 0 && (
          <div className="chart-state empty">Sin datos para este período</div>
        )}

        {!loading && data?.ok && series.length > 0 && (
          <>
            <svg
              key={`${asset}-${range}`}
              viewBox={`0 0 ${width} ${totalH}`}
              width="100%"
              height={totalH}
              role="img"
              aria-label={summary}
              onPointerMove={onMove}
              onPointerLeave={() => setHover(null)}
              className="chart-svg"
            >
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="var(--chart-price)" stopOpacity="0.28" />
                  <stop offset="1" stopColor="var(--chart-price)" stopOpacity="0" />
                </linearGradient>
              </defs>

              {priceTicks.map((t) => (
                <g key={`p${t}`}>
                  <line x1={x0} x2={x1} y1={yPrice(t)} y2={yPrice(t)} className="grid" />
                  <text x={x1 + 8} y={yPrice(t) + 4} className="tick">{formatNumber(t)}</text>
                </g>
              ))}
              {areaPath && <path d={areaPath} fill={`url(#${gradId})`} />}
              <path d={pricePath} className="line price" pathLength={1} />
              {pricePts.length > 0 && (
                <g>
                  <circle cx={pricePts[pricePts.length - 1][0]} cy={pricePts[pricePts.length - 1][1]} r="8" className="dot-halo" />
                  <circle cx={pricePts[pricePts.length - 1][0]} cy={pricePts[pricePts.length - 1][1]} r="3.5" className="dot price" />
                </g>
              )}

              {hasGap && (
                <>
                  <text x={x0} y={gapTop - 8} className="tick label">Brecha vs oficial (%)</text>
                  {gapTicks.map((t) => (
                    <g key={`g${t}`}>
                      <line x1={x0} x2={x1} y1={yGap(t)} y2={yGap(t)} className={t === 0 ? 'grid zero' : 'grid'} />
                      <text x={x1 + 8} y={yGap(t) + 4} className="tick">{formatPct(t)}</text>
                    </g>
                  ))}
                  <path d={gapPath} className="line gap" pathLength={1} />
                </>
              )}

              <text x={x0} y={totalH - 6} className="tick">{fmtDate(series[0].date)}</text>
              {series.length > 2 && <text x={(x0 + x1) / 2} y={totalH - 6} className="tick" textAnchor="middle">{fmtDate(series[Math.floor(series.length / 2)].date)}</text>}
              <text x={x1} y={totalH - 6} className="tick" textAnchor="end">{fmtDate(last.date)}</text>

              {h && (
                <g className="crosshair">
                  <line x1={h.x} x2={h.x} y1={PAD.top} y2={totalH - PAD.bottom} />
                  <circle cx={h.x} cy={yPrice(h.p.value)} r="4" className="dot price" />
                  {hasGap && h.gap !== undefined && <circle cx={h.x} cy={yGap(h.gap)} r="4" className="dot gap" />}
                </g>
              )}
            </svg>

            {h && (
              <div className="tooltip" style={{ left: `${(h.x / width) * 100}%` }} role="status">
                <span className="tooltip-date">{fmtDate(h.p.date)}</span>
                <span><i className="swatch price" />{isRiesgo ? `${formatNumber(h.p.value)} pts` : `$ ${formatNumber(h.p.value)}`}</span>
                {hasGap && h.gap !== undefined && <span><i className="swatch gap" />brecha {formatPct(h.gap)}</span>}
              </div>
            )}
          </>
        )}
      </div>

      <div className="chart-legend secondary">
        <span><i className="swatch price" />{isRiesgo ? 'Riesgo país (puntos)' : 'Precio de venta ($)'}</span>
        {hasGap && <span><i className="swatch gap" />Brecha vs oficial (%)</span>}
        {!loading && data?.ok && series.length > 0 && (
          <details className="table-toggle">
            <summary>Ver como tabla</summary>
            <table>
              <thead><tr><th>Fecha</th><th>{isRiesgo ? 'Puntos' : 'Venta'}</th>{hasGap && <th>Brecha</th>}</tr></thead>
              <tbody>
                {series.map((p) => (
                  <tr key={p.date}><td>{p.date}</td><td>{formatNumber(p.value)}</td>{hasGap && <td>{gapByDate.has(p.date) ? formatPct(gapByDate.get(p.date)!) : '—'}</td>}</tr>
                ))}
              </tbody>
            </table>
          </details>
        )}
      </div>
    </section>
  );
}
