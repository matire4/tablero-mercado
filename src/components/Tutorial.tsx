'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';

const STORAGE_KEY = 'tutorial-seen';
const WELCOME = -1; // la bienvenida no cuenta como paso

/**
 * Avatar del tutorial: tres clips del video del Memoji de Mati (el de su portafolio), sin fondo (segmentados cuadro
 * por cuadro al armarlos) y en WebP animado con transparencia, que anda en Chrome, Firefox y Safari. Cada uno tiene
 * además su primer cuadro fijo (-0.webp) para prefers-reduced-motion. Son decorativos (aria-hidden) y se cambian
 * sin tocar la lógica: en un banco va su mascota o se sacan (docs/demo.md).
 * saludo: bienvenida (una vez) · reposo: en bucle durante los pasos · guino: al llegar al último paso (una vez).
 */
type Clip = 'saludo' | 'reposo' | 'guino';
const ONCE_MS: Record<Exclude<Clip, 'reposo'>, number> = { saludo: 58 * 67, guino: 18 * 67 }; // cuadros × 67 ms

/** Cada paso apunta a un elemento real del tablero por su atributo data-tutorial (no por clase). */
const STEPS = [
  {
    anchor: 'valor',
    title: 'Valor y hora del dato',
    text: 'Mirá esta tarjeta: es el precio de venta y hace cuánto se actualizó. Si dice "último cierre", el mercado está cerrado y el dato es de ese momento.',
  },
  {
    anchor: 'brecha',
    title: 'Brecha',
    text: 'Esto es la brecha: cuánto se aleja este dólar del oficial, en porcentaje. Te la muestro; no te digo si es mucho o poco.',
  },
  {
    anchor: 'mercado',
    title: 'Mercado abierto o cerrado',
    text: 'Acá ves si el mercado está abierto o cerrado. Si está cerrado, las tarjetas quedan con el último valor y te dicen de cuándo es.',
  },
  {
    anchor: 'noticias',
    title: 'Noticias con demora',
    text: 'Las noticias pueden venir con hasta 12 h de demora: cada una dice cuándo salió. Van de la más nueva a la más vieja, no por importancia. Si te olvidás de algo, estoy en "¿Cómo leer esto?".',
  },
] as const;

// La entrada "puertas" terminó cuando <html> ya no tiene data-intro (lo saca DoorsIntro al abrir).
// Se lee con useSyncExternalStore, como el tema en ThemeToggle: sin setState dentro de un efecto.
function subscribeIntro(onChange: () => void) {
  const mo = new MutationObserver(onChange);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-intro'] });
  return () => mo.disconnect();
}
const introOver = () => document.documentElement.dataset.intro === undefined;

// Primera vez = sin marca en localStorage. Si el navegador no da storage (lanza), no se abre solo:
// sin forma de recordar que ya se vio, se abriría en cada visita.
function isFirstVisit(): boolean {
  try { return localStorage.getItem(STORAGE_KEY) === null; } catch { return false; }
}
const noSubscribe = () => () => {};
function subscribeReduce(onChange: () => void) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}
const prefersReduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const serverFalse = () => false;

/**
 * Tutorial: botón "¿Cómo leer esto?" + avatar que guía + recuadro sobre el elemento de cada paso.
 * La primera vez se abre solo con la bienvenida, cuando terminó la entrada y el tablero tiene datos (los pasos
 * apuntan a elementos que existen solo con datos). Desde el botón arranca directo en el paso 1.
 * Al cerrarlo por cualquier vía queda marcado como visto.
 */
export function Tutorial({ ready }: { ready: boolean }) {
  const intro = useSyncExternalStore(subscribeIntro, introOver, serverFalse);
  const firstVisit = useSyncExternalStore(noSubscribe, isFirstVisit, serverFalse);
  // null = nadie lo abrió ni lo cerró todavía: decide la apertura automática.
  const [choice, setChoice] = useState<boolean | null>(null);
  const [step, setStep] = useState(WELCOME);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const open = choice ?? (ready && intro && firstVisit);

  // La primera vez, apenas hay datos, se pide el saludo (~600 KB) para que no aparezca a medio cargar. El resto
  // de los clips carga mientras se lee la bienvenida.
  useEffect(() => {
    if (!ready || !firstVisit) return;
    fetch('/avatar/mati-saludo.webp').catch(() => { /* decorativo: si falla, el avatar aparece cuando cargue */ });
  }, [ready, firstVisit]);

  const close = useCallback(() => {
    setChoice(false);
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* sin storage: se vuelve a abrir solo la próxima vez */ }
    buttonRef.current?.focus();
  }, []);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="pill help-btn"
        aria-haspopup="dialog"
        onClick={() => { setStep(0); setChoice(true); }}
      >
        ¿Cómo leer esto?
      </button>
      {open && createPortal(<TourLayer step={step} setStep={setStep} onClose={close} />, document.body)}
    </>
  );
}

interface LayerProps {
  step: number;
  setStep: (n: number) => void;
  onClose: () => void;
}

function TourLayer({ step, setStep, onClose }: LayerProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const welcome = step === WELCOME;
  const s = welcome ? null : STEPS[step];
  const last = step === STEPS.length - 1;
  const anchorName = s?.anchor ?? null;
  const reduce = useSyncExternalStore(subscribeReduce, prefersReduce, serverFalse);
  // Clip del avatar: el de una vez (saludo o guiño) y, cuando termina, reposo en bucle. restAt = paso en el que ya
  // terminó el clip de una vez (el cambio lo dispara un timer, no un setState dentro del efecto).
  const [restAt, setRestAt] = useState<number | null>(null);
  const firstClip: Clip = welcome ? 'saludo' : last ? 'guino' : 'reposo';
  const clip: Clip = restAt === step ? 'reposo' : firstClip;
  // Con prefers-reduced-motion no se anima: primer cuadro fijo del clip del paso.
  const avatarSrc = reduce ? `/avatar/mati-${firstClip}-0.webp` : `/avatar/mati-${clip}.webp`;

  // Al abrir, el foco va al diálogo.
  useEffect(() => { panelRef.current?.focus(); }, []);

  // Si el botón que tenía el foco desaparece o se deshabilita (Empezar, Anterior en el paso 1), pasa al principal.
  useEffect(() => {
    const panel = panelRef.current;
    if (panel && !panel.contains(document.activeElement)) nextRef.current?.focus();
  }, [step]);

  // Esc cierra; Tab y Shift+Tab quedan dentro del panel (primer y último botón habilitado).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      const panel = panelRef.current;
      if (e.key !== 'Tab' || !panel) return;
      const focusables = [...panel.querySelectorAll<HTMLElement>('button:not([disabled])')];
      if (focusables.length === 0) return;
      const first = focusables[0];
      const lastEl = focusables[focusables.length - 1];
      const active = document.activeElement;
      const inside = active instanceof Node && panel.contains(active);
      if (e.shiftKey && (!inside || active === first || active === panel)) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && (!inside || active === lastEl)) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Recuadro, panel y avatar se posicionan escribiendo el estilo directo (sin estado de React): se recalculan
  // con scroll, resize y cambios de alto de la página (el gráfico y las noticias cargan después).
  useEffect(() => {
    const layer = layerRef.current;
    const box = boxRef.current;
    const card = cardRef.current;
    if (!layer || !box || !card) return;
    const selector = anchorName ? `[data-tutorial="${anchorName}"]` : null;
    let frame = 0;
    let firstPlace = true;
    let moveTimer: ReturnType<typeof setTimeout> | undefined;

    const place = () => {
      frame = 0;
      const anchor = selector ? document.querySelector<HTMLElement>(selector) : null;
      if (!anchor) {
        // Bienvenida, o el elemento no está (por ejemplo, esa tarjeta en error): se oscurece todo.
        layer.dataset.anchor = 'none';
        placeCard(card, null, selector === null);
      } else {
        const r = anchor.getBoundingClientRect();
        layer.dataset.anchor = 'ok';
        box.style.top = `${r.top}px`;
        box.style.left = `${r.left}px`;
        box.style.width = `${r.width}px`;
        box.style.height = `${r.height}px`;
        const radius = getComputedStyle(anchor).borderRadius;
        box.style.borderRadius = radius === '0px' ? '8px' : radius; // el encabezado de noticias no tiene radio
        placeCard(card, r, false);
      }
      // Al cambiar de paso, recuadro y panel+avatar viajan juntos al nuevo elemento (CSS, data-moving); con
      // scroll o resize se mueven pegados, sin transición, para no quedar atrás del elemento.
      if (firstPlace && card.dataset.placed !== undefined) {
        box.dataset.moving = '';
        card.dataset.moving = '';
        moveTimer = setTimeout(() => { delete box.dataset.moving; delete card.dataset.moving; }, 500);
      }
      firstPlace = false;
      card.dataset.placed = '';
      box.dataset.placed = '';
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(place); };

    if (selector) document.querySelector(selector)?.scrollIntoView({ block: 'center' });
    schedule();
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, { passive: true });
    const ro = new ResizeObserver(schedule);
    ro.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(moveTimer);
      delete box.dataset.moving;
      delete card.dataset.moving;
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule);
      ro.disconnect();
    };
  }, [anchorName]);

  useEffect(() => {
    if (reduce || firstClip === 'reposo') return;
    const t = setTimeout(() => setRestAt(step), ONCE_MS[firstClip]);
    return () => clearTimeout(t);
  }, [step, firstClip, reduce]);

  return (
    <div ref={layerRef} className="tour-layer" data-welcome={welcome ? '' : undefined}>
      <div ref={boxRef} className={`tour-box${anchorName === 'brecha' ? ' gap' : ''}`} aria-hidden="true" data-testid="tour-box" />
      <div ref={cardRef} className="tour-card">
        <div ref={avatarRef} className="tour-av" aria-hidden="true" data-testid="tour-avatar">
          {/* key: al cambiar de clip se monta una imagen nueva, así el WebP animado arranca desde el principio. */}
          <Image
            key={avatarSrc}
            className="tour-av-img"
            src={avatarSrc}
            alt=""
            width={360}
            height={270}
            unoptimized
            loading="eager"
            draggable={false}
            onLoad={() => { if (avatarRef.current) avatarRef.current.dataset.ready = ''; }}
          />
        </div>
        <div
          ref={panelRef}
          className="tour-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tour-title"
          aria-describedby="tour-text"
          tabIndex={-1}
        >
          {welcome ? (
            <>
              <div aria-live="polite" aria-atomic="true">
                <h2 id="tour-title" className="tour-hello">¡Hola! Soy Mati.</h2>
                <p id="tour-text" className="tour-text secondary">Te muestro en 30 segundos cómo leer este tablero: son 4 cosas y listo.</p>
              </div>
              <div className="tour-actions welcome">
                <button type="button" className="tour-btn" onClick={onClose}>Saltar</button>
                <button ref={nextRef} type="button" className="tour-btn primary" onClick={() => setStep(0)}>Empezar</button>
              </div>
              <p className="tour-note secondary">Podés salir en cualquier momento.</p>
            </>
          ) : (
            <>
              <div aria-live="polite" aria-atomic="true">
                <p className="tour-head secondary">Paso {step + 1} de {STEPS.length}</p>
                <h2 id="tour-title" className="sr-only">{s?.title}</h2>
                <p id="tour-text" className="tour-bubble secondary" key={step}>{s?.text}</p>
              </div>
              <div className="tour-actions">
                <button type="button" className="tour-btn ghost" onClick={onClose}>Saltar tutorial</button>
                <button type="button" className="tour-btn" onClick={() => setStep(step - 1)} disabled={step === 0}>Anterior</button>
                <button ref={nextRef} type="button" className="tour-btn primary" onClick={last ? onClose : () => setStep(step + 1)}>
                  {last ? 'Entendido' : 'Siguiente'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const GAP = 14; // entre el elemento y la tarjeta
const MARGIN = 16; // al borde de la ventana

/**
 * Ubica la tarjeta (avatar + globo). Celular (< 900 px): siempre abajo (CSS).
 * Escritorio: la bienvenida al centro; en los pasos, debajo del elemento si entra, si no arriba, y si no entra
 * en ninguno de los dos, abajo centrada. El panel queda alineado con el borde izquierdo del elemento y el
 * avatar a su izquierda.
 */
function placeCard(card: HTMLElement, r: DOMRect | null, center: boolean) {
  const fallback = (place: 'bottom' | 'center') => { card.style.top = ''; card.style.left = ''; card.dataset.place = place; };
  const desktop = window.matchMedia('(min-width: 900px)').matches;
  if (!desktop) return fallback('bottom'); // en celular, siempre abajo: Mati asoma desde el borde
  const w = card.offsetWidth;
  const h = card.offsetHeight;
  if (center) {
    // En px y no con transform: así la tarjeta viaja sin saltos desde el centro hasta el primer paso.
    card.style.top = `${Math.max(MARGIN, (window.innerHeight - h) / 2)}px`;
    card.style.left = `${Math.max(MARGIN, (window.innerWidth - w) / 2)}px`;
    card.dataset.place = 'anchor';
    return;
  }
  if (!r) return fallback('bottom');
  const panelW = card.querySelector<HTMLElement>('.tour-panel')?.offsetWidth ?? w;
  let top: number;
  if (window.innerHeight - r.bottom >= h + GAP + MARGIN) top = r.bottom + GAP;
  else if (r.top >= h + GAP + MARGIN) top = r.top - GAP - h;
  else return fallback('bottom');
  const left = Math.min(Math.max(r.left - (w - panelW), MARGIN), window.innerWidth - w - MARGIN);
  card.style.top = `${top}px`;
  card.style.left = `${left}px`;
  card.dataset.place = 'anchor';
}
