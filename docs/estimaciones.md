# Estimaciones — estimado vs real

**Estimado congelado el 26/09/2026** (fase Producto, antes de escribir código). La columna "Estimado" no se modifica más. "Real" y "Desvío" se completan al cerrar cada entregable a partir de `docs/horas.md`.

Criterio de estimación: rango pesimista honesto, horas de trabajo propio. El presupuesto del challenge es 25-30 h en 10 días; el escenario realista declarado desde el día 1 es **30-32 h**, porque no todo sale en el piso del rango. Ver al final el alcance agregado después de congelar, que lo lleva a 33-36 h.

---

## Desarrollo

| Ítem | Estimado (h) | Real (h) | Desvío | Explicación |
|---|---|---|---|---|
| Scaffold Next.js + deploy "hola" en Vercel | 0.5 – 1 | | | |
| Tipos propios + adaptadores (DolarAPI; ArgentinaDatos: riesgo país, histórico, feriados; noticias) | 2.5 – 3.5 | | | |
| Route handlers proxy + cache (60 s cotizaciones, 15 min noticias) | 1 – 1.5 | | | |
| Modo mock + fixtures (plan B y base de tests) | 0.5 – 1 | | | |
| Tablero: 5 tarjetas, estados carga/error/sin datos, "actualizado hace X", disclaimer, responsive | 2.5 – 3.5 | | | |
| Gráfico histórico: línea de venta, 7/30/90, un activo por vez | 1.5 – 2 | | | |
| Tablero de noticias (fuente, fecha, idioma, link, temas fijos) | 1 – 1.5 | | | |
| Estado mercado cerrado (ventana única + feriados + "último cierre") | 1 – 1.5 | | | |
| Feature 1: brecha cambiaria (% en tarjeta + serie superpuesta en gráfico) | 2 – 3 | | | |
| Feature 2: detalle por activo | 0 (solo spec) | | | Su costo está en Producto. |
| README + .env.example | 0.5 | | | |
| **Subtotal desarrollo** | **13 – 19** | | | Se completa al cerrar el desarrollo. |

## Producto, calidad, documentación y demo

| Entregable | Estimado (h) | Real (h) | Desvío | Explicación |
|---|---|---|---|---|
| Día 0: respuesta al mail, repo, .gitignore, horas.md, ai-log.md, registro en APIs | 0.5 – 1 | 1 | 0 (techo del rango) | Solo la respuesta al mail con preguntas y fecha de entrega (28/09). El repo y el registro en APIs se hicieron en las sesiones de arquitectura y están contados ahí. |
| Producto: chat PO, producto.md, estimaciones.md, CLAUDE.md, spec de feature 2 | 4 – 5 | 4.5 *(aprox.)* | 0 (dentro del rango) | Dos sesiones (25 y 26/09) anotadas de memoria. No incluye la revisión del 29/09 para reflejar los desvíos de desarrollo. |
| arquitectura.md con diagrama | 1 – 1.5 | 3 *(aprox.)* | +1.5 a +2 | Hubo dos versiones: v1 el 27/09 (estructura, tipos, contratos) y v2 el 28/09 reescrita con los formatos reales tras verificar cada API con curl. Esa sesión incluyó además los curls, los crudos en `raw/`, la cuenta de GNews y el `.env.local`, que el estimado tenía repartidos en "Día 0". Aun descontando eso, el doc se subestimó: se estimó como un diagrama y fue el lugar donde se decidió cache, brecha, variación del día y cuota de noticias. |
| Tests Vitest + MSW (timeout, 429, vacío) sobre adaptadores | 2 – 2.5 | 0.15 *(aprox.)* de QA + lo escrito en desarrollo, sin separar | No medible (solo QA: −1.85 a −2.35) | Los 85 unitarios con MSW (timeout, 429, vacío, corte a mitad de la lectura) se escribieron junto con cada adaptador y están dentro de las líneas de Desarrollo del 28/09, que no separan código de tests. QA sumó 2 en la sesión del 30/09. El trabajo no se ahorró: cambió de fila. Los unitarios de los arreglos (hasta llegar a 98) están en las líneas del Tech Lead. |
| 1 test Playwright happy path | 0.5 – 1 | 1 (0.75 + 0.25 *(aprox.)*) | 0 (techo del rango) | El estimado era un test del happy path; hay 27 + 1 salteado. 0,75 h el 29/09 (Tech Lead, 11 e2e por criterio de aceptación; `horas.md` lo anota como Calidad) y ~0,25 de QA el 30/09 (4 e2e × 2 viewports para error, mercado cerrado y sin datos, que ningún test dibujaba). Los del tutorial y los de los arreglos están en sus propias líneas. Entró más cobertura en el mismo tiempo porque el e2e corre en modo mock, con los fixtures que ya existían. |
| testing.md: plan + 3 casos documentados + evidencia | 1 – 1.5 | 1.65 *(aprox.)* | +0.15 a +0.65 | 0,9 de la sesión del 30/09 (plan, cobertura por criterio, casos 2 y 3 con evidencia, revisión de código con 7 hallazgos) más tres verificaciones de arreglos de 0,25 cada una (30/09 dos veces y 01/10), que el estimado no preveía: cada arreglo del Tech Lead volvió a QA, y cada verificación encontró un hallazgo nuevo (#8; #9 y #10; #11). Falta el caso 1, que hace Mati en horario de mercado. |
| bug-report.md | 0.5 | 0.2 *(aprox.)* | −0.3 | Solo la redacción. El diagnóstico (descartar hipótesis con el dashboard de GNews y los logs de Vercel) está contado en testing.md (caso 3), y la verificación del arreglo, en la del 30/09 a la noche. Bug real, no simulado (BUG-01). |
| riesgos.md (matriz) | 0.5 – 1 | 0.33 | −0.17 a −0.67 | 20 min de la sesión del 01/10, que incluye además este cierre. Quedó por debajo porque las 10 entradas se anotaron en caliente durante el desarrollo (en las líneas del Tech Lead) y la revisión de código ya estaba hecha: la matriz fue agruparlas, puntuarlas y comprobar cada mitigación en el código. |
| estimaciones.md: completar real y desvíos | 0.5 | | | |
| uso-de-ia.md | 0.5 – 1 | | | |
| demo.md: guion con minutos + apéndice técnico | 1 – 1.5 | | | |
| Ensayo con chat Cliente, dos veces | 1 – 1.5 | | | |
| Cierre: plan B en URL pública, revisión de /docs, chequeo de claves en git | 0.5 | | | |
| **Subtotal no desarrollo** | **13.5 – 19** | | | Se completa al cerrar cada entregable. |

**Cómo se repartió Calidad (cierre de QA, 01/10).** `horas.md` tiene 7,08 h anotadas como Calidad. En las filas de arriba van solo 3,33 h: las de QA y las 0,75 h del e2e del 29/09. La sesión de QA del 30/09 (1,5 h, sin reloj) se repartió por lo que produjo, con el visto bueno de Mati: 10 % unitarios, 15 % e2e, 60 % testing.md, 15 % bug-report.md (0,15 / 0,25 / 0,9 / 0,2, redondeado para que sume 1,5). **Los arreglos de los hallazgos (Tech Lead, 3,75 h: 30/09 2,25 y 0,25; 01/10 1 y 0,25) no son trabajo de QA y no están en ninguna fila:** el estimado congelado no preveía ciclos de arreglo y verificación. Las 5 filas de calidad suman 4,5 – 6,5 h estimadas contra 7,08 h de Calidad en total: el desvío sale entero de los arreglos.

## Total

| | Estimado (h) | Real (h) |
|---|---|---|
| Desarrollo | 13 – 19 | |
| No desarrollo | 13.5 – 19 | |
| **Total** | **26.5 – 38** | |
| **Escenario realista declarado** | **30 – 32** | |
| **Escenario realista con alcance agregado (28/09)** | **33 – 36** | |

---

## Palancas de recorte (no aplicadas al congelar)

El checklist propio asignaba 10-12 h a desarrollo; el alcance base cerrado no entra ahí ni en el escenario optimista. Se decidió congelar sin recortes y dejar estas palancas escritas. Si el desarrollo se desvía, se activan en este orden y se anota en `horas.md` y `ai-log.md`:

1. Brecha solo como porcentaje en tarjeta, sin serie en el gráfico: −1 h. *(Desde el 29/09 la serie va en un panel propio, no superpuesta; la palanca es la misma.)*
2. Selector 7/30 sin 90 días: −0.5 h.
3. Mercado cerrado sin feriados (solo fin de semana y horario): −0.5 h; feriados pasan a próximos pasos.

Con las tres, desarrollo queda en 11-17 h.

## Alcance agregado después de congelar

| Fecha | Qué se agregó | Horas | Efecto |
|---|---|---|---|
| 28/09 | Alcance de diseño (ver `producto.md` §4): tema claro/oscuro, animación de entrada, tarjetas escalonadas, gráfico que se dibuja al cambiar, tabla accesible, tutorial de 4 pasos. Aceptado con su costo tras aprobar el mockup. | 3 – 4 | Desarrollo pasa a 16 – 23 h; escenario realista total pasa de 30-32 a **33 – 36 h**. |
| 29/09 | Avatar en el tutorial: el Memoji de Mati saluda en una bienvenida (Empezar / Saltar) y explica cada paso en un globo; en escritorio, busto animado que viaja entre pasos y "habla"; en celular, círculo; tests ajustados. Pedido de Mati después de ver el tutorial base; se anota para medir el desvío. Primero 1,5 – 2 h; subió a 2 – 2,5 h al pedir el busto animado en escritorio (29/09). | 2 – 2.5 | Desarrollo pasa a 18 – 25.5 h; escenario realista total pasa a **35 – 38.5 h**. Si se pasa, se anota el desvío acá y en `horas.md`. |
| 29/09 | Avatar, tercera vuelta: fondo transparente (segmentación cuadro por cuadro), globo de cómic y celular con Mati asomando desde abajo. Pedido de Mati después de ver la versión en video; el avatar ya estaba en el techo (2,5 h). Desvío aceptado por Mati. | 1.5 – 2 | Desarrollo pasa a 19.5 – 27.5 h; escenario realista total pasa a **36.5 – 40.5 h**. |
| 01/10 | Avatar con video nuevo: "que hable y señale" (pendiente opcional del 29/09) con un video de Kling de Mati; 3 clips que quedan en su último cuadro, y arreglo del salto al terminar el saludo. Decidido por Mati al mandar el video. Real ~1 h (ver `horas.md`). | ~1 | Desarrollo pasa a 20,5 – 28,5 h; escenario realista total pasa a **37,5 – 41,5 h**. |

No se agrega a la columna "Estimado" de las tablas de arriba porque esa columna está congelada; se registra acá para que el desvío total se lea completo y con su causa.

## Cómo se completa el real

Una línea por sesión en `docs/horas.md` (fecha, entregable, horas, nota). Al cerrar cada entregable, la suma va a la columna "Real" de acá con una frase de explicación del desvío, positiva o negativa. No se reconstruye al final.
