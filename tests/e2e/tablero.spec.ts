import { expect, test } from '@playwright/test';

// Happy path en modo mock (MOCK_SCENARIO=normal) + un proveedor caído.
// Cada test dice qué criterio de aceptación de docs/producto.md cubre.

test.beforeEach(async ({ page }) => {
  // La entrada "puertas" y el tutorial tapan la pantalla la primera vez: se marcan como vistos
  // para que estos tests miren el tablero directo. El tutorial tiene su propio test.
  await page.addInitScript(() => {
    sessionStorage.setItem('intro-seen', '1');
    localStorage.setItem('tutorial-seen', '1');
  });
  await page.goto('/');
});

test('H0-1 · cinco tarjetas con valor, hora del dato y disclaimer sin scroll', async ({ page }) => {
  await expect(page.getByRole('note').filter({ hasText: 'Datos de demostración' })).toBeVisible();

  const cards = page.locator('.card');
  await expect(cards).toHaveCount(5);
  await expect(page.locator('.card .card-value')).toHaveCount(5); // ninguna en error ni cargando
  for (const label of ['Blue', 'MEP', 'Oficial', 'Tarjeta', 'Riesgo país']) {
    await expect(cards.filter({ has: page.locator('.card-head b', { hasText: new RegExp(`^${label}$`) }) })).toHaveCount(1);
  }
  await expect(page.locator('.card .card-time').first()).toHaveText(/hace|recién|dato del|último cierre/);

  const disclaimer = page.getByText('No es recomendación de inversión');
  await expect(disclaimer).toBeInViewport();
});

test('H1-1 · los paralelos muestran brecha vs oficial; oficial y riesgo país no', async ({ page }) => {
  const card = (label: string) => page.locator('.card').filter({ has: page.locator('.card-head b', { hasText: new RegExp(`^${label}$`) }) });
  for (const label of ['Blue', 'MEP', 'Tarjeta']) {
    await expect(card(label).locator('.chip')).toHaveText(/^Brecha [+−]?\d+,\d %$/);
  }
  await expect(card('Oficial').locator('.chip')).toHaveText('Referencia para la brecha');
  await expect(card('Riesgo país').locator('.chip')).toHaveText('Sin brecha');
});

test('H0-2 + H1-2/H1-3 · el gráfico cambia de activo y rango; panel de brecha solo en paralelos', async ({ page }) => {
  const chart = page.getByRole('region', { name: 'Evolución' });
  const activo = chart.getByRole('tablist', { name: 'Activo' });

  await activo.getByRole('tab', { name: 'MEP' }).click();
  await expect(chart.locator('.chart-svg')).toBeVisible();
  await expect(chart.locator('.line.gap')).toHaveCount(1);
  await expect(chart.locator('.chart-legend').getByText('Brecha vs oficial (%)')).toBeVisible();

  await chart.getByRole('tablist', { name: 'Período' }).getByRole('tab', { name: '7 d' }).click();
  await expect(chart.getByRole('tab', { name: '7 d' })).toHaveAttribute('aria-selected', 'true');
  await expect(chart.locator('.chart-svg')).toBeVisible();

  await activo.getByRole('tab', { name: 'Oficial' }).click();
  await expect(chart.locator('.chart-svg')).toBeVisible();
  await expect(chart.locator('.line.gap')).toHaveCount(0);
  await expect(chart.getByText('Brecha vs oficial (%)')).toHaveCount(0);
});

test('H0-3 · noticias con título-link, fuente, fecha, idioma y tema', async ({ page }) => {
  const news = page.getByRole('region', { name: 'Noticias' });
  // Esperar notas reales: el esqueleto de carga también usa .news-item.
  const items = news.locator('.news-item').filter({ has: page.locator('.news-link') });
  await expect(items.first()).toBeVisible();
  expect(await items.count()).toBeGreaterThan(3);

  const first = items.first();
  await expect(first.getByRole('link')).toHaveAttribute('target', '_blank');
  await expect(first.getByRole('link')).toHaveAttribute('href', /^https?:\/\//);
  await expect(first.locator('time')).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}T/);

  // Local e internacional: el mock trae las dos búsquedas reales.
  await expect(news.locator('.tag', { hasText: /^ES$/ }).first()).toBeVisible();
  await expect(news.locator('.tag', { hasText: /^EN$/ }).first()).toBeVisible();
  await expect(news.getByText('pueden tener hasta 12 h de demora')).toBeVisible();
});

test('H0-5 · si falla el proveedor de noticias, se ve el error y las cotizaciones siguen', async ({ page }) => {
  await page.route('**/api/news', (route) =>
    route.fulfill({ json: { ok: false, error: { kind: 'rate-limited', message: 'HTTP 429' } } }),
  );
  await page.reload();
  const news = page.getByRole('region', { name: 'Noticias' });
  await expect(news.getByRole('alert')).toContainText('No pudimos traer las noticias');
  await expect(news.getByRole('alert')).toContainText('limitó las consultas');
  await expect(page.locator('.card .card-value')).toHaveCount(5);
});

test('H0-7 · en celular no hay scroll horizontal y las tarjetas se apilan', async ({ page }, info) => {
  test.skip(info.project.name !== 'celular', 'solo aplica al viewport de celular');
  await expect(page.locator('.card .card-value')).toHaveCount(5);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
  const xs = await page.locator('.card').evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().x)));
  expect(new Set(xs).size).toBe(1); // una sola columna
});
