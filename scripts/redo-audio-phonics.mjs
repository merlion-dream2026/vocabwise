// Re-record Phonics clips Andie flagged as wrong/unclear (list from the QA page's "Copy danh sách sai").
// Usage: node --env-file=../axanh-global-english/.env.local --env-file=.env.local scripts/redo-audio-phonics.mjs <list.txt> [--takes 4] [--seed-from 1] [--no-context]
//
// Per key: up to N takes (different seed, slower + steadier, "The word is…" as unspoken context so a
// lone word isn't read as a name/fragment). Groq Whisper checks each take; the first one heard as the
// word (or a true homophone) wins. No take passes → the best-sounding last take is kept and listed.
// Winner gets a new file name (seed in the hash) → new URL past the SW cache; old clip deleted.
// data/phonics-audio-redo.json records key → { file, seed } so gen-audio-phonics.mjs won't undo it.
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'

const VOICE = 'cgSgspJ2msm6clMCkdW9' // Jessica (US) — same as gen-audio-phonics.mjs
const MODEL = 'eleven_multilingual_v2'
const DIR = 'public/audio/phonics/'
const INDEX = 'data/phonics-audio.json'
const CACHE = 'data/phonics-audio-qa.json'
const REDO = 'data/phonics-audio-redo.json'
const SETTINGS = { stability: 0.8, similarity_boost: 0.75, speed: 0.85 }
// Whisper writes these spellings for a correctly spoken word.
const HOMOPHONES = {
  know: ['no'], sea: ['see', 'c'], die: ['dye'], tie: ['thai'], male: ['mail'], hay: ['hey'],
  while: ['wile'], sigh: ['psi'], numb: ['num'], fin: ['finn'],
}

const args = process.argv.slice(2)
const listFile = args.find((a, i) => !a.startsWith('--') && !['--takes', '--seed-from'].includes(args[i - 1]))
const takes = Number(args.includes('--takes') ? args[args.indexOf('--takes') + 1] : 4)
const seedFrom = Number(args.includes('--seed-from') ? args[args.indexOf('--seed-from') + 1] : 1)
const noContext = args.includes('--no-context') // some words (bat) blur into the context: "…is bat" → "that"
if (!listFile) { console.error('Usage: redo-audio-phonics.mjs <list.txt>'); process.exit(1) }

const index = JSON.parse(readFileSync(INDEX, 'utf8'))
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {}
const redo = existsSync(REDO) ? JSON.parse(readFileSync(REDO, 'utf8')) : {}
const keys = readFileSync(listFile, 'utf8').split('\n').map((s) => s.trim().toLowerCase()).filter(Boolean)
const norm = (s) => s.toLowerCase().replace(/[^a-z' ]+/g, ' ').replace(/\s+/g, ' ').trim()
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const slug = (k) => k.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'clip'
const save = () => {
  writeFileSync(INDEX, JSON.stringify(index, null, 1) + '\n')
  writeFileSync(CACHE, JSON.stringify(cache, null, 1) + '\n')
  writeFileSync(REDO, JSON.stringify(redo, null, 1) + '\n')
}

async function tts(text, seed) {
  const single = !/\s/.test(text)
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}?output_format=mp3_44100_64`, {
    method: 'POST',
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({
      text, model_id: MODEL, seed, voice_settings: SETTINGS,
      ...(single && !noContext ? { previous_text: 'The word is' } : {}),
    }),
  })
  if (!res.ok) throw Object.assign(new Error(`ElevenLabs ${res.status} ${(await res.text()).slice(0, 200)}`), { status: res.status })
  return Buffer.from(await res.arrayBuffer())
}

async function whisper(buf, name) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const fd = new FormData()
    fd.append('file', new Blob([buf], { type: 'audio/mpeg' }), name)
    fd.append('model', 'whisper-large-v3-turbo')
    fd.append('language', 'en')
    fd.append('temperature', '0')
    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST', headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, body: fd,
    })
    if (res.status === 429) { await sleep(Number(res.headers.get('retry-after') ?? 10) * 1000 + 500); continue }
    if (!res.ok) throw new Error(`Groq ${res.status}`)
    await sleep(3100) // free tier ≈ 20 requests/min
    return ((await res.json()).text ?? '').trim()
  }
  throw new Error('Groq rate-limited')
}

const failed = []
for (const key of keys) {
  const old = index[key]
  if (!old) { console.error(`? ${key}: not in ${INDEX}`); continue }
  const text = key.charAt(0).toUpperCase() + key.slice(1) + (/\s/.test(key) ? '' : '.')
  const ok = new Set([norm(key), ...(HOMOPHONES[key] ?? [])])
  let pick = null
  for (let seed = seedFrom; seed < seedFrom + takes; seed++) {
    let buf
    try { buf = await tts(text, seed) } catch (e) {
      console.error(`✗ ${key}: ${e.message}`)
      if ([401, 402, 429].includes(e.status)) { save(); process.exit(1) }
      break
    }
    const heard = await whisper(buf, `${key}.mp3`)
    pick = { buf, seed, heard }
    if (ok.has(norm(heard))) break
    console.log(`  ${key} take ${seed}: heard "${heard}"`)
  }
  if (!pick) { failed.push(`${key} (no audio)`); continue }
  const hash = createHash('sha1').update(text + VOICE + MODEL + JSON.stringify(SETTINGS) + pick.seed).digest('hex').slice(0, 6)
  const file = `${slug(key)}-${hash}.mp3`
  writeFileSync(DIR + file, pick.buf)
  if (old !== file && existsSync(DIR + old)) unlinkSync(DIR + old)
  delete cache[old]
  index[key] = file
  cache[file] = pick.heard
  redo[key] = { file, seed: pick.seed }
  save()
  const pass = ok.has(norm(pick.heard))
  if (!pass) failed.push(`${key} → "${pick.heard}"`)
  console.log(`${pass ? '✓' : '⚠'} ${key} → ${file} (take ${pick.seed}, heard "${pick.heard}")`)
}
console.log(`\n${keys.length - failed.length}/${keys.length} pass Whisper.${failed.length ? '\nStill off:\n  ' + failed.join('\n  ') : ''}`)
