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
- **Plan B:** `USE_MOCK_DATA=true` con banner obligatorio de "Datos de demostración".
