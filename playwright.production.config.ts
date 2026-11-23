import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://127.0.0.1:4174';

export default defineConfig({
  testDir: './tests',
  reporter: 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    // Existing visual assertions compare the light reference. Theme tests use fresh storage.
    storageState: { cookies: [], origins: [{ origin: baseURL, localStorage: [{ name: 'data-catalog.theme', value: 'light' }] }] },
  },
  projects: [{ name: 'production', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run preview -- --port 4174 --strictPort',
    url: 'http://127.0.0.1:4174',
    reuseExistingServer: false,
  },
});
