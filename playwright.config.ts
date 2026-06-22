import { defineConfig, devices } from '@playwright/test'

const PORT = 3000
const baseURL = `http://localhost:${PORT}`
const isCI = !!process.env.CI

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? 'list' : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL,
    locale: 'vi-VN',
    // Keep CI fast/light — no video or screenshots by default.
    video: 'off',
    screenshot: 'off',
    trace: 'off',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run E2E against a PRODUCTION build (`next build` + `next start`), not
  // `next dev`. The app's strict CSP (no 'unsafe-eval') blocks the eval that
  // Next.js dev/HMR relies on, which prevents client-side hydration — so
  // client auth guards (router.push('/login')) never fire under `next dev`.
  // A production build hydrates correctly and exercises real gating behaviour.
  // Reuses an already-running server locally; always builds fresh in CI.
  webServer: {
    command: `npx next build && npx next start -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 300_000,
  },
})
