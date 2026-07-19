import { defineConfig, devices } from '@playwright/test';

const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const localBaseUrl = 'http://127.0.0.1:4321/Signal-Chain-Preflight/';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  use: {
    baseURL: externalBaseUrl ?? localBaseUrl,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  ...(externalBaseUrl ? {} : {
    webServer: {
      command: 'pnpm preview --host 127.0.0.1',
      url: localBaseUrl,
      reuseExistingServer: !process.env.CI,
      env: { ASTRO_DEV_BACKGROUND: '0' },
    },
  }),
});
