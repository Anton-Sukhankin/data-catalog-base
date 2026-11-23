import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4173';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    // Existing visual assertions compare the light reference. Theme tests use fresh storage.
    storageState: { cookies: [], origins: [{ origin: baseURL, localStorage: [{ name: 'data-catalog.theme', value: 'light' }] }] },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    env: { VITE_DEMO_HTTP: 'true' },
    reuseExistingServer: false,
  },
});
