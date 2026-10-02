# Testing

Plan, cobertura contra los criterios de aceptación y casos de prueba documentados.
Escrito por el rol QA (30/09/2026), que no participó del desarrollo. La definición de terminado son los criterios Given/When/Then de `docs/producto.md`.

**Estado al 01/10:** 98 tests unitarios y 27 e2e en verde (+1 salteado a propósito), en la Mac de Mati (e2e con un worker, ver §3) y en un clon limpio. `npm run check` (tipos + lint + unitarios) y `npm run test:e2e`.

---

## 1. Plan por tipo de prueba

Presupuesto de QA: 3 h. Al arrancar QA ya existían 85 unitarios y 15 e2e escritos durante el desarrollo, así que el trabajo fue **encontrar huecos, no sumar cobertura**.

| Tipo | Decisión | Por qué |
|---|---|---|
| Unitarias (Vitest + MSW) | Automatizado | Adaptadores, normalización y `fetchJson` con MSW simulando timeout, HTTP 429, 500, respuesta vacía, JSON inválido y corte a mitad de lectura. Lógica pura: días hábiles, estado de mercado, variación del día, brecha, escalas del gráfico, formato es-AR. |
| Integración con APIs reales | Manual, puntual | No se automatiza: gasta cuota de GNews (100/día) y depende de terceros. Se verificó con curl contra la URL pública y con el dashboard de GNews (caso 3). |
| e2e (Playwright, modo mock) | Automatizado | Un test por criterio de aceptación, en escritorio y celular (Pixel 7). Los estados de error, cerrado y sin datos se disparan interceptando `/api/*` en el navegador, sin tocar el código de la app. |
| Responsive | Automatizado parcial + manual | El e2e verifica una sola columna y sin scroll horizontal en celular (H0-7). La legibilidad del gráfico se mira a mano (caso 2). |
| Accesibilidad básica | Manual | Teclado y Lighthouse Accessibility. El tutorial ya tiene test automatizado de foco, Tab y Esc. No se suma axe: dependencia nueva por un dato que Lighthouse ya da. |
| Performance | Descartado, salvo una medición | Sin presupuesto para optimizar. Se deja el número de Lighthouse en celular como referencia; el peso del avatar (~1 MB) se trata como riesgo en `riesgos.md`. |

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
npm run check        # tipos + lint + 98 unitarios (~5 s)
npm run test:e2e     # 28 e2e (27 + 1 salteado) en modo mock, un worker, levanta next dev en :3100 (~1,8 min)
```

El e2e siempre corre en modo mock (`playwright.config.ts` fuerza `USE_MOCK_DATA=true`), así que no gasta cuota ni depende de terceros. Si hay otro `next dev` corriendo sobre la misma carpeta, el e2e no arranca (Next 16).

**Un solo worker (01/10).** Con 2 workers, el test del tutorial que se abre desde "¿Cómo leer esto?" falló en dos corridas completas seguidas en la Mac (una en celular, otra en escritorio, en puntos distintos) y pasó solo y en la nube. Los traces muestran la Mac sin CPU, no un error de la app: `/api/quotes` respondió en 112 ms, pero Playwright solo pudo consultar la página 4 veces en 5 s; en la otra corrida la página se dibujaba a ~2 cuadros por segundo y un `Tab` no se procesó en 22 s. Con `workers: 1` en `playwright.config.ts` pasan los 27 y tarda lo mismo (1,8 min contra 1,9): el cuello era la CPU, no la cantidad de tests en paralelo.

---

## 4. Casos de prueba documentados

### Caso 1 · Happy path en la URL pública, mercado abierto

| | |
|---|---|
| **Criterios** | H0-1, H0-2, H0-3, H1-1, H1-2 |
| **Precondición** | URL pública https://tablero-mercado.vercel.app, modo real (sin banner de demostración). Día hábil entre 10 y 18 hs Argentina. Navegador sin sesión previa (ventana privada). |
| **Pasos** | 1. Abrir la URL. 2. Esperar la entrada y saltar el tutorial. 3. Mirar las 5 tarjetas y la píldora de mercado. 4. Tocar "MEP" en el gráfico y cambiar a 90 d. 5. Bajar al panel de noticias. |
| **Resultado esperado** | Píldora "Mercado abierto · datos de hace X". 5 tarjetas con valor, variación "hoy" y "hace X min". Brecha con un decimal en blue, MEP y tarjeta. Disclaimer visible sin scroll. Gráfico de MEP con panel de brecha debajo. Noticias con etiquetas ES y EN, sin aviso de fuente caída. |
| **Resultado real** | *Pendiente: lo ejecuta Mati el 30/09 en horario de mercado.* |
| **Evidencia** | *Pendiente:* `docs/evidencia/caso1-happy-path-escritorio.png`, `caso1-happy-path-celular.png` |

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
| **Verificación adicional (cache)** | Dos GET seguidos a `/api/news` el 30/09: `x-vercel-cache: HIT`, `age: 566`, mismo `fetchedAt`. Con las dos búsquedas bien, el CDN retiene la respuesta 45 min como se diseñó. |
| **Evidencia** | `docs/evidencia/gnews-dashboard-horas-30-09.png`, `gnews-dashboard-dias-30-09.png`, `cache-news-hit-30-09.txt`, `caso3-noticias-parcial-escritorio.png` (reproducción local de la respuesta del 29/09: solo notas ES y el aviso de fuente caída). |

---

## 5. Pruebas manuales pendientes

| Prueba | Quién | Estado |
|---|---|---|
| Caso 1 en la URL pública (capturas escritorio y celular) | Mati | Pendiente |
| Lighthouse (Accessibility y Performance, celular) sobre la URL pública | Mati | Pendiente |
| Recorrido con teclado: Tab por tarjetas, tabs del gráfico, "Ver como tabla", links de noticias | Mati | Pendiente |
| Plan B: activar modo mock en Vercel y verificar el banner en la URL pública | Mati + Tech Lead | **Hecho (01/10).** URL fija de preview (rama `demo-mock`, variables de Preview solo para esa rama). Ventana privada: abre sin login, con el banner y datos del fixture; `/api/quotes` idéntico al mock local (`diff` vacío). Producción sigue en modo real (diff contra el mock: fechas del 01/10). Deploy en 14 s. Activar el mock en producción cambiando la variable no sirve: Vercel exige redeploy. Detalle en `demo.md`, "Plan B". |

---

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
