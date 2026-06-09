#!/usr/bin/env node
// QA and fix practice_sentences for phonics pair lessons.
// Detects: grammar errors, repeated words, awkward phrasing, wrong highlights.
// Run: node scripts/qa-phonics-sentences.mjs
// Safe to re-run. Only updates lessons where sentences changed.

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

// ─── Prompt ───────────────────────────────────────────────────────────────────

const SYSTEM = `You are a quality checker for English phonics practice sentences used by children.

For each set of 4 sentences, check and FIX any of these problems:
- Grammar errors (wrong verb form, subject-verb mismatch, etc.)
- Unnatural or awkward phrasing that a native speaker would not say
- Repeated words within the same sentence
- "highlight" words that don't appear in the sentence (remove them)
- Highlight array missing important target-sound words that ARE in the sentence

Rules for fixes:
- If a sentence is fine, return it UNCHANGED
- Make minimal edits — prefer fixing over rewriting
- Keep all highlight words lowercase, no punctuation
- Keep sentences 6–12 words, A1–A2 vocabulary
- Return ONLY the JSON array, nothing else

Format: [{"en":"...","highlight":["word1","word2"]},...]`

function buildPrompt(lesson) {
  const sounds = lesson.sounds.map(s => `/${s.symbol}/ (${s.keyword})`).join(' vs ')
  const existing = JSON.stringify(lesson.practice_sentences, null, 2)
  return `Target sound(s): ${sounds}
Practice words available: ${lesson.practice_words.join(', ')}

Current sentences (check and fix if needed):
${existing}`
}

async function callGroq(prompt) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL, max_tokens: 700, temperature: 0.2,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user',   content: prompt  },
      ],
    }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)
  return (await res.json()).choices[0].message.content.trim()
}

function parse(raw) {
  const m = raw.match(/\[[\s\S]*\]/)
  if (!m) throw new Error('No JSON array found')
  const arr = JSON.parse(m[0])
  if (!Array.isArray(arr) || arr.length === 0) throw new Error('Empty array')
  for (const s of arr) {
    if (typeof s.en !== 'string' || !Array.isArray(s.highlight))
      throw new Error(`Bad structure: ${JSON.stringify(s)}`)
    const words = s.en.toLowerCase().replace(/[.,!?'"]/g, '').split(/\s+/)
    for (const h of s.highlight)
      if (!words.includes(h.toLowerCase()))
        throw new Error(`"${h}" not in "${s.en}"`)
  }
  return arr.slice(0, 4)
}

function sentencesEqual(a, b) {
  if (a.length !== b.length) return false
  return a.every((s, i) =>
    s.en === b[i].en &&
    JSON.stringify(s.highlight.slice().sort()) === JSON.stringify(b[i].highlight.slice().sort())
  )
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function main() {
  const data = JSON.parse(readFileSync(DATA, 'utf8'))

  // Only QA lessons that have sentences (skip lessons without)
  const lessons = []
  for (const level of data.levels)
    for (const lesson of level.lessons)
      if (lesson.type === 'pair' && lesson.practice_sentences?.length)
        lessons.push(lesson)

  console.log(`\n🔍 QA check: ${lessons.length} lessons\n`)

  let fixed = 0, unchanged = 0, errors = 0

  for (const lesson of lessons) {
    const soundStr = lesson.sounds.map(s => `/${s.symbol}/`).join(' ')
    process.stdout.write(`⏳  ${lesson.id.padEnd(22)} ${soundStr.padEnd(14)} ... `)

    let attempt = 0
    while (attempt < 3) {
      try {
        const original = lesson.practice_sentences
        const raw      = await callGroq(buildPrompt(lesson))
        const updated  = parse(raw)

        if (sentencesEqual(original, updated)) {
          console.log('✅  no changes')
          unchanged++
        } else {
          lesson.practice_sentences = updated
          writeFileSync(DATA, JSON.stringify(data, null, 2) + '\n', 'utf8')
          console.log('✏️   fixed:')
          original.forEach((s, i) => {
            if (s.en !== updated[i]?.en || JSON.stringify(s.highlight) !== JSON.stringify(updated[i]?.highlight)) {
              console.log(`       was: "${s.en}"  [${s.highlight.join(', ')}]`)
              console.log(`       now: "${updated[i].en}"  [${updated[i].highlight.join(', ')}]`)
            }
          })
          fixed++
        }
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
  console.log(`✏️   Fixed:     ${fixed} lessons`)
  console.log(`✅  Unchanged: ${unchanged} lessons`)
  if (errors) console.log(`❌  Errors:    ${errors}`)
  console.log(`💾  Saved: data/phonicsLevels.json`)
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1) })
