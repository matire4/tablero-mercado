import { defineConfig, devices } from '@playwright/test';

// e2e del tablero en MODO MOCK: datos reales guardados, sin llamar a ninguna API ni gastar cuota de GNews.
// El reloj lo pone cada fixture (MOCK_SCENARIO=normal: lunes 28/09 10:00, mercado abierto).
const PORT = 3100;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 30_000,
  retries: 0,
  // Un worker (01/10): con 2, la Mac se quedaba sin CPU y el test del tutorial fallaba al azar. Tarda lo mismo (testing.md §3).
  workers: 1,
  reporter: 'list',
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure' },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
    { name: 'celular', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npx next dev -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    // Las variables del proceso pisan a .env.local: aunque ahí diga USE_MOCK_DATA=false, el e2e corre en mock.
    env: { USE_MOCK_DATA: 'true', MOCK_SCENARIO: 'normal' },
  },
});
