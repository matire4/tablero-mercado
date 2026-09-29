# Rubika — Tablero de mercado

## Estado
Fase actual: desarrollo (producto cerrado el 26/09/2026; arquitectura aprobada el 27/09, revisada el 28/09 con formatos reales).
Día 1 de 10 (día 0 = 28/09). Entrega: miércoles 07/10; demo jueves 08 o viernes 09/10 (propuesto a Rubika el 28/09). Horas usadas: 16.5 aprox. (ver docs/horas.md) de 28 (escenario realista: 30-32 declarado; 33-36 con el alcance de diseño del 28/09).

URL pública: https://tablero-mercado.vercel.app (deploy automático en cada push a main).

## Decisiones cerradas (no reabrir sin avisarme)
- Usuario: cliente minorista argentino de un banco, sin formación financiera, celular y escritorio. App standalone embebible; sin login ni datos personales.
- Problema: información de mercado dispersa y sin saber cuán actualizada está. El tablero muestra y destaca; no recomienda ni interpreta.
- Feature 1 (se implementa): brecha cambiaria — % vs oficial en cada dólar paralelo + serie de brecha en el gráfico (en panel propio debajo del precio: desvío de H1-2 aprobado el 29/09, ver Diseño). Sin colores/íconos de "bueno/malo".
- Feature 2 (solo especificada): detalle por activo.
- Alcance base: 5 tarjetas + gráfico histórico (línea de venta, 7/30/90, un activo por vez) + tablero de noticias (temas fijos, local e internacional, idioma marcado) + 4 estados de UI (carga, error, sin datos, mercado cerrado) + "actualizado hace X min" + disclaimer + modo mock + responsive.
- Estado mercado cerrado: ventana única lunes a viernes 10-18 hs Argentina + feriados nacionales. Fuera de ventana, tarjetas muestran último valor y "Último cierre: día y hora". La app sigue consultando; solo cambia la presentación.
- Stack: Next.js 16.3 (App Router) + TypeScript + Vercel, sin Tailwind. Claves solo en route handlers del server, nunca en cliente. Vercel usa Node.js 24.x (verificado 29/09).
- Next 16 cambió el modelo de cache: NO usamos `cacheComponents` ni `use cache`. Usamos el modelo previo: `fetch` con `next: { revalidate: N }` (verificado en node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md). Antes de escribir código de Next, leer la doc local, no la memoria del modelo.
- APIs: DolarAPI (cotizaciones; MEP se llama `bolsa`), ArgentinaDatos (riesgo país, histórico, feriados), GNews (noticias, plan gratis, 100 req/día, 12 h de demora). Formatos reales en src/lib/fixtures/raw/; los adaptadores se escriben contra esos archivos, no contra la doc.
- Cache: 60 s cotizaciones, 45 min noticias, 24 h histórico, 24 h feriados con fallback a fixture.
- Noticias (cerrado 28/09): GNews plan gratis, UNA búsqueda por idioma (es + en) con operadores OR, en secuencia con 1 s de pausa; tema asignado localmente por palabra clave y las notas sin tema fijo SE DESCARTAN (`mercados` no es comodín); cache 45 min → 64 requests/día de 100. Se descartó agregar un segundo proveedor para repartir la cuota: dos APIs son dos adaptadores, dos formatos, dos límites y dos claves que mantener, y el mismo problema se resuelve pagando el plan de GNews si el producto avanza. En desarrollo, USE_MOCK_DATA=true por defecto para no gastar cuota.
- Búsqueda de noticias en inglés (cambio del 29/09): la de `Argentina AND (…)` traía 4 notas, la más nueva de 19 días, y ruido ("The Messi economy"). Pasa a cubrir temas internacionales del tablero (Fed, Wall Street, mercados emergentes, FMI) más Argentina con palabras financieras; se saca `economy` del filtro de `mercados`. Verificada con curl el 29/09. `Fed` distingue mayúsculas y excluye "Fed up"; notas repetidas entre medios se sacan por título.
- Panel de noticias (29/09): si una de las dos búsquedas falla, una línea "Una de las fuentes no respondió; la lista puede estar incompleta". Aviso fijo de hasta 12 h de demora. Sin refresco automático (las notas llegan con 12 h de demora). En modo mock las noticias usan su propio reloj (el de la captura, 29/09 09:32Z), no el del escenario. Lista completa sin "ver más" (hasta ~20 notas; decidido 29/09). Notas en inglés mayormente de mercado de EE. UU.: se deja así y se cuenta en la demo (docs/demo.md).
- Histórico: el server pide la serie completa una vez por día y la recorta POR FECHA a los últimos 90 días calendario antes de mandarla al cliente (decidido el 28/09; se descartó recortar por cantidad de registros porque las series tienen calendarios distintos y 31 registros no cubrían el selector de 90 días).
- Variación del día (cerrado 28/09): contra la última entrada del histórico con fecha anterior a la del dato actual. Se descartaron "contra ayer", "último valor distinto" y "día hábil anterior" (historia en arquitectura.md §8 y ai-log.md). No usa lógica de días hábiles; business-days.ts queda solo para el estado de mercado.
- Activos del dashboard (lista cerrada): blue, MEP, oficial, tarjeta, riesgo país. Segundo nivel solo en feature 2. Merval y acciones: afuera.
- Estimación congelada en docs/estimaciones.md. Palancas de recorte en orden: (1) brecha sin serie en gráfico, (2) sin 90 días, (3) mercado cerrado sin feriados.
- Descartadas con motivo en docs/producto.md.

### Diseño y alcance de UI (cerrado 28/09, mockup aprobado en Claude Design)
- Estética: fondo carbón con manchas de color desenfocadas que se mueven lento, paneles de vidrio (backdrop-filter), acento salmón, línea de brecha violeta punteada. Tipografías Sora (títulos/números) e Inter Tight (secundario).
- Tema claro y oscuro: por defecto sigue la preferencia del sistema; botón para cambiarlo, persistido en el navegador.
- Alcance NUEVO respecto de producto.md, aceptado con su costo (3–4 h; desarrollo pasa a 16–23 h, total realista 33–36):
  - Animación de entrada "puertas" de 0,8 s, solo la primera vez por sesión, con el tablero ya cargado detrás. No bloquea datos.
  - Tarjetas entran escalonadas (80 ms entre cada una); el gráfico se dibuja al cambiar activo o rango.
  - Tutorial de 4 pasos con foco sobre la interfaz (valor y hora · brecha · mercado cerrado · noticias con demora). Se abre solo la primera vez o desde el botón "¿Cómo leer esto?".
- Todo movimiento respeta prefers-reduced-motion. Vidrio y desenfoque limitados a paneles visibles; si un celular viejo se traba, se baja el desenfoque, no se saca el diseño.
- Sigue vigente: variación y brecha sin flechas ni verde/rojo; números en formato es-AR; datos cada 60 s, "hace X min" cada 30 s.
- Gráfico (desvío de H1-2 aprobado el 29/09): la brecha NO va superpuesta con segundo eje Y sobre el precio, sino en un panel propio debajo, alineado fecha a fecha y con su escala. Motivo: dos ejes Y en un mismo gráfico inducen comparaciones falsas entre unidades distintas. Colores de líneas validados para daltonismo y contraste en ambos temas; se distinguen además por trazo (sólido / punteado). Curva monótona (no inventa extremos). Tabla accesible bajo "Ver como tabla".

### Arquitectura (detalle en docs/arquitectura.md)
- Carga de datos: client components con fetch a los route handlers; Dashboard refresca /api/quotes cada 60 s.
- Estado de mercado: un solo MarketStatus en QuotesResponse.market, no por Quote.
- Route handlers devuelven siempre HTTP 200 con Result en el body; "error" y "sin datos" son valores distintos.
- Días hábiles: lib/business-days.ts, usada solo por market-status. La variación del día no usa días hábiles (ver Decisiones).
- Brecha se calcula solo en el server (lib/brecha.ts); la UI no calcula nada.
- Manejo de timeout (5 s), 429 y vacío en un único helper (lib/fetch-json.ts).
- Modo mock: USE_MOCK_DATA=true + MOCK_SCENARIO=normal|viernes-cerrado|sin-oficial, `now` congelado por fixture, banner no ocultable "Datos de demostración, no reflejan el mercado". Fixtures recortados a 90 días (igual al rango máximo del selector; antes 60 y el mock mostraba menos de lo que prometía, 29/09); crudos en raw/ como evidencia.
- Variables de entorno: .env.local solo local; producción se carga a mano en Vercel. Ningún valor real en el repo.

## Restricciones
- Dependencias (regla del 28/09): una librería nueva entra solo si ahorra más de ~1 h, está mantenida y se anota en arquitectura.md con el motivo. Se evaluó Recharts para el gráfico y se descartó: trae 11 dependencias (Redux Toolkit, react-redux, immer…) para dos líneas. El gráfico es SVG propio (src/lib/chart.ts + HistoryChart.tsx).
- No agregar features fuera de las dos acordadas ni del alcance base.
- Toda decisión nueva se anota acá antes de implementarse.
- Si algo va a llevar más horas que docs/estimaciones.md, avisar antes de hacerlo.
- Los docs viven en /docs con los nombres ya definidos.

## Pendiente
Hecho (28-29/09): fixtures; business-days + change + market-status con tests; scaffold + deploy; capa de datos con tests MSW; route handlers con cache verificada; NEWS_API_KEY en Vercel y endpoints verificados en la URL pública; riesgos.md iniciado; tarjetas + estados + banner mock + tema; gráfico SVG con panel de brecha; Node 24.x en Vercel; entradas del PO en ai-log.md; horas.md al día; producto.md y estimaciones.md copiados al repo; archivos vacíos `next`, `tsc` y `tablero-mercado@0.1.0` borrados.

Siguiente, en este orden (acordado 29/09):
1. Noticias: hecho (29/09), 85 tests en verde. Falta verificar en la URL pública después del push.
2. README: hecho (29/09).
3. e2e con Playwright (happy path en modo mock).
4. Entrada "puertas" + tutorial. Antes de arrancar, avisarle a Mati: esa parte la hace en otro chat de Claude.
5. Lint: hecho (29/09). `npm run check` ahora corre tipos + lint + tests.
6. No desarrollo: testing.md, bug-report.md (candidato: timeout a mitad de la lectura del cuerpo en fetch-json, ai-log 28/09), matriz de riesgos, estimaciones real/desvío, uso-de-ia.md, demo.md, ensayos.

Abierto: producto.md no refleja los desvíos aprobados en desarrollo (brecha en panel propio, alcance de diseño, demora y cuota de noticias). Prompt al PO pasado el 29/09; cuando vuelva, copiar producto.md al repo.
