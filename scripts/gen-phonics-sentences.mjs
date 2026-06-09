#!/usr/bin/env node
// Generate practice_sentences for phonics pair lessons missing them.
// Run from project root: node scripts/gen-phonics-sentences.mjs
// Reads GROQ_API_KEY from .env.local automatically. Safe to re-run.

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir   = dirname(fileURLToPath(import.meta.url))
const ROOT    = join(__dir, '..')
const DATA    = join(ROOT, 'data/phonicsLevels.json')
const DELAY   = 1200   // ms between calls
const MODEL   = 'llama-3.3-70b-versatile'

// ─── Load .env.local ──────────────────────────────────────────────────────────
try {
  const env = readFileSync(join(ROOT, '.env.local'), 'utf8')
  for (const line of env.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.+)$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim()
  }
} catch { /* no .env.local */ }

const API_KEY = process.env.GROQ_API_KEY
if (!API_KEY) {
  console.error('❌  GROQ_API_KEY not found in .env.local or environment')
  process.exit(1)
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

const SYSTEM = `You generate English practice sentences for a children's phonics pronunciation app.
Students READ ALOUD each sentence. Highlighted words contain the target phoneme(s) to practice.

Rules:
1. Generate exactly 4 sentences, 6–12 words each.
2. Prefer words from the provided practice_words list. You may add common simple words.
3. "highlight" array = lowercase words (no punctuation) that contain the target sound(s).
4. Aim for 2–3 highlighted words per sentence so students get enough practice.
5. Vocabulary: A1–A2 level (simple nouns, verbs, adjectives children know).
6. Sentences must sound natural and make sense.
7. Return ONLY a valid JSON array, nothing else — no markdown fence, no explanation.

Output format:
[
  { "en": "The rain falls on the plain.", "highlight": ["rain", "plain"] },
  { "en": "We play a great game today.", "highlight": ["play", "game"] }
]`

function buildPrompt(lesson) {
  const sounds = lesson.sounds
    .map(s => `  /${s.symbol}/ — keyword: "${s.keyword}" ${s.emoji}`)
    .join('\n')
  const words = lesson.practice_words.join(', ')
  const tip   = lesson.tip ? `\nTip: ${lesson.tip}` : ''
  return `Target sound(s):\n${sounds}\n\nPractice words: ${words}${tip}\n\nGenerate 4 sentences.`
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function callGroq(prompt) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 700,
      temperature: 0.4,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user',   content: prompt  },
      ],
    }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.choices[0].message.content.trim()
}

// ─── Parse + validate ─────────────────────────────────────────────────────────

function parse(raw) {
  const m = raw.match(/\[[\s\S]*\]/)
  if (!m) throw new Error('No JSON array found')
  const arr = JSON.parse(m[0])
  if (!Array.isArray(arr) || arr.length === 0) throw new Error('Empty array')
  for (const s of arr) {
    if (typeof s.en !== 'string' || !Array.isArray(s.highlight))
      throw new Error(`Bad structure: ${JSON.stringify(s)}`)
    const sentenceWords = s.en.toLowerCase().replace(/[.,!?'"]/g, '').split(/\s+/)
    for (const h of s.highlight) {
      if (!sentenceWords.includes(h.toLowerCase()))
        throw new Error(`"${h}" not in "${s.en}"`)
    }
  }
  return arr.slice(0, 4)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function main() {
  const data = JSON.parse(readFileSync(DATA, 'utf8'))

  const missing = []
  for (const level of data.levels)
    for (const lesson of level.lessons)
      if (lesson.type === 'pair' && !lesson.practice_sentences?.length)
        missing.push(lesson)

  console.log(`\n📋 ${missing.length} lessons need sentences (${19 - missing.length} already done)\n`)
  if (!missing.length) { console.log('Nothing to do.'); return }

  let done = 0, errors = 0

  for (const lesson of missing) {
    const soundStr = lesson.sounds.map(s => `/${s.symbol}/`).join(' ')
    process.stdout.write(`⏳  ${lesson.id.padEnd(22)} ${soundStr.padEnd(12)} ... `)

    let attempt = 0
    while (attempt < 3) {
      try {
        const raw       = await callGroq(buildPrompt(lesson))
        const sentences = parse(raw)
        lesson.practice_sentences = sentences
        // Write after each lesson so progress is never lost
        writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n', 'utf8')
        console.log(`✅  ${sentences.length} sentences`)
        for (const s of sentences)
          console.log(`       "${s.en}"  → [${s.highlight.join(', ')}]`)
        done++
        break
      } catch (e) {
        attempt++
        if (attempt >= 3) { console.log(`❌  ${e.message}`); errors++ }
        else { process.stdout.write(`⚠️  retry ${attempt}... `); await sleep(3000) }
      }
    }

    await sleep(DELAY)
  }

  console.log(`\n${'─'.repeat(55)}`)
  console.log(`✅  Generated: ${done} lessons`)
  if (errors) console.log(`❌  Failed:    ${errors} (re-run to retry)`)
  console.log(`💾  Saved: data/phonicsLevels.json`)
  if (done > 0) console.log(`\n👉  Next: git add data/phonicsLevels.json && git commit -m "content: add practice_sentences to ${done} phonics lessons" && git push`)
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1) })
