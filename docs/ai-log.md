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

## 2026-09-28 · Tech Lead
**Qué propuso:** las dos búsquedas a GNews (es + en) en paralelo con `Promise.all`.
**Por qué estaba mal:** en la primera prueba real, la búsqueda en español dio HTTP 429 mientras la de inglés dio 200, con menos de 10 requests usadas en el día. Hipótesis: el plan gratis no admite requests simultáneas con la misma key. El tablero igual respondió `ok` solo con las notas en inglés (la degradación por fuente funcionó).
**Cómo lo detecté:** logging de fetches de Next en desarrollo (`logging.fetches` en next.config.ts).
**Qué hice:** búsquedas secuenciales. Al repetir, la misma búsqueda en español dio 200 (la de inglés salió de cache, así que la prueba no fue del todo limpia). Se da por resuelto; si reaparece un 429 aislado, el tablero lo absorbe igual.

## 2026-09-28 · Tech Lead
**Qué propuso:** en la asignación de tema de noticias, `mercados` como comodín para toda nota que no matcheara otro tema.
**Por qué estaba mal:** con la búsqueda amplia (OR) de producción entraron notas de política, cultura y crédito etiquetadas como `mercados`. El producto dice "filtradas por temas fijos"; el comodín lo rompía.
**Cómo lo detecté:** yo, leyendo la primera respuesta real de `/api/news` en la URL pública.
**Qué hice:** las notas sin tema se descartan y `mercados` requiere palabras explícitas. Menos notas, pertinentes. Documentado en riesgos.md y arquitectura.md §10.

## 2026-09-28 · Tech Lead (diseño)
**Qué propuso:** un primer mockup plano y "cuadrado", y después tres paletas pastel.
**Por qué estaba mal:** no era lo que el dueño del producto tenía en la cabeza (referencia: el mockup del Asistente Contable, oscuro y con movimiento). Dos vueltas de mockup antes de acertar.
**Cómo lo detecté:** lo dijo Mati al ver cada versión.
**Qué hice:** preguntar antes de dibujar la tercera (tema, forma, qué se anima) y recién ahí armar la v2, que se aprobó. Lección: para lo visual, preguntar referencia antes de proponer.

## 2026-09-28 · Tech Lead
**Qué propuso:** en `fetch-json.ts`, el try/catch solo alrededor de `fetch()`; la lectura del cuerpo (`response.text()`) quedó afuera.
**Por qué estaba mal:** el timeout de 5 s puede saltar a mitad de la lectura de una respuesta grande (históricos de ~0,5 MB). Ese error escapó y `/api/quotes` devolvió HTTP 500, rompiendo la promesa de diseño "nunca lanza al cliente".
**Cómo lo detecté:** Mati pegó el log del dev server: `GET /api/quotes 500 in 6.5s` + `unhandledRejection`. Los tests con MSW no lo cubrían porque simulaban el timeout antes de la respuesta, no durante.
**Qué hice:** lectura del cuerpo dentro de try/catch y test nuevo con un stream que se corta a mitad. Candidato a docs/bug-report.md.

## 2026-09-28 · Tech Lead
**Qué propuso:** fetch del cliente con `cache: 'no-store'`.
**Por qué estaba mal:** el navegador manda `Cache-Control: no-cache` y Next lo trata como recarga forzada: saltea su Data Cache y cada visita pegaba a los 3 proveedores (en el log: `cache skip (hard refresh)` en todas las llamadas del navegador; con curl sí había cache).
**Cómo lo detecté:** mismo log.
**Qué hice:** fetch sin opción de cache; la frescura la controla el server (revalidate + Cache-Control).

## 2026-09-29 · Tech Lead
**Qué propuso:** Recharts para el gráfico, "para ahorrar una hora".
**Por qué estaba mal:** lo recomendé sin verificar qué traía. `npm view recharts` mostró 11 dependencias, incluidas Redux Toolkit, react-redux, immer y reselect: un gestor de estado completo para un gráfico de dos líneas. Contradecía el criterio de Mati de no llenar el proyecto de dependencias.
**Cómo lo detecté:** Mati preguntó por qué la recomendaba; al verificar antes de instalar, apareció la lista.
**Qué hice:** gráfico en SVG propio (~150 líneas de utilidades puras con tests + un componente). Regla nueva en CLAUDE.md para toda dependencia futura.

## 2026-09-29 · Tech Lead
**Qué propuso:** H1-2 tal cual: brecha superpuesta al precio con un segundo eje Y.
**Por qué lo cuestioné:** dos ejes Y en un gráfico es el error clásico de visualización: el ojo compara las líneas como si compartieran escala. Propuse un panel de brecha debajo del precio, alineado en el tiempo. Es un desvío de una decisión cerrada, avisado antes de implementar; se cambia a superposición en 15 min si Mati lo prefiere.
**Qué hice:** Mati aprobó el panel separado el 29/09. Queda anotado en CLAUDE.md como desvío de H1-2; se le pide al PO que actualice producto.md.

## 2026-09-29 · Tech Lead
**Qué propuso:** búsqueda de noticias en inglés `Argentina AND (peso OR "central bank" OR inflation OR … OR economy)`, filtrada por título.
**Por qué estaba mal:** exigir "Argentina" más una palabra financiera en el título en inglés casi no da resultados. El crudo real trajo 4 notas: la más nueva del 10/09 (19 días) y una fuera de tema ("The Messi economy…") que entraba al tema `mercados` por la palabra `economy`. El pendiente "la búsqueda en inglés no devolvió notas" no era un fallo de Vercel: era la búsqueda.
**Cómo lo detecté:** curl de la búsqueda en inglés guardado en `raw/gnews-search-en.json` para armar el fixture del mock.
**Qué hice:** opciones a Mati; eligió una búsqueda internacional (Fed, Wall Street, mercados emergentes, FMI y Argentina con palabras financieras) y sacar `economy` del filtro. Se verifica con curl antes de tocar código.

## 2026-09-29 · Tech Lead
**Qué propuso:** CLAUDE.md con "entrega 08/10" y una línea que decía que business-days se usaba también para la variación del día.
**Por qué estaba mal:** la fecha enviada a Rubika es miércoles 07/10 (08/10 es el día 10 contado desde el 28/09, no la entrega). Lo de business-days contradecía la decisión del 28/09 en el mismo archivo (la variación no usa días hábiles).
**Cómo lo detecté:** al retomar en un chat nuevo de Tech Lead, releyendo CLAUDE.md contra el código y el mail.
**Qué hice:** corregido en CLAUDE.md y horas.md.

## 2026-09-29 · Tech Lead
**Qué propuso:** en `HistoryChart` y `ThemeToggle`, `setState` dentro de `useEffect` (poner "cargando" y cerrar el tooltip al cambiar de activo; leer el tema al montar).
**Por qué estaba mal:** la regla `react-hooks/set-state-in-effect` lo marca como error: provoca un render extra en cascada. No rompía nada visible, pero `npm run lint` fallaba con 2 errores y quien revise el repo lo corre.
**Cómo lo detecté:** al retomar en un chat nuevo corrí `npm run lint`; el script `check` solo corría tipos y tests, así que nunca había saltado.
**Qué hice:** en el gráfico, "cargando" se deriva de comparar la clave pedida (activo + rango) con la de la última respuesta, y el tooltip se cierra en el mismo click que cambia el activo. El tema se lee con `useSyncExternalStore` (atributo `data-theme` + preferencia del sistema), que además sigue en vivo un cambio del sistema. Verificado en el navegador: tema, persistencia al recargar, tooltip y panel de brecha. `check` ahora incluye lint.

## 2026-09-29 · Tech Lead
**Qué propuso:** la tabla accesible "Ver como tabla" dentro de la misma fila flex que la leyenda del gráfico.
**Por qué estaba mal:** al abrirla, la tabla estiraba la fila: la leyenda quedaba centrada en un hueco vacío enorme y la tabla, angosta, pegada a la derecha. Las capturas de verificación del gráfico se habían sacado con la tabla cerrada.
**Cómo lo detecté:** Mati, abriendo la tabla en el navegador.
**Qué hice:** abierta ocupa el ancho debajo de la leyenda (máximo 520 px, centrada; primero quedó alineada a la derecha y en escritorio se veía desbalanceada), con altura máxima, scroll propio, encabezado fijo y fechas DD/MM/AAAA. Verificado en escritorio y celular.


## 2026-09-29 · Tech Lead (entrada "puertas")
**Qué propuso:** el shorthand `animation: 800ms ease …` sin nombre de animación en las reglas de las puertas.
**Por qué estaba mal:** el compilador de CSS de Next (Lightning CSS) reduce un shorthand sin nombre a `animation: none`: las puertas no se movían.
**Cómo lo detecté:** midiendo `getComputedStyle(html, '::after').transform` durante la animación, no a ojo.
**Qué hice:** el shorthand lleva siempre el nombre en cada regla; quedó comentado en globals.css.

## 2026-09-29 · Tech Lead (entrada "puertas")
**Qué propuso:** detectar el fin de la animación con `getAnimations()`.
**Por qué estaba mal:** Chromium no lista en `getAnimations()` las animaciones de pseudoelementos de `<html>`; los eventos `animationend` sí llegan.
**Qué hice:** se volvió a `animationend` + timeout, y después a un timeout de apertura, porque la apertura la dispara el propio componente (DoorsIntro.tsx).

## 2026-09-29 · Tech Lead (entrada "puertas")
**Qué propuso:** el color del telón, en tres vueltas: primero del color del fondo, después invertido.
**Por qué estaba mal:** del color del fondo no se veía; invertido quedaba crema sobre el modo oscuro.
**Cómo lo detecté:** la versión invertida la vio Mati.
**Qué hice:** el telón sigue al tema y se distingue por las manchas, el título y el brillo de la unión.

## 2026-09-29 · Tech Lead (entrada "puertas")
**Qué propuso:** mantener la duración de 0,8 s cerrada el 28/09.
**Por qué estaba mal:** a 0,8 s no se percibía. Mati pidió 5 s; para un usuario "de un vistazo" es una espera.
**Qué hice:** se acordó ~2,4 s con acercamiento (1,4 s) y apertura (0,8 s). Anotado en CLAUDE.md.

## 2026-09-29 · Tech Lead (entrada "puertas")
**Qué se pidió:** Mati pidió un porcentaje de carga sobre el telón.
**Por qué lo cuestioné:** sería inventado: la duración es fija y el fetch corre en paralelo, no hay nada real que medir.
**Qué hice:** nombre del producto + "Cargando cotizaciones y noticias…" con una línea que se subraya.

## 2026-09-29 · Tech Lead (entrada "puertas")
**Qué se pidió:** Mati pidió que el telón no se abra con las tarjetas en "Cargando…".
**Qué hice:** el telón espera a que no quede ningún `aria-busy="true"` en la página, con tope de 6 s. Probado con API rápida, con 3 s de demora simulada y colgada.

## 2026-09-29 · Tech Lead (entrada "puertas")
**Qué propuso:** correr comandos de git de solo lectura (`git status`, `git diff`) desde el shell de la carpeta conectada.
**Por qué estaba mal:** ese shell no tiene permiso de borrado: git dejó un `.git/index.lock` huérfano que bloqueó el commit de Mati.
**Cómo lo detecté:** el commit de Mati falló por el lock.
**Qué hice:** se borró a mano. Regla: nada de git desde la carpeta conectada; diffs y estado, en un clon.

## 2026-09-29 · Tech Lead (tutorial)
**Qué se pidió:** Mati pidió que el tutorial sea "una personita que explique qué se ve en cada sección", como la de su portafolio.
**Por qué lo cuestioné:** es alcance nuevo, fuera de las 3–4 h del alcance de diseño, con 1–1,5 h de presupuesto para el tutorial. Además no pude ver la referencia: en el portafolio es un canvas ("Retrato · 2026") que apareció vacío en el navegador y la pestaña se trabó; no la reconstruí de suposiciones.
**Qué hice:** opciones con trade-offs; Mati eligió tutorial base primero y la personita después, como capa decorativa aparte (SVG propio, `aria-hidden`) sin tocar la lógica, y solo si entra en horas. Manda captura o GIF de referencia. Anotado en CLAUDE.md antes de implementar.

## 2026-09-29 · Tech Lead (tutorial)
**Qué propuso:** el recuadro del tutorial con un borde de 2 px dibujado sobre el borde del elemento, y el anillo de foco del panel en color de acento.
**Por qué estaba mal:** el borde pisaba el texto del encabezado de noticias y del chip de brecha (que no tienen margen propio), y el anillo de foco del panel se leía como un segundo resaltado.
**Cómo lo detecté:** capturas de los 4 pasos en escritorio y celular, tema claro y oscuro, antes de pasarlo.
**Qué hice:** el recuadro mide exactamente lo que el elemento (el test lo compara a ±2 px) y el anillo va 4 px afuera con `outline-offset`; sin anillo en el panel (el foco sigue entrando al abrir).

## 2026-09-29 · Tech Lead (tutorial)
**Qué propuso:** texto del paso 4 "No se ordenan por impacto", sin decir cómo se ordenan.
**Por qué importa:** dejaba la duda al usuario. Verificado en el código (`providers/news.ts`): se ordenan por fecha, de la más nueva a la más vieja.
**Qué hice:** "Van de la más nueva a la más vieja; no se ordenan por impacto."

## 2026-09-29 · Tech Lead (avatar del tutorial)
**Qué propuso:** en escritorio, el busto del avatar asomando por encima del panel, con el corte de la imagen tapado por el borde del panel (así quedó escrito en CLAUDE.md antes de implementar).
**Por qué cambió:** el panel va pegado al elemento resaltado (debajo o arriba); una cabeza asomando por encima del panel tapaba justo el elemento que se explica.
**Cómo lo detecté:** al implementar la ubicación del panel, antes de mostrárselo a Mati.
**Qué hice:** el busto va al costado izquierdo del panel y la base se funde con una máscara, así no se ve el corte. Corregido en CLAUDE.md.

## 2026-09-29 · Claude Design (poses del avatar)
**Qué se pidió:** dos cuadros más del video del Memoji, con la boca abierta "hablando" y el mismo encuadre que la pose neutral, para animar el habla.
**Qué hizo bien:** revisó el video cuadro por cuadro y no los inventó: los únicos cuadros con la boca abierta son sonrisas, y en ellos también se mueven cejas, cachetes y cabeza (diferencia con la pose neutral 5 a 7 veces mayor que entre dos cuadros quietos). Alternarlos habría parecido muecas.
**Qué hice:** Mati eligió un vaivén leve mientras aparece el texto. El código acepta cuadros de boca si más adelante salen de un video nuevo, con la pose neutral del mismo video.

## 2026-09-29 · Tech Lead (avatar del tutorial)
**Qué propuso:** en el test de apertura automática, borrar la marca `tutorial-seen` con `page.addInitScript` y después verificar que al recargar ya no se abre solo.
**Por qué estaba mal:** el init script corre en cada navegación: al recargar volvía a borrar la marca y el tutorial se abría de nuevo. El test fallaba por el test, no por la app.
**Cómo lo detecté:** falló en escritorio y celular con el diálogo todavía visible después de recargar.
**Qué hice:** el init script borra la marca una sola vez (bandera en `sessionStorage`). 15 e2e en verde.

## 2026-09-29 · Tech Lead (avatar del tutorial)
**Qué propuso:** animar el avatar con poses fijas (PNG) y movimiento por CSS: subir saludando con balanceo, inclinarse hacia el elemento, "hablar" con un vaivén y un saltito al cambiar de paso.
**Por qué estaba mal:** una imagen quieta que se balancea no parece una persona: Mati lo describió como "mover una hoja de papel de derecha a izquierda; el avatar no interactuaba". Las capturas de verificación eran cuadros sueltos y no mostraban ese efecto; recién se vio en la grabación.
**Cómo lo detecté:** Mati, mirando la grabación de escritorio.
**Qué hice:** se sacó todo el movimiento de imagen fija. El avatar pasó a ser video: 3 clips del video del Memoji del portafolio de Mati (saludo, reposo en bucle, guiño), con su fondo, en WebM + MP4. Antes se evaluó generar videos nuevos con Gemini (pedía plan pago) y Kling (sin cuenta a mano; no se crean cuentas ni se entra con contraseñas desde el asistente). Aprendizaje: para validar animaciones, mostrar un video, no capturas.

## 2026-09-30 · Tech Lead (tutorial)
**Qué propuso:** los textos del tutorial en tono coloquial ("Mirá esta tarjeta", "Te la muestro; no te digo si es mucho o poco", "Si te olvidás de algo, estoy en…").
**Por qué estaba mal:** para un cliente de un banco se leían poco claros y poco serios; "estoy en «¿Cómo leer esto?»" ni siquiera se entiende. El prompt pedía textos "cortos, sin recomendar" y se cuidó lo segundo, no la claridad.
**Cómo lo detecté:** Mati, al usar el tutorial.
**Qué hice:** textos reescritos en voseo neutro y formal (el mismo registro que el resto de la interfaz), sin coloquialismos, manteniendo lo que no se dice: la brecha se muestra como "dato informativo: no indica si conviene comprar o vender". Verificado que entren en 390 px.

## 2026-09-30 · Product Owner (criterio H0-4), detectado por QA
**Qué propuso:** en H0-4, que fuera de horario "cada tarjeta" (las 5) mostrara "Último cierre: día y hora".
**Por qué estaba mal:** el criterio se escribió el 26/09, antes de verificar los formatos reales de las APIs. ArgentinaDatos publica el riesgo país solo con fecha, sin hora (`raw/argdatos-riesgo-ultimo.json`). Cumplir el criterio al pie de la letra obligaba a inventar una hora ("18:00") que la fuente no da, contra la promesa del producto: "cada dato dice de cuándo es" y "no se muestra ningún valor inventado". El código ya hacía lo correcto (`QuoteCard.tsx`: sin hora → "dato del DD/MM"); el que estaba mal era el criterio.
**Cómo lo detecté:** al escribir el e2e de mercado cerrado (`tests/e2e/estados.spec.ts`), el chat de QA contrastó el criterio con lo que dibuja la tarjeta y vio que riesgo país nunca muestra "último cierre".
**Qué hice:** se precisó el criterio en producto.md (marcado como desvío del 30/09): los 4 dólares muestran "último cierre" con hora; riesgo país, "dato del DD/MM". El test verifica exactamente eso. No se tocó código. Aprendizaje: un criterio de aceptación que describe datos se escribe después de ver la respuesta real del proveedor, no antes.

## 2026-09-30 · QA (diagnóstico de noticias en inglés)
**Qué propuso:** que la búsqueda en inglés había fallado el 29/09 "casi seguro" por la cuota diaria de GNews gastada (100 requests/día).
**Por qué estaba mal:** se afirmó con confianza antes de mirar el consumo real. El dashboard de GNews muestra 10 requests en todo el 29/09 y 21 en el mes: la cuota nunca estuvo en riesgo.
**Cómo lo detecté:** Mati mandó capturas del dashboard de GNews (`docs/evidencia/gnews-dashboard-*.png`).
**Qué hice:** se descartó la hipótesis. La causa real (timeout de 5 s o error de GNews) no se puede determinar: el código descarta el error cuando una búsqueda sale bien y la otra no, y no escribe nada en los logs de Vercel. Eso pasa a ser el bug de bug-report.md.

## 2026-09-30 · QA (e2e de H0-6)
**Qué propuso:** un e2e para H0-6 ("histórico vacío muestra sin datos") que intercepta `/api/history` en el navegador y le inyecta `ok: true` con una serie vacía.
**Por qué estaba mal:** probaba la rama de la interfaz sin verificar que el server pudiera llegar a ella. En modo real, un histórico vacío del proveedor sale del server como `ok: false, kind: 'empty'` y el gráfico muestra el error. El test pasaba en verde y el criterio no se cumplía en producción.
**Cómo lo detecté:** en la revisión de código (paso 4), siguiendo el camino completo desde `fetchJson` hasta `HistoryChart`.
**Qué hice:** hallazgo #1 de `testing.md` §6; se pidió el arreglo al Tech Lead con un unitario que cubra el camino del server. Aprendizaje: un e2e que modifica la respuesta prueba la interfaz, no el criterio; hace falta al menos un test que recorra el server.
