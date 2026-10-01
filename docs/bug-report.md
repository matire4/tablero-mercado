# Bug report

## BUG-01 · Una búsqueda de noticias falla en producción y no deja rastro para diagnosticarla

| | |
|---|---|
| **Estado** | **Resuelto en `83587f6`** (30/09) · verificado en producción el 30/09 21:12 hora Argentina · arreglo pedido al Tech Lead el 30/09 (`testing.md` §6, hallazgo #2) |
| **Reportado por** | QA, 30/09/2026 |
| **Detectado** | 29/09/2026 20:02 UTC, mirando la URL pública después del deploy del tutorial |
| **Entorno** | Producción · https://tablero-mercado.vercel.app · Vercel (plan Hobby, Node 24.x) · commit `f21d706` · GNews plan gratis |
| **Componente** | `src/lib/providers/news.ts` (`fetchNews`, `mergeNews`) · `src/app/api/news/route.ts` |
| **Severidad** | **Media.** El usuario no ve nada roto (el panel degrada bien y avisa), pero el equipo quedó sin forma de saber qué pasó. |
| **Prioridad** | **Alta para la entrega.** Es chico de arreglar (~15 min) y sin el arreglo, la próxima falla del proveedor en la demo tampoco va a poder explicarse. |
| **Tipo** | Real, no simulado |

### Resumen

El 29/09 la búsqueda en inglés de GNews falló en producción durante al menos 3 horas. El tablero lo manejó como estaba especificado: mostró las notas en español y el aviso "Una de las fuentes no respondió". Pero cuando se intentó averiguar **por qué** falló, no había ningún dato: la respuesta de `/api/news` no dice qué búsqueda falló ni con qué error, el código no escribe nada en los logs y los logs de Vercel no guardan ese horario. La causa se tuvo que buscar descartando hipótesis, y quedó sin confirmar.

### Pasos para reproducir

Con la falla real (29/09):

1. Abrir https://tablero-mercado.vercel.app y bajar al panel de noticias.
2. `curl -s https://tablero-mercado.vercel.app/api/news` y leer `data.sources`.
3. Buscar la causa: Vercel → proyecto → Logs, filtro `/api/news`.

Reproducible en local, sin gastar cuota:

1. En `tests/unit/providers.test.ts`, caso "una búsqueda falla con 429 y la otra responde": MSW devuelve 429 para `lang=en` y 200 para `lang=es`.
2. Inspeccionar el `Result` que devuelve `fetchNews`: `sources: { ok: 1, total: 2 }`, sin ningún dato del error.
3. Verificar que no se escribió nada en consola: `grep -rn "console\." src/` no encuentra nada.

### Resultado esperado

- El panel muestra lo que llegó y avisa que la lista puede estar incompleta. *(Esto sí pasa.)*
- **Queda registrado qué búsqueda falló y por qué** (idioma y tipo de error: timeout, 429, error HTTP, respuesta inválida), en los logs del server y en la respuesta del endpoint, para diagnosticar con un `curl` sin depender de cuánto duran los logs.

### Resultado real

- 29/09 20:02Z y 23:02Z: `ok: true`, `sources: { ok: 1, total: 2 }`, 10 notas, todas en español.
- El panel mostró "Una de las fuentes no respondió; la lista puede estar incompleta". Las cotizaciones no se vieron afectadas.
- **No hay forma de saber la causa.** La respuesta no identifica la búsqueda ni el error. Los Runtime Logs de Vercel el 30/09 solo muestran los últimos 30 minutos, y aun dentro de esa ventana los contadores de Error y Warning están en 0, porque el código no escribe nada.
- 30/09 15:05Z: `sources: { ok: 2, total: 2 }`, 19 notas. Se recuperó sola, sin cambios de código.

### Diagnóstico hecho (qué se sabe y qué no)

| Hipótesis | Resultado | Evidencia |
|---|---|---|
| Cuota diaria de GNews agotada (100/día) | **Descartada.** 10 requests en todo el 29/09 y 21 en el mes. | `evidencia/gnews-dashboard-dias-30-09.png` |
| GNews rechaza la búsqueda en inglés (query inválida) | **Descartada.** La misma búsqueda respondió bien el 30/09 sin cambios de código. | `/api/news` del 30/09: `sources 2/2` |
| La cache guardó un resultado parcial 45 min | **Descartada.** La Data Cache de Next solo guarda respuestas 200 (`patch-fetch.js`, l. 696) y el route handler manda `no-store` si la lista es parcial. | Código de Next 16 y `api/news/route.ts` |
| Timeout de 5 s o error puntual de GNews (429 por ráfaga, 5xx) | **Posible, no confirmable.** El dashboard de GNews muestra que recibió las dos búsquedas a la hora 23 UTC, así que la request en inglés llegó: la falla estuvo en la respuesta. | `evidencia/gnews-dashboard-horas-30-09.png` |

La causa raíz del incidente queda **sin determinar**. La causa raíz de **no poder determinarla** sí es clara: `mergeNews` se queda solo con los resultados buenos y descarta los errores cuando al menos una búsqueda sale bien, y en ningún punto del camino se escribe un log.

```ts
// src/lib/providers/news.ts, mergeNews (commit f21d706)
const okOnes = results.filter((r) => r.ok);
if (okOnes.length === 0) return results[0];        // solo si fallan TODAS se ve el error
...
return ok({ items, sources: { ok: okOnes.length, total: results.length } });  // el error se pierde
```

### Impacto

- **Usuario:** bajo. Ve menos notas y un aviso honesto.
- **Equipo / operación:** alto. Cualquier falla parcial de GNews es invisible. En un banco, "no sabemos por qué pasó" no es una respuesta aceptable ante un incidente.
- **Relacionado (hallazgo #3, no se arregla ahora):** mientras una búsqueda falla, la falla no se cachea y cada visita vuelve a pedirla a GNews. Sin logs, tampoco se vería que la cuota se está consumiendo más rápido. Ver `riesgos.md`.

### Arreglo propuesto

1. En `fetchNews`, cuando una búsqueda falla, escribir **una línea** con `console.error` con idioma, `kind` y `message`. Nunca la URL, porque lleva la API key.
2. Sumar a la respuesta `sources.failed: [{ lang, kind }]`, sin el mensaje: permite diagnosticar con un `curl` aunque los logs ya no estén.
3. Sin cambios de UI ni de cache.

### Cómo se verifica el arreglo

- Unitario con MSW: con 429 en `lang=en`, `sources.failed` es `[{ lang: 'en', kind: 'rate-limited' }]`, `console.error` se llama una vez y el texto no contiene `apikey`.
- En producción, después del deploy: `curl -s .../api/news` muestra `sources.failed: []` con las dos búsquedas bien.
- Si vuelve a fallar: el `curl` dice qué búsqueda y de qué tipo, y Vercel → Logs muestra la línea `[news]` con el nivel Error.

### Verificación (30/09)

| Dónde | Qué se hizo | Resultado |
|---|---|---|
| Unitario (`providers.test.ts`, `fetchNews con MSW`) | 429 en `lang=en`, 200 en `lang=es` | `sources: { ok: 1, total: 2, failed: [{ lang: 'en', kind: 'rate-limited' }] }`; `console.error` 1 vez, sin `apikey` ni la clave. 90 tests en verde con `npm run check`. |
| Unitario | Las dos búsquedas fallan | `ok: false` con el primer error; 2 líneas de log, una por búsqueda. |
| Unitario | `redactKey` (agregado por decisión de Mati, 30/09) | Un mensaje que trajera la URL sale con `apikey=***`. |
| Local, modo real con clave inválida | `USE_MOCK_DATA=false NEWS_API_KEY=invalida npm run dev` y GET `/api/news` | En la terminal: `[news] búsqueda en es falló: upstream · HTTP 400` y la misma línea para `en`. Sin la clave; el log de fetch de Next también corta la URL. GNews responde 400 (no 401) a una clave inválida. |
| Producción, después del deploy de `83587f6` | `curl -s https://tablero-mercado.vercel.app/api/news` | 2026-10-01 00:12:53Z (30/09 21:12 hora Argentina): `ok: true`, `sources: { ok: 2, total: 2, failed: [] }`, 20 notas. Que aparezca `failed` confirma que corre la versión nueva. |

**Queda sin observar:** la línea `[news]` en los Runtime Logs de Vercel con nivel Error. Solo aparece cuando una búsqueda falla en producción, y desde el deploy no falló ninguna. Si vuelve a fallar: `curl` a `/api/news` → `sources.failed` dice qué búsqueda y de qué tipo; Vercel → Logs muestra la línea con el mensaje, si todavía está dentro de la retención del plan.

La causa raíz del incidente del 29/09 sigue **sin determinar**: el arreglo no la explica hacia atrás, hace que la próxima se pueda explicar.

### Evidencia

- `docs/evidencia/gnews-dashboard-horas-30-09.png`: requests por hora, dos por franja (es + en).
- `docs/evidencia/gnews-dashboard-dias-30-09.png`: 10 requests el 29/09, cuota lejos del límite.
- `docs/evidencia/cache-news-hit-30-09.txt`: cache del CDN funcionando con las dos búsquedas bien.
- `docs/evidencia/caso3-noticias-parcial-escritorio.png`: cómo se ve el panel con la respuesta del 29/09 (reproducción local de esa respuesta).
- `docs/testing.md` §4 caso 3 y §6 hallazgo #2.
