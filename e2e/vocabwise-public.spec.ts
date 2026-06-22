import { test, expect } from '@playwright/test'

// After middleware security fix, all Academic routes require auth.
// Guests are redirected to /login — login page renders with VocabWise branding.
test.describe('VocabWise Academic — guest redirect', () => {
  test('book page redirects guests to /login', async ({ page }) => {
    await page.goto('/vocabwise/book1')
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('topic page redirects guests to /login', async ({ page }) => {
    await page.goto('/vocabwise/book1/b1-t01')
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })
    await expect(page.locator('body')).not.toBeEmpty()
  })
})
