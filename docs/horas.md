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
| | | | |

**Total a la fecha:** 20 h (aprox.) de 28 (realista declarado 30-32; con el alcance de diseño, 33-36). Desarrollo hecho hasta acá: 10 h reales contra 13–19.5 h estimadas para esos mismos ítems (falta la entrada + tutorial, 3–4 h).
