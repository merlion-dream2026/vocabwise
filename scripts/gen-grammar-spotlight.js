// ═══════════════════════════════════════════════════════════════════════════
// Generate grammar_spotlight for VocabWise Academic topics.
// Reads grammar points from grammar-spotlight-plan.csv and passages from
// topic JSON files, then calls Cerebras to generate structured content.
//
// Usage:
//   node scripts/gen-grammar-spotlight.js --book 1            → Book 1 (b1-t02..t60)
//   node scripts/gen-grammar-spotlight.js --book 1 --topic 5  → single topic b1-t05
//   node scripts/gen-grammar-spotlight.js --book 1 --dry-run  → preview only
//   node scripts/gen-grammar-spotlight.js --book 1 --force    → overwrite existing
//
// Requires env: CEREBRAS_API_KEY
// ═══════════════════════════════════════════════════════════════════════════

const fs   = require('fs')
const path = require('path')

try { require('dotenv').config({ path: '.env.local' }) } catch {}

const API_KEY  = process.env.CEREBRAS_API_KEY
const API_BASE = 'https://api.cerebras.ai/v1'
const MODEL    = 'gpt-oss-120b'
const DELAY_MS = 5000

if (!API_KEY) { console.error('Missing CEREBRAS_API_KEY'); process.exit(1) }

const args     = process.argv.slice(2)
const bookArg  = args.includes('--book')  ? args[args.indexOf('--book')  + 1] : null
const topicArg = args.includes('--topic') ? args[args.indexOf('--topic') + 1] : null
const dryRun   = args.includes('--dry-run')
const force    = args.includes('--force')

if (!bookArg) { console.error('Usage: node gen-grammar-spotlight.js --book 1 [--topic 5] [--dry-run] [--force]'); process.exit(1) }

const bookNum    = parseInt(bookArg)
const bookFolder = `book${bookNum}`
const DATA_DIR   = path.join(__dirname, '..', 'data', 'vocabwise', bookFolder)
const CSV_PATH   = path.join(__dirname, '..', 'data', 'grammar-spotlight-plan.csv')

const SOURCE_REF = bookNum <= 2
  ? 'Murphy, R. (2019). English Grammar in Use (5th ed.). Cambridge University Press.'
  : 'Hewings, M. (2013). Advanced Grammar in Use (3rd ed.). Cambridge University Press.'

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ── Parse CSV ───────────────────────────────────────────────────────────────
function parseCSV(csvPath) {
  const lines = fs.readFileSync(csvPath, 'utf-8').split('\n').filter(l => l.trim())
  const headers = lines[0].split(',')
  return lines.slice(1).map(line => {
    // Handle quoted fields
    const cols = []
    let cur = '', inQ = false
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ }
      else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = '' }
      else cur += ch
    }
    cols.push(cur.trim())
    return Object.fromEntries(headers.map((h, i) => [h.trim(), cols[i] ?? '']))
  })
}

// ── Load passage from topic JSON ─────────────────────────────────────────────
function loadPassage(topicId) {
  const jsonPath = path.join(DATA_DIR, `${topicId}.json`)
  if (!fs.existsSync(jsonPath)) return null
  const json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
  // Strip ** markdown, join paragraphs
  return json.passage.paragraphs
    .map(p => p.text_en.replace(/\*\*(.+?)\*\*/g, '$1'))
    .join(' ')
}

function loadTopicJSON(topicId) {
  const jsonPath = path.join(DATA_DIR, `${topicId}.json`)
  if (!fs.existsSync(jsonPath)) return null
  return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
}

// ── Build prompt ─────────────────────────────────────────────────────────────
function buildPrompt(row, passage) {
  return `You are an expert ELT (English Language Teaching) content creator specialising in grammar pedagogy for Vietnamese learners of English.

TASK: Generate a "Grammar Spotlight" JSON object for a VocabWise Academic topic.

TOPIC: "${row.topic_title}" (${row.topic_id}, CEFR ${row.level})
GRAMMAR POINT: ${row.grammar_point}
VIETNAMESE NAME: ${row.vi_grammar_point}

PASSAGE TEXT (source for in_context examples):
"""
${passage}
"""

OUTPUT FORMAT — return ONLY valid JSON, no markdown fences, no commentary:
{
  "grammar_point": "${row.grammar_point}",
  "vi_grammar_point": "${row.vi_grammar_point}",
  "level": "${row.level}",
  "source_ref": "${SOURCE_REF}",
  "form": {
    "positive": "<structure formula using Subject/Object/Verb labels>",
    "negative": "<negative form if applicable, else omit key>",
    "question": "<question form if applicable, else omit key>",
    "variant": "<alternative form if applicable, else omit key>"
  },
  "rule_vi": "<1-2 Vietnamese sentences: when/how to use this structure>",
  "rule_en": "<1 English sentence: when/how to use this structure>",
  "common_error": "❌ <wrong example>  →  ✅ <correct example>",
  "in_context": [
    "<sentence 1 copied or lightly adapted from PASSAGE with **bold** on the target grammar>",
    "<sentence 2 from PASSAGE with **bold** on target grammar>",
    "<sentence 3 from PASSAGE with **bold** on target grammar>"
  ],
  "ex1_mcq": {
    "instruction": "<instruction in Vietnamese>",
    "items": [
      { "id": 1, "sentence": "<sentence with _____ blank>", "options": ["opt1","opt2","opt3","opt4"], "answer": "<correct option>" },
      { "id": 2, "sentence": "...", "options": [...], "answer": "..." },
      { "id": 3, "sentence": "...", "options": [...], "answer": "..." },
      { "id": 4, "sentence": "...", "options": [...], "answer": "..." },
      { "id": 5, "sentence": "...", "options": [...], "answer": "..." }
    ]
  },
  "ex2_scramble": {
    "instruction": "Sắp xếp các từ thành câu đúng.",
    "items": [
      { "id": 1, "words": ["word1","word2","word3",...], "answer": "word1 word2 word3 ..." },
      { "id": 2, "words": [...], "answer": "..." },
      { "id": 3, "words": [...], "answer": "..." }
    ]
  },
  "ex3_gap_fill": {
    "instruction": "<instruction in Vietnamese>",
    "word_bank": ["<6 words: correct answers + plausible distractors>"],
    "items": [
      { "id": 1, "sentence": "<sentence with _____ blank>", "answer": "<exact word from word_bank>" },
      { "id": 2, ... },
      { "id": 3, ... },
      { "id": 4, ... },
      { "id": 5, ... }
    ]
  }
}

STRICT RULES:
1. Grammar rules must follow standard ELT reference grammar (Cambridge tradition). Be accurate.
2. in_context: use sentences FROM the passage above. Bold (**...**) ONLY the target grammar structure. Include 3 sentences.
3. ex1_mcq: each sentence has exactly one _____ blank. Options are 4 strings. Answer is RANDOMLY positioned (not always option A). All 4 options must be plausible. Each sentence must have only ONE correct answer.
4. ex2_scramble: "words" array has NO period/punctuation. "answer" is words joined with single spaces, NO period. Comparison is case-insensitive.
5. ex3_gap_fill: sentence has exactly one _____ blank. word_bank has exactly 6 words total (5 answers + 1 distractor, or vary). Each answer must appear in word_bank. Each sentence has only ONE unambiguous correct answer.
6. All exercise sentences must be at CEFR ${row.level} level — clear, natural English.
7. Vary sentence topics in exercises — do not repeat the same context.
8. Return ONLY the JSON object. No explanation, no markdown.`
}

// ── Call Cerebras (with retry on 429) ────────────────────────────────────────
async function callCerebras(prompt, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    })
    if (res.status === 429) {
      const wait = attempt * 8000
      console.log(`  ⏳ Rate limited, waiting ${wait/1000}s (attempt ${attempt}/${retries})...`)
      await sleep(wait)
      continue
    }
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Cerebras error ${res.status}: ${err}`)
    }
    const data = await res.json()
    const content = data.choices[0].message.content.trim()
    // Truncated response (rate-throttled without 429) — treat as retriable
    if (content.length < 800) {
      if (attempt < retries) {
        console.log(`  ⏳ Response too short (${content.length} chars), waiting ${attempt * 10}s...`)
        await sleep(attempt * 10000)
        continue
      }
      throw new Error(`Response too short after ${retries} attempts (${content.length} chars)`)
    }
    return content
  }
  throw new Error('Rate limit exceeded after retries')
}

// ── Validate output ───────────────────────────────────────────────────────────
function validate(obj) {
  const required = ['grammar_point','vi_grammar_point','level','source_ref','form','rule_vi','rule_en','common_error','in_context','ex1_mcq','ex2_scramble','ex3_gap_fill']
  for (const key of required) {
    if (!obj[key]) return `Missing field: ${key}`
  }
  if (!Array.isArray(obj.in_context) || obj.in_context.length < 2) return 'in_context must have ≥2 items'
  if (!Array.isArray(obj.ex1_mcq?.items) || obj.ex1_mcq.items.length !== 5) return 'ex1_mcq must have 5 items'
  if (!Array.isArray(obj.ex2_scramble?.items) || obj.ex2_scramble.items.length !== 3) return 'ex2_scramble must have 3 items'
  if (!Array.isArray(obj.ex3_gap_fill?.items) || obj.ex3_gap_fill.items.length !== 5) return 'ex3_gap_fill must have 5 items'
  if (!Array.isArray(obj.ex3_gap_fill?.word_bank) || obj.ex3_gap_fill.word_bank.length < 4) return 'word_bank must have ≥4 items'
  // Check MCQ answers are in options
  for (const item of obj.ex1_mcq.items) {
    if (!item.options.includes(item.answer)) return `MCQ item ${item.id}: answer "${item.answer}" not in options`
  }
  // Check gap fill answers are in word_bank
  for (const item of obj.ex3_gap_fill.items) {
    if (!obj.ex3_gap_fill.word_bank.includes(item.answer)) return `GapFill item ${item.id}: answer "${item.answer}" not in word_bank`
  }
  return null
}

// ── Process one topic ─────────────────────────────────────────────────────────
async function processTopic(row) {
  const { topic_id } = row
  const jsonData = loadTopicJSON(topic_id)
  if (!jsonData) { console.log(`  ⚠️  JSON not found: ${topic_id}`); return false }

  if (!force && jsonData.grammar_spotlight) {
    console.log(`  ⏭  Already has grammar_spotlight — skip (use --force to overwrite)`)
    return true
  }

  const passage = loadPassage(topic_id)
  if (!passage) { console.log(`  ⚠️  No passage: ${topic_id}`); return false }

  const prompt = buildPrompt(row, passage)

  let raw, parsed
  try {
    raw = await callCerebras(prompt)
    // Strip markdown fences if present
    const clean = raw.replace(/^```(?:json)?\n?/,'').replace(/\n?```$/,'').trim()
    parsed = JSON.parse(clean)
  } catch (e) {
    console.log(`  ❌ Parse error: ${e.message}`)
    console.log(`  Raw: ${raw?.slice(0, 200)}`)
    return false
  }

  const err = validate(parsed)
  if (err) { console.log(`  ❌ Validation failed: ${err}`); return false }

  // Write back to JSON
  jsonData.grammar_spotlight = parsed
  const jsonPath = path.join(DATA_DIR, `${topic_id}.json`)
  fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2), 'utf-8')
  console.log(`  ✅ Done`)
  return true
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const allRows = parseCSV(CSV_PATH)
  let rows = allRows.filter(r => parseInt(r.book) === bookNum)

  // Skip b1-t01 (already done manually)
  if (bookNum === 1) rows = rows.filter(r => r.topic_id !== 'b1-t01')

  // Filter to single topic if --topic given
  if (topicArg) {
    const padded = topicArg.padStart(2, '0')
    rows = rows.filter(r => r.topic_id === `b${bookNum}-t${padded}`)
  }

  console.log(`\n📖 Grammar Spotlight — Book ${bookNum}`)
  console.log(`   Topics: ${rows.length} | Model: ${MODEL} | Dry run: ${dryRun}`)
  console.log(`${'─'.repeat(50)}`)

  let ok = 0, fail = 0

  for (const row of rows) {
    console.log(`\n[${row.topic_id}] ${row.topic_title} — ${row.grammar_point}`)
    if (dryRun) { console.log('  (dry run)'); continue }

    const success = await processTopic(row)
    if (success) ok++; else fail++

    if (fail > 10) { console.log('\n⛔ Too many failures (>10), stopping.'); break }
    await sleep(DELAY_MS)
  }

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`✅ Done: ${ok}  ❌ Failed: ${fail}`)
}

main().catch(e => { console.error(e); process.exit(1) })
