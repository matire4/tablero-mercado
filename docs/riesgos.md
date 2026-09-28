# Riesgos

La matriz completa (riesgo, probabilidad, impacto, mitigación) la arma el rol QA en la fase de calidad. Esta sección la va alimentando el Tech Lead con lo que aparece durante el desarrollo, para que la matriz salga de hechos y no de memoria.

## Detectados durante el desarrollo

### 2026-09-28 · Noticias fuera de tema en el tablero
**Qué pasó:** en la primera respuesta real de `/api/news` en producción entraron notas de política ("A Milei la política no le sienta"), cultura ("La venta de libros crece 3,9 %") y crédito ("Morosidad…"), todas etiquetadas como tema `mercados`. El tema `mercados` funcionaba como comodín para cualquier nota que no matcheara otro tema, y la búsqueda de GNews con operadores OR es amplia.
**Impacto:** alto para la confianza del usuario: el producto promete "noticias económicas filtradas por temas fijos" y mostraba ruido. Es lo primero que un gerente señalaría en la demo.
**Mitigación implementada:** las notas que no matchean ningún tema fijo se descartan, y `mercados` requiere palabras explícitas (Merval, bolsa, acciones, bonos, Wall Street, FMI, mercados). Consecuencia: menos notas (5–7 por idioma en vez de 10), todas pertinentes. Código en `src/lib/providers/news.ts`, `TOPIC_RULES`.
**Riesgo residual:** el filtro es por palabra clave en el título; puede descartar una nota pertinente con título ambiguo o dejar pasar una que use la palabra en otro sentido ("bolsa de trabajo"). Se documenta como aproximación.

### 2026-09-28 · Concentración de fuente (todas las notas de Clarín)
**Qué pasó:** las 10 notas en español de la primera respuesta real eran de Clarín.
**Por qué:** el plan gratis de GNews devuelve como máximo 10 notas por búsqueda, las más recientes; el medio que más publica domina.
**Mitigación:** ninguna disponible en el plan gratis sin sacrificar pertinencia (sacar `country=ar` trae medios de otros países). Se muestra la fuente en cada nota para que sea visible. Un plan pago permite `max` mayor y diversificar.

### 2026-09-28 · Límite de requests simultáneas en GNews
**Qué pasó:** dos búsquedas en paralelo con la misma key: una dio HTTP 429 con menos de 10 requests usadas en el día.
**Mitigación implementada:** búsquedas en secuencia con 1 s de pausa; si una búsqueda falla, la respuesta lleva `sources: { ok, total }` y el route handler manda `Cache-Control: no-store` para que el CDN no retenga 45 min una lista incompleta.
**Riesgo residual:** la respuesta parcial (solo un idioma) es válida y se muestra; el usuario no ve un error, ve menos notas.

### 2026-09-28 · Demora de 12 h en las noticias (plan gratis)
**Qué pasó:** confirmado en el dashboard de GNews y en los datos: la nota más reciente tenía ~32 h al momento del curl.
**Mitigación implementada:** cada nota muestra "publicada hace X h"; el tablero nunca las presenta como última hora. Se cuenta en la demo. Se elimina pagando el plan.

### 2026-09-28 · Feriados: fallback a fixture
**Riesgo:** si ArgentinaDatos no responde, el estado "mercado cerrado" usa `fixtures/feriados.json` (año 2026). Un feriado decretado después de generar el fixture, con el proveedor caído, mostraría mercado abierto un día sin mercado. La respuesta lo marca con `holidaysSource: 'fallback-fixture'`.

### 2026-09-28 · Variación del día depende de un segundo proveedor
**Riesgo:** DolarAPI no devuelve variación diaria; se calcula con el histórico de ArgentinaDatos. Si ese histórico no está disponible, la tarjeta muestra precio y brecha pero "variación no disponible". Cache de 24 h del histórico reduce la ventana de exposición.
