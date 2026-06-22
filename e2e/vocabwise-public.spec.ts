import { test, expect } from '@playwright/test'

// The Academic (VocabWise) book + topic pages are NOT hard-gated: they render
// a server shell publicly and apply free-tier / upgrade gating client-side
// after fetching /api/auth/me. So for a guest we assert the page loads (does
// not redirect to /login) and shows the VocabWise shell.
test.describe('VocabWise Academic — public render', () => {
  test('book page renders for guests (no login redirect)', async ({ page }) => {
    await page.goto('/vocabwise/book1')
    await expect(page).toHaveURL(/\/vocabwise\/book1/)
    await expect(page.locator('body')).toContainText(/VocabWise/i)
  })

  test('topic page renders for guests (no login redirect)', async ({ page }) => {
    await page.goto('/vocabwise/book1/b1-t01')
    await expect(page).toHaveURL(/\/vocabwise\/book1\/b1-t01/)
    await expect(page.locator('body')).not.toBeEmpty()
  })
})
