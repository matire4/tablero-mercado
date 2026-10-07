# Tablero de mercado

Tablero de una pantalla para un cliente minorista argentino: dólar blue, MEP, oficial y tarjeta, riesgo país, su histórico y noticias económicas. Cada dato dice de cuándo es. Muestra y destaca; no recomienda.

**URL pública:** https://tablero-mercado.vercel.app

Challenge técnico de Rubika (Product Engineer). Qué se construye y por qué: [`docs/producto.md`](docs/producto.md).

## Qué hace

- 5 tarjetas con valor, variación del día y "actualizado hace X min" (o "Último cierre: día y hora" con el mercado cerrado).
- **Brecha cambiaria** (feature 1): cada dólar paralelo muestra su distancia porcentual al oficial, y el gráfico la dibuja en un panel propio debajo del precio.
- Gráfico histórico de un activo por vez: 7, 30 o 90 días.
- Noticias en español e inglés sobre temas fijos (dólar, BCRA, Fed, inflación, riesgo país, mercados), con fuente, fecha, idioma y link.
- Estados de carga, error, sin datos y mercado cerrado, distintos entre sí. Si un proveedor falla, el resto del tablero sigue funcionando.
- Tema claro y oscuro. Responsive, pensado primero para celular.

## Correrlo en local

Requisitos: Node.js 22 o superior (Vercel usa 24.x) y npm.

```bash
npm ci
cp .env.example .env.local   # completar NEWS_API_KEY si se quieren noticias reales
npm run dev                  # http://localhost:3000
```

**Modo mock (sin claves):** con `USE_MOCK_DATA=true` el tablero usa datos reales guardados (`src/lib/fixtures/`) y no llama a ninguna API. Muestra un banner de "Datos de demostración" que no se puede ocultar. Es el plan B de la demo y la base de los tests. Se activa en `.env.local` o directo en la línea de comandos (las variables del proceso pisan a `.env.local`):

```bash
USE_MOCK_DATA=true MOCK_SCENARIO=normal npm run dev
```

**Plan B en la URL pública:** https://tablero-mercado-git-demo-mock-matias-projects-d0bd5617.vercel.app es el mismo código en modo mock (rama `demo-mock`). Cómo está armado y por qué no se activa cambiando la variable en producción: [`docs/demo.md`](docs/demo.md), "Plan B".

| `MOCK_SCENARIO` | Qué muestra |
|---|---|
| `normal` | Lunes 28/09 10:00, mercado abierto |
| `viernes-cerrado` | Viernes 25/09 19:30, mercado cerrado: "Último cierre" |
| `sin-oficial` | Falta el dólar oficial: la brecha dice "no disponible" y los precios siguen visibles |

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` / `npm start` | Build y servidor de producción |
| `npm run check` | Tipos (`tsc --noEmit`) + lint + tests unitarios (Vitest + MSW) |
| `npm test` | Solo tests unitarios |
| `npm run test:e2e` | Tests end-to-end con Playwright en modo mock, escritorio y celular (levanta el server solo) |
| `npm run lint` | ESLint |
| `npm run fixtures` | Regenera los fixtures del modo mock desde las respuestas reales en `src/lib/fixtures/raw/` |

## Variables de entorno

Los nombres están en [`.env.example`](.env.example). Ningún valor real va al repo; en producción se cargan en Vercel.

| Variable | Para qué |
|---|---|
| `NEWS_API_KEY` | Clave de GNews. Solo se lee en el server (`src/lib/providers/news.ts`); el navegador nunca la ve. |
| `USE_MOCK_DATA` | `true` sirve fixtures en vez de llamar a las APIs. |
| `MOCK_SCENARIO` | `normal` · `viernes-cerrado` · `sin-oficial`. |

## Stack

- **Next.js 16 (App Router) + TypeScript**, deploy en **Vercel**. Los route handlers (`/api/quotes`, `/api/history/[asset]`, `/api/news`) hacen de proxy: las claves quedan en el server y la cache (60 s cotizaciones, 45 min noticias, 24 h histórico y feriados) protege los límites de uso de cada proveedor.
- **Sin librería de gráficos:** SVG propio. Recharts traía 11 dependencias (Redux Toolkit incluido) para dibujar dos líneas.
- **Sin Tailwind:** un solo `globals.css` con tokens de tema.
- **Tests:** Vitest + MSW para los adaptadores (timeout, 429, respuesta vacía, JSON inválido) y funciones puras (brecha, días hábiles, variación, estado de mercado). Playwright para los e2e: cada test nombra el criterio de aceptación que cubre (H0-1, H1-2…). La primera vez: `npx playwright install chromium`.

**APIs:** [DolarAPI](https://dolarapi.com) (cotizaciones), [ArgentinaDatos](https://argentinadatos.com) (riesgo país, histórico, feriados) y [GNews](https://gnews.io) (noticias, plan gratis: 100 consultas por día y hasta 12 h de demora).

## Cómo leer esta entrega

Todo lo que pide la consigna está en `/docs`. Si tenés poco tiempo, este orden alcanza:

| Pide la consigna | Dónde |
|---|---|
| Usuario y problema; dos funcionalidades con valor y esfuerzo; descartes | [`producto.md`](docs/producto.md) §1, §4 |
| Historias de usuario con Given/When/Then y Definition of Done | [`producto.md`](docs/producto.md) §5 |
| Estimación antes de codear y real vs. estimado con desvíos | [`estimaciones.md`](docs/estimaciones.md) (resumen en "Total") |
| Arquitectura, claves, caché y límites de uso | [`arquitectura.md`](docs/arquitectura.md) |
| Uso de IA: herramientas, prompts clave, errores | [`uso-de-ia.md`](docs/uso-de-ia.md) |
| Plan de testing, tres casos y evidencia | [`testing.md`](docs/testing.md) §1, §4, §8 |
| Bug report | [`bug-report.md`](docs/bug-report.md) |
| Matriz de riesgos | [`riesgos.md`](docs/riesgos.md) |
| Demo y plan B | [`demo.md`](docs/demo.md) |

Sobre los "roles" que aparecen en los docs (PO, Tech Lead, QA, Cliente): son chats de IA separados por función dentro de un mismo proyecto, que trabajé yo. Cuando un doc dice "QA, que no participó del desarrollo", quiere decir un chat que revisó el código sin recibir el razonamiento de diseño. Cómo se usó y dónde se equivocó: `uso-de-ia.md`. Los hashes y números de hallazgo (#1 a #15) son trazabilidad: cada uno lleva a un commit o a una fila de `testing.md` §6.

## Documentación

| Doc | Contenido |
|---|---|
| [`docs/producto.md`](docs/producto.md) | Usuario, problema, supuestos, activos, features, historias de usuario, descartes |
| [`docs/estimaciones.md`](docs/estimaciones.md) | Estimación congelada antes de codear, y real vs. estimado con sus desvíos |
| [`docs/arquitectura.md`](docs/arquitectura.md) | Diagrama, tipos, contratos de la API, cache, mercado cerrado, brecha, noticias, modo mock |
| [`docs/uso-de-ia.md`](docs/uso-de-ia.md) | Herramientas, prompts clave y dónde se equivocó la IA |
| [`docs/ai-log.md`](docs/ai-log.md) | Diario de errores y correcciones de la IA, anotados en el momento |
| [`docs/horas.md`](docs/horas.md) | Registro de horas por sesión |
| [`docs/testing.md`](docs/testing.md) | Plan de pruebas, cobertura por criterio, casos documentados, revisión de código |
| [`docs/bug-report.md`](docs/bug-report.md) | Bug real encontrado en producción (BUG-01), con su arreglo y verificación |
| [`docs/riesgos.md`](docs/riesgos.md) | Matriz de riesgos con mitigación y dónde está en el código |
| [`docs/demo.md`](docs/demo.md) | Guion de la demo y plan B |
| [`docs/evidencia/`](docs/evidencia/) | Capturas y salidas de tests que respaldan `testing.md` |
| [`CLAUDE.md`](CLAUDE.md) | Decisiones cerradas y estado del proyecto (contexto para los agentes de IA) |

## Límites conocidos

- Datos con demora de minutos (fuentes gratuitas); cada dato muestra de cuándo es.
- Ventana de mercado única y simplificada: lunes a viernes de 10 a 18 (hora Argentina), más feriados nacionales.
- Noticias con hasta 12 h de demora; el tema se asigna por palabras del título, que es una aproximación. Las notas en inglés son de mercado internacional; las de español suelen concentrarse en un medio.
- La brecha de la tarjeta es un recargo fijo sobre el oficial, no una brecha de mercado (`docs/riesgos.md` fila 15).
- Alojado en el plan Hobby de Vercel, que es para uso no comercial; producción necesita un plan comercial (`docs/riesgos.md` fila 14).
- Sin integración continua: los tests se corren a mano con `npm run check` y `npm run test:e2e`. `next build` necesita internet por las tipografías de Google.

*La información de este tablero no constituye recomendación de inversión.*
