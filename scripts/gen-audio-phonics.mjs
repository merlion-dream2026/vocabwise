// Generate ElevenLabs audio for Phonics + Word Stress words and sentences → public/audio/phonics/*.mp3
// Usage: node --env-file=../axanh-global-english/.env.local scripts/gen-audio-phonics.mjs [--dry] [--limit N] [--only words|sentences]
//
// Covers every text the Phonics/Word Stress screens speak: sound keywords, practice words, rule-bucket
// words, practice + rhythm sentences, Word Stress words. One US voice (Andie, 2026-11-24).
// Output:
//   public/audio/phonics/{slug}-{hash6}.mp3 — hash of text+voice+model in the name, so a re-recorded
//     clip gets a new URL (the service worker caches /audio/ forever).
//   data/phonics-audio.json — key → file. Imported by lib/recordedVoice.ts (code-split chunk, so it
//     updates on deploy — not under /audio/, which the SW would serve stale).
// Re-running only records texts that are new or whose voice/model changed; a clip is never re-bought.
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const VOICE = 'cgSgspJ2msm6clMCkdW9' // Jessica (US) — same voice as Scholar Mini Stories
const MODEL = 'eleven_multilingual_v2'
const DIR = 'public/audio/phonics/'
const INDEX = 'data/phonics-audio.json'

const args = process.argv.slice(2)
const val = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null }
const dry = args.includes('--dry')
const limit = Number(val('--limit') ?? Infinity)
const only = val('--only') // words | sentences

/** Same rule as clipKey() in lib/recordedVoice.ts — keep them in sync. */
export function clipKey(text) {
  return text.normalize('NFC').replace(/\*\*/g, '').replace(/[‘’]/g, "'").replace(/\s+/g, ' ')
    .trim().toLowerCase().replace(/[.!?,;:]+$/, '')
}

// ── Collect texts ────────────────────────────────────────────────────────────
const levels = JSON.parse(readFileSync('data/phonicsLevels.json', 'utf8'))
const stress = JSON.parse(readFileSync('data/wordStress.json', 'utf8'))
const items = new Map() // key → { text, kind }
const add = (text, kind) => {
  if (typeof text !== 'string' || !text.trim()) return
  const k = clipKey(text)
  if (k && !items.has(k)) items.set(k, { text: text.replace(/\*\*/g, '').trim(), kind })
}
for (const lv of (Array.isArray(levels) ? levels : levels.levels ?? Object.values(levels))) {
  for (const ls of lv.lessons ?? []) {
    for (const s of ls.sounds ?? []) add(s.keyword, 'word')
    for (const w of ls.practice_words ?? []) add(w, 'word')
    for (const b of ls.buckets ?? []) for (const w of b.words ?? []) add(w, 'word')
    for (const s of ls.practice_sentences ?? []) add(s.en, 'sentence')
    for (const s of ls.sentences ?? []) add(s.en, 'sentence')
  }
}
for (const g of stress.groups ?? []) for (const w of g.words ?? []) add(w.word, 'word')

// ── Generate ─────────────────────────────────────────────────────────────────
const index = existsSync(INDEX) ? JSON.parse(readFileSync(INDEX, 'utf8')) : {}
// Clips re-recorded by scripts/redo-audio-phonics.mjs (Andie flagged) — keep them, don't re-buy the default take.
const redo = existsSync('data/phonics-audio-redo.json') ? JSON.parse(readFileSync('data/phonics-audio-redo.json', 'utf8')) : {}
mkdirSync(DIR, { recursive: true })
const slug = (k) => k.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'clip'
let made = 0, skipped = 0, chars = 0, failed = 0
const todo = [...items].filter(([, v]) => !only || v.kind === (only === 'words' ? 'word' : 'sentence'))
console.log(`${todo.length} texts (${todo.filter(([, v]) => v.kind === 'word').length} words, ${todo.filter(([, v]) => v.kind === 'sentence').length} sentences)`)

for (const [key, { text }] of todo) {
  if (made >= limit) break
  const hash = createHash('sha1').update(text + VOICE + MODEL).digest('hex').slice(0, 6)
  const file = `${slug(key)}-${hash}.mp3`
  if ((index[key] === file || index[key] === redo[key]?.file) && existsSync(DIR + index[key])) { skipped++; continue }
  if (dry) { chars += text.length; made++; continue }
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_64`, {
    method: 'POST',
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ text, model_id: MODEL, voice_settings: { stability: 0.6, similarity_boost: 0.75 } }),
  })
  if (!res.ok) {
    console.error(`✗ ${text}: ElevenLabs ${res.status} ${(await res.text()).slice(0, 200)}`)
    if (res.status === 401 || res.status === 402 || res.status === 429) break // out of credit / blocked → stop
    failed++; continue
  }
  writeFileSync(DIR + file, Buffer.from(await res.arrayBuffer()))
  index[key] = file
  writeFileSync(INDEX, JSON.stringify(index, null, 1) + '\n')
  made++; chars += text.length
  if (made % 50 === 0) console.log(`… ${made} done`)
}
console.log(`${dry ? 'would generate' : 'generated'} ${made} (~${chars} credits), already current ${skipped}, failed ${failed}`)
