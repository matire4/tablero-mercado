# Uso de IA

Cómo se usó la IA en el challenge, qué prompts pesaron más y dónde se equivocó. Todo sale de `docs/ai-log.md` (diario anotado en el momento, 52 entradas del 25/09 al 02/10), de las decisiones de `CLAUDE.md` y del historial de git. Cada error citado tiene su entrada en `ai-log.md` con la fecha indicada.

## 1. Herramientas y cómo se usaron

Un Project de Claude ("Rubika Challenge") con el PDF del challenge como conocimiento y unas reglas comunes a todos los chats: español rioplatense, Mati decide, la IA propone con trade-offs, no se inventan formatos de APIs y toda corrección se dice explícitamente para anotarla en `ai-log.md`. Dentro del proyecto, un chat por rol: **PO** (producto y estimación), **Tech Lead** (arquitectura y código), **QA** (tests, revisión, riesgos) y **Cliente** (ensayo de la demo). Los chats no se pasan información entre sí: la memoria compartida es el repo. `CLAUDE.md` es la fuente de verdad (estado, decisiones cerradas, restricciones) y cada chat arranca leyéndolo; lo que un rol produce se escribe en `/docs` antes de que lo use otro. Cuando un chat se alargaba, se cerraba y se abría otro con el mismo prompt.

El trabajo sobre el repo se hizo con Claude (Cowork) con la carpeta conectada: lee y escribe código y docs, corre `tsc` y `eslint`; los tests se corren en la Mac de Mati o en un clon aparte, y los commits los hace Mati (regla que quedó después de dos `.git/index.lock` huérfanos, ai-log 29/09 y 30/09). Los mockups se hicieron en Claude Design (aprobado el 28/09 tras dos vueltas, ver §3). El video del avatar del tutorial lo generó Mati con Kling (01/10); antes se había descartado Gemini porque pedía plan pago (ai-log 29/09).

## 2. Prompts clave

### PO: preguntar antes de proponer

> 1. Usuario y problema. Hacete 3 preguntas críticas y proponé dos definiciones alternativas de usuario (por ejemplo: cliente minorista argentino del banco vs. operador interno). Yo elijo. […]
> 3. Estimación. […] Discutimos hasta que la firme; esa versión se congela y no se toca más.

**Por qué así.** Un PO que propone de una da un producto genérico; obligarlo a preguntar y a dar dos alternativas deja la decisión en Mati. Congelar la estimación antes del código hace que el desvío se pueda medir.
**Qué evitó.** El PO dijo antes de congelar que su estimación de desarrollo (13–19 h) no entraba en las 10–12 h del checklist, en vez de acomodar los números; se congeló sin recortes, con escenario realista de 30–32 h y tres palancas de recorte escritas (ai-log 26/09). También señaló él mismo que proponer Merval contradecía un descarte de la misma conversación (ai-log 25/09).

### Tech Lead: arquitectura antes que código, formato de API verificado antes que adaptador

> 1. **Esquema de arquitectura, antes de cualquier código.** […]
> 2. **Verificación de APIs.** Antes de escribir un adaptador, decime qué forma asumís que tiene la respuesta […] y yo la verifico con curl. Los paths de DolarAPI aparecen distintos en dos páginas de su doc: no asumas ninguno.

**Por qué así.** El chat de desarrollo es el que más tienta a avanzar rápido y a inventar campos. Separar el diseño del código y la suposición de la verificación obliga a que cada contrato se apruebe antes de escribirse.
**Qué evitó.** `arquitectura.md` se reescribió el 28/09 con los formatos reales, después de verificar cada API con curl; los adaptadores se escriben contra respuestas guardadas en `src/lib/fixtures/raw/`, no contra la documentación. Ningún formato de respuesta se asumió (ai-log 25/09); por ejemplo, el MEP en DolarAPI se llama `bolsa` (`CLAUDE.md`).

### QA: adversarial y sin el razonamiento de diseño

> Sos mi QA lead y analista de riesgos para el challenge de Rubika. No participaste del desarrollo: tu trabajo es encontrar lo que está mal, no defender lo que se hizo. […] `CLAUDE.md` leelo solo para el estado y las reglas de trabajo: que algo esté "decidido" ahí no prueba que esté bien hecho.

**Por qué así.** Si QA recibe el razonamiento de diseño, lo valida. Recibe historias, código y URL, y tiene que romper.
**Qué evitó.** Encontró que el e2e de H0-6 pasaba en verde mientras el criterio no se cumplía en producción, porque inyectaba una respuesta que el server nunca produce (ai-log 30/09, hallazgo #1); que las fallas de GNews no dejaban rastro (BUG-01); que 7/30/90 días mostraban 8/31/91 (hallazgo #4); y que el criterio H0-4 del PO pedía inventar una hora que el proveedor no da (ai-log 30/09). Cada verificación de un arreglo encontró un hallazgo nuevo (#8 a #11, `testing.md` §6).

## 3. Dónde se equivocó la IA

### Inventó o asumió

- **Variación del día "contra el día hábil anterior"** (Tech Lead, 28/09). La dedujo de un solo histórico (blue); en oficial y MEP el sábado ya trae el cierre del viernes, y el lunes habría mostrado un movimiento que no existió. *Cómo se detectó:* el mismo Tech Lead, al bajar los otros históricos y compararlos. *Qué quedó:* verificar un patrón en todos los activos, no en uno; la regla final compara contra la última entrada anterior a la fecha del dato.
- **"Casi seguro" se agotó la cuota de GNews** (QA, 30/09). Lo afirmó antes de mirar el consumo: el dashboard de GNews mostraba 10 requests ese día, de 100. *Cómo se detectó:* Mati mandó capturas del dashboard. *Qué quedó:* la hipótesis se descartó con evidencia; que la causa no se pudiera determinar se convirtió en el bug real (BUG-01, el error no dejaba rastro).
- **Criterio H0-4 escrito antes de ver los datos** (PO, 26/09; detectado por QA el 30/09). Pedía "último cierre: día y hora" en las 5 tarjetas, pero ArgentinaDatos publica el riesgo país solo con fecha. *Cómo se detectó:* al escribir el e2e de mercado cerrado. *Qué quedó:* un criterio que describe datos se escribe después de ver la respuesta real del proveedor.

- **Un defecto del avatar en Safari que no existía** (Tech Lead, 02/10). Con la descripción de Mati ("en el iPhone queda congelado en el paso 2") propuso una causa (la precarga o la URL repetida gastaban la animación) y un arreglo de ~1 h con URLs `blob:`, como hipótesis probable y sin evidencia. *Cómo se detectó:* antes de tocar código, una página de diagnóstico con seis pruebas aisladas corrida en el iPhone: todas las variantes se movían y todas quedaban quietas al terminar. El "congelado" era el comportamiento especificado el 01/10 en CLAUDE.md: cada clip se reproduce una vez y queda en su último cuadro. *Qué quedó:* antes de buscar la causa de un "se traba", comprobar que el síntoma no sea lo especificado; y ninguna hipótesis sobre el navegador se arregla sin reproducirla primero. Lo que Mati quería era otra cosa, un cambio de diseño (el gesto se repite con pausa), y así se hizo.

### Abstracción de más

- **Recharts "para ahorrar una hora"** (Tech Lead, 29/09). Recomendado sin mirar qué traía: `npm view recharts` mostró 11 dependencias, entre ellas Redux Toolkit, react-redux e immer, para un gráfico de dos líneas. *Cómo se detectó:* Mati preguntó por qué lo recomendaba y se verificó antes de instalar. *Qué quedó:* gráfico en SVG propio y una regla en `CLAUDE.md`: una dependencia entra solo si ahorra más de ~1 h, está mantenida y se anota con el motivo.

### Error de tipo que los tests no vieron

- **`q.updatedAt` sobre un `Result<Quote>`** (Tech Lead, 28/09; el dato estaba en `q.data`). En runtime rompía las tres pruebas de `getQuotes`, pero Vitest no chequea tipos. *Cómo se detectó:* `tsc --noEmit` antes de correr los tests. *Qué quedó:* `tsc` siempre antes de los tests, en el script `npm run check` (que desde el 29/09 corre también lint).

### Diseño

- **Mockups que no eran lo pedido** (Tech Lead, 28/09). Primero uno plano y "cuadrado", después tres paletas pastel; la referencia de Mati era oscura y con movimiento. *Cómo se detectó:* Mati, al ver cada versión. *Qué quedó:* para lo visual, preguntar la referencia (tema, forma, qué se anima) antes de dibujar; la versión siguiente se aprobó.
- **Brecha superpuesta al precio con dos ejes Y** (especificada así en H1-2; cuestionada por el Tech Lead el 29/09). Dos ejes Y hacen comparar líneas de unidades distintas como si compartieran escala. *Cómo se detectó:* el Tech Lead lo avisó antes de implementar, como desvío de una decisión cerrada. *Qué quedó:* panel de brecha propio debajo del precio, aprobado por Mati y anotado en `CLAUDE.md`.

### Datos del proyecto mal copiados

- **Entrega "08/10" en `CLAUDE.md`** (Tech Lead, 29/09). La fecha enviada a Rubika es el miércoles 07/10; el 08/10 era el día 10 contado desde el 28/09. En el mismo archivo, una línea contradecía una decisión cerrada (días hábiles en la variación del día). *Cómo se detectó:* al abrir un chat nuevo de Tech Lead, releyendo `CLAUDE.md` contra el código y el mail. *Qué quedó:* corregido en `CLAUDE.md` y `horas.md`.

### Al revés: donde verificar evitó el error

- **Paths de DolarAPI** (PO, 25/09). Dos páginas de la documentación daban paths distintos; el PO no eligió uno: lo marcó "a verificar con curl" y así pasó al prompt del Tech Lead.
- **Cache de noticias de 20 min** (28/09). El número lo había fijado Mati sin hacer la cuenta; el Tech Lead la hizo al leer la respuesta real de GNews (100 requests/día no alcanzaban ni con una búsqueda por idioma) y se rediseñó: una búsqueda por idioma y cache de 45 min, 64 requests/día.

## 4. Qué aprendí del proceso

1. Los errores más caros de la IA fueron afirmaciones sin mirar (la variación por día hábil, la cuota de GNews, Recharts); las reglas que más rindieron fueron las que obligan a verificar antes: curl antes del adaptador, `tsc` antes del test, `npm view` antes de instalar.
2. Los tests que escribe el mismo rol que escribe el código tienden a describir el código: el e2e de H0-6 y el test de "blue 30 días" pasaban con el error adentro. El rol adversarial, sin el razonamiento de diseño, fue el que los encontró.
3. El alcance creció después de congelar la estimación: diseño (3–4 h, 28/09) y el avatar del tutorial en tres vueltas (29/09 y 01/10). Cada agregado se registró con su costo en `estimaciones.md`, "Alcance agregado después de congelar", en vez de esconderse en las filas congeladas; por eso el total (35,83 h al 01/10; el número vigente está en `docs/horas.md`) se puede explicar línea por línea contra las 28 h del escenario base.
4. El repo como memoria compartida funcionó, pero `CLAUDE.md` se desactualiza solo si nadie lo relee: la fecha de entrega mal copiada y la contradicción sobre días hábiles aparecieron al abrir un chat nuevo.
5. Para lo visual, la IA necesita una referencia y un video, no una descripción y capturas: los mockups necesitaron dos vueltas antes de acertar y el avatar "que parecía mover una hoja de papel" solo se vio en una grabación (ai-log 29/09).
