import { defineConfig, devices } from '@playwright/test';

// BASE_URL selects the target: local (default), staging, or live.
// Always end it with a slash so relative test paths keep the /AutomationCI/ prefix on GitHub Pages.
const raw = process.env.BASE_URL ?? 'http://127.0.0.1:8123';
const baseURL = raw.endsWith('/') ? raw : `${raw}/`;
const isLocal = /^https?:\/\/(127\.0\.0\.1|localhost)(:|\/|$)/.test(baseURL);

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['json', { outputFile: '../../test-results/results.json' }]],
  outputDir: '../../test-results/artifacts',
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Serve dist/ ourselves only when testing locally.
  webServer: isLocal
    ? {
        command: 'npx http-server ../../dist -p 8123 -c-1 -a 127.0.0.1',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
      }
    : undefined,
});
