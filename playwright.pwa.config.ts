import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/pwa',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-pwa-report', open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4175',
    serviceWorkers: 'allow',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined },
  },
  projects: [
    { name: 'pwa-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'pwa-mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    env: { VITE_SUPABASE_URL: 'https://danz-test.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_danz_test_key' },
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4175 --strictPort',
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: false,
  },
})
