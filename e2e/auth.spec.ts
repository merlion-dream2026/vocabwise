import { test, expect } from '@playwright/test'

test.describe('Authentication flows', () => {
  test('landing page loads with VocabWise branding', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/VocabWise/i)
    await expect(page.getByText(/VocabWise/i).first()).toBeVisible()
  })

  test('unauthenticated /dashboard redirects to /login', async ({ page }) => {
    // /dashboard guards client-side: it fetches the session then router.push's
    // to /login when none. Allow extra time for the cold dev-server compile.
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })
  })

  test('login page renders phone + password fields', async ({ page }) => {
    await page.goto('/login')
    // Username (phone) field and password field should be present.
    await expect(page.locator('input[autocomplete="username"]')).toBeVisible()
    await expect(page.locator('input[autocomplete="current-password"]')).toBeVisible()
  })

  test('register page renders form fields', async ({ page }) => {
    await page.goto('/register')
    // Name/phone fields plus a new-password field.
    await expect(page.locator('input').first()).toBeVisible()
    await expect(page.locator('input[autocomplete="new-password"]').first()).toBeVisible()
  })

  test('forgot-password page renders a form', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })
})
