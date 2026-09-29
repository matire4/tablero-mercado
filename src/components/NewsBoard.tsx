'use client';

import { useEffect, useState } from 'react';
import type { NewsResponse, NewsTopic, Result } from '@/lib/types';
import { ERROR_TEXT, formatCierre, relativeTime } from '@/lib/format';

const TOPIC_LABEL: Record<NewsTopic, string> = {
  dolar: 'Dólar', bcra: 'BCRA', fed: 'Fed', inflacion: 'Inflación', 'riesgo-pais': 'Riesgo país', mercados: 'Mercados',
};
const LANG = { es: { short: 'ES', long: 'en español' }, en: { short: 'EN', long: 'en inglés' } } as const;

type State = { status: 'loading' } | { status: 'done'; body: Result<NewsResponse> };

/**
 * Tablero de noticias. Una sola carga al montar: las notas del plan gratis llegan con hasta 12 h de demora,
 * refrescarlas cada minuto no las acerca al presente (arquitectura.md §10).
 * Estados: carga · error · sin datos · parcial (una búsqueda falló) · lista.
 */
export function NewsBoard() {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/news')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<Result<NewsResponse>>;
      })
      .then((body) => { if (!cancelled) setState({ status: 'done', body }); })
      .catch(() => {
        if (!cancelled) setState({ status: 'done', body: { ok: false, error: { kind: 'upstream', message: 'sin conexión con el tablero' } } });
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="news glass" aria-labelledby="news-title">
      <div className="news-head">
        <h2 id="news-title" className="news-title">Noticias</h2>
        <p className="news-sub secondary">
          Dólar, BCRA, Fed, inflación, riesgo país y mercados · pueden tener hasta 12 h de demora
        </p>
      </div>
      <NewsBody state={state} />
    </section>
  );
}

function NewsBody({ state }: { state: State }) {
  if (state.status === 'loading') {
    return (
      <ul className="news-list" aria-busy="true" aria-label="Cargando noticias">
        {[0, 1, 2].map((i) => (
          <li key={i} className="news-item">
            <div className="skeleton" style={{ width: '90%' }} />
            <div className="skeleton" style={{ width: '40%', height: 10 }} />
          </li>
        ))}
      </ul>
    );
  }

  const { body } = state;
  if (!body.ok) {
    return (
      <div className="news-state error" role="alert">
        <b>No pudimos traer las noticias</b>
        <span className="secondary">{ERROR_TEXT[body.error.kind] ?? body.error.message} Las cotizaciones siguen funcionando. Recargá la página para reintentar.</span>
      </div>
    );
  }

  const { items, sources, fetchedAt, mock } = body.data;
  // En mock el reloj es el de la captura del fixture; en real, el del navegador.
  const now = mock ? new Date(fetchedAt) : new Date();
  const partial = sources.ok < sources.total;

  if (items.length === 0) {
    return (
      <div className="news-state empty">
        Sin noticias de los temas del tablero por ahora.
        {partial && <span className="secondary">Una de las fuentes no respondió.</span>}
      </div>
    );
  }

  return (
    <>
      {partial && (
        <p className="news-partial secondary" role="note">Una de las fuentes no respondió; la lista puede estar incompleta.</p>
      )}
      <ul className="news-list">
        {items.map((n) => (
          <li key={n.id} className="news-item">
            <a className="news-link" href={n.url} target="_blank" rel="noopener noreferrer" lang={n.lang}>
              {n.title}
            </a>
            <div className="news-meta secondary">
              <span>{n.source}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={n.publishedAt} title={`Publicada ${formatCierre(n.publishedAt)} (hora Argentina)`}>
                {relativeTime(n.publishedAt, now)}
              </time>
              <span className="tag" aria-label={`Idioma: ${LANG[n.lang].long}`}>{LANG[n.lang].short}</span>
              <span className="tag">{TOPIC_LABEL[n.topic]}</span>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
