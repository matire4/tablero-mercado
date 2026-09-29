# Producto — Tablero de mercado

Documento de producto del challenge técnico de Rubika (puesto Product Engineer).
Cerrado el 26/09/2026 en la fase Producto. Las decisiones de acá se replican en `CLAUDE.md` y no se reabren sin anotarlo.

---

## 1. Usuario y problema

**Usuario:** cliente minorista argentino de un banco, con ahorros en pesos y dólares, que consulta el mercado varias veces por semana desde el celular o la computadora, sin formación financiera.

**Problema:** la información que le importa (dólar, riesgo país, noticias económicas) está dispersa en sitios distintos, con formatos distintos y sin saber cuán actualizada está. Termina decidiendo con datos viejos o de fuentes que no conoce.

**Qué hace el producto:** un tablero de una pantalla que reúne un conjunto cerrado de cotizaciones argentinas y noticias económicas, muestra de forma clara qué se movió y hace cuánto se actualizó cada dato, y no recomienda nada: la decisión es del usuario. Es un widget (análogo a la pantalla de cotizaciones de un exchange): muestra y destaca, no aconseja.

**Fuera de alcance:** login, datos personales, integración con home banking, alertas, operaciones, interpretación de noticias.

### Usuario alternativo evaluado y descartado

**Operador interno de tesorería / administración** (persona del área administrativa que necesita tipos de cambio de referencia para valuar, facturar o cerrar el mes). Se descartó porque prioriza activos distintos (oficial BNA divisa, mayorista, MEP), necesita valor de cierre por fecha con fuente auditable y le da poco valor a noticias y disclaimer. Servir a los dos usuarios con 25-30 horas implicaba hacer la mitad de cada tablero. Queda documentado como segmento para una fase posterior.

---

## 2. Supuestos y preguntas al cliente

No hay un enunciado formal más allá de la consigna general (tablero de cotizaciones + histórico + noticias). Todo lo que sigue sale de preguntas hechas a Rubika y de supuestos propios. La comunicación de estos supuestos es parte del entregable.

### Preguntas enviadas y respuestas

| # | Fecha | Pregunta | Respuesta | Decisión tomada |
|---|---|---|---|---|
| 1 | Día 0 | ¿Hay que usar el stack técnico que me recomendaron en su momento? | No es necesario; se evalúa la defensa de la elección. | Next.js + Vercel, claves solo en server. |
| 2 | Día 0 | ¿Mercado global o argentino? | Con argentino basta. | Solo activos argentinos. Noticias locales e internacionales. |

### Supuestos propios (no confirmados por el cliente)

| # | Supuesto | Por qué se asumió así | Qué cambiaría si es falso |
|---|---|---|---|
| S1 | El tablero es una app standalone que el banco puede embeber después; no se integra hoy al home banking. | Integrar implica autenticación y sesión del banco: fuera de presupuesto y no evaluado. | Habría que sumar identidad y sesión; cambia arquitectura. |
| S2 | Sin login ni datos personales. | No hay nada del usuario que proteger o personalizar; la seguridad relevante es de claves y de datos de terceros. | Favoritos/alertas pasarían a ser viables. |
| S3 | Datos con demora aceptada (minutos), siempre mostrando hace cuánto se actualizó cada uno. | Fuentes gratuitas no son tiempo real; la honestidad sobre la antigüedad es la feature de confianza. | Se necesitarían fuentes pagas y streaming. |
| S4 | Uso mixto: vistazo rápido en celular y consulta en escritorio. Responsive obligatorio. | El cliente pidió UX/UI óptima en ambos. | — |
| S5 | UI en español rioplatense. | Usuario minorista argentino. | Cambiar textos; no cambia alcance. |
| S6 | Ventana de mercado única y simplificada: lunes a viernes, 10 a 18 hs Argentina, más feriados nacionales. | Cada activo tiene horario distinto (rueda, blue, Wall Street); una ventana única es la simplificación defendible en este plazo. | Ventanas por activo quedan en próximos pasos. |

---

## 3. Activos del tablero (lista cerrada)

Basado en un relevamiento rápido de lo que publican los sitios de referencia argentinos (Dolarito, Ámbito, calculador.ar) y del ranking de instrumentos más operados (Balanz, agosto 2026).

**Primer vistazo (tarjetas):**
1. Dólar blue
2. Dólar MEP
3. Dólar oficial
4. Dólar tarjeta
5. Riesgo país

**Segundo nivel (solo dentro de la feature 2, "detalle por activo"):** CCL, cripto, mayorista, euro, real.

### Activos evaluados y dejados afuera

| Activo | Motivo |
|---|---|
| Merval | Estuvo en la lista de primer vistazo y se sacó: requiere un segundo proveedor con API key y límites de uso, suma 2-4 horas y riesgo alto por un dato que el minorista mira menos que el dólar. Queda en próximos pasos. |
| Acciones GGAL / YPFD / MELI | Mismo proveedor que Merval; misma razón. |
| CEDEARs individuales | Son los instrumentos de mayor volumen real, pero el minorista sin formación no los reconoce salvo MELI. |
| Bonos (AL30, GD41) | Alto volumen, baja lectura para el usuario definido. |
| BTC | Referencia cultural más que operativa para este usuario; el "dólar cripto" lo cubre en parte. |

---

## 4. Funcionalidades

### Alcance base (se implementa, no cuenta como feature)

- Tablero con las 5 tarjetas: valor, variación del día, "actualizado hace X min".
- Gráfico histórico: línea de venta, un activo por vez, selector 7 / 30 / 90 días. Se eligió línea simple (no velas, no comparación multi-activo, no variación porcentual) porque es lo que el usuario ya sabe leer.
- Tablero de noticias económicas locales e internacionales, filtradas por temas fijos (dólar, BCRA, Fed, inflación, riesgo país, mercados). Cada nota con título, fuente, fecha, idioma y link. No afirma qué noticia impacta a qué precio.
- Cuatro estados de interfaz, visibles y distintos: carga, error, sin datos y **mercado cerrado**.
- Estado mercado cerrado: fuera de la ventana de mercado (S6) cada tarjeta mantiene el último valor conocido y muestra "Último cierre: día y hora" en lugar de "actualizado hace X". La app sigue consultando las fuentes; solo cambia cómo presenta la antigüedad del dato.
- Disclaimer visible sin scroll: la información no constituye recomendación de inversión.
- Modo mock con datos guardados (plan B de la demo y base de tests).
- Responsive.

### Feature 1 — Brecha cambiaria (se implementa)

Cada dólar paralelo (blue, MEP, tarjeta) muestra su diferencia porcentual contra el oficial, y el gráfico histórico superpone la evolución de esa brecha cuando el activo seleccionado es un paralelo. Convierte cinco precios en una lectura: "el blue subió" pasa a ser "el blue se despegó del oficial". No usa colores ni íconos de "bueno/malo": muestra, no recomienda.

Por qué esta: entra en presupuesto (2-3 h), se calcula con datos que ya están en el tablero, y es el análisis que un usuario argentino hace de cabeza.

### Feature 2 — Detalle por activo (solo especificada)

Ficha por activo con compra y venta, variación día/semana/mes, histórico de 90 días, brecha si aplica, y noticias relacionadas por coincidencia de palabras clave en el título (marcadas como coincidencia aproximada). Incluye los activos de segundo nivel.

Por qué se especifica y no se implementa: 5-7 h, y depende de un histórico por activo y de un matching de noticias que son frágiles. Es la evolución natural del tablero y la más pedida ("quiero consultar una moneda en particular").

### Candidatas evaluadas y descartadas

| Feature | Horas | Motivo del descarte |
|---|---|---|
| Comparador "¿por dónde me conviene comprar?" (monto en pesos → dólares por cada vía) | 3-4 | Buena idea de cross-sell para el banco, pero como feature "solo especificada" queda chica y como implementada desplaza a la brecha. Próximos pasos. |
| Merval + acciones GGAL / YPFD / MELI | 5-8 | Segundo proveedor con key y límites; riesgo alto por un dato secundario para el usuario. |
| Cierre del día exportable (tabla por fecha, fuente, hora, CSV) | 3-5 | Es la feature del usuario administrativo, que se descartó. Meterla forzaría el perfil contable sobre el usuario elegido. Evolución para otro segmento. |
| Favoritos / alertas de precio | 6-10 | Requiere identidad y persistencia; contradice "sin login". Sería lo primero a pedir si el banco embebe con identidad propia. |
| Noticias con relevancia causal por activo ("esta nota afecta al dólar") | 3-5 | Ninguna fuente gratuita lo da: habría que clasificar con palabras clave (impreciso) o con un modelo (costo, latencia, otro proveedor). Además es interpretar el mercado, y el widget no interpreta. Queda como aproximación por palabras clave dentro de la feature 2. |
| Asistente de IA conversacional sobre el tablero | 5-6 mínimo | Descartado por estos motivos, en este orden: (1) contradice al usuario y al problema: un minorista que quiere ver el dólar de un vistazo; un chat es lo opuesto a un vistazo. (2) Riesgo legal no mitigable en este plazo: un modelo respondiendo sobre dólar y bonos a un cliente de un banco va a producir en algún momento algo que suene a recomendación de inversión; el disclaimer no alcanza, requiere guardrails, evaluación de respuestas y revisión legal. (3) Costo y dependencia: una clave más, otro límite de uso, costo por consulta que escala con los usuarios y latencia de varios segundos en un producto cuyo valor es la inmediatez. (4) Esfuerzo: 5-6 horas mínimas que salen de testing, documentación y ensayo de demo. |

---

## 5. Historias de usuario

### H0 · Alcance base: tablero de un vistazo

**Como** cliente minorista del banco, **quiero** ver en una pantalla las cotizaciones del dólar que me importan, el riesgo país, su evolución reciente y las noticias económicas del día, **para** saber cómo está el mercado sin recorrer varios sitios ni dudar de cuán actualizado está cada dato.

Criterios de aceptación:

1. **Given** las fuentes responden, **when** abro el tablero, **then** veo 5 tarjetas (blue, MEP, oficial, tarjeta, riesgo país) con valor, variación del día, "actualizado hace X min", y el disclaimer de no recomendación visible sin scroll.
2. **Given** las fuentes responden, **when** toco una tarjeta, **then** el gráfico muestra la serie de venta de ese activo con selector 7 / 30 / 90 días.
3. **Given** las fuentes responden, **when** miro el tablero de noticias, **then** cada nota tiene título, fuente, fecha, idioma y link, y pertenece a los temas fijos definidos.
4. **Given** es sábado, domingo o feriado nacional, **when** abro el tablero, **then** cada tarjeta muestra el último valor conocido con "Último cierre: día y hora" y ningún indicador de error.
5. **Given** un proveedor falla (timeout, HTTP 429 o respuesta vacía), **when** abro el tablero, **then** las tarjetas de ese proveedor muestran estado de error con leyenda propia, las demás siguen funcionando, y no se muestra ningún valor inventado.
6. **Given** el histórico de un activo viene vacío, **when** toco su tarjeta, **then** el gráfico muestra "sin datos para este período", distinto del estado de error.
7. **Given** abro desde un celular, **when** cargo el tablero, **then** las tarjetas se apilan, el gráfico es legible sin zoom y nada queda cortado.

Definition of Done: los 7 criterios verificados a mano en la URL pública y en modo mock; los cuatro estados (carga, error, sin datos, mercado cerrado) visibles y distintos; tests de adaptadores en verde; sin claves en el cliente ni en el historial de git; README permite levantar el proyecto en local.

### H1 · Feature 1: brecha cambiaria (se implementa)

**Como** cliente minorista, **quiero** ver cuánto se aleja cada dólar paralelo del oficial, en porcentaje y en el tiempo, **para** entender si un movimiento de precio es normal o una anomalía, sin que nadie me diga qué hacer.

Criterios de aceptación:

1. **Given** oficial y blue/MEP/tarjeta tienen valor, **when** miro sus tarjetas, **then** cada una muestra "Brecha vs oficial: +X %", calculada sobre el precio de venta, con un decimal.
2. **Given** selecciono blue, MEP o tarjeta en el gráfico, **when** miro la serie, **then** veo la brecha del período como serie superpuesta con su propia escala y leyenda.
3. **Given** selecciono oficial o riesgo país, **when** miro el gráfico, **then** no aparece la brecha ni un espacio vacío donde iría.
4. **Given** el oficial no tiene valor (error o vacío), **when** miro las tarjetas, **then** la brecha muestra "no disponible" y el precio del activo sigue visible.
5. **Given** es mercado cerrado, **when** miro la brecha, **then** se calcula sobre los últimos valores conocidos y lleva la misma leyenda de último cierre.

Definition of Done: criterios verificados en URL pública y en modo mock; cálculo cubierto por test unitario con casos normal, oficial ausente y valores iguales (brecha 0); la brecha nunca se presenta como recomendación (sin colores "bueno/malo", sin flechas de acción).

### H2 · Feature 2: detalle por activo (solo especificada)

**Como** cliente minorista, **quiero** abrir un activo y ver su ficha completa, **para** consultar una moneda en particular con más profundidad que el vistazo.

Criterios de aceptación:

1. **Given** el activo tiene datos, **when** abro su detalle, **then** veo compra y venta, variación día/semana/mes, histórico de 90 días y su brecha si aplica.
2. **Given** el activo tiene datos, **when** miro "noticias relacionadas", **then** veo las notas del tablero cuyo título contiene las palabras clave del activo, marcadas como "coincidencia aproximada".
3. **Given** el activo no tiene histórico, **when** abro su detalle, **then** la ficha muestra los datos actuales y "sin histórico disponible" en lugar del gráfico.
4. **Given** el proveedor falla, **when** abro el detalle, **then** veo estado de error y un botón para volver al tablero.
5. **Given** ninguna noticia coincide, **when** miro la sección, **then** dice "sin noticias relacionadas hoy"; no queda vacía.

Definition of Done (para cuando se implemente): criterios verificables; matching por palabras clave documentado como aproximación; ninguna afirmación causal entre noticia y precio.

---

## 6. Próximos pasos (fuera de este challenge)

En orden de valor para el cliente:

1. **Detalle por activo** (feature 2, ya especificada).
2. **Comparador de vías de compra** (monto en pesos → dólares por cada vía).
3. **Embeber en el home banking**: la app está pensada sin login y sin datos personales para que la identidad la aporte el banco.
4. **Favoritos y alertas**, una vez que exista identidad.
5. **Merval y acciones**, con evaluación de proveedor, costo y límites.
6. **Ventanas de mercado por activo** en lugar de la ventana única.
7. **Cierre del día exportable** para un segmento administrativo.
8. **Asistente de IA conversacional**, solo en una fase con revisión legal, guardrails, evaluación de respuestas y presupuesto propio.
