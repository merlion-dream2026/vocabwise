// Phone screenshots of the live app for the landing page, taken as the demo family
// (scripts/seed-demo-account.mjs). Re-run after a UI change:
//
//   node scripts/capture-landing-screenshots.mjs            → all shots
//   node scripts/capture-landing-screenshots.mjs flashcard  → only the named shot(s)
//   BASE_URL=http://localhost:3000 node scripts/...         → against a local server
//
// Signs in through POST /api/auth/login with DEMO_USERNAME/DEMO_PASSWORD from .env.local (the browser
// context keeps the session cookie). Output: public/screenshots/app/{name}.webp, 390×844 @2x.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import { chromium } from 'playwright'
import sharp from 'sharp'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
for (const line of fs.readFileSync(path.join(root, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '')
}
const BASE = process.env.BASE_URL || 'https://vocabwise.id.vn'
const OUT = path.join(root, 'public/screenshots/app')

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const { data: fam } = await sb.from('families').select('id').eq('username', process.env.DEMO_USERNAME || '0999999990').single()
if (!fam) throw new Error('No demo family — run scripts/seed-demo-account.mjs first')
const { data: kids } = await sb.from('children').select('id, name, level').eq('family_id', fam.id)
const kid = name => kids.find(k => k.name === name)
const su = kid('Su'), bin = kid('Bin')

// name → { path, child (sets the active child for routes without one in the URL), wait (selector/text) }
const SHOTS = {
  'pick-child':  { path: '/kids' },
  'daily-level': { path: `/dashboard/${su.id}/starter` },
  'trophy':      { path: `/dashboard/${su.id}/starter/family-home` },   // first visit to a mastered topic opens the trophy
  'topic-hub':   { path: `/dashboard/${su.id}/starter/toys`, trophySeen: `trophy_${su.id}_starter_toys` },
  'flashcard':   { path: `/dashboard/${su.id}/starter/family-home/flashcard` },
  'game-listen': { path: `/dashboard/${su.id}/starter/family-home/listen` },
  'game-speak':  { path: `/dashboard/${bin.id}/master/${process.env.MASTER_TOPIC || 'law-justice'}/speak` },
  'stickers':    { path: `/dashboard/${su.id}/profile` },
  'phonics':     { path: `/dashboard/${bin.id}/phonics` },
  'academic':    { path: '/vocabwise/book1/b1-t01', child: bin.id },
  'my-words':    { path: '/my-words', child: bin.id },
  'parent':      { path: '/dashboard' },
}

const only = process.argv.slice(2)
const browser = await chromium.launch({ channel: process.env.PW_CHANNEL || 'chrome' })  // system Chrome; PW_CHANNEL=chromium after `npx playwright install chromium`
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
  reducedMotion: 'reduce', locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh',
})
const login = await ctx.request.post(`${BASE}/api/auth/login`, {
  data: { username: process.env.DEMO_USERNAME || '0999999990', password: process.env.DEMO_PASSWORD },
})
if (!login.ok()) throw new Error(`Demo login failed (${login.status()}): ${await login.text()}`)
fs.mkdirSync(OUT, { recursive: true })

for (const [name, s] of Object.entries(SHOTS)) {
  if (only.length && !only.includes(name)) continue
  const page = await ctx.newPage()
  await page.addInitScript(([child, trophySeen]) => {
    localStorage.setItem('onboarding_done', '1')
    localStorage.setItem('vw_game_sound_enabled', '0')
    if (child) localStorage.setItem('nav_child_id', child)
    if (trophySeen) sessionStorage.setItem(trophySeen, '1')
    // Headless Chrome has no TTS voices → the app would show its "no voice" banner on every word.
    const voice = { name: 'English', lang: 'en-US', default: true, localService: true, voiceURI: 'en-US' }
    if (window.speechSynthesis) {
      speechSynthesis.getVoices = () => [voice]
      speechSynthesis.speak = () => {}
    }
  }, [s.child ?? null, s.trophySeen ?? null])
  await page.goto(BASE + s.path, { waitUntil: 'load' })
  if (new URL(page.url()).pathname.startsWith('/login')) throw new Error(`Bounced to /login on ${s.path}`)
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {})  // SW + analytics can keep the network busy
  await page.waitForTimeout(1500)
  const png = await page.screenshot({ type: 'png' })
  await sharp(png).webp({ quality: 82 }).toFile(path.join(OUT, `${name}.webp`))
  console.log(`✓ ${name}  ${page.url().replace(BASE, '')}`)
  await page.close()
}
await browser.close()
