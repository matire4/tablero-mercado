# Riesgos

La matriz completa (riesgo, probabilidad, impacto, mitigación) la arma el rol QA en la fase de calidad. Esta sección la va alimentando el Tech Lead con lo que aparece durante el desarrollo, para que la matriz salga de hechos y no de memoria.

## Detectados durante el desarrollo

### 2026-09-28 · Noticias fuera de tema en el tablero
**Qué pasó:** en la primera respuesta real de `/api/news` en producción entraron notas de política ("A Milei la política no le sienta"), cultura ("La venta de libros crece 3,9 %") y crédito ("Morosidad…"), todas etiquetadas como tema `mercados`. El tema `mercados` funcionaba como comodín para cualquier nota que no matcheara otro tema, y la búsqueda de GNews con operadores OR es amplia.
**Impacto:** alto para la confianza del usuario: el producto promete "noticias económicas filtradas por temas fijos" y mostraba ruido. Es lo primero que un gerente señalaría en la demo.
**Mitigación implementada:** las notas que no matchean ningún tema fijo se descartan, y `mercados` requiere palabras explícitas (Merval, bolsa, acciones, bonos, Wall Street, FMI, mercados). Consecuencia: menos notas (5–7 por idioma en vez de 10), todas pertinentes. Código en `src/lib/providers/news.ts`, `TOPIC_RULES`.
**Segunda vuelta (mismo día):** con el filtro activo, la búsqueda en inglés quedó vacía: GNews matcheaba las palabras en título *y descripción*, y el filtro local solo mira el título. Se agregó `in=title` a la búsqueda (verificado en la doc de GNews) y palabras clave financieras en inglés.
**Riesgo residual:** el filtro es por palabra clave en el título; puede descartar una nota pertinente con título ambiguo o dejar pasar una que use la palabra en otro sentido ("bolsa de trabajo"). Se documenta como aproximación.

### 2026-09-28 · Concentración de fuente (todas las notas de Clarín)
**Qué pasó:** las 10 notas en español de la primera respuesta real eran de Clarín.
**Por qué:** el plan gratis de GNews devuelve como máximo 10 notas por búsqueda, las más recientes; el medio que más publica domina.
**Mitigación:** ninguna disponible en el plan gratis sin sacrificar pertinencia (sacar `country=ar` trae medios de otros países). Se muestra la fuente en cada nota para que sea visible. Un plan pago permite `max` mayor y diversificar.

### 2026-09-28 · Límite de requests simultáneas en GNews
**Qué pasó:** dos búsquedas en paralelo con la misma key: una dio HTTP 429 con menos de 10 requests usadas en el día.
**Mitigación implementada:** búsquedas en secuencia con 1 s de pausa; si una búsqueda falla, la respuesta lleva `sources: { ok, total, failed }` (`failed` desde el 30/09, ver BUG-01) y el route handler manda `Cache-Control: no-store` para que el CDN no retenga 45 min una lista incompleta.
**Riesgo residual:** la respuesta parcial (solo un idioma) es válida y se muestra; el usuario no ve un error, ve menos notas.

### 2026-09-28 · Demora de 12 h en las noticias (plan gratis)
**Qué pasó:** confirmado en el dashboard de GNews y en los datos: la nota más reciente tenía ~32 h al momento del curl.
**Mitigación implementada:** cada nota muestra "publicada hace X h"; el tablero nunca las presenta como última hora. Se cuenta en la demo. Se elimina pagando el plan.

### 2026-09-28 · Feriados: fallback a fixture
**Riesgo:** si ArgentinaDatos no responde, el estado "mercado cerrado" usa `fixtures/feriados.json` (año 2026). Un feriado decretado después de generar el fixture, con el proveedor caído, mostraría mercado abierto un día sin mercado. La respuesta lo marca con `holidaysSource: 'fallback-fixture'`.

### 2026-09-28 · Variación del día depende de un segundo proveedor
**Riesgo:** DolarAPI no devuelve variación diaria; se calcula con el histórico de ArgentinaDatos. Si ese histórico no está disponible, la tarjeta muestra precio y brecha pero "variación no disponible". Cache de 24 h del histórico reduce la ventana de exposición.

### 2026-09-29 · Noticias en inglés escasas y viejas
**Qué pasó:** la búsqueda en inglés (`Argentina AND (…)` en el título) devolvió 4 notas; la más nueva era del 10/09 (19 días) y una estaba fuera de tema ("The Messi economy…", que entraba a `mercados` por `economy`). Explica el pendiente del 28/09 "la búsqueda en inglés no devolvió notas": no era un fallo de Vercel, era la búsqueda.
**Impacto:** el alcance base promete noticias locales e internacionales; con esa búsqueda el lado internacional queda vacío o viejo.
**Mitigación implementada (29/09):** búsqueda internacional por temas del tablero (Fed, Wall Street, mercados emergentes, FMI) más Argentina con palabras financieras; `economy` fuera del filtro; `Fed` sensible a mayúsculas (excluye "Fed up"); notas repetidas entre medios se sacan por título. Verificado con curl: 10 notas del día anterior.
**Riesgo residual:** las notas en inglés son mayormente de mercado estadounidense (Wall Street, Fed) y alguna es de baja calidad (una nota promocional de cripto entró por "Federal Reserve"). Argentina casi no aparece en medios en inglés con ese filtro. Se cuenta en la demo como límite del plan gratis y del filtro por palabras (decisión del 29/09: se deja así; nota en demo.md).

### 2026-09-29 · Lista de noticias larga en celular
**Qué pasa:** con dos búsquedas de hasta 10 notas, el panel muestra hasta ~20 notas seguidas; en celular es un scroll largo para un tablero "de un vistazo".
**Decisión:** se deja la lista completa. Se evaluó mostrar 8 y un botón "ver más" (~15 min) y se descartó por no sumar alcance. El panel va último en la página, así que no tapa las cotizaciones ni el gráfico.

### 2026-09-30 · Mientras una búsqueda de noticias falla, cada visita gasta cuota de GNews
**Origen:** hallazgo #3 de la revisión de código de QA (`testing.md` §6). Se documenta y no se arregla ahora (decisión de Mati, 30/09).
**Qué pasa:** la Data Cache de Next solo guarda respuestas HTTP 200 (`node_modules/next/dist/server/lib/patch-fetch.js`, l. 696), así que la búsqueda que falla no queda en cache. Y si la lista es parcial, el route handler de `/api/news` manda `Cache-Control: no-store`, así que el CDN tampoco la guarda. Resultado: mientras una búsqueda falla, cada carga de la página vuelve a pedir esa búsqueda a GNews.
**Impacto:** con tráfico real, ~100 visitas en un día con una búsqueda caída agotan la cuota del plan gratis (100 requests/día), y entonces cae también la búsqueda que andaba: el panel pasa de "lista incompleta" a error. Con el tráfico de la demo (un puñado de visitas) no llega a pasar: el 29/09 hubo 10 requests en todo el día con la búsqueda en inglés caída al menos 3 h (`docs/evidencia/gnews-dashboard-dias-30-09.png`).
**Detección (desde el 30/09):** cada falla deja una línea `[news] búsqueda en <idioma> falló: …` en los logs de Vercel y aparece en `sources.failed` de `/api/news` (BUG-01, `83587f6`). Un consumo acelerado de cuota se vería como muchas líneas `[news]` seguidas y en el dashboard de GNews.
**Mitigación posible, no implementada:** cachear también la respuesta parcial por poco tiempo (por ejemplo, 1 a 5 min en el CDN) para que una falla no se pida en cada visita, o pasar al plan pago de GNews si el producto avanza (ya es la palanca elegida para la cuota, ver CLAUDE.md, decisión del 28/09). Cualquiera de las dos cambia la cache, que el 30/09 se decidió no tocar.

### 2026-10-01 · "Brecha no disponible" puede quedar hasta 1 h en el gráfico después de que el oficial vuelve
**Origen:** verificación de QA del hallazgo #10 (`testing.md` §7, 01/10).
**Qué pasa:** si el histórico del oficial falla (500, timeout), `/api/history/<paralelo>` responde `ok` con `gapUnavailable: true`, y el route handler cachea toda respuesta `ok` con `s-maxage=3600, stale-while-revalidate=3600` (`src/app/api/history/[asset]/route.ts`, l. 26). El error del oficial no entra en la Data Cache (solo guarda HTTP 200), pero la respuesta del paralelo sí queda en el CDN.
**Impacto:** bajo. Durante hasta ~1 h el gráfico de blue/MEP/tarjeta dice "Brecha no disponible para este período" mientras las tarjetas, que se refrescan cada 60 s, ya muestran la brecha. No se muestra ningún dato falso: es un aviso que dura más que la falla. Requiere que falle justo el histórico del oficial, que se pide una vez por día.
**Mitigación posible, no implementada:** mandar `no-store` (o un `s-maxage` corto) cuando `gapUnavailable` es `true`, como ya se hace en `/api/news` con la lista parcial. Cambia la cache, que se decidió no tocar en estos arreglos; queda a decisión de Mati.

