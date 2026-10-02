# Demo

El guion con minutos y el apéndice técnico se escriben en la fase de demo. Mientras tanto, esta sección junta lo que conviene contar, anotado cuando aparece.

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
- Estado al 02/10: `demo-mock` apunta a `37f7cb7`, con el mismo código que `db46eb5` (los commits entre los dos son solo docs). Después de cualquier push a esa rama, Vercel no crea el deploy solo: hay que crearlo a mano (Deployments → ⋯ → Create Deployment → `demo-mock`) y verificar el banner en ventana privada.
- Después de congelar el código, apuntar la rama al commit congelado (`git push origin <hash>:demo-mock`) y, si no aparece un deploy nuevo, crearlo igual que arriba. Verificar el banner en ventana privada.
- No usar `vercel deploy` desde la terminal para esta rama: esos deploys no quedan asociados a la rama y no toman sus variables ([guía de Vercel](https://vercel.com/kb/guide/branch-variables-and-domains-not-linked-to-cli-deployments)).

**Plan C:** mock en local, `USE_MOCK_DATA=true MOCK_SCENARIO=normal npx next dev`, compartiendo pantalla.
