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

**Sin claves:** con `USE_MOCK_DATA=true` en `.env.local` el tablero usa datos reales guardados (`src/lib/fixtures/`) y no llama a ninguna API. Muestra un banner de "Datos de demostración" que no se puede ocultar. Es el plan B de la demo y la base de los tests.

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
- **Tests:** Vitest + MSW para los adaptadores (timeout, 429, respuesta vacía, JSON inválido) y funciones puras (brecha, días hábiles, variación, estado de mercado).

**APIs:** [DolarAPI](https://dolarapi.com) (cotizaciones), [ArgentinaDatos](https://argentinadatos.com) (riesgo país, histórico, feriados) y [GNews](https://gnews.io) (noticias, plan gratis: 100 consultas por día y hasta 12 h de demora).

## Documentación

| Doc | Contenido |
|---|---|
| [`docs/producto.md`](docs/producto.md) | Usuario, problema, supuestos, activos, features, historias de usuario, descartes |
| [`docs/arquitectura.md`](docs/arquitectura.md) | Diagrama, tipos, contratos de la API, cache, mercado cerrado, brecha, noticias, modo mock |
| [`docs/estimaciones.md`](docs/estimaciones.md) | Estimación congelada antes de codear, y real vs. estimado |
| [`docs/horas.md`](docs/horas.md) | Registro de horas por sesión |
| [`docs/riesgos.md`](docs/riesgos.md) | Riesgos detectados durante el desarrollo |
| [`docs/ai-log.md`](docs/ai-log.md) | Diario de errores y correcciones de la IA, anotados en el momento |
| [`CLAUDE.md`](CLAUDE.md) | Decisiones cerradas y estado del proyecto (contexto para los agentes de IA) |

Plan de pruebas, reporte de bug, uso de IA y guion de demo se suman en la fase de calidad.

## Límites conocidos

- Datos con demora de minutos (fuentes gratuitas); cada dato muestra de cuándo es.
- Ventana de mercado única y simplificada: lunes a viernes de 10 a 18 (hora Argentina), más feriados nacionales.
- Noticias con hasta 12 h de demora; el tema se asigna por palabras del título, que es una aproximación.

*La información de este tablero no constituye recomendación de inversión.*
