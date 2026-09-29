# Rubika — Tablero de mercado

## Estado
Fase actual: desarrollo (producto cerrado el 26/09/2026; arquitectura aprobada el 27/09, revisada el 28/09 con formatos reales).
Día 0 de 10 (día 0 = 28/09; entrega 08/10). Horas usadas: 8.5 aprox. (ver docs/horas.md) de 28 (escenario realista declarado: 30-32).

URL pública: https://tablero-mercado.vercel.app (deploy automático en cada push a main).

## Decisiones cerradas (no reabrir sin avisarme)
- Usuario: cliente minorista argentino de un banco, sin formación financiera, celular y escritorio. App standalone embebible; sin login ni datos personales.
- Problema: información de mercado dispersa y sin saber cuán actualizada está. El tablero muestra y destaca; no recomienda ni interpreta.
- Feature 1 (se implementa): brecha cambiaria — % vs oficial en cada dólar paralelo + serie de brecha superpuesta en el gráfico. Sin colores/íconos de "bueno/malo".
- Feature 2 (solo especificada): detalle por activo.
- Alcance base: 5 tarjetas + gráfico histórico (línea de venta, 7/30/90, un activo por vez) + tablero de noticias (temas fijos, local e internacional, idioma marcado) + 4 estados de UI (carga, error, sin datos, mercado cerrado) + "actualizado hace X min" + disclaimer + modo mock + responsive.
- Estado mercado cerrado: ventana única lunes a viernes 10-18 hs Argentina + feriados nacionales. Fuera de ventana, tarjetas muestran último valor y "Último cierre: día y hora". La app sigue consultando; solo cambia la presentación.
- Stack: Next.js 16.3 (App Router) + TypeScript + Vercel, sin Tailwind. Claves solo en route handlers del server, nunca en cliente.
- Next 16 cambió el modelo de cache: NO usamos `cacheComponents` ni `use cache`. Usamos el modelo previo: `fetch` con `next: { revalidate: N }` (verificado en node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md). Antes de escribir código de Next, leer la doc local, no la memoria del modelo.
- APIs: DolarAPI (cotizaciones; MEP se llama `bolsa`), ArgentinaDatos (riesgo país, histórico, feriados), GNews (noticias, plan gratis, 100 req/día, 12 h de demora). Formatos reales en src/lib/fixtures/raw/; los adaptadores se escriben contra esos archivos, no contra la doc.
- Cache: 60 s cotizaciones, 45 min noticias, 24 h histórico, 24 h feriados con fallback a fixture.
- Noticias (cerrado 28/09): GNews plan gratis, UNA búsqueda por idioma (es + en) con operadores OR, en secuencia con 1 s de pausa; tema asignado localmente por palabra clave y las notas sin tema fijo SE DESCARTAN (`mercados` no es comodín); cache 45 min → 64 requests/día de 100. Se descartó agregar un segundo proveedor para repartir la cuota: dos APIs son dos adaptadores, dos formatos, dos límites y dos claves que mantener, y el mismo problema se resuelve pagando el plan de GNews si el producto avanza. En desarrollo, USE_MOCK_DATA=true por defecto para no gastar cuota.
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
- Carga de datos: client components con fetch a los route handlers; QuoteGrid refresca /api/quotes cada 60 s.
- Estado de mercado: un solo MarketStatus en QuotesResponse.market, no por Quote.
- Route handlers devuelven siempre HTTP 200 con Result en el body; "error" y "sin datos" son valores distintos.
- Días hábiles: una sola función (lib/business-days.ts) usada por market-status y por la variación del día.
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
- Pegar en docs/ai-log.md las entradas del PO y la corrección del Tech Lead sobre el reloj del fixture. Completar docs/horas.md.
- Paso b) fixtures: hecho. c) business-days + change + market-status con tests: hecho (30 tests en verde). d) scaffold + deploy: hecho (28/09).
- Capa de datos: hecha (68 tests en verde, `npm run check`). DolarAPI: /v1/dolares verificado (200); /api/dolares da 404.
- Route handlers: hechos y probados en local con datos reales; cache verificada (28/09). GNews en secuencia.
- NEWS_API_KEY cargada en Vercel; /api/quotes, /api/history y /api/news verificados en la URL pública (28/09). docs/riesgos.md iniciado con lo detectado en desarrollo.
- Pendiente: confirmar en los logs de Vercel por qué la búsqueda en inglés no devolvió notas en la primera respuesta.
- Tarjetas + estados + banner + tema: hecho (28/09). Gráfico con brecha: hecho y aprobado (29/09).
- Siguiente: noticias → entrada + tutorial → README.
- Verificar en Vercel que el proyecto usa Node.js 22 o 24 (aviso: builds con Node 20 fallan desde el 30/09).
