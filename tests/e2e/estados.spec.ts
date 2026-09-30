import { expect, test, type Page, type Route } from '@playwright/test';
import type { QuotesResponse } from '../../src/lib/types';

// Estados de UI que el happy path no dispara (huecos detectados en QA, 30/09).
// Cada test intercepta la respuesta de /api/* en el navegador: el server sigue en modo mock
// y se modifica solo lo que el criterio necesita. Así se prueba la UI sin tocar proveedores reales.

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('intro-seen', '1');
    localStorage.setItem('tutorial-seen', '1');
  });
});

const card = (page: Page, label: string) =>
  page.locator('.card').filter({ has: page.locator('.card-head b', { hasText: new RegExp(`^${label}$`) }) });

/** Pide la respuesta real (mock) de /api/quotes y la devuelve modificada. */
async function patchQuotes(route: Route, patch: (body: QuotesResponse) => void) {
  const res = await route.fetch();
  const body = (await res.json()) as QuotesResponse;
  patch(body);
  await route.fulfill({ response: res, json: body });
}

test('H0-4 + H1-5 · mercado cerrado: último cierre en cada dólar, brecha visible y ningún error', async ({ page }) => {
  await page.route('**/api/quotes', (route) =>
    patchQuotes(route, (b) => {
      // Sábado 26/09 12:00 hora Argentina; último cierre viernes 25/09 18:00.
      b.market = { isOpen: false, reason: 'weekend', lastCloseAt: '2026-09-25T21:00:00.000Z', holidaysSource: 'live' };
    }),
  );
  await page.goto('/');

  await expect(page.getByRole('status').filter({ hasText: 'Mercado cerrado' })).toContainText('vie 25/09 18:00');
  for (const label of ['Blue', 'MEP', 'Oficial', 'Tarjeta']) {
    await expect(card(page, label).locator('.card-value')).toBeVisible();
    await expect(card(page, label).locator('.card-time')).toHaveText('último cierre vie 25/09 18:00');
  }
  // Riesgo país no trae hora: muestra la fecha del dato, no "hace X".
  await expect(card(page, 'Riesgo país').locator('.card-time')).toHaveText(/^dato del \d{2}\/\d{2}$/);
  // H1-5: la brecha se sigue mostrando sobre los últimos valores.
  for (const label of ['Blue', 'MEP', 'Tarjeta']) {
    await expect(card(page, label).locator('.chip')).toHaveText(/^Brecha [+−]?\d+,\d %$/);
  }
  await expect(page.locator('.card.error')).toHaveCount(0);
  await expect(page.locator('.card .card-time', { hasText: /^hace|^recién/ })).toHaveCount(0);
});

test('H0-5 · DolarAPI no responde: los cuatro dólares en error sin valor, riesgo país sigue', async ({ page }) => {
  const err = { ok: false, error: { kind: 'timeout', message: 'Sin respuesta en 5000 ms' } } as const;
  await page.route('**/api/quotes', (route) =>
    patchQuotes(route, (b) => {
      for (const a of ['blue', 'mep', 'oficial', 'tarjeta'] as const) b.quotes[a] = err;
    }),
  );
  await page.goto('/');

  for (const label of ['Blue', 'MEP', 'Oficial', 'Tarjeta']) {
    const c = card(page, label);
    await expect(c).toHaveAttribute('role', 'alert');
    await expect(c).toContainText('No pudimos obtener este dato');
    await expect(c).toContainText('no respondió a tiempo');
    await expect(c.locator('.card-value')).toHaveCount(0);
    await expect(c).not.toContainText('$'); // ningún valor inventado ni anterior
  }
  await expect(card(page, 'Riesgo país').locator('.card-value')).toBeVisible();
});

test('H1-4 · sin oficial: los paralelos muestran precio y "Brecha no disponible"', async ({ page }) => {
  await page.route('**/api/quotes', (route) =>
    patchQuotes(route, (b) => {
      b.quotes.oficial = { ok: false, error: { kind: 'empty', message: 'DolarAPI no devolvió la casa de Dólar oficial' } };
      for (const a of ['blue', 'mep', 'tarjeta'] as const) {
        const q = b.quotes[a];
        if (q.ok) q.data.gapVsOficial = null;
      }
    }),
  );
  await page.goto('/');

  await expect(card(page, 'Oficial')).toContainText('No pudimos obtener este dato');
  for (const label of ['Blue', 'MEP', 'Tarjeta']) {
    await expect(card(page, label).locator('.card-value')).toBeVisible();
    await expect(card(page, label).locator('.chip')).toHaveText('Brecha no disponible');
  }
});

test('H0-6 · histórico vacío muestra "sin datos", distinto del error', async ({ page }) => {
  await page.route('**/api/history/**', async (route) => {
    const res = await route.fetch();
    const body = await res.json();
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/mep')) {
      // MEP: el proveedor falla → estado de error
      await route.fulfill({ json: { ok: false, error: { kind: 'upstream', message: 'HTTP 500' } } });
      return;
    }
    body.data.series = []; // cualquier otro activo: serie vacía → sin datos
    body.data.gapSeries = [];
    await route.fulfill({ response: res, json: body });
  });
  await page.goto('/');

  const chart = page.getByRole('region', { name: 'Evolución' });
  await expect(chart.getByText('Sin datos para este período')).toBeVisible();
  await expect(chart.getByRole('alert')).toHaveCount(0);
  await expect(chart.locator('.chart-svg')).toHaveCount(0);

  await chart.getByRole('tablist', { name: 'Activo' }).getByRole('tab', { name: 'MEP' }).click();
  await expect(chart.getByRole('alert')).toContainText('No pudimos obtener el histórico');
  await expect(chart.getByText('Sin datos para este período')).toHaveCount(0);
});
