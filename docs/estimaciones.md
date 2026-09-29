# Estimaciones — estimado vs real

**Estimado congelado el 26/09/2026** (fase Producto, antes de escribir código). La columna "Estimado" no se modifica más. "Real" y "Desvío" se completan al cerrar cada entregable a partir de `docs/horas.md`.

Criterio de estimación: rango pesimista honesto, horas de trabajo propio. El presupuesto del challenge es 25-30 h en 10 días; el escenario realista declarado desde el día 1 es **30-32 h**, porque no todo sale en el piso del rango.

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
| **Subtotal desarrollo** | **13 – 19** | | | |

## Producto, calidad, documentación y demo

| Entregable | Estimado (h) | Real (h) | Desvío | Explicación |
|---|---|---|---|---|
| Día 0: respuesta al mail, repo, .gitignore, horas.md, ai-log.md, registro en APIs | 0.5 – 1 | | | |
| Producto: chat PO, producto.md, estimaciones.md, CLAUDE.md, spec de feature 2 | 4 – 5 | | | |
| arquitectura.md con diagrama | 1 – 1.5 | | | |
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
| **Subtotal no desarrollo** | **13.5 – 19** | | | |

## Total

| | Estimado (h) | Real (h) |
|---|---|---|
| Desarrollo | 13 – 19 | |
| No desarrollo | 13.5 – 19 | |
| **Total** | **26.5 – 38** | |
| **Escenario realista declarado** | **30 – 32** | |

---

## Palancas de recorte (no aplicadas al congelar)

El checklist propio asignaba 10-12 h a desarrollo; el alcance base cerrado no entra ahí ni en el escenario optimista. Se decidió congelar sin recortes y dejar estas palancas escritas. Si el desarrollo se desvía, se activan en este orden y se anota en `horas.md` y `ai-log.md`:

1. Brecha solo como porcentaje en tarjeta, sin serie superpuesta en el gráfico: −1 h.
2. Selector 7/30 sin 90 días: −0.5 h.
3. Mercado cerrado sin feriados (solo fin de semana y horario): −0.5 h; feriados pasan a próximos pasos.

Con las tres, desarrollo queda en 11-17 h.

## Cómo se completa el real

Una línea por sesión en `docs/horas.md` (fecha, entregable, horas, nota). Al cerrar cada entregable, la suma va a la columna "Real" de acá con una frase de explicación del desvío, positiva o negativa. No se reconstruye al final.
