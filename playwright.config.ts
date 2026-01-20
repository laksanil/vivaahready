import { defineConfig, devices } from '@playwright/test'

const e2eDatabaseUrl = process.env.DATABASE_URL_E2E || process.env.DATABASE_URL
const chromeExecutablePath = process.env.PLAYWRIGHT_CHROME_EXECUTABLE_PATH
const useSystemChrome = process.env.PLAYWRIGHT_USE_SYSTEM_CHROME === '1'
const extraChromeArgs = process.env.PLAYWRIGHT_CHROME_ARGS?.split(' ').filter(Boolean)

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  outputDir: 'test-results/playwright',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  globalSetup: './tests/e2e/global-setup.ts',
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/playwright/results.json' }],
    ['list']
  ],
  use: {
    baseURL: process.env.TEST_BASE_URL || 'http://127.0.0.1:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(chromeExecutablePath
          ? { launchOptions: { executablePath: chromeExecutablePath, args: extraChromeArgs } }
          : useSystemChrome
            ? { channel: 'chrome', launchOptions: { args: extraChromeArgs } }
            : { launchOptions: { args: extraChromeArgs } }),
      },
    },
  ],
  webServer: {
    command: 'npm run dev -- -p 3001 -H 127.0.0.1',
    url: 'http://127.0.0.1:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      ...process.env,
      ...(e2eDatabaseUrl ? { DATABASE_URL: e2eDatabaseUrl } : {}),
      PLAYWRIGHT_TEST: 'true',
      NEXT_PUBLIC_E2E_TEST: 'true',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://127.0.0.1:3001',
    },
  },
})
