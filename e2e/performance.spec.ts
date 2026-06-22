import { test, expect } from '@playwright/test'

// Lightweight smoke-level performance budgets. These run against `next dev`,
// where the FIRST request to a route pays a one-off on-demand compile cost
// (several seconds). We warm the route once, then measure a warm navigation so
// the budget reflects actual page weight, not the dev compiler. Budgets are
// generous and only meant to catch gross regressions (hung loads, redirect
// loops), not to be a precise Lighthouse-style metric.
async function warmThenMeasure(page: import('@playwright/test').Page, path: string) {
  await page.goto(path, { waitUntil: 'load' }) // warm: triggers dev compile
  const start = Date.now()
  await page.goto(path, { waitUntil: 'load' }) // measured: warm load
  return Date.now() - start
}

test.describe('Basic performance', () => {
  test('landing page warm load within budget', async ({ page }) => {
    const elapsed = await warmThenMeasure(page, '/')
    expect(elapsed).toBeLessThan(5000)
  })

  test('login page warm load within budget', async ({ page }) => {
    const elapsed = await warmThenMeasure(page, '/login')
    expect(elapsed).toBeLessThan(3000)
  })
})
