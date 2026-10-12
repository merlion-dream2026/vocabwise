// Demo family for landing-page screenshots (scripts/capture-landing-screenshots.mjs).
//
//   node scripts/seed-demo-account.mjs <sourceChildA> <sourceChildB>   → create (or refresh) the demo
//   node scripts/seed-demo-account.mjs --delete                        → remove it
//
// Creates a Pro 6-tháng family (username DEMO_USERNAME, default 0999999990) with two children with
// made-up names — Bin (Rocky) and Su (Bubi) — whose progress is COPIED from the two source children
// (vocab_sync rows incl. Phonics, child_stickers, vw_academic_sync_child), plus the first source's
// family My Words (vw_word_lists + vw_saved_words). Sources are only read.
// XP is stripped from the copied daily history so the demo kids never appear on the shared
// leaderboard (/api/leaderboard ranks children with XP > 0). Lifecycle emails go to GMAIL_USER
// (the app's own sender mailbox). Credentials are appended to .env.local as DEMO_USERNAME/DEMO_PASSWORD.
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

const envPath = path.join(root, '.env.local')
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '')
}
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const USERNAME = process.env.DEMO_USERNAME || '0999999990'
const KIDS = [
  { name: 'Bin', emoji: '👦', theme: 'blue', mascot: 'rocky' },
  { name: 'Su', emoji: '👧', theme: 'pink', mascot: 'bubi' },
]

const must = ({ data, error }, what) => { if (error) throw new Error(`${what}: ${error.message}`); return data }

async function removeFamily(familyId) {
  const kids = must(await sb.from('children').select('id').eq('family_id', familyId), 'list demo kids')
  const ids = kids.map(k => k.id)
  if (ids.length) {
    for (const t of ['vocab_sync', 'child_stickers', 'vw_academic_sync_child']) must(await sb.from(t).delete().in('child_id', ids), `clear ${t}`)
    must(await sb.from('children').delete().in('id', ids), 'delete demo kids')
  }
  for (const t of ['vw_saved_words', 'vw_word_lists']) must(await sb.from(t).delete().eq('family_id', familyId), `clear ${t}`)
  must(await sb.from('families').delete().eq('id', familyId), 'delete demo family')
}

const existing = must(await sb.from('families').select('id, admin_note').eq('username', USERNAME).maybeSingle(), 'find demo family')
if (existing && existing.admin_note !== 'DEMO') throw new Error(`${USERNAME} belongs to a real family — set DEMO_USERNAME to another number`)

if (process.argv.includes('--delete')) {
  if (existing) await removeFamily(existing.id)
  console.log(existing ? 'Demo family deleted.' : 'No demo family.')
  process.exit(0)
}

const sources = process.argv.slice(2)
if (sources.length !== KIDS.length) { console.error('Usage: node scripts/seed-demo-account.mjs <sourceChildA> <sourceChildB>'); process.exit(1) }
if (existing) await removeFamily(existing.id)

const password = process.env.DEMO_PASSWORD || crypto.randomBytes(9).toString('base64url')
const yearOn = new Date(Date.now() + 365 * 864e5)
const family = must(await sb.from('families').insert({
  username: USERNAME,
  password_hash: await bcrypt.hash(password, 12),
  name: 'Gia đình Demo',
  phone: USERNAME,
  email: process.env.GMAIL_USER,
  email_verified: true,
  plan: '6months',
  plan_start_date: new Date().toISOString().slice(0, 10),
  plan_end_date: yearOn.toISOString().slice(0, 10),
  plan_expires_at: yearOn.toISOString(),
  max_kids: 3,
  admin_note: 'DEMO',
}).select('id').single(), 'create demo family')

for (const [i, kid] of KIDS.entries()) {
  const src = must(await sb.from('children').select('level').eq('id', sources[i]).single(), `read source child ${i + 1}`)
  const child = must(await sb.from('children').insert({
    family_id: family.id, ...kid, level: src.level, mascot_intro_seen_at: new Date().toISOString(),
  }).select('id').single(), `create ${kid.name}`)

  const syncs = must(await sb.from('vocab_sync').select('*').eq('child_id', sources[i]), 'read source vocab_sync')
  for (const { id: _id, child_id: _c, history, ...row } of syncs) {
    const noXp = Object.fromEntries(Object.entries(history ?? {}).map(([d, h]) => [d, { ...h, xp: 0 }]))
    must(await sb.from('vocab_sync').insert({ ...row, child_id: child.id, history: noXp }), `copy vocab_sync ${row.level}`)
  }

  const stickers = must(await sb.from('child_stickers').select('level, topic_id, earned_at, legacy').eq('child_id', sources[i]), 'read stickers')
  if (stickers.length) must(await sb.from('child_stickers').insert(stickers.map(s => ({ ...s, child_id: child.id }))), 'copy stickers')

  const ac = must(await sb.from('vw_academic_sync_child').select('mastery, srs, history, revision_scores').eq('child_id', sources[i]).maybeSingle(), 'read academic')
  if (ac) must(await sb.from('vw_academic_sync_child').insert({ ...ac, child_id: child.id }), 'copy academic')

  console.log(`${kid.name}: ${src.level}, ${syncs.length} sync rows, ${stickers.length} stickers${ac ? ', academic' : ''}`)
}

// My Words: lists first (new ids), then the saved words pointing at them.
const srcFamily = must(await sb.from('children').select('family_id').eq('id', sources[0]).single(), 'read source family').family_id
const lists = must(await sb.from('vw_word_lists').select('id, name, color').eq('family_id', srcFamily), 'read word lists')
const listMap = {}
for (const { id, ...l } of lists) listMap[id] = must(await sb.from('vw_word_lists').insert({ ...l, family_id: family.id }).select('id').single(), 'copy word list').id
const words = must(await sb.from('vw_saved_words').select('*').eq('family_id', srcFamily), 'read saved words')
if (words.length) must(await sb.from('vw_saved_words').insert(words.map(({ id: _id, ...w }) => ({ ...w, family_id: family.id, list_id: w.list_id ? listMap[w.list_id] ?? null : null }))), 'copy saved words')
console.log(`My Words: ${lists.length} lists, ${words.length} words`)

const env = fs.readFileSync(envPath, 'utf8')
if (!/^DEMO_PASSWORD=/m.test(env)) fs.appendFileSync(envPath, `${env.endsWith('\n') ? '' : '\n'}DEMO_USERNAME=${USERNAME}\nDEMO_PASSWORD=${password}\n`)
console.log(`Demo family ready: ${USERNAME} (password in .env.local)`)
