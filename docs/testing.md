# Testing

Plan, cobertura contra los criterios de aceptación y casos de prueba documentados.
Escrito por el rol QA (30/09/2026), que no participó del desarrollo. La definición de terminado son los criterios Given/When/Then de `docs/producto.md`.

**Estado al 02/10:** sobre el código congelado (`4bb415b`, después del descongelamiento del 02/10), 101 tests unitarios y 31 e2e en verde, más 1 salteado a propósito (H0-7 solo aplica al viewport de celular), en un clon limpio (§7). `npm run check` (tipos + lint + unitarios) y `npm run test:e2e`. Pruebas manuales hechas: casos 1 a 3, Lighthouse en celular y recorrido con teclado (§5).

---

## 1. Plan por tipo de prueba

Presupuesto de QA: 3 h para la primera fase y 1,5 h para el cierre. Al arrancar QA ya existían 85 unitarios y 15 e2e escritos durante el desarrollo, así que el trabajo fue **encontrar huecos, no sumar cobertura**. La columna "Qué se hizo" dice lo que se ejecutó de verdad, no lo planeado.

| Tipo | Decisión | Qué se hizo | Por qué |
|---|---|---|---|
| Unitarias (Vitest + MSW) | Automatizado | 101 tests. Adaptadores, normalización y `fetchJson` con MSW simulando timeout, HTTP 429, 500, respuesta vacía, JSON inválido y corte a mitad de lectura; el server en modo real con MSW para histórico vacío, formato cambiado y puntos descartados (#1, #8, #9, #11). Lógica pura: días hábiles, estado de mercado, variación del día, brecha, escalas del gráfico, formato es-AR. Archivos del avatar: bucle sin fin y pausa de 1,5 s en el contenedor WebP (`avatar-clips.test.ts`, 02/10). | Es donde está la lógica que puede mentir un dato; corre en ~5 s. |
| Integración con APIs reales | Manual, puntual | `curl` contra la URL pública y dashboard de GNews (caso 3, BUG-01); modo real local con clave inválida (BUG-01). | Automatizarla gasta cuota de GNews (100/día) y depende de terceros. |
| e2e (Playwright, modo mock) | Automatizado | 31 + 1 salteado: un test por criterio de aceptación, en escritorio y celular (Pixel 7). Error, cerrado, sin datos y avisos del gráfico se disparan interceptando `/api/*` en el navegador. Tutorial: foco, Tab, Esc, pedidos de red con `prefers-reduced-motion` (#12) y fondo sin scroll mientras está abierto (rueda, teclas, dedo; 02/10). | Cubre lo que el usuario ve, sin tocar el código de la app. |
| Responsive | Automatizado parcial + manual | e2e de una columna y sin scroll horizontal en celular (H0-7); caso 2 en celular; caso 1 en celular (captura). | La legibilidad del gráfico solo se juzga mirando. |
| Accesibilidad básica | Manual + e2e del tutorial | Recorrido con teclado de 15 pasos en Chrome (§5, todos OK); Lighthouse Accessibility en celular: 97. | No se suma axe: dependencia nueva por un dato que Lighthouse ya da. |
| Performance | Una medición | Lighthouse (PageSpeed Insights) en celular: Rendimiento 82 (§5). Peso del avatar tratado como riesgo (`riesgos.md` fila 10). | Sin presupuesto para optimizar; el número queda como referencia. |
| Seguridad de claves | Revisión manual | Código e historial de git completo (`git log --all -p`): sin claves (§6, "Revisado sin hallazgos"; `riesgos.md` fila 9). | Es la única clave del producto y lo pide la definición de terminado. |
| Plan B de la demo | Manual | URL pública de `demo-mock` en ventana privada y hash de `/api/quotes` contra el mock local (§7, 02/10). | Ítem del PDF: probar el plan B en la URL pública. |
| Lector de pantalla (VoiceOver) | **Descartado por tiempo** | — | Un recorrido serio lleva más de 1 h y el teclado + Lighthouse cubren lo básico. |
| Otros navegadores (Firefox) y Safari completo | **Descartado por tiempo** | Safari solo en el plan B; e2e solo en Chromium. | El clip WebP animado se eligió porque anda igual en los tres (`CLAUDE.md`); el resto es HTML/CSS estándar. |
| Carga y estrés | **Descartado por tiempo** | — | El tráfico de la demo es un puñado de visitas; el límite real es la cuota de GNews, ya tratado en `riesgos.md` fila 5. |
| Pruebas con usuarios del perfil | **Descartado por tiempo** | — | Requiere reclutar usuarios; queda como propuesta en `riesgos.md` fila 2. |

## 2. Cobertura contra los criterios de aceptación

✔ = cubierto · — = no aplica en ese nivel. En negrita, lo que se agregó en QA.

| Criterio | Unitario | e2e |
|---|---|---|
| H0-1 · 5 tarjetas, hora del dato, disclaimer sin scroll | `change`, `format` | `tablero.spec` |
| H0-2 · gráfico por activo, 7/30/90 | `data` (30/09: cantidad exacta de fechas, hallazgo #4) | `tablero.spec` |
| H0-3 · noticias con título, fuente, fecha, idioma, tema fijo | `providers` | `tablero.spec` |
| H0-4 · fin de semana/feriado: último cierre, sin error | `market-status`, `data` | **`estados.spec`** |
| H0-5 · proveedor caído: error propio, el resto sigue, sin valor inventado | `fetch-json`, `providers`, **`dolarapi-fetch`** | `tablero.spec` (noticias), **`estados.spec` (cotizaciones)** |
| H0-6 · histórico vacío: "sin datos", distinto de error | `data` (30/09: modo real con MSW, `[]` → sin datos, 500 → error) | **`estados.spec`** |
| H0-7 · celular apilado, sin corte | — | `tablero.spec` + caso 2 (manual) |
| H1-1 · brecha en tarjeta, un decimal | `brecha` | `tablero.spec` |
| H1-2 · panel de brecha propio, alineado por fecha | `data` | `tablero.spec` |
| H1-3 · sin brecha en oficial y riesgo país | `data` | `tablero.spec` |
| H1-4 · sin oficial: "no disponible", precio visible | `data` | **`estados.spec`** |
| H1-5 · brecha en mercado cerrado | `data` | **`estados.spec`** |

**Hallazgo principal del relevamiento:** la lógica estaba bien cubierta, pero **ningún test dibujaba los estados de error, cerrado o sin datos**: el e2e corría solo el escenario `normal`. Se sumaron 4 e2e (× 2 viewports) y 2 unitarios.

**Hallazgo sobre la especificación:** al escribir el e2e de H0-4 apareció que riesgo país nunca muestra "último cierre", porque ArgentinaDatos lo publica sin hora. El código hacía lo correcto; el criterio pedía inventar una hora. Se precisó el criterio (desvío del 30/09 en `producto.md`, entrada en `ai-log.md`).

## 3. Cómo correr los tests

```bash
npm run check        # tipos + lint + 101 unitarios (~5 s)
npm run test:e2e     # 32 e2e (31 + 1 salteado) en modo mock, un worker, levanta next dev en :3100 (1 a 2 min)
```

El e2e siempre corre en modo mock (`playwright.config.ts` fuerza `USE_MOCK_DATA=true`), así que no gasta cuota ni depende de terceros. Si hay otro `next dev` corriendo sobre la misma carpeta, el e2e no arranca (Next 16).

**Un solo worker (01/10).** Con 2 workers, el test del tutorial que se abre desde "¿Cómo leer esto?" falló en dos corridas completas seguidas en la Mac (una en celular, otra en escritorio, en puntos distintos) y pasó solo y en la nube. Los traces muestran la Mac sin CPU, no un error de la app: `/api/quotes` respondió en 112 ms, pero Playwright solo pudo consultar la página 4 veces en 5 s; en la otra corrida la página se dibujaba a ~2 cuadros por segundo y un `Tab` no se procesó en 22 s. Con `workers: 1` en `playwright.config.ts` pasan los 27 y tarda lo mismo (1,8 min contra 1,9): el cuello era la CPU, no la cantidad de tests en paralelo.

---

## 4. Casos de prueba documentados

### Caso 1 · Happy path en la URL pública, mercado abierto

| | |
|---|---|
| **Criterios** | H0-1, H0-2, H0-3, H1-1, H1-2, H0-7 |
| **Por qué este caso** | Es lo que va a ver el evaluador: la URL pública con datos reales, en horario de mercado, en escritorio y en celular. |
| **Precondición** | URL pública https://tablero-mercado.vercel.app, modo real (sin banner de demostración). Día hábil entre 10 y 18 hs Argentina. Navegador sin sesión previa (ventana privada). |
| **Pasos** | 1. Abrir la URL. 2. Esperar la entrada y saltar el tutorial. 3. Mirar la píldora de mercado, las 5 tarjetas y el disclaimer. 4. Mirar el gráfico con su panel de brecha. 5. Bajar al panel de noticias. 6. Repetir 1 a 3 en el celular. |
| **Resultado esperado** | Píldora "Mercado abierto · datos de hace X". 5 tarjetas con valor, variación "hoy" y "hace X min". Brecha con un decimal en blue, MEP y tarjeta. Disclaimer visible sin scroll. Gráfico de un paralelo con panel de brecha debajo. Noticias con etiquetas ES y EN, sin aviso de fuente caída. En celular, una columna, sin corte. |
| **Resultado real** | **Escritorio, 01/10 12:33 hora Argentina, tema claro: ✔ coincide.** Píldora "Mercado abierto · datos de hace 2 min". Blue $ 1.555 (−0,3 % hoy, brecha +0,6 %, hace 35 min), MEP $ 1.548,9 (−0,5 %, +0,3 %), oficial $ 1.545 ("Referencia para la brecha", hace 3 h), tarjeta $ 2.008,5 (+30,0 %), riesgo país 607 ("dato del 30/09", "Sin brecha"). Disclaimer bajo el título. Blue 30 d (02/09 a 30/09) con el panel "Brecha vs oficial (%)" debajo. Noticias: 18 notas en la captura, con ES y EN, cada una con medio, "hace X", idioma y tema; sin aviso de fuente caída. **Celular:** *pendiente, captura del 02/10 en horario de mercado.* |
| **Observación** | La captura muestra Blue a 30 d, no MEP a 90 d como decían los pasos originales: el cambio de activo y de rango quedó probado en el recorrido con teclado (§5, pasos 10 y 12) y en el e2e de H0-2. Coincide con lo ya documentado en `riesgos.md` fila 2: las notas en inglés son de mercado internacional y las de español que se ven son todas de Clarín. Sobre H0-2, ver §6 #14. |
| **Evidencia** | `docs/evidencia/caso1-happy-path-escritorio.png`, `caso1-noticias-escritorio.png`, `caso1-happy-path-celular.png` (pendiente). |

### Caso 2 · Edge: viernes después del cierre (escenario mock `viernes-cerrado`)

| | |
|---|---|
| **Criterios** | H0-4, H1-5, H0-7 |
| **Por qué este caso** | Es el borde más fácil de romper: el dato es del viernes, el reloj ya pasó las 18:00 y la variación del día no puede comparar contra un día inventado. A diferencia del e2e de H0-4 (que modifica la respuesta en el navegador), este caso recorre **server + UI completos**: el estado de mercado lo calcula `market-status.ts` con el reloj del fixture (viernes 25/09 19:30 hora Argentina). |
| **Precondición** | `USE_MOCK_DATA=true MOCK_SCENARIO=viernes-cerrado npm run dev`. Tema oscuro. Escritorio 1366×900 y celular Pixel 7. |
| **Pasos** | 1. Abrir `/`. 2. Leer la píldora de mercado y las 5 tarjetas. 3. Mirar el gráfico de Blue a 30 d. 4. Repetir en celular. |
| **Resultado esperado** | Píldora "Mercado cerrado · último cierre vie 25/09 18:00". Los 4 dólares con "último cierre vie 25/09 18:00" y variación "en la rueda" (no "hoy"). Riesgo país con "dato del 25/09". Brecha visible sobre los últimos valores. Ninguna tarjeta en error. En celular, una columna, sin corte. |
| **Resultado real** | ✔ Coincide. Píldora y 4 dólares con "último cierre vie 25/09 18:00"; riesgo país "dato del 25/09"; brechas +1,3 %, +0,4 %, +30,0 %; variación "0,0 % en la rueda" (blue), "+0,2 %" (MEP), "+0,3 %" (oficial y tarjeta). Gráfico de 30 d con panel de brecha. Celular apilado, sin scroll horizontal. |
| **Observación** | Con el selector en **7 d**, `/api/history` devolvía **8 puntos** (18/09 al 25/09): el recorte incluía los dos extremos. Hallazgo #4, arreglado en `d0e289c`: ahora 7 puntos, del 19/09 al 25/09 (verificado por QA el 30/09). |
| **Evidencia** | `docs/evidencia/caso2-viernes-cerrado-escritorio.png`, `caso2-viernes-cerrado-celular.png` |

### Caso 3 · Falla de API externa: la búsqueda en inglés de GNews cae en producción

| | |
|---|---|
| **Criterios** | H0-5 (versión noticias), H0-3 |
| **Por qué este caso** | No es simulado: pasó en producción el 29/09 y se detectó mirando la URL pública. |
| **Precondición** | URL pública, modo real, `NEWS_API_KEY` cargada en Vercel. |
| **Pasos** | 1. `curl -s https://tablero-mercado.vercel.app/api/news` y leer `sources`. 2. Abrir la URL y bajar al panel de noticias. 3. Revisar el consumo en el dashboard de GNews. 4. Buscar la causa en los Runtime Logs de Vercel. 5. Repetir el paso 1 al día siguiente. |
| **Resultado esperado** | Si una búsqueda falla: el panel muestra las notas que sí llegaron y la línea "Una de las fuentes no respondió; la lista puede estar incompleta"; las cotizaciones no se ven afectadas; la respuesta parcial no se cachea 45 min. **Y el equipo puede saber por qué falló.** |
| **Resultado real** | 29/09 20:02Z y 23:02Z: `ok: true`, `sources: {ok: 1, total: 2}`, 10 notas todas en español. El panel mostró el aviso y siguió andando: **la degradación funcionó como estaba especificada.** 30/09 15:05Z: `sources: {ok: 2, total: 2}`, 19 notas, sin cambios de código en el medio. **La causa no se pudo determinar:** el dashboard de GNews descarta la cuota (10 requests el 29/09 de 100) y muestra que GNews recibió las dos búsquedas a la hora 23 UTC; los logs de Vercel no tienen nada, porque el código no escribe el error en ningún lado y `mergeNews` lo descarta cuando la otra búsqueda sale bien. ✘ Falla en la parte de diagnóstico → `bug-report.md`. |
| **Observación** | Cache: dos GET seguidos a `/api/news` el 30/09: `x-vercel-cache: HIT`, `age: 566`, mismo `fetchedAt`. Con las dos búsquedas bien, el CDN retiene la respuesta 45 min como se diseñó. |
| **Evidencia** | `docs/evidencia/gnews-dashboard-horas-30-09.png`, `gnews-dashboard-dias-30-09.png`, `cache-news-hit-30-09.txt`, `caso3-noticias-parcial-escritorio.png` (reproducción local de la respuesta del 29/09: solo notas ES y el aviso de fuente caída). |

---

## 5. Pruebas manuales

| Prueba | Quién | Estado |
|---|---|---|
| Caso 1 en la URL pública | Mati | Escritorio **hecho (01/10)**; celular pendiente (02/10, horario de mercado). Ver §4. |
| Lighthouse en celular sobre la URL pública | Mati | **Hecho (02/10)**, abajo. |
| Recorrido con teclado | Mati | **Hecho (02/10)**, 15 de 15 OK, abajo. |
| Plan B: modo mock en una URL pública con banner | Tech Lead (01/10) + QA (02/10) | **Hecho.** URL fija de preview (rama `demo-mock`, variables de Preview solo para esa rama). Tech Lead (01/10): ventana privada sin login, banner y datos del fixture; `/api/quotes` idéntico al mock local (`diff` vacío); producción en modo real; deploy en 14 s; cambiar la variable en producción no sirve porque Vercel exige redeploy (detalle en `demo.md`, "Plan B"). QA lo repitió el 02/10 (ítem del PDF "probar plan B en la URL pública"): banner en ventana privada y `/api/quotes` con el mismo SHA-256 que el mock local (§7). |

### Lighthouse en celular (02/10)

PageSpeed Insights, pestaña Celulares, sobre https://tablero-mercado.vercel.app, 02/10 02:12 hora Argentina (mercado cerrado; primera visita, con la bienvenida del tutorial abierta). Una sola corrida; los valores cambian entre corridas.

| Rendimiento | Accesibilidad | Prácticas recomendadas | SEO |
|---|---|---|---|
| 82 | 97 | 100 | 100 |

- **Rendimiento 82** (franja naranja, 50 a 89) en un celular emulado con red y CPU limitadas: aceptable para un tablero sin optimización dedicada; la corrida incluye la primera visita con el tutorial, que es el caso más pesado (`riesgos.md` fila 10).
- **Accesibilidad 97**: alguna auditoría automática no pasa; el detalle no se registró en la captura. El recorrido con teclado no encontró bloqueos (un hallazgo menor, §6 #13).
- **Prácticas recomendadas y SEO 100**. Evidencia: `docs/evidencia/lighthouse-celular-02-10.png`.

### Recorrido con teclado (02/10)

Chrome en ventana de incógnito sobre la URL pública, sin mouse. 15 de 15 OK.

| # | Acción | Esperado | Resultado |
|---|---|---|---|
| 1 | Tab en la bienvenida del tutorial | El foco va y viene entre Saltar y Empezar, con anillo visible; no sale del globo | OK |
| 2 | Enter en Empezar | "Paso 1 de 4" | OK |
| 3 | Tab en el paso 1 | Recorre "Saltar tutorial" y "Siguiente"; "Anterior" deshabilitado | OK |
| 4 | Enter en Siguiente ×3 | "Paso 4 de 4", el botón dice Entendido | OK |
| 5 | Enter en Entendido | Se cierra el tutorial | OK |
| 6 | Tab desde arriba | El primer foco es "¿Cómo leer esto?"; las tarjetas no reciben foco (no son interactivas) | OK |
| 7 | Enter en "¿Cómo leer esto?" | Abre el tutorial en el paso 1 | OK |
| 8 | Esc | Cierra y el foco vuelve a "¿Cómo leer esto?" | OK |
| 9 | Tab y Enter en el botón de tema | Cambia entre claro y oscuro | OK |
| 10 | Tab por los activos; Enter en MEP | Cada activo recibe foco; el gráfico pasa a MEP | OK |
| 11 | Flechas ← → sobre los activos | Sin efecto (se esperaba así; ver §6 #13) | OK |
| 12 | Tab a 7 d / 30 d / 90 d; Enter en 90 d | El gráfico pasa a 90 días | OK |
| 13 | Enter en "Ver como tabla" (dos veces) | Abre y cierra la tabla | OK |
| 14 | Tab por las noticias; Enter en una | Cada título se marca; abre la nota en otra pestaña | OK |
| 15 | Shift+Tab en cualquier punto | El foco vuelve para atrás sin trabarse | OK |

## 6. Revisión de código (30/09)

Alcance: `src/app/api/`, `src/lib/` (adaptadores, `fetch-json`, `data`, cache), `src/components/` (salvo `Tutorial.tsx`, en pausa), `next.config.ts` y el historial de git. La cache se verificó contra el código de Next 16 (`node_modules/next/dist/server/lib/patch-fetch.js`), no contra la documentación.

| # | Hallazgo | Severidad | Dónde | Decisión (30/09) |
|---|---|---|---|---|
| 1 | **Histórico vacío en modo real muestra error, no "sin datos".** Si ArgentinaDatos devuelve `[]`, `fetchJson` y `normalizeHistorico` lo convierten en `fail('empty')`; el gráfico recibe `ok: false` y muestra "No pudimos obtener el histórico". H0-6 pide "sin datos para este período", distinto del error. El e2e de H0-6 pasaba porque inyecta `ok: true` con serie vacía, una respuesta que el server nunca produce en ese caso. | Media · criterio incumplido | `lib/data.ts` (`getHistory`), `providers/argentinadatos.ts` | **Arreglado en `8cdcd9a`**: `empty` de la serie del activo → `ok` con `series: []`. El e2e de H0-6 ahora tiene respaldo: un unitario recorre el server en modo real con MSW. **Verificado por QA (30/09), con observación → hallazgo #8.** |
| 2 | **Las fallas de GNews no dejan rastro.** No hay ningún `console.error` en `src/`; `mergeNews` descarta el error de la búsqueda que falla si la otra sale bien. Es la causa de que el caso 3 no se pudiera diagnosticar. | Media · operación | `providers/news.ts` | **Arreglado en `83587f6`** · `bug-report.md` BUG-01 (resuelto, verificado en producción) **Verificado por QA (30/09).** |
| 3 | **Mientras una búsqueda falla, cada visita gasta cuota de GNews.** La Data Cache de Next solo guarda respuestas 200 (`patch-fetch.js`, l. 696) y el route handler manda `no-store` si la respuesta es parcial: cada carga de página es una request nueva. Con ~100 visitas en un día así se agota la cuota y cae también la búsqueda en español. | Media · con tráfico real | `api/news/route.ts`, `fetch-json.ts` | Se documenta en `riesgos.md` |
| 4 | **7 / 30 / 90 días muestran 8 / 31 / 91 días.** `addDays(today, -range)` incluye los dos extremos (caso 2: 7 d = 18/09 a 25/09). | Baja · visible | `lib/data.ts` (`getHistory`) | **Arreglado en `d0e289c`**: ventana `addDays(today, -(range - 1))` a hoy. Tests: MEP 7 d en `viernes-cerrado` = 19/09 a 25/09; blue 30 d = exactamente 30 fechas, 30/08 a 28/09 (antes el test aceptaba 31). **Verificado por QA (30/09).** |
| 5 | Si `/api/quotes` falla después de la primera carga, las tarjetas quedan con el último dato sin aviso de reintento. Es honesto ("hace X min" sigue creciendo), pero no se avisa. | Baja | `Dashboard.tsx` | Se documenta |
| 6 | La píldora puede decir "Mercado abierto" hasta ~6 min después de las 18:00: el CDN sirve `/api/quotes` con `s-maxage=60, stale-while-revalidate=300` y el estado de mercado se calcula al armar la respuesta. | Baja | `api/quotes/route.ts` | Se documenta |
| 7 | `/api/news` puede tardar más de 11 s (dos búsquedas de hasta 5 s + 1 s de pausa). Si el límite de duración de funciones del plan de Vercel es menor, la función se corta y el panel muestra error. Límite sin verificar. | Baja · a verificar | `providers/news.ts` | Se documenta; verificar en Vercel |
| 8 | **Un histórico con formato cambiado se muestra como "sin datos", no como error.** Efecto del arreglo #1: `normalizeHistorico` devuelve `empty` cuando la lista viene con elementos pero ninguno es válido (por ejemplo, el proveedor renombra `fecha`). Desde `8cdcd9a`, `getHistory` lo trata como "sin datos" y el CDN lo guarda 1 h: un cambio de formato del proveedor se le muestra al usuario como "no hubo datos en el período", que es falso, y no deja rastro. Probado con MSW: `[{ casa, compra, venta, fechaRenombrada }]` → `ok: true, series: []`. | Media · error presentado como dato | `providers/argentinadatos.ts` (`normalizeHistorico`) | **Arreglado en `7bb6bf7`**: en `normalizeHistorico`, lista con elementos y ningún punto válido → `fail('invalid')`; `empty` queda solo para la lista vacía (que `fetchJson` ya corta antes). `getHistory` y `fetchJson` sin cambios. Tests: `data.test.ts` (modo real con MSW: `[{ casa, compra, venta, fechaRenombrada }]` → `ok: false, kind: 'invalid'`) y `providers.test.ts` (el caso "sin puntos válidos" pasa a esperar `invalid`; nuevo: lista vacía → `empty`). Los dos fallan con el código anterior. 92 unitarios y 23 e2e + 1 salteado en verde. **Verificado por QA (30/09).** |
| 9 | **Un histórico con algunos puntos inválidos los descarta en silencio.** `normalizeHistorico` saltea cada elemento que no tiene el formato esperado y devuelve `ok` con los que quedan. Probado con MSW: con la mitad de los `venta` en `null`, blue 30 d da 14 puntos en vez de 30, sin aviso; la línea del gráfico une los huecos y parece continua. | Baja · dato incompleto sin aviso | `providers/argentinadatos.ts` (`normalizeHistorico`) | **Arreglado en `1eb36b1`** (decisión de Mati, 30/09; QA proponía solo documentarlo): `parseHistorico` devuelve también cuántos elementos descartó; `normalizeHistorico` queda igual (envuelve a la nueva) y cambia el tipo de `fetchHistorico`, que solo usa `data.ts`. `/api/history` expone `skippedPoints` (sobre toda la serie del proveedor, no sobre el rango), el server deja una línea `[history] <activo>: N puntos descartados por formato` con `console.warn` y el gráfico dice "Algunos datos del proveedor no se pudieron leer y no se muestran", sin decir cuántos días faltan. La respuesta sigue siendo `ok` y se cachea igual; sin ningún punto válido sigue siendo `invalid` (#8). Tests: `providers.test.ts` (2 válidos + 1 inválido → 2 puntos, 1 descartado), `data.test.ts` (modo real con MSW: mitad de los `venta` en `null` → `skippedPoints` 46 y un solo `console.warn` con el texto exacto) y `estados.spec.ts` (aviso en Blue, no en MEP). **No cubierto:** si el rango elegido queda vacío se ve "Sin datos para este período" sin el aviso. **Verificado por QA (01/10)**, con una observación: el mismo descarte silencioso pasa en la serie del **oficial** que se usa para la brecha (hallazgo #11). |
| 10 | **Si el histórico del oficial falla, el panel de brecha desaparece del gráfico sin decir por qué.** `getHistory` deja `gapSeries: null` y `HistoryChart` no dibuja el panel ni muestra "brecha no disponible": para un paralelo se ve igual que para oficial o riesgo país. Las tarjetas sí lo dicen (H1-4); el gráfico no. Pasa con cualquier error del oficial, no solo con el formato cambiado: es anterior al #8. Probado con MSW: oficial con formato cambiado → blue `ok`, `gapSeries: null`. | Baja · H1-2 sin estado de error | `lib/data.ts`, `HistoryChart.tsx` | **Arreglado en `e3d3166`**: `HistoryResponse.gapUnavailable` es `true` solo si el activo es un paralelo y el histórico del oficial vino con error (incluye `empty`: para un paralelo la brecha aplica y falta igual). En el lugar del panel de brecha va "Brecha no disponible para este período", con el estilo secundario de la leyenda. Oficial y riesgo país sin cambios (H1-3). Tests: `data.test.ts` (modo real con MSW: blue bien + oficial 500 → `gapUnavailable: true`; oficial → `false`) y `estados.spec.ts` (texto visible, sin `.line.gap`, precio dibujado; en Oficial, sin aviso). **No cubierto, se documenta:** si el oficial responde pero no tiene ninguna fecha dentro del rango, `gapSeries` es `[]` y el panel desaparece sin aviso. **Verificado por QA (01/10).** De acuerdo con contar el `empty` del oficial como "no disponible": para un paralelo la brecha aplica y el dato falta igual (comprobado con MSW: oficial `[]` → `gapUnavailable: true`; no tiene test propio). |
| 11 | **La serie del oficial con puntos inválidos deja la brecha con huecos, sin aviso.** `getHistory` cuenta y avisa `skippedPoints` solo para la serie del activo elegido. Si los elementos ilegibles están en el histórico del **oficial**, la brecha de blue/MEP/tarjeta se calcula solo con las fechas que quedan, la línea une los huecos, no sale el aviso del gráfico ni la línea `[history]`. Probado con MSW (01/10): oficial con la mitad de los `venta` en `null` → blue 30 d con 27 puntos de precio y **13 de brecha**, `skippedPoints: 0`, `gapUnavailable: false`, ningún `console.warn`. Solo se ve si el usuario elige "Oficial" en el gráfico (ahí sí avisa). | Baja · dato incompleto sin aviso (mismo caso que #9, en la brecha) | `lib/data.ts` (`getHistory`) | **Arreglado en `1c39d79`** (opción (a), decisión de Mati, 01/10): en un paralelo, los descartados del histórico del oficial se suman a `skippedPoints`, que pasa a significar "descartados en las series que usa el gráfico" (contrato y UI sin cambios: mismo aviso "Algunos datos del proveedor no se pudieron leer y no se muestran"). El server deja una línea propia, `[history] oficial (brecha de <activo>): N puntos descartados por formato`, además de la del activo si la tiene. Pedir "oficial" como activo no cambia: avisa por su propia serie, una sola línea. Tests en `data.test.ts`, modo real con MSW: blue bien + oficial con la mitad de los `venta` en `null` → `ok`, `skippedPoints` 46 y **una** línea `[history] oficial (brecha de blue)…` (falla con `69b2b78`: daba `skippedPoints` 0); oficial como activo con los mismos datos → 46 y una sola línea `[history] oficial: …`. Mock: 3 escenarios × 5 activos × 3 rangos en 0. |
| 12 | **Con `prefers-reduced-motion`, el saludo animado se descarga igual y nunca se muestra.** Observado por QA el 01/10 en `riesgos.md` (fila 10), no en esta tabla; lo anota acá el Tech Lead con los archivos actuales. El `useEffect` que pide el saludo la primera vez no miraba la preferencia: `mati-saludo.webp` (474 KB) se bajaba aunque el avatar muestra el cuadro fijo (`mati-saludo-0.webp`, 11 KB). Los clips `paso` (302 KB) y `cierre` (161 KB) ya respetaban la preferencia: el `src` usa el cuadro fijo y el pedido anticipado del paso siguiente sale antes con `reduce`. | Baja · peso de más con datos móviles | `components/Tutorial.tsx` (pedido del saludo) | **Arreglado (01/10, Tech Lead)**: con la preferencia activa no se pide el saludo animado; una línea en el `useEffect`, sin tocar cache ni UI. Test: e2e en `tablero.spec.ts` ("con prefers-reduced-motion no se pide ningún clip animado"): emula la preferencia, abre el tutorial como primera visita, recorre los 4 pasos y exige que todos los pedidos a `/avatar/` sean cuadros fijos (`-0.webp`). Con el código anterior falla por el pedido del saludo. **Verificado por QA (02/10)**: el test falla con el `src/` de `2e39607` y pasa con `db46eb5` (§7). |
| 13 | **Los selectores de activo y período no responden a las flechas.** Tienen `role="tablist"` / `role="tab"`, y el patrón ARIA de pestañas espera moverse con ← →; acá cada pestaña es una parada de Tab y se activa con Enter o espacio. Encontrado en el recorrido con teclado (§5, paso 11). | Baja · accesibilidad, no bloquea: todo se opera con Tab y Enter | `components/HistoryChart.tsx` l. 114-121 | Se documenta (código congelado). |
| 14 | **H0-2 dice "toco una tarjeta" y las tarjetas no se pueden tocar.** El activo del gráfico se elige con los botones de arriba del gráfico (Blue, MEP, Oficial, Tarjeta, Riesgo país); `QuoteCard` no tiene acción. El e2e de H0-2 prueba los botones, así que el criterio, tal como está escrito, no lo verifica ningún test. | Baja · diferencia entre especificación y producto | `docs/producto.md` §5 H0-2; `components/QuoteCard.tsx` | Se documenta. Precisar el criterio ("cuando elijo un activo en el gráfico") es decisión del PO, como el desvío de H0-4 del 30/09. |
| 15 | **Con el tutorial abierto se puede tocar la página de fondo.** Reproducción: abrir el tutorial desde "¿Cómo leer esto?" y, en el paso 1, tocar un título de noticia o el botón de tema: responde (el link abre la nota; el tema cambia) y el tutorial sigue abierto en el paso 1. Causa: `.tour-layer` tiene `pointer-events: none` (`src/app/globals.css` línea 314) y solo el globo (`.tour-panel`) los recupera; el oscurecido es la sombra de `.tour-box`, que no frena clics. El diálogo es `aria-modal`, pero el fondo sigue activo. Reproducido por el PO en la URL del plan B (02/10): `document.elementFromPoint` sobre un título de noticia devuelve el link. Por QA en Chromium, escritorio y Pixel 7 (02/10): el botón de tema pasa de "Cambiar a tema oscuro" a "Cambiar a tema claro" con el tutorial en el paso 1; "7 d" en el gráfico cambia el período y el foco sale del globo (el próximo Tab lo devuelve); con el tutorial en el paso 2, "¿Cómo leer esto?" lo reinicia en el paso 1 y vuelve a pedir los clips con un `?n=` nuevo. | Baja · UX y accesibilidad: contradice el diálogo modal, no bloquea | `src/app/globals.css` (`.tour-layer`); `components/Tutorial.tsx` | **No se arregla** (decidido por Mati con el PO, 02/10): código congelado en `4bb415b`; el guion de la demo no ejercita el caso. Próximos pasos: capa del tutorial que capture los clics. |

**Revisado sin hallazgos:**
- **Claves:** `NEWS_API_KEY` solo se lee en el server (`providers/news.ts`, vía `data.ts`). `next.config.ts` loguea fetches con `fullUrl: false`, así que la URL con la key no va a los logs. En el historial de git no hay `.env*` (solo `.env.example`) ni ningún `apikey=` con valor. Los mensajes de error que viajan al cliente son textos fijos sin URL, y la UI muestra `ERROR_TEXT` por tipo.
- **Errores al cliente:** ningún route handler lanza por una falla de proveedor (todo viaja como `Result`, siempre HTTP 200). Los tres componentes atrapan también un 500 o un cuerpo no-JSON del propio endpoint.
- **Cache de cotizaciones e histórico:** con `dynamic = 'force-dynamic'` y `revalidate` explícito en cada `fetch`, la Data Cache sí guarda (`patch-fetch.js`: `force-dynamic` solo anula la cache cuando el fetch no trae configuración). La cache del CDN para noticias se verificó en producción (caso 3).

---

## 7. Verificación de los arreglos (30/09)

Sobre `3942c1b`, en un clon limpio con `npm ci`: `npm run check` → **90 unitarios en verde**; `npm run test:e2e` → **23 pasados + 1 salteado** (el e2e no lo había corrido el Tech Lead). Los tests nuevos se corrieron también contra el `data.ts` anterior a los arreglos: los de #1 y #4 **fallan** con el código viejo, así que prueban el cambio y no pasan de casualidad.

| Hallazgo | Resultado | Evidencia |
|---|---|---|
| #1 · histórico vacío → "sin datos" | **Con observaciones** | El unitario "getHistory en modo real con MSW" recorre `fetchJson → fetchHistorico → getHistory` con `mock: false`: `[]` → `ok` con serie vacía; 500 → `upstream`. Falla con el código anterior. `timeout`, `rate-limited`, `upstream` e `invalid` siguen siendo error (`data.ts`, `getHistory`: solo `kind === 'empty'` pasa a ok). **Pero** `empty` también lo produce `normalizeHistorico` cuando ningún elemento es válido → hallazgo #8. El `s-maxage=3600` del histórico sin datos no lo veo como riesgo propio: la Data Cache ya guardaba ese `[]` 24 h porque llega con HTTP 200; el riesgo aparece solo combinado con #8. |
| #2 · BUG-01 | **Verificado** | Coincide con "Resultado esperado" y "Cómo se verifica" de `bug-report.md`. La línea de log solo arma `lang`, `kind` y `message`; ningún mensaje de `fetch-json` ni de `normalizeNews` incluye la URL, y `redactKey` tapa `apikey=` por las dudas (test propio). Mock: `failed: []` (test de `data.test.ts`). Fallan las dos: la respuesta es `ok: false` con el primer error (`rate-limited`) y no trae `sources`; el detalle de la segunda queda solo en el log. Aceptable y documentado así en `bug-report.md`. Consumidores de `NewsResponse`: `NewsBoard.tsx` y `api/news/route.ts` usan solo `ok` y `total`; `tsc` en verde. |
| #4 · 7/30/90 = 7/30/90 fechas | **Verificado** | Blue 30 d: exactamente 30 fechas (test). MEP 7 d en `viernes-cerrado`: 19/09 a 25/09 (el test fija los extremos, no la cantidad; con MEP diario equivale a 7, comprobado aparte). Brecha alineada fecha a fecha en MEP/blue 7 d, MEP 90 d y tarjeta 30 d. Riesgo país (solo días hábiles) no se rompe: 7 d = 4 o 5 puntos según el día, porque la ventana es de 7 días **calendario**, no de 7 registros, como dice `arquitectura.md`. |
| Docs | **Verificado, con un ajuste** | `bug-report.md` (Estado y Verificación), `riesgos.md` (hallazgo #3) y `arquitectura.md` dicen lo que hace el código. La observación del caso 2 seguía diciendo "8 puntos": actualizada. Queda **sin observar**, como dice `bug-report.md`: la línea `[news]` en los logs de Vercel, porque desde el deploy no falló ninguna búsqueda. |

### Verificación del hallazgo #8 (30/09)

Sobre `8f272f3`, clon limpio: `npm run check` → **92 unitarios en verde**; `npm run test:e2e` → **23 pasados + 1 salteado**.

| Qué | Resultado | Evidencia |
|---|---|---|
| Arreglo | **Verificado** | `7bb6bf7` solo toca `normalizeHistorico`: lista vacía → `empty`; lista con elementos y ningún punto válido → `invalid`. `getHistory` y `fetchJson` sin cambios (`git diff 13424ad 8f272f3 -- src/` toca solo `argentinadatos.ts` y `Tutorial.tsx`, este último fuera de la revisión). `invalid` no es `empty`, así que `getHistory` lo devuelve como error y el gráfico muestra "No pudimos obtener el histórico". La lista vacía sigue dando "sin datos" (el test de H0-6 sigue en verde). |
| Tests | **Verificado** | El caso nuevo de `data.test.ts` recorre el server en modo real con MSW, igual que el de H0-6. Los dos tests nuevos (`data.test.ts` y `providers.test.ts`, "sin puntos válidos → invalid") **fallan con el `argentinadatos.ts` de `13424ad`** y pasan con el nuevo. El caso "lista vacía → `empty`" cubre la rama que `fetchJson` ya corta antes: no la ejercita el camino real, pero documenta el contrato de la función. |
| Cache | **Verificado** | `src/app/api/history/[asset]/route.ts`, línea 26: `body.ok ? 's-maxage=3600…' : 'no-store'`. Con `invalid`, `body.ok` es `false` → `no-store`, como los demás errores. |
| Docs | **Verificado** | La fila #8 de §6 y el punto 7 de `CLAUDE.md` describen el cambio y apuntan a `7bb6bf7`. |
| Casos borde | **Dos hallazgos nuevos, de severidad baja** | #9 (puntos inválidos sueltos se descartan sin aviso) y #10 (el panel de brecha desaparece sin aviso si falla el oficial). Ver §6. |

### Verificación de los hallazgos #9 y #10 (01/10)

Sobre `c8d771d`, en un clon limpio de GitHub con `npm ci`: `npm run check` → **96 unitarios en verde**; `npm run test:e2e` (con `playwright.local.config.ts`, Chromium 1194, sin commitear) → **27 pasados + 1 salteado** en 1,2 min, con `workers: 1` y también con `--workers=2`. Los tests nuevos se corrieron contra el `src/` anterior: con el de `8cbeb2c` fallan los 3 unitarios nuevos de `data.test.ts`, el de `providers.test.ts` y los 2 e2e nuevos en los dos viewports; con el de `e3d3166` (con #10, sin #9) fallan solo los 2 unitarios de #9.

| Qué | Resultado | Evidencia |
|---|---|---|
| #10 · brecha no disponible | **Verificado** | `data.ts`: `gapUnavailable = needsOficial && !oficial.ok`. Unitario en modo real con MSW: blue bien + oficial 500 → `ok`, `gapSeries: null`, `gapUnavailable: true`; oficial → `false`. Oficial `[]` → `true` (comprobado aparte con MSW, sin test propio). `HistoryChart.tsx`: la línea es un `<p class="chart-note secondary">` con `color: var(--fg-2)`, sin `role="alert"` ni ícono; el e2e verifica el precio dibujado, sin `.line.gap` y sin alerta. Oficial y riesgo país: `needsOficial` es falso → sin panel y sin texto (H1-3, e2e cambia a Oficial). |
| #9 · puntos descartados | **Con observaciones** | `parseHistorico` cuenta `raw.length - points.length` sobre toda la lista. Unitario: la mitad de los `venta` en `null` → `ok`, `skippedPoints` 46 y **un** `console.warn` con el texto exacto. El texto del gráfico no dice cuántos días faltan. Sin ningún punto válido sigue `invalid` (test de #8 en verde). Variación del día de `getQuotes`: idéntica antes y después en los 3 escenarios mock (comparada con el `src/` de `8cbeb2c`). **Observación:** no cubre la serie del oficial que alimenta la brecha → hallazgo #11. |
| Contrato y mock | **Verificado** | `gapUnavailable` y `skippedPoints` en `types.ts` (con comentario) y en `arquitectura.md` (tipos, tabla de §6 y párrafo propio). Mock: los 3 escenarios × 5 activos × 3 rangos (45 combinaciones) dan `skippedPoints: 0` y `gapUnavailable: false`. `git diff 8cbeb2c c8d771d -- tests/e2e` solo agrega 2 tests al final de `estados.spec.ts`; `tablero.spec.ts` sin cambios. |
| Cache | **Verificado, con un riesgo** | `src/app/api/history/[asset]/route.ts`, línea 26, sin cambios: `body.ok ? 'public, s-maxage=3600, stale-while-revalidate=3600' : 'no-store'`. Las dos respuestas nuevas son `ok`, así que el CDN las guarda. Para `skippedPoints` no cambia nada (el JSON del proveedor llega con 200 y la Data Cache ya lo guarda 24 h). Para `gapUnavailable` sí: el error del oficial no entra en la Data Cache, pero la respuesta de blue/MEP/tarjeta queda "Brecha no disponible" hasta 1 h en el CDN, aunque el oficial vuelva y las tarjetas ya muestren la brecha. Anotado en `riesgos.md`. |
| Tests | **Verificado** | Fallan con el código anterior (ver arriba). Los e2e de #9 y #10 inyectan el campo en la respuesta, el mismo patrón que se objetó en H0-6; acá está bien porque el camino del server lo cubren los unitarios en modo real con MSW. |
| Casos borde | **Documentados; uno nuevo** | Oficial sin fechas en el rango (MSW, blue 7 d): `gapSeries: []`, `gapUnavailable: false` → el panel desaparece sin aviso. Rango vacío con descartados: `series: []`, `skippedPoints: 1` → "Sin datos para este período" sin el aviso. Los dos están en las filas #9 y #10 y se comportan como dicen. Nuevo: #11. |
| `workers: 1` | **Verificado** | La explicación de §3 cierra: los traces muestran la Mac sin CPU (4 consultas en 5 s, `Tab` sin procesar en 22 s), no un error de la app, y en la nube (2 vCPU) los 27 pasan con 1 y con 2 workers en el mismo tiempo (1,2 min), así que el paralelismo no ahorraba nada. No esconde nada de la app: los tests no comparten estado entre sí (cada uno abre su página contra el mismo `next dev` en mock). Lo único a vigilar: el test del tutorial es el más sensible a la carga; si vuelve a fallar con un worker, ya no es la CPU. |
| Docs | **Verificado** | Filas #9 y #10, punto 7 de `CLAUDE.md` y `arquitectura.md` describen lo que hace el código y apuntan a `e3d3166` y `1eb36b1`; ningún `<hash…>` sin reemplazar. Desactualizado después de esta verificación: el punto 7 de `CLAUDE.md` todavía dice "Pendiente: que QA verifique #9 y #10" (no es un archivo de QA; queda para el Tech Lead). |

### Verificación del hallazgo #12, del plan B y del #7 (02/10)

Sobre `37f7cb7` (`main` y `demo-mock` en GitHub; incluye `db46eb5`), en un clon limpio con `npm ci`: `npm run check` → **98 unitarios en verde**; `npm run test:e2e` (con `playwright.local.config.ts`, Chromium 1194, sin commitear) → **29 pasados + 1 salteado** en 1,0 min.

| Qué | Resultado | Evidencia |
|---|---|---|
| #12 · e2e contra el código anterior | **Verificado** | El test "con prefers-reduced-motion no se pide ningún clip animado" pasa con `db46eb5` en escritorio y celular. Con el `src/` de `2e39607` (`db46eb5^`) falla en los dos viewports y el pedido de más es exactamente `/avatar/mati-saludo.webp` (`Received: ["/avatar/mati-saludo.webp"]`). Prueba el arreglo, no pasa de casualidad. `src/` restaurado después. `docs/evidencia/e2e-12-antes-despues-02-10.txt`. |
| #12 · navegador | **Cubierto por el e2e; no se repitió a mano en producción** | El e2e es la verificación de red en un navegador real: Chromium con la preferencia emulada, registra cada pedido a `/avatar/` y exige solo cuadros fijos (`-0.webp`, 11.748 B). La prueba manual en Network solo agregaba confirmar el deploy, que se deduce: Vercel publica `main` y `main` incluye `db46eb5`. Pesos en `public/avatar/`: saludo 474.194 B, paso 301.698 B, cierre 160.994 B (coinciden con `riesgos.md` fila 10). | 
| Plan B en la URL pública | **Verificado** | Ventana privada de Safari, sin sesión de Vercel: la URL de `demo-mock` abre sin login, con el banner "Datos de demostración, no reflejan el mercado", la bienvenida del tutorial (primera visita) y datos del fixture `normal` (blue $ 1.560, riesgo país 609, "dato del 25/09"). `curl -s <plan B>/api/quotes \| shasum -a 256` desde la Mac = `d5c34e99…e477e9fd`, idéntico al `/api/quotes` del mock local `normal` (dos llamadas locales, mismo hash: la respuesta es determinística). Producción sigue en modo real: sin banner y con otros valores (blue $ 1.555 "en la rueda", riesgo país 636). `docs/evidencia/planb-banner-privada-02-10.png`, `produccion-modo-real-02-10.png`. |
| Plan B · escenarios | **Alcance, no hallazgo** | `viernes-cerrado` y `sin-oficial` no están expuestos en esa URL: el escenario sale solo de `MOCK_SCENARIO` (`data.ts`, `configFromEnv`) y la rama tiene `normal`. Para mostrarlos en la demo se usa `npm run dev` local con la variable (caso 2). |
| #7 · límite de duración de funciones | **Verificado** | Las dos páginas de Vercel enlazadas en `riesgos.md` fila 12 (actualizadas el 24/08/2026) dicen, con Fluid compute: "Hobby: 300s default and maximum". Coincide con lo citado. También se confirma la salvedad de la fila: ninguna de las dos da el límite sin Fluid compute. |
| Pendiente para la revisión final | **Observación** | El `main` local tiene `3569306` (solo docs) sin pushear; en GitHub `main` y `demo-mock` están en `37f7cb7`. No cambia la demo, pero el punto 5 de `CLAUDE.md` pide `demo-mock` en el último commit. |

### Verificación del descongelamiento del 02/10 (`0496210` y `4bb415b`)

Sobre `62f9b7c` (`main` en GitHub, código en `4bb415b`), en un clon limpio con `npm ci`: `npx vitest run` → **101 unitarios en verde**; `npx playwright test` (con un config local que apunta a Chromium 1194, sin commitear) → **31 pasados + 1 salteado** en 1,3 min, `workers: 1`.

| Qué | Resultado | Evidencia |
|---|---|---|
| e2e nuevo contra el código anterior (`0496210`) | **Verificado** | "Tutorial · abierto, la página de fondo no scrollea…" pasa con `4bb415b` en los dos viewports. Con el `Tutorial.tsx` de `577af5b` falla en los dos, en el primer intento de scroll con el tutorial abierto (`tablero.spec.ts` l. 171: escritorio 542 → 0, celular 1359 → 0). Sin el `preventScroll` del cierre (resto del arreglo igual) falla en l. 178: al cerrar, la página vuelve a 0. El test prueba las dos partes del arreglo. `src/` restaurado después. |
| Parte de iOS del arreglo (`touchmove`/`wheel` con `passive: false`) | **Sin cobertura automática** | Con los dos listeners comentados, el e2e sigue pasando en escritorio y Pixel 7: en Chromium alcanza con `overflow: hidden`. No es un defecto (el bug de iOS Safari no se reproduce en Chromium), pero la única evidencia de esa parte es la prueba a mano en un iPhone. |
| Unitario de los clips (`4bb415b`) contra los WebP anteriores | **Verificado** | Con `public/avatar/` de `577af5b` fallan los 3 casos (`expected 1 to be +0`: el chunk `ANIM` tenía 1 repetición). Restaurado después. |
| "Sin recodificar" | **Verificado** | `cmp` entre los WebP de `577af5b` y `4bb415b`: **3 bytes distintos por archivo** (cantidad de repeticiones en `ANIM` y duración del último `ANMF`), mismo peso (474.194 / 301.698 / 160.994 B; `riesgos.md` fila 10 sin cambios). Cuadros: saludo 36, paso 33, cierre 15, todos de 67 ms salvo el último (1.567 ms). Ciclo: 3,9 / 3,7 / 2,5 s, como dice `CLAUDE.md`. |
| Hallazgo #15 | **Confirmado; se documenta** | En el código (`.tour-layer` con `pointer-events: none`), en Chromium (botón de tema, "7 d", "¿Cómo leer esto?") y por el PO en el plan B (título de noticia). Documentado sin arreglar (§6, #15). |
| Plan B en la URL de preview (verificación cruzada) | **Verificado por el PO; QA no lo repitió** | Deploy de Preview `62f9b7c` (Ready, código igual a `4bb415b`), 02/10 a la noche: banner "Datos de demostración", datos del fixture (blue $ 1.560, riesgo país 609), `overflow: hidden` en `html` con el tutorial abierto (la página no se mueve con la rueda) y avatar en bucle. Fue en escritorio: no reemplaza la prueba con el dedo en el iPhone de la fila siguiente (`demo.md`, "Plan B"). |
| A mano en celular, producción y plan B | **Pendiente (Mati, 02/10)** | En un iPhone con Safari y la barra colapsada: (1) con el tutorial abierto, el fondo no scrollea con el dedo; (2) el paso 4 baja solo hasta noticias; (3) al cerrar con Entendido o con Saltar, la página queda en el mismo lugar y vuelve a scrollear; (4) el avatar repite el gesto en cada paso, también después de tocar Anterior y Siguiente varias veces. |

---

## 8. Evidencia

Todo en `docs/evidencia/`.

| Archivo | Qué muestra | Cubre |
|---|---|---|
| `caso1-happy-path-escritorio.png` | URL pública en mercado abierto: píldora, 5 tarjetas, disclaimer, Blue 30 d con brecha (01/10 12:33) | Caso 1 |
| `caso1-noticias-escritorio.png` | Panel de noticias en producción con notas ES y EN, sin aviso de fuente caída | Caso 1 |
| `caso1-happy-path-celular.png` | *Pendiente (02/10)* | Caso 1 |
| `caso2-viernes-cerrado-escritorio.png` | Mock `viernes-cerrado`: mercado cerrado, último cierre, variación "en la rueda" | Caso 2 |
| `caso2-viernes-cerrado-celular.png` | Lo mismo en celular, apilado y sin scroll horizontal | Caso 2 |
| `caso3-noticias-parcial-escritorio.png` | Reproducción local de la respuesta del 29/09: solo notas ES y el aviso de fuente caída | Caso 3, BUG-01 |
| `gnews-dashboard-horas-30-09.png` | Requests por hora en GNews: llegaron las dos búsquedas | Caso 3, BUG-01 |
| `gnews-dashboard-dias-30-09.png` | 10 requests el 29/09: cuota lejos del límite | Caso 3, BUG-01, `riesgos.md` fila 5 |
| `cache-news-hit-30-09.txt` | Dos GET a `/api/news`: `HIT` del CDN, mismo `fetchedAt` | Caso 3 (cache) |
| `e2e-12-antes-despues-02-10.txt` | Test del #12 en verde con `db46eb5` y en rojo con el código anterior; suite completa | §6 #12, §7 |
| `planb-banner-privada-02-10.png` | URL de `demo-mock` en ventana privada, con el banner | §5 plan B, §7 |
| `produccion-modo-real-02-10.png` | Producción sin banner y con datos reales | §7 (producción no quedó en mock) |
| `lighthouse-celular-02-10.png` | PageSpeed Insights, celular: 82 / 97 / 100 / 100 | §5 Lighthouse |
