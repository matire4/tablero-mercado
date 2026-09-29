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
| Tests Vitest + MSW (timeout, 429, vacío) sobre adaptadores | 2 – 2.5 | | | |
| 1 test Playwright happy path | 0.5 – 1 | | | |
| testing.md: plan + 3 casos documentados + evidencia | 1 – 1.5 | | | |
| bug-report.md | 0.5 | | | |
| riesgos.md (matriz) | 0.5 – 1 | | | |
| estimaciones.md: completar real y desvíos | 0.5 | | | |
| uso-de-ia.md | 0.5 – 1 | | | |
| demo.md: guion con minutos + apéndice técnico | 1 – 1.5 | | | |
| Ensayo con chat Cliente, dos veces | 1 – 1.5 | | | |
| Cierre: plan B en URL pública, revisión de /docs, chequeo de claves en git | 0.5 | | | |
| **Subtotal no desarrollo** | **13.5 – 19** | | | Se completa al cerrar cada entregable. |

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

No se agrega a la columna "Estimado" de las tablas de arriba porque esa columna está congelada; se registra acá para que el desvío total se lea completo y con su causa.

## Cómo se completa el real

Una línea por sesión en `docs/horas.md` (fecha, entregable, horas, nota). Al cerrar cada entregable, la suma va a la columna "Real" de acá con una frase de explicación del desvío, positiva o negativa. No se reconstruye al final.
