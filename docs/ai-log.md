# AI log — diario en caliente

Cada vez que un chat propone algo mal, lleva a una abstracción innecesaria, inventa un campo o se contradice, se anota acá en el momento. Es la materia prima de `docs/uso-de-ia.md`.

## 2026-09-25 · PO
**Qué propuso:** Merval como sexta tarjeta del primer vistazo.
**Por qué estaba mal:** requiere un segundo proveedor con API key y límites, contradiciendo el descarte de "Merval/acciones" como feature en la misma conversación.
**Cómo lo detecté:** al listar dudas abiertas, el propio PO señaló la contradicción.
**Qué hice:** saqué Merval; quedan 5 tarjetas. Motivo documentado en producto.md.

## 2026-09-25 · PO
**Qué propuso:** paths de DolarAPI (`/v1/dolares` y `/api/dolar/blue`) que aparecen distintos en dos páginas de la documentación.
**Por qué estaba mal:** no estaba mal, estaba sin verificar; el PO lo marcó como "a verificar con curl" en vez de darlo por cierto.
**Cómo lo detecté:** dos fetches a la doc devolvieron paths distintos.
**Qué hice:** quedó como pendiente del Tech Lead. Se verificó con curl el 28/09; ningún formato de respuesta se asumió.

## 2026-09-26 · PO
**Qué propuso:** insistió dos veces en que faltaba "el enunciado original de Rubika" en el proyecto.
**Por qué estaba mal:** el documento del proyecto es la consigna; no hay otro enunciado. Error de lectura del contexto.
**Cómo lo detecté:** lo aclaré yo.
**Qué hice:** reemplazamos "enunciado" por una sección de supuestos y preguntas al cliente en producto.md.

## 2026-09-26 · PO
**Qué propuso:** el checklist propio asignaba 10-12 h a desarrollo; la estimación del PO dio 13-19 h.
**Por qué importa:** el PO lo dijo antes de congelar en vez de acomodar los números al presupuesto.
**Qué hice:** congelé sin recortes con escenario realista 30-32 h y tres palancas de recorte escritas en estimaciones.md.

## 2026-09-26 · PO
**Qué propuso:** subtotal no-desarrollo "14-19 h" y total "27-38 h" en el chat, y así se firmó.
**Por qué estaba mal:** la suma de las líneas da 13.5-19 (total 26.5-38). Error aritmético del PO.
**Cómo lo detecté:** verificación con script al redactar estimaciones.md.
**Qué hice:** el doc congelado lleva la suma correcta; el escenario realista (30-32) no cambia.

## 2026-09-27 · Tech Lead
**Qué propuso:** fixture "viernes-cerrado" para el modo mock, con el estado de mercado calculado por getMarketStatus.
**Por qué estaba mal:** getMarketStatus usa el reloj real; un martes al mediodía ese fixture mostraba mercado abierto. El escenario no probaba lo que decía probar.
**Cómo lo detecté:** pregunté si el modo mock podía mostrar información errónea; al revisar, el reloj era el problema, no los precios.
**Qué hice:** cada fixture trae su propio `now` congelado y MOCK_SCENARIO elige el escenario. Además, banner obligatorio de "datos de demostración" y timestamps reales (no corridos a "ahora").

## 2026-09-28 · Tech Lead
**Qué propuso:** changePct "contra el cierre del día hábil anterior", porque los fines de semana repetían el valor del viernes.
**Por qué estaba mal:** lo dedujo de un solo histórico (blue). En oficial y MEP la entrada del sábado ya trae el cierre del viernes; con esa regla el lunes mostraba un movimiento que no existió.
**Cómo lo detecté:** al bajar los históricos que faltaban, el Tech Lead comparó los cuatro y se corrigió solo.
**Qué hice:** regla en revisión; propuesta nueva: contra la última entrada anterior a la fecha del dato actual. Lección: verificar un patrón en todos los activos, no en uno.

## 2026-09-28 · Tech Lead
**Qué propuso:** cache de noticias de 20 min con búsquedas por tema y por idioma.
**Por qué estaba mal:** el plan gratis de GNews da 100 requests/día y una búsqueda es una request; 12 búsquedas cada 20 min son 864/día. Ni con una búsqueda por idioma (144/día) entraba. Yo había fijado los 20 min sin hacer la cuenta.
**Cómo lo detecté:** el Tech Lead hizo la cuenta al leer el crudo de GNews; verificamos en la doc que `lang` acepta un solo valor por request.
**Qué hice:** opciones con trade-offs en arquitectura.md §10; decisión pendiente.

## 2026-09-28 · Tech Lead
**Qué propuso:** en `data.ts`, leer `q.updatedAt` donde `q` es un `Result<Quote>` (el dato está en `q.data`).
**Por qué estaba mal:** error de tipos; en runtime `undefined.slice` rompía las tres pruebas de `getQuotes`.
**Cómo lo detecté:** `npx tsc --noEmit` lo marcó antes de correr los tests; Vitest no chequea tipos.
**Qué hice:** corregido. Regla nueva: `tsc --noEmit` siempre antes de `npm test`; queda en el script `check` de package.json.
