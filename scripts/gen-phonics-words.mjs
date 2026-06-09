#!/usr/bin/env node
// Add more practice_words to pair lessons that are under target count.
// Target: 12 words for 2-sound lessons, 15 for 3-sound lessons, 12 for 1-sound.
// Run: node scripts/gen-phonics-words.mjs

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir  = dirname(fileURLToPath(import.meta.url))
const ROOT   = join(__dir, '..')
const DATA   = join(ROOT, 'data/phonicsLevels.json')
const DELAY  = 1200
const MODEL  = 'llama-3.3-70b-versatile'

// Load .env.local
try {
  const env = readFileSync(join(ROOT, '.env.local'), 'utf8')
  for (const line of env.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.+)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
  }
} catch {}

const API_KEY = process.env.GROQ_API_KEY
if (!API_KEY) { console.error('❌  GROQ_API_KEY not found'); process.exit(1) }

// ─── Target word counts ───────────────────────────────────────────────────────
// 2-sound pair: 12 total (6 per sound, interleaved even/odd)
// 1-sound solo: 12 total
// 3-sound trio: skip (code currently only handles even/odd split — architectural issue)
const TARGET = { 1: 12, 2: 12 }

// ─── Prompt ───────────────────────────────────────────────────────────────────

const SYSTEM = `You generate additional English practice words for a phonics app.
Words must clearly contain the target phoneme sound(s).
Rules:
- Simple, common English words (A1–A2 level, known by children)
- Do NOT repeat any word already in the existing list
- Each word must unambiguously contain the target sound
- Return ONLY a JSON array of strings, nothing else
Example: ["word1","word2","word3","word4"]`

function buildPrompt(lesson, soundIdx, needed, existing) {
  const s = lesson.sounds[soundIdx]
  return `Target sound: /${s.symbol}/ — keyword: "${s.keyword}" (example: ${s.emoji})

Existing words for this sound (do NOT repeat): ${existing.join(', ')}

Generate exactly ${needed} new words that contain /${s.symbol}/.`
}

async function callGroq(prompt) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL, max_tokens: 200, temperature: 0.5,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user',   content: prompt  },
      ],
    }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
  return (await res.json()).choices[0].message.content.trim()
}

function parseWords(raw) {
  const m = raw.match(/\[[\s\S]*?\]/)
  if (!m) throw new Error('No JSON array found')
  const arr = JSON.parse(m[0])
  if (!Array.isArray(arr)) throw new Error('Not an array')
  return arr.map(w => String(w).toLowerCase().trim()).filter(Boolean)
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function main() {
  const data = JSON.parse(readFileSync(DATA, 'utf8'))

  // Find lessons under target
  const toExpand = []
  for (const level of data.levels) {
    for (const lesson of level.lessons) {
      if (lesson.type !== 'pair') continue
      const nSounds = lesson.sounds.length
      if (!(nSounds in TARGET)) continue           // skip 3-sound lessons
      const target  = TARGET[nSounds]
      const current = lesson.practice_words.length
      if (current < target) toExpand.push({ lesson, target, current, nSounds })
    }
  }

  console.log(`\n📋 ${toExpand.length} lessons need more words\n`)
  if (!toExpand.length) { console.log('Nothing to do.'); return }

  let done = 0, errors = 0

  for (const { lesson, target, current, nSounds } of toExpand) {
    const soundStr = lesson.sounds.map(s => `/${s.symbol}/`).join(' ')
    const needed   = target - current
    console.log(`⏳  ${lesson.id.padEnd(22)} ${soundStr.padEnd(14)} ${current} → ${target} (+${needed} words)`)

    try {
      const words = [...lesson.practice_words]

      if (nSounds === 1) {
        // Solo: just append more words
        const existing = [...words]
        const raw      = await callGroq(buildPrompt(lesson, 0, needed, existing))
        const newWords = parseWords(raw).slice(0, needed)
        words.push(...newWords)
        console.log(`       +[${newWords.join(', ')}]`)
        await sleep(DELAY)
      } else {
        // 2-sound: add interleaved (even=s0, odd=s1)
        // Current words: even indices → s0, odd → s1
        const s0existing = words.filter((_, i) => i % 2 === 0)
        const s1existing = words.filter((_, i) => i % 2 === 1)
        const perSound   = needed / 2

        // Generate for each sound
        const [raw0, raw1] = await Promise.all([
          callGroq(buildPrompt(lesson, 0, Math.ceil(perSound),  s0existing)),
          callGroq(buildPrompt(lesson, 1, Math.floor(perSound), s1existing)),
        ])
        const new0 = parseWords(raw0).slice(0, Math.ceil(perSound))
        const new1 = parseWords(raw1).slice(0, Math.floor(perSound))

        // Interleave new words into existing list
        const result = [...words]
        const pairs  = Math.min(new0.length, new1.length)
        for (let i = 0; i < pairs; i++) { result.push(new0[i]); result.push(new1[i]) }
        if (new0.length > pairs) result.push(...new0.slice(pairs))
        if (new1.length > pairs) result.push(...new1.slice(pairs))

        words.splice(0, words.length, ...result)
        console.log(`       /${lesson.sounds[0].symbol}/ +[${new0.join(', ')}]`)
        console.log(`       /${lesson.sounds[1].symbol}/ +[${new1.join(', ')}]`)
        await sleep(DELAY)
      }

      lesson.practice_words = words
      writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n', 'utf8')
      console.log(`       ✅  now ${words.length} words`)
      done++
    } catch (e) {
      console.log(`       ❌  ${e.message}`)
      errors++
      await sleep(DELAY)
    }
  }

  console.log(`\n${'─'.repeat(55)}`)
  console.log(`✅  Expanded: ${done} lessons`)
  if (errors) console.log(`❌  Errors:   ${errors}`)
  console.log(`💾  Saved: data/phonicsLevels.json`)
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1) })
