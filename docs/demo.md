# Demo

Guion de la demo de 20 minutos para el gerente de producto digital del banco (no técnico), seguida de preguntas del equipo técnico de Rubika. Escrito el 02/10 en la fase Demo sobre el código congelado (`db46eb5`). Las notas que se juntaron durante el desarrollo y la sección "Plan B (verificado el 01/10)" están al final, tal como se anotaron.

**Regla del guion:** cada bloque se cuenta en términos de lo que gana el cliente del banco. La parte técnica va en el apéndice "Si preguntan", al final. Lo que aparece como [PANTALLA] es lo que tiene que estar visible en ese momento; [DECIR] es texto sugerido, no para leer literal.

**URLs**

- Producción (la demo se hace acá): https://tablero-mercado.vercel.app
- Plan B, datos de demostración (pestaña abierta antes de empezar): https://tablero-mercado-git-demo-mock-matias-projects-d0bd5617.vercel.app

---

## Antes de empezar (10 minutos antes)

Pestañas, en este orden, en una **ventana privada** (así la entrada y la bienvenida del tutorial se ven como primera visita):

1. Producción, **sin cargar todavía** (se carga en vivo en el bloque 3; si se carga antes, la entrada y la bienvenida ya no aparecen).
2. Plan B cargado y verificado: banner "Datos de demostración, no reflejan el mercado" visible.
3. Producción en vista de celular (emulación Pixel 7 en las herramientas del navegador, ya cargada y con el tutorial saltado), para el final del bloque 3.
4. Captura `docs/evidencia/caso2-viernes-cerrado-escritorio.png` (mercado cerrado) o, si la demo es fuera del horario de mercado, `caso1-happy-path-escritorio.png` (mercado abierto): la que muestre el estado que **no** se va a ver en vivo.

Chequeos: producción responde y sin banner; el plan B tiene el banner; cronómetro a la vista; en el bloque 3 nada se lee del guion, se mira la pantalla.

**Según la hora de la demo:**
- Día hábil entre 10 y 18 hs: en vivo se ve "Mercado abierto · datos de hace X min". Mercado cerrado se muestra con la captura y con el paso 3 del tutorial.
- Fuera de ese horario o fin de semana: en vivo se ve "Mercado cerrado · último cierre …" (es la decisión de producto que más se nota: mejor todavía). Mercado abierto se muestra con la captura.

---

## Guion (20 minutos)

### Bloque 1 · El problema — 2 min (0:00 a 2:00)

[PANTALLA] Nada del producto. Cámara o una diapositiva en blanco con una sola frase: "Muestra y destaca, no recomienda".

[DECIR]
- El usuario: un cliente del banco con ahorros en pesos y dólares, que mira el mercado varias veces por semana desde el celular, sin formación financiera. No es un operador, no es un contador: es la mayoría de los clientes.
- El problema: lo que le importa (dólar, riesgo país, noticias económicas) está repartido en sitios distintos, con formatos distintos, y en ninguno sabe cuán viejo es el dato. Termina decidiendo con números viejos o de fuentes que no conoce.
- Ejemplo concreto: es lunes a la mañana y el blue aparece más caro que el viernes. ¿Se movió el blue, o se movió todo el mercado y el blue solo acompañó al oficial? Son dos situaciones distintas y hoy el usuario las tiene que calcular de cabeza con dos pestañas abiertas.
- Qué construimos: una sola pantalla que junta esas cotizaciones y noticias, dice hace cuánto se actualizó cada dato y le da hecha esa lectura. **Muestra y destaca, no recomienda:** la decisión sigue siendo del usuario, y el banco no queda en posición de aconsejar.

Marca de tiempo: a los 2:00 tiene que estar dicha la frase "muestra y destaca, no recomienda" y el ejemplo del lunes.

### Bloque 2 · Qué construimos — 3 min (2:00 a 5:00)

[PANTALLA] Todavía sin cargar producción. Dos capturas: la del tablero en escritorio (`caso1-happy-path-escritorio.png`) y la de mercado cerrado (`caso2-viernes-cerrado-escritorio.png`). Si la demo es en horario de mercado, acá se muestra la de cerrado; si es fuera de horario, la de abierto.

[DECIR], en este orden:
1. **Cinco tarjetas:** blue, MEP, oficial, tarjeta y riesgo país. Cada una con el valor, cuánto cambió hoy, de qué fuente viene y hace cuántos minutos se actualizó. Son los cinco datos que el cliente minorista mira; lo demás quedó afuera a propósito.
2. **Un gráfico** de los últimos 7, 30 o 90 días, una cotización a la vez, una línea simple: lo que el usuario ya sabe leer.
3. **Noticias económicas** locales e internacionales, de temas fijos (dólar, Banco Central, inflación, riesgo país, mercados), cada una con su medio, su hora y su link. El tablero no dice qué noticia mueve qué precio: eso sería interpretar.
4. **Cuatro estados distintos y visibles:** cargando, error, sin datos y **mercado cerrado**. Este último es la decisión de producto que más se nota: un sábado el tablero no dice "actualizado hace 14 horas" como si fuera un problema; dice "último cierre: viernes 18:00" y mantiene el valor. Si una fuente se cae, la tarjeta de esa fuente lo dice y las demás siguen; nunca se muestra un número inventado.
5. **Un tutorial de 4 pasos guiado por un avatar** que se abre solo la primera vez: valor y hora, brecha, mercado cerrado, noticias con demora. Es la forma de explicar el tablero sin manual ni capacitación. [PANTALLA] señalar el avatar en la captura.
6. **La brecha cambiaria**, la funcionalidad que elegimos agregar: cada dólar paralelo muestra cuánto se aleja del oficial, en porcentaje, y en el gráfico se ve cómo evolucionó esa distancia. Es la cuenta que el usuario argentino hace de cabeza; nosotros se la damos hecha. Vuelve el ejemplo del lunes: con la brecha, "el blue subió" pasa a ser "el blue se despegó del oficial" o "subió todo".

Marca de tiempo: a los 5:00, cargar producción.

### Bloque 3 · Demo en vivo — 6 min (5:00 a 11:00)

Guion de clics exacto. Tiempos acumulados dentro del bloque. Todo en la pestaña 1 (producción), salvo el último paso.

| # | Tiempo | Clic | [PANTALLA] / [DECIR] | Si falla en vivo |
|---|---|---|---|---|
| 1 | 0:00 | Cargar la URL de producción. | [PANTALLA] Entrada ("puertas", ~2 s) con el tablero ya cargado detrás. [DECIR] "Esto es lo que ve su cliente la primera vez". | Si no aparece la entrada (no es primera visita): seguir; no se menciona. |
| 2 | 0:10 | Se abre la bienvenida del tutorial: dejar que el avatar salude. | [DECIR] "El tablero se explica solo, la primera vez, con un recorrido de cuatro pasos". | Si el avatar no carga (se ve el cuadro fijo o nada): "la explicación está en el globo, el avatar es decorativo" y seguir. |
| 3 | 0:20 | **Empezar** → **Siguiente** × 3 → **Entendido**. Unos 10 s por paso, leyendo el título del globo en voz alta, no el texto completo. | [PANTALLA] Cada paso recuadra el elemento real: tarjeta, brecha, píldora de mercado, noticias. [DECIR] en el paso 3: "esto es mercado cerrado; lo vemos en la captura de antes". | Si vas atrasado (más de 1:10 acumulado al terminar): **Saltar** en cualquier paso. El tutorial se puede reabrir con "¿Cómo leer esto?" si preguntan. |
| 4 | 1:00 | Sin clic. Señalar la píldora de mercado y las 5 tarjetas. | [PANTALLA] Píldora "Mercado abierto · datos de hace X min" (o "Mercado cerrado · último cierre …"). [DECIR] "Cada dato dice de dónde viene y de cuándo es. Esto es el corazón de la confianza: hace X minutos, no 'ahora'". Señalar el aviso "no es recomendación de inversión", visible sin bajar. | Una tarjeta en error ("No pudimos obtener …"): mostrarla como lo que es: "una fuente no respondió, el resto sigue, no inventamos el número; se reintenta solo cada minuto". Dos o más tarjetas en error: pasar al plan B (abajo). |
| 5 | 1:40 | En el gráfico, elegir **Blue** (si no está ya) y señalar el **panel de brecha** debajo del precio. | [PANTALLA] Línea de precio arriba, panel "Brecha vs oficial (%)" debajo, alineados por fecha. [DECIR] "Arriba el precio; abajo, cuánto se alejó del oficial en el mismo período. Son dos lecturas distintas y van en dos paneles distintos a propósito, para no mezclar pesos con porcentajes". Volver al ejemplo del lunes. | Si dice "Brecha no disponible para este período": "la fuente del oficial no respondió para el histórico; el tablero lo dice en vez de dibujar una línea con huecos". Si el gráfico entero está en error: elegir **MEP**; si también falla, plan B. |
| 6 | 2:50 | Cambiar el rango: **7 d** → **90 d**. | [PANTALLA] El gráfico se redibuja; la brecha acompaña. [DECIR] "Mismo activo, tres distancias: la semana, el mes, el trimestre". | Riesgo bajo. Si tarda: "está pidiendo el histórico más largo", esperar 2 s. |
| 7 | 3:15 | **Ver como tabla**. | [PANTALLA] Tabla fecha a fecha debajo del gráfico. [DECIR] "Para quien prefiere números, o usa lector de pantalla, el mismo dato en tabla". Cerrarla. | Riesgo bajo. |
| 8 | 3:40 | Bajar al **panel de noticias**. Señalar el aviso de demora del encabezado y, en una nota, el medio y el "hace X h". | [PANTALLA] Aviso "las notas pueden tener hasta 12 h", notas con medio, hora, idioma y tema. [DECIR] "Las noticias llegan con demora, y el tablero lo dice en vez de disimularlo. Cada nota dice de qué medio es y de cuándo. No decimos qué noticia mueve qué precio". | Si aparece "Una de las fuentes no respondió; la lista puede estar incompleta": mostrarlo como diseño: "esto pasó de verdad en producción el 29/09 y así lo vio el usuario: menos notas, nunca un error". Si el panel entero está en error: "las noticias dependen de un proveedor externo; las cotizaciones no se vieron afectadas", y seguir (no hace falta plan B por las noticias). |
| 9 | 4:40 | **Botón de tema** (claro ↔ oscuro). | [PANTALLA] Cambia todo el tablero. [DECIR] "Sigue la preferencia del teléfono, y se puede cambiar; se recuerda la elección". | Riesgo bajo. |
| 10 | 5:00 | Pasar a la **pestaña 3** (vista de celular). Bajar y subir una vez. | [PANTALLA] Una columna, tarjetas apiladas, gráfico legible, nada cortado. [DECIR] "Su cliente lo va a mirar desde acá; el 'vistazo' está pensado para esta pantalla". | Si la pestaña se cerró o perdió la vista de celular: achicar la ventana de producción hasta el ancho de un celular; el tablero se reacomoda igual. |
| — | 6:00 | Volver a la pestaña 1. Fin del bloque. | | |

**Plan B en el bloque 3.** Si producción falla de un modo que no se puede mostrar como estado de error (varias tarjetas caídas, página que no carga, red), pasar a la **pestaña 2** y decir: "uno de los proveedores no responde; paso a la versión con datos de demostración, que es la que ven: tiene el banner". Cambiar de pestaña lleva 5 segundos; el banner "Datos de demostración, no reflejan el mercado" explica solo lo que se está viendo. En esa versión se hacen los mismos clics 5 a 9 (el tutorial también se abre, si es primera visita). Si falla **solo** la fuente de noticias, no se activa el plan B: el panel dice "una de las fuentes no respondió" y el resto del tablero sigue; se muestra tal cual (fila 8). Detalle técnico y verificación del plan B: sección "Plan B (verificado el 01/10)", al final.

[DECISIÓN MATI] Tutorial: el guion lo recorre completo en ~40 s porque deja presentados brecha, mercado cerrado y demora de noticias antes de mostrarlos en vivo. La alternativa es dejar el saludo y tocar **Saltar** (15 s), ganando 25 s para el gráfico. Se decide después del primer ensayo con cronómetro.

[DECISIÓN MATI] Celular: el guion usa la emulación en una pestaña ya cargada (misma vista que los tests). La alternativa es compartir el teléfono real: convence más, pero depende de que la duplicación de pantalla ande en el momento.

### Bloque 4 · Decisiones que tomamos y descartamos — 3 min (11:00 a 14:00)

[PANTALLA] Producción quieta en el tablero. Si hay diapositiva, dos columnas: "Tomamos" / "Descartamos".

Reparto del bloque: 1:30 las tres que tomamos, 0:45 las tres que descartamos, 0:45 estimado vs real.

**Tres que tomamos** (30 s cada una):
1. **Sin login ni datos personales.** El tablero no sabe quién lo mira. Ventaja para el banco: nada del cliente que proteger, y se puede embeber mañana en el home banking para que la identidad la ponga el banco. Costo: no hay favoritos ni alertas, todavía.
2. **Una ventana única de mercado:** lunes a viernes de 10 a 18, más feriados nacionales. Cada activo tiene en realidad su horario; elegimos una regla simple y honesta antes que cinco reglas a medias. Por eso el sábado dice "último cierre" en vez de fingir que está actualizado.
3. **La brecha en un panel propio** debajo del precio, en vez de superpuesta sobre la misma línea. La versión original la superponía; se cambió durante el desarrollo, y se anotó, porque poner pesos y porcentajes en el mismo gráfico lleva a comparar lo que no se compara.

**Tres que descartamos** (15 s cada una, una frase por decisión; son decisiones de criterio, no de tiempo):
1. **Asistente de IA conversacional sobre el tablero.** Primero por riesgo legal: un modelo contestando sobre dólar y bonos a un cliente de un banco en algún momento va a decir algo que suene a recomendación de inversión, y un aviso al pie no alcanza. Segundo, porque contradice al usuario: alguien que quiere ver el dólar de un vistazo no quiere chatear. Va en próximos pasos, con revisión legal y presupuesto propio.
2. **Merval y acciones.** Requieren otro proveedor con sus propios límites y costo, por un dato que este usuario mira mucho menos que el dólar. Antes de sumarlo hay que elegir proveedor.
3. **Alertas de precio.** Necesitan saber quién es el usuario; chocan con "sin login". Son lo primero a pedir cuando el banco embeba el tablero con su identidad.

**Estimado vs real** (45 s, acá, no escondido):

[DECIR] "Congelé la estimación antes de escribir código: entre 26,5 y 38 horas, con un escenario realista declarado de 30 a 32. El trabajo real va a cerrar en [COMPLETAR desde `horas.md` al cerrar la demo: al 01/10 el registro sumaba 35,83 h, sin la última sesión de QA ni demo y ensayos]. El desvío no vino de lo que estimé: el desarrollo congelado se hizo por debajo del rango (10 horas contra 13 a 19). Vino de dos cosas que decidí agregar después de congelar, cada una anotada con su costo: el diseño (tema, entrada, tutorial; 3 a 4 horas) y el avatar del tutorial (4 horas en tres vueltas). Con eso, el escenario realista pasó a 37,5-41,5 horas, y ahí estamos. Lo que aprendí: congelar el alcance no congela las ganas de mejorar el producto; lo que hizo legible el desvío fue anotar cada agregado en el momento, con su costo, y no mezclarlo con la estimación original."

### Bloque 5 · Cómo aseguramos la calidad — 2 min (14:00 a 16:00)

[PANTALLA] Producción quieta, o una diapositiva con cuatro números: 98 · 29 · 82 · 0.

[DECIR]
- **98 pruebas automáticas del código** (datos, calendario de mercado, brecha, gráfico). En lenguaje llano: probamos qué pasa cuando la fuente se cae, cuando tarda demasiado, cuando devuelve basura, cuando devuelve la mitad de los datos y cuando no devuelve nada. En todos los casos el tablero avisa; nunca inventa un número.
- **29 pruebas automáticas en el navegador**, en escritorio y celular, una por cada criterio que escribimos antes de programar: las cinco tarjetas, el gráfico, las noticias, mercado cerrado, fuente caída, sin datos, celular sin cortes, y los cinco criterios de la brecha.
- **Un bug real, encontrado y arreglado.** Cuando una fuente de noticias falló en producción, el usuario vio lo correcto (menos notas y el aviso), pero nosotros no podíamos saber por qué había fallado: el tablero no dejaba rastro. Se arregló, se verificó en producción y quedó documentado. Lo cuento porque es lo que va a pasar en el banco: lo importante no es que no falle, es que cuando falle el usuario vea algo honesto y el equipo pueda saber qué pasó.
- **Medición independiente en celular** (Lighthouse de Google): rendimiento 82 sobre 100, accesibilidad 97, prácticas recomendadas y posicionamiento 100. Y un recorrido completo solo con teclado, sin mouse: 15 de 15 pasos bien.
- **Cero claves en el historial del código.** La única clave de acceso a un proveedor vive en el servidor, no en el navegador del usuario, y se revisó todo el historial del repositorio: no hay ninguna.

### Bloque 6 · Riesgos — 2 min (16:00 a 18:00)

[PANTALLA] Panel de noticias de producción, con el aviso de demora visible.

[DECIR] "Tres riesgos que quiero que conozcan antes de que los descubran ustedes."
1. **Las noticias llegan con hasta 12 horas de demora.** Es el límite del plan gratuito del proveedor. El tablero lo dice en el encabezado y cada nota muestra su hora real; nunca se presenta como última hora. Para producción en el banco hace falta el plan pago del proveedor de noticias, GNews: €49,99 por mes, que además saca la demora y multiplica por diez la cantidad de consultas permitidas.
2. **Dependemos de fuentes gratuitas sin contrato de servicio.** Las cotizaciones vienen de proyectos abiertos mantenidos por particulares, no de una fuente oficial. Por eso el tablero está construido para que una fuente caída se vea como "fuente caída" y no como un número falso. Para producción, la recomendación es una fuente contratada con compromiso de disponibilidad para las cotizaciones.
3. **Licencias.** Para este challenge estamos en regla: el plan gratuito de noticias es para desarrollo y prueba, y de cada nota mostramos solo título, medio, fecha y link al original. Para que el banco lo use comercialmente hay que pasar al plan pago y revisar el texto legal del aviso de no recomendación con el área legal del banco: hoy es un texto de producto, no un texto legal.

[DECIR] para cerrar: "La honestidad sobre estos límites es parte del producto: el tablero le dice al usuario cuán viejo es cada dato, y yo les digo a ustedes qué hace falta para ponerlo en producción."

### Bloque 7 · Próximos pasos y decisión que le pido — 2 min (18:00 a 20:00)

[PANTALLA] Producción en el tablero. Si hay diapositiva: dos opciones, una frase cada una.

[DECIR] "El tablero está completo para lo que prometimos. Para la próxima iteración hay dos caminos, los dos especificados, y la elección es de ustedes:"

- **Opción A · Detalle por activo.** Su cliente toca una cotización y ve la ficha completa: compra y venta, cómo cambió en el día, la semana y el mes, el histórico largo, la brecha, y las noticias que mencionan ese activo. Es lo más pedido ("quiero consultar una moneda en particular") y profundiza el tablero que ya tienen. Incluye activos de segundo nivel que hoy no se muestran: contado con liqui, cripto, mayorista, euro, real.
- **Opción B · Comparador de vías de compra.** Su cliente escribe un monto en pesos y ve cuántos dólares obtiene por cada vía disponible: oficial, MEP, tarjeta. Convierte el tablero de consulta en una herramienta de decisión concreta, y es una oportunidad de acercar al cliente a los productos del banco. Es más chica que la A y más cercana a una operación.

[DECIR] "¿Cuál de las dos prioriza para su cliente? Con esa respuesta armo la próxima estimación."

Marca de tiempo: a los 20:00, la pregunta hecha y silencio. Después, preguntas.

---

## Apéndice · Si preguntan

Respuestas de 3-4 líneas. Las primeras siete son las que haría el gerente; las tres últimas, las que suelen venir después.

**¿Esto está en tiempo real?**
No, y el tablero lo dice en cada dato. Las cotizaciones se piden al proveedor como máximo cada minuto y cada tarjeta muestra "hace X min" con la hora del dato, no la hora en que lo pedimos. Tiempo real exigiría fuentes pagas con transmisión continua; para un cliente minorista que mira el dólar varias veces por semana, minutos de demora declarados valen más que segundos sin declarar.

**¿Qué tan atrasado está?**
Cotizaciones: lo que diga la tarjeta, normalmente pocos minutos, según cuándo publicó el proveedor. Noticias: hasta 12 horas, por el plan gratuito; el panel lo avisa y cada nota muestra su hora real. Fuera del horario de mercado no hay atraso que disimular: el tablero dice "último cierre" con día y hora.

**¿Por qué me tendría que fiar de este número?**
Porque cada número dice de dónde viene y de cuándo es, y porque cuando no lo tenemos lo decimos: "no disponible" en vez de un valor inventado. Las fuentes son las mismas que usan los sitios de referencia que su cliente ya mira, con la fuente visible en cada tarjeta. Y porque se probó qué pasa cuando la fuente devuelve basura: el tablero la descarta y avisa.

**¿Qué pasa si la fuente de datos se cae un lunes a las 10?**
Las tarjetas de esa fuente muestran "no pudimos obtener el dato" y "se reintenta cada minuto"; las demás siguen con su valor y su hora. El gráfico y las noticias tienen cada uno su propio aviso, así que una fuente caída nunca tira todo el tablero. Pasó en producción con las noticias el 29/09 y el usuario vio menos notas con un aviso, no un error.

**¿Cuánto sale mantener esto con 10.000 usuarios?**
El costo de los datos no crece con los usuarios: el tablero guarda cada respuesta un rato y la comparte entre todos los que miran, así que el proveedor recibe la misma cantidad de consultas con 10 o con 10.000 personas. Los costos fijos para producción son el plan pago de noticias (€49,99/mes) y pasar el alojamiento a un plan comercial [a verificar el precio del plan de Vercel según el uso del banco]. Lo que sí hay que decidir antes de escalar es una fuente de cotizaciones con contrato.

**¿Por qué no hiciste la otra funcionalidad?**
Porque con el presupuesto entraba una funcionalidad hecha y bien probada, y elegí la que se calcula con datos que ya están en el tablero y responde la pregunta que el usuario argentino se hace solo: cuánto se aleja cada dólar del oficial. El detalle por activo quedó especificado, con criterios de aceptación escritos, para que la próxima iteración arranque sin volver a definirlo. Es la decisión que les pido al final.

**¿Esto lo puede usar mi mamá?**
Es el usuario para el que se diseñó: sin login, una pantalla, y un recorrido de cuatro pasos que se abre solo la primera vez y explica qué es cada cosa. No hay colores de "bueno" o "malo" ni flechas que insinúen qué hacer. Lo que no hicimos es probarlo con usuarios reales de ese perfil: está anotado como pendiente antes de escalar.

**¿Lo puedo usar en el banco tal cual?**
Técnicamente sí, hoy mismo; comercialmente no, por tres cosas que están listadas en riesgos: plan pago del proveedor de noticias, evaluación de una fuente oficial o contratada para las cotizaciones, y revisión del texto de no recomendación por el área legal. Además, el avatar del tutorial se reemplaza por la mascota del banco y el tablero se embebe con la identidad del banco cuando quieran favoritos o alertas.

**¿Qué hace la IA acá?**
En el producto, nada: no hay ningún modelo respondiendo ni clasificando; las noticias se filtran por palabras fijas del título, y así está declarado. La IA se usó para construirlo: como equipo de producto, arquitectura, desarrollo y pruebas con roles separados, con cada decisión y cada corrección anotadas en un registro. Descarté meter IA en el producto por riesgo legal y porque contradice al usuario que quiere ver el dólar de un vistazo.

**¿Por qué un avatar tuyo?**
Para darle entidad al producto en esta demo. Son tres clips cortos, decorativos: no llevan información que no esté en el texto, y quien tiene la animación reducida en su teléfono ve una imagen fija. En el banco se reemplazan por su mascota o se sacan sin tocar la lógica del tutorial; está pensado para eso.

---

## Notas para el guion

- **Noticias en inglés = mercado internacional, no Argentina** (29/09). La búsqueda en inglés trae Fed, Wall Street, FMI y mercados emergentes; los medios en inglés casi no publican sobre Argentina con esas palabras en el título. Alguna nota es de baja calidad (una promocional de cripto entró por "Federal Reserve"). Es el límite del plan gratis de GNews y del filtro por palabras. Decisión: se deja así y se cuenta. Detalle en `riesgos.md`.
- **Las noticias llegan con hasta 12 h de demora** (plan gratis). El panel lo avisa y cada nota dice hace cuánto se publicó; nunca se presentan como última hora.
- **Todas las notas en español son de Clarín.** El plan gratis devuelve las 10 más recientes y el medio que más publica domina. La fuente se ve en cada nota.
- **Lista de noticias completa, sin "ver más"** (29/09). En celular son hasta ~20 notas seguidas. Se evaluó mostrar 8 con un botón "ver más" y se descartó: Mati la ve bien así y no suma alcance.
- **Brecha en panel propio, no superpuesta** (desvío de H1-2 aprobado el 29/09). Dos ejes Y en un mismo gráfico hacen comparar líneas de unidades distintas. Buen ejemplo de "el Tech Lead avisó antes de desviarse".
- **Sin librería de gráficos.** Recharts traía Redux Toolkit y 10 dependencias más para dos líneas.
- **Avatar del tutorial = el Memoji de Mati** (29/09). Le da entidad al producto en la demo, pero en un banco no iría la cara del desarrollador: son tres clips cortos, decorativos (`aria-hidden`), y el banco los reemplaza por su mascota o los saca sin tocar la lógica del tutorial. Tenerlo listo si preguntan "¿esto va a producción así?".
- **Plan B:** ver la sección "Plan B" más abajo.

## Plan B (verificado el 01/10)

**URL:** https://tablero-mercado-git-demo-mock-matias-projects-d0bd5617.vercel.app

**Cómo se usa en la demo:** la demo se hace en producción (https://tablero-mercado.vercel.app) con datos reales. La URL del plan B queda abierta en otra pestaña desde antes de empezar. Si algo falla en vivo (un proveedor caído, GNews sin cuota, la red), se cambia de pestaña y se dice: "uno de los proveedores no responde; paso a la versión con datos de demostración, que es la que ven: tiene el banner". Tiempo: lo que tarda cambiar de pestaña.

**Por qué no se activa cambiando la variable en producción.** La documentación de Vercel dice que un cambio de variables de entorno no se aplica a los deploys existentes, solo a los nuevos: hace falta un redeploy ([Managing environment variables](https://vercel.com/docs/environment-variables/managing-environment-variables)). Activar el mock en producción en plena demo serían 1-2 min muertos y el riesgo de dejar producción en mock después.

**Cómo está armado.** Rama `demo-mock` con el mismo código que `main`. Variables de entorno de Preview atadas solo a esa rama (`USE_MOCK_DATA=true`, `MOCK_SCENARIO=normal`, tipo Config), cargadas con `vercel env add <nombre> preview demo-mock --no-sensitive`. Las variables de "Production and Preview" no se tocaron. Una variable de rama pisa a la de Preview con el mismo nombre ([Preview environment variables](https://vercel.com/docs/environment-variables#preview-environment-variables)). Vercel Authentication está desactivada en el proyecto para que la URL de preview abra sin cuenta de Vercel; no expone nada, porque las claves solo viven en el server y el modo mock no usa ninguna.

**Qué se verificó (01/10, a la noche):**
- Producción en modo real: `diff` entre `/api/quotes` de producción y el de `next dev` local con `USE_MOCK_DATA=true MOCK_SCENARIO=normal`: precios distintos y fechas del 01/10 en producción; el mock tiene el reloj del fixture (28/09). El código solo activa el mock con `USE_MOCK_DATA === 'true'` (`src/lib/data.ts`).
- URL del plan B en ventana privada: abre sin login, con el banner "Datos de demostración, no reflejan el mercado" y los datos del fixture (blue $ 1.560, riesgo país 609 "dato del 25/09", gráfico hasta el 28/09).
- `diff` entre `/api/quotes` del plan B y el del mock local: vacío.
- Deploy: el push de `demo-mock` no generó un deploy (sin causa verificada); se creó a mano desde Deployments → ⋯ → Create Deployment → `demo-mock`. Tardó 14 s hasta Ready.

**Antes de la demo:**
- Estado al 02/10 (noche): `demo-mock` apunta a `62f9b7c`, con el mismo código que el congelado `4bb415b` (el commit entre los dos es solo docs). Deploy creado a mano y banner verificado en ventana privada: [PENDIENTE: Mati confirma y borra esta marca]. Después de cualquier push a esa rama, Vercel no crea el deploy solo: hay que crearlo a mano (Deployments → ⋯ → Create Deployment → `demo-mock`) y verificar el banner en ventana privada.
- Después de congelar el código, apuntar la rama al commit congelado (`git push origin <hash>:demo-mock`) y, si no aparece un deploy nuevo, crearlo igual que arriba. Verificar el banner en ventana privada.
- No usar `vercel deploy` desde la terminal para esta rama: esos deploys no quedan asociados a la rama y no toman sus variables ([guía de Vercel](https://vercel.com/kb/guide/branch-variables-and-domains-not-linked-to-cli-deployments)).
- Los escenarios `viernes-cerrado` y `sin-oficial` no están en la URL del plan B (solo `normal`); mercado cerrado se muestra con la captura del caso 2 o, si hace falta en vivo, con el plan C.

**Plan C:** mock en local, `USE_MOCK_DATA=true MOCK_SCENARIO=normal npx next dev`, compartiendo pantalla.
