# Horas por sesión

Una línea por sesión, anotada al terminar la sesión (no reconstruida al final). Día 0 = 28/09/2026 (respuesta al mail). Día 10 = 08/10/2026.

Las líneas marcadas *(aprox.)* son anteriores al inicio del registro y se anotaron de memoria. Las marcadas *(reconstr.)* se completaron el 29/09: Mati estimó 8 h de desarrollo en total y se repartieron por bloque según los commits del 28/09 y la madrugada del 29/09. El resto es tiempo real.

Entrega: miércoles 07/10/2026 (día 9).

| Fecha | Entregable | Horas | Nota |
| --- | --- | --- | --- |
| 25/09 | Producto | 2.5 *(aprox.)* | Chat PO: usuario, problema, 6 candidatas, descartes. |
| 26/09 | Producto | 2 *(aprox.)* | Estimación congelada, historias de usuario, producto.md, CLAUDE.md. |
| 27/09 | Arquitectura | 1.5 *(aprox.)* | Chat Tech Lead: estructura, tipos, contratos, cache, brecha. arquitectura.md v1. Repo inicial. |
| 28/09 | Día 0 | 1 | Respuesta al mail con preguntas y fecha de entrega. |
| 28/09 | Arquitectura | 1.5 *(aprox.)* | Curls a DolarAPI y ArgentinaDatos, crudos en raw/, cuenta GNews, .env.local. arquitectura.md v2 con formatos reales. |
| 28/09 | Desarrollo | 1.5 *(reconstr.)* | Fixtures desde los crudos; business-days, estado de mercado y variación del día con tests; scaffold Next 16 + deploy en Vercel. |
| 28/09 | Desarrollo | 1.5 *(reconstr.)* | Capa de datos: fetch-json, adaptadores, modo mock, tests con MSW. |
| 28/09 | Desarrollo | 1.5 *(reconstr.)* | Route handlers + cache; noticias: temas fijos, búsquedas en secuencia, `in=title`; riesgos.md. |
| 28/09 | Desarrollo | 1.5 *(reconstr.)* | Mockups de diseño (tres vueltas); tarjetas con estados, tema claro/oscuro, banner de mock. |
| 29/09 | Desarrollo | 2 *(reconstr.)* | Gráfico SVG propio con panel de brecha, tooltip y animación; fixtures a 90 días; descarte de Recharts. |
| 29/09 | Documentación | 0.5 | Chat Tech Lead 2 (06:00–09:40, horas por bloque según los commits). Orden del repo: horas, CLAUDE.md y arquitectura al día, producto y estimaciones al repo, sync con el proyecto, prompt al PO. |
| 29/09 | Desarrollo | 1 | Noticias: búsqueda internacional verificada con curl, filtro "Fed" y repetidas, panel con estados, mock es+en. |
| 29/09 | Desarrollo | 0.25 | README. |
| 29/09 | Desarrollo | 0.75 | Lint sin errores (sin setState en efectos); tabla del gráfico (dos vueltas, la segunda por captura de Mati). |
| 29/09 | Calidad | 0.75 | e2e con Playwright en modo mock, escritorio y celular (11 tests). |
| 29/09 | Producto | 0 | Revisión del PO de producto.md y estimaciones.md: corrió en paralelo, dentro del mismo horario. |
| 29/09 | Desarrollo | 2.5 | Entrada "puertas": CSS sobre html[data-intro], tres vueltas de color (fondo → invertido → sigue al tema), una de duración (0,8 s → ~2,4 s con acercamiento) y espera a los datos con tope de 6 s; e2e marca entrada y tutorial como vistos. |
| 29/09 | Desarrollo | 1 | Tutorial de 4 pasos: recuadro sobre el elemento real (anclas data-tutorial), panel de vidrio, teclado (Esc, Tab, foco), apertura después de la entrada y con datos; 2 tests e2e. Una vuelta visual (anillo afuera del elemento, sin anillo de foco en el panel). Personita: alcance nuevo, pendiente de referencia. |
| 29/09 | Desarrollo | 1 | Avatar en el tutorial: mockup sobre el tablero real, bienvenida (Empezar / Saltar), busto animado en escritorio (sube saludando, viaja entre pasos, se inclina, "habla" con vaivén), círculo en celular, poses en WebP; tests del tutorial ajustados. No incluye el tiempo de Mati con Claude Design para sacar las poses. |
| 29/09 | Desarrollo | 1.5 | Avatar, segunda vuelta: las poses fijas con balanceo se veían "como mover una hoja de papel". Prompts para generar videos (Gemini pedía plan pago; Kling, cuenta), y finalmente 3 clips del video del portafolio de Mati (saludo, reposo, guiño) en WebM + MP4; tutorial pasado a video, sin balanceo; grabaciones de escritorio y celular. |
| 29/09 | Desarrollo | 0.5 | Avatar, tercera vuelta: fondo sacado cuadro por cuadro (rembg, comparando dos modelos), clips en WebP animado con transparencia, globo de cómic, celular con Mati asomando desde abajo; grabaciones. |
| 30/09 | Desarrollo | 0.25 | Textos del tutorial reescritos en tono formal; e2e ajustado al nuevo título de la bienvenida. Prompt del chat de QA. |
| 30/09 | Calidad | 2.25 | Chat Tech Lead, arreglos de la revisión de QA (19:07–21:25, por reloj; commits `8cdcd9a`, `83587f6`, `d0e289c`, `eb368db`, `2a86a77`): #1 histórico vacío → "sin datos" (H0-6), #2 BUG-01 (rastro de fallas de GNews, verificado en producción), #4 7/30/90 fechas, test de blue 30 d endurecido, hallazgo #3 a riesgos.md, docs al día. Trabajo del Tech Lead: ~50 min contra 45 de presupuesto (+5 aprobados por Mati para riesgos.md); el resto, pruebas manuales de Mati, commits y esperas entre pasos. |
| | | | |

**Total a la fecha:** 28,75 h al 30/09 a la noche (suma de la tabla; pasa las 28 del escenario base; el total del 29/09 a la mañana decía 20 y la tabla sumaba 19,75) de 28 (realista declarado 30-32; con el alcance de diseño, 33-36; con el avatar, 35-38,5). Desarrollo hecho hasta acá: 16,75 h reales contra 19,5–27,5 h estimadas con el alcance de diseño y el avatar. Entrada + tutorial: 3,5 h contra 3–4 h estimadas (la entrada se llevó 2,5 h). Avatar: 3 h contra 3,5–4,5 h estimadas con la tercera vuelta (2–2,5 + 1,5–2); la versión con poses fijas se descartó.
