import { test, expect } from '@playwright/test'

// All protected routes require auth after middleware security fix.
// Guests are redirected to /login for every route not in PUBLIC_PATHS.
test.describe('Plan gating — guest access behaviour', () => {
  test('/kids (Daily) redirects guests to /login', async ({ page }) => {
    await page.goto('/kids')
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })
  })

  test('/vocabwise redirects guests to /login', async ({ page }) => {
    await page.goto('/vocabwise')
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })
  })

  test('/my-words redirects guests to /login', async ({ page }) => {
    await page.goto('/my-words')
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })
  })
})
