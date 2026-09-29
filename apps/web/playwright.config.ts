import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
  },
  projects: [
    // Logs in once and writes the session cookies; see tests/auth.setup.ts.
    // Needs room for the throttle-aware retry loop inside `login`.
    { name: 'setup', testMatch: /auth\.setup\.ts/, timeout: 180_000 },
    {
      name: 'chromium',
      dependencies: ['setup'],
      // e2e/full-audit/student-stress each log in for themselves — about ten
      // POST /auth/login between them, against a 5-per-minute per-IP limit — so
      // they throttle both themselves and the `setup` project when run
      // together. Drop this testIgnore to run them.
      testIgnore: /(e2e|full-audit|student-stress)\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: 'tests/.auth/user.json' },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    port: 3000,
    reuseExistingServer: true,
    timeout: 120000,
  },
});
