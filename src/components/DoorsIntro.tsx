'use client';

import { useEffect } from 'react';

const MIN_MS = 200 + 1400; // quieta + acercamiento (globals.css), contado desde el primer pintado
const MAX_WAIT_MS = 6000; // si una fuente tarda más, se abre igual y se ven los estados reales
const OPEN_MS = 800; // apertura (globals.css)

/**
 * Entrada "puertas": telón que se acerca y se abre cuando el tablero ya tiene sus datos.
 * Las puertas son CSS puro sobre html[data-intro] (ver globals.css) y la marca la pone el script inline
 * de layout.tsx antes del primer pintado, solo la primera vez por sesión (sessionStorage) y sin
 * prefers-reduced-motion. Así el tablero se carga detrás y no hay parpadeo hasta hidratar.
 *
 * Este componente decide cuándo abrir: cuando pasó el acercamiento y no queda ningún panel con
 * aria-busy="true" (tarjetas, gráfico y noticias lo usan mientras cargan), o a los 6 s como máximo.
 * Pone data-intro="open" (dispara la apertura en CSS) y saca la marca al terminar.
 * No usa setState: el estado vive en el atributo de <html>, como el tema.
 */
export function DoorsIntro() {
  useEffect(() => {
    const html = document.documentElement;
    if (html.dataset.intro === undefined) return;

    // La animación arranca con el primer pintado; performance.now() cuenta desde la navegación.
    const firstPaint = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0;
    const sinceFirstPaint = () => performance.now() - firstPaint;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let opened = false;

    const open = () => {
      if (opened) return;
      opened = true;
      observer.disconnect();
      html.dataset.intro = 'open';
      timers.push(setTimeout(() => { delete html.dataset.intro; }, OPEN_MS + 100));
    };
    const tryOpen = () => {
      if (sinceFirstPaint() >= MIN_MS && !document.querySelector('[aria-busy="true"]')) open();
    };
    const observer = new MutationObserver(tryOpen);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['aria-busy'] });
    timers.push(setTimeout(tryOpen, Math.max(0, MIN_MS - sinceFirstPaint())));
    timers.push(setTimeout(open, Math.max(0, MAX_WAIT_MS - sinceFirstPaint())));

    return () => { observer.disconnect(); timers.forEach(clearTimeout); };
  }, []);

  return null;
}
