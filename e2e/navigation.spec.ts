import { test, expect } from '@playwright/test'

test.describe('Public navigation', () => {
  test('landing page mentions all 3 modules (Phonics, Daily, Academic)', async ({ page }) => {
    await page.goto('/')
    const body = page.locator('body')
    await expect(body).toContainText(/Phonics/i)
    await expect(body).toContainText(/Daily/i)
    await expect(body).toContainText(/Academic/i)
  })

  test('onboarding page renders', async ({ page }) => {
    const res = await page.goto('/onboarding')
    expect(res?.status()).toBeLessThan(400)
    await expect(page.locator('body')).not.toBeEmpty()
  })

  test('privacy page returns 200 with content', async ({ page }) => {
    const res = await page.goto('/privacy')
    expect(res?.status()).toBe(200)
    await expect(page.locator('body')).toContainText(/.{50,}/)
  })

  test('terms page returns 200 with content', async ({ page }) => {
    const res = await page.goto('/terms')
    expect(res?.status()).toBe(200)
    await expect(page.locator('body')).toContainText(/.{50,}/)
  })

  test('unknown route shows 404 not-found page', async ({ page }) => {
    const res = await page.goto('/nonexistent-page-xyz')
    expect(res?.status()).toBe(404)
    await expect(page.locator('body')).toContainText(/404|không tìm thấy/i)
  })
})
