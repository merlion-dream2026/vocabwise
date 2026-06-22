import { test, expect } from '@playwright/test'

// Plan gating requires an authenticated session, which we don't create in E2E
// (no real Supabase test account). What we CAN verify:
//  - Routes that hard-redirect guests to /login do so (client-side auth guard).
//  - Routes that gate content client-side still render their shell publicly
//    (the upgrade/free-tier gating is applied after the page hydrates).
test.describe('Plan gating — guest access behaviour', () => {
  test('/kids (Daily) redirects guests to /login', async ({ page }) => {
    await page.goto('/kids')
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })
  })

  test('/vocabwise renders publicly (content gated client-side)', async ({ page }) => {
    await page.goto('/vocabwise')
    // Does NOT redirect to /login — stays on the Academic landing shell.
    await expect(page).toHaveURL(/\/vocabwise/)
    await expect(page.locator('body')).toContainText(/VocabWise/i)
  })

  test('/my-words renders publicly (free-tier limit applied client-side)', async ({ page }) => {
    await page.goto('/my-words')
    await expect(page).toHaveURL(/\/my-words/)
  })
})
