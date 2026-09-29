'use client';

import { useEffect, useState } from 'react';
import type { AssetId, QuotesResponse } from '@/lib/types';
import { MarketBadge } from './MarketBadge';
import { HistoryChart } from './HistoryChart';
import { NewsBoard } from './NewsBoard';
import { QuoteCard } from './QuoteCard';
import { ThemeToggle } from './ThemeToggle';
import { Tutorial } from './Tutorial';

const ASSETS: AssetId[] = ['blue', 'mep', 'oficial', 'tarjeta', 'riesgo-pais'];
const REFRESH_MS = 60_000; // alineado con la cache del server
const CLOCK_MS = 30_000; // "hace X min" se recalcula sin pedir datos

export function Dashboard() {
  const [data, setData] = useState<QuotesResponse | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        // Sin cache: 'no-store': el navegador mandaría Cache-Control: no-cache y Next saltearía su cache de datos.
        const res = await fetch('/api/quotes');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = (await res.json()) as QuotesResponse;
        if (!cancelled) { setData(body); setFetchError(null); setNow(new Date()); }
      } catch (err) {
        if (!cancelled) setFetchError(err instanceof Error ? err.message : 'error');
      }
    }
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), CLOCK_MS);
    return () => clearInterval(id);
  }, []);

  // En modo mock el reloj es el del fixture, para que "hace X" y mercado cerrado sean coherentes con los datos.
  const clock = data?.mock ? new Date(data.fetchedAt) : now;

  return (
    <>
      {data?.mock && <div className="mock-banner" role="note">Datos de demostración, no reflejan el mercado</div>}

      <header className="header">
        <div>
          <h1 className="title">Tablero de mercado</h1>
          <p className="disclaimer secondary">No es recomendación de inversión · cada dato dice de cuándo es</p>
        </div>
        <div className="header-actions">
          {data && <MarketBadge market={data.market} fetchedAt={data.fetchedAt} now={clock} />}
          <Tutorial ready={data !== null} />
          <ThemeToggle />
        </div>
      </header>

      {fetchError && !data && (
        <div className="glass empty-state" role="alert">No pudimos conectar con el tablero. Se reintenta cada minuto.</div>
      )}

      <section className="grid" aria-label="Cotizaciones">
        {ASSETS.map((asset, i) => (
          <QuoteCard
            key={asset}
            asset={asset}
            result={data ? data.quotes[asset] : null}
            market={data?.market ?? null}
            now={clock}
            index={i}
          />
        ))}
      </section>

      <HistoryChart />

      <NewsBoard />
    </>
  );
}
