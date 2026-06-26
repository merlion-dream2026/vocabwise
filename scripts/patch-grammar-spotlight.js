// ═══════════════════════════════════════════════════════════════════════════
// Patch existing grammar_spotlight with richer content (OpenAI gpt-4o-mini):
//   - rule_vi:       rewrite as 3-4 sentences, deeper and more precise
//   - usage_notes:   3-4 specific usage bullets in Vietnamese
//   - in_context_vi: Vietnamese translation of each in_context sentence
//
// Usage:
//   node scripts/patch-grammar-spotlight.js --book 1
//   node scripts/patch-grammar-spotlight.js --book 1 --topic 5
//   node scripts/patch-grammar-spotlight.js --book 1 --dry-run
//   node scripts/patch-grammar-spotlight.js --book 1 --force
//
// Requires env: OPENAI_API_KEY
// ═══════════════════════════════════════════════════════════════════════════

const fs   = require('fs')
const path = require('path')

try { require('dotenv').config({ path: '.env.local' }) } catch {}

const API_KEY  = process.env.GROQ_API_KEY
const API_BASE = 'https://api.groq.com/openai/v1'
const MODEL    = 'llama-3.3-70b-versatile'
const DELAY_MS = 2500  // ~24 RPM, safely under Groq 30 RPM limit

if (!API_KEY) { console.error('Missing GROQ_API_KEY'); process.exit(1) }

const args     = process.argv.slice(2)
const bookArg  = args.includes('--book')  ? args[args.indexOf('--book')  + 1] : null
const topicArg = args.includes('--topic') ? args[args.indexOf('--topic') + 1] : null
const dryRun   = args.includes('--dry-run')
const force    = args.includes('--force')

if (!bookArg) { console.error('Usage: node patch-grammar-spotlight.js --book 1 [--topic 5] [--dry-run]'); process.exit(1) }

const bookNum  = parseInt(bookArg)
const DATA_DIR = path.join(__dirname, '..', 'data', 'vocabwise', `book${bookNum}`)

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function buildPrompt(gs, passageTextVi) {
  return `You are an expert ELT teacher with deep knowledge of English grammar, writing Vietnamese explanations for learners at ${gs.level} level.

GRAMMAR POINT: ${gs.grammar_point}
Vietnamese name: ${gs.vi_grammar_point}
CEFR level: ${gs.level}

CURRENT (too brief) explanation:
"${gs.rule_vi}"

PASSAGE VIETNAMESE (for reference when translating sentences):
"${passageTextVi.slice(0, 600)}"

IN-CONTEXT ENGLISH SENTENCES (bold marks the grammar structure):
${gs.in_context.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Return ONLY valid JSON with exactly these three fields:

{
  "rule_vi": "<Rewrite the grammar explanation in Vietnamese: 3-4 clear sentences. Cover: what it is, when to use it, the key structure rule. Be specific and precise. For complex grammar (C1-C2), include the full range of uses. Do NOT repeat what usage_notes will say.>",
  "usage_notes": [
    { "text": "<Key usage rule in Vietnamese — 1-2 sentences, specific>", "examples": ["<❌ wrong → ✅ correct, or a short illustrative example>"] },
    { "text": "<Second key usage rule>", "examples": ["<example>"] },
    { "text": "<Third key usage rule>", "examples": ["<example 1>", "<example 2 if needed>"] },
    { "text": "<Fourth rule — only if genuinely different>", "examples": ["<example>"] }
  ],
  "in_context_vi": [
    "<Natural Vietnamese translation of sentence 1 — no bold markdown>",
    "<Natural Vietnamese translation of sentence 2>",
    "<Natural Vietnamese translation of sentence 3>"
  ]
}

REQUIREMENTS:
- rule_vi: 3-4 sentences. Thorough Vietnamese explanation. For modal verbs: explain meaning differences. For conditionals: explain when each type is used. For advanced structures (inversion, cleft, nominalization, etc.): explain the full system. Be more thorough than the current explanation.
- usage_notes: 3-4 DISTINCT points each covering a DIFFERENT aspect — position/word order, formal vs informal register, common confusions, exceptions, differences from Vietnamese grammar, or learner errors.
  * "text": 1-2 Vietnamese sentences.
  * "examples": 1-2 SHORT English illustrative strings (under 15 words each). Write in ENGLISH. Format: "❌ wrong English → ✅ correct English" for error examples, or just a correct English usage sentence. The "examples" key is REQUIRED for every note — always include at least one example in English.
- in_context_vi: natural Vietnamese, accurate, no markdown.
- Return ONLY valid JSON. No explanation, no markdown fences.`
}

async function callOpenAI(prompt, retries = 4) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2,
        max_tokens: 1500,
      }),
    })
    if (res.status === 429) {
      const wait = attempt * 5000
      console.log(`  ⏳ Rate limited, waiting ${wait / 1000}s...`)
      await sleep(wait)
      continue
    }
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`)
    const data = await res.json()
    return data.choices[0].message.content.trim()
  }
  throw new Error('Rate limit exceeded after retries')
}

async function patchTopic(topicId) {
  const jsonPath = path.join(DATA_DIR, `${topicId}.json`)
  if (!fs.existsSync(jsonPath)) { console.log('  ⚠️  Not found'); return false }
  const json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
  const gs = json.grammar_spotlight
  if (!gs) { console.log('  ⚠️  No grammar_spotlight'); return false }

  if (!force && gs.usage_notes && gs.in_context_vi) {
    console.log('  ⏭  Already patched — skip (use --force to overwrite)')
    return true
  }

  const passageTextVi = (json.passage?.paragraphs ?? [])
    .map(p => p.text_vi ?? '').join(' ')

  const prompt = buildPrompt(gs, passageTextVi)

  let parsed
  try {
    const raw = await callOpenAI(prompt)
    parsed = JSON.parse(raw)
  } catch (e) {
    console.log(`  ❌ Error: ${e.message}`)
    return false
  }

  // Strip any stray CJK characters (model code-switching artifact)
  const stripCJK = s => s.replace(/[一-鿿㐀-䶿]+/g, '').trim()
  if (typeof parsed.rule_vi === 'string') parsed.rule_vi = stripCJK(parsed.rule_vi)
  if (Array.isArray(parsed.usage_notes)) {
    parsed.usage_notes = parsed.usage_notes.map(n => {
      if (typeof n === 'string') return stripCJK(n)
      return {
        ...n,
        text: stripCJK(n.text ?? ''),
        examples: Array.isArray(n.examples) ? n.examples.map(e => stripCJK(String(e))) : [],
      }
    })
  }

  // Validate
  if (typeof parsed.rule_vi !== 'string' || parsed.rule_vi.length < 50)
    { console.log('  ❌ rule_vi too short'); return false }
  if (!Array.isArray(parsed.usage_notes) || parsed.usage_notes.length < 2)
    { console.log('  ❌ usage_notes invalid'); return false }
  // Normalise: if model returns strings instead of objects, wrap them
  parsed.usage_notes = parsed.usage_notes.map(n =>
    typeof n === 'string' ? { text: n, examples: [] } : n
  )
  if (!Array.isArray(parsed.in_context_vi) || parsed.in_context_vi.length < 1)
    { console.log('  ❌ in_context_vi invalid'); return false }

  json.grammar_spotlight.rule_vi       = parsed.rule_vi
  json.grammar_spotlight.usage_notes   = parsed.usage_notes.slice(0, 4)
  json.grammar_spotlight.in_context_vi = parsed.in_context_vi.slice(0, gs.in_context.length)

  fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2), 'utf-8')
  console.log(`  ✅ rule_vi ${parsed.rule_vi.length}c | ${parsed.usage_notes.length} notes | ${parsed.in_context_vi.length} VI`)
  return true
}

async function main() {
  const files = fs.readdirSync(DATA_DIR)
    .filter(f => f.match(/^b\d-t\d+\.json$/))
    .sort()

  let topics = files.map(f => f.replace('.json', ''))

  if (topicArg) {
    const padded = topicArg.padStart(2, '0')
    topics = topics.filter(id => id === `b${bookNum}-t${padded}`)
  }

  console.log(`\n🔧 Patch Grammar Spotlight — Book ${bookNum} (llama-3.3-70b)`)
  console.log(`   Topics: ${topics.length} | Force: ${force} | Dry run: ${dryRun}`)
  console.log('─'.repeat(50))

  let ok = 0, fail = 0

  for (const id of topics) {
    console.log(`\n[${id}]`)
    if (dryRun) { console.log('  (dry run)'); continue }
    const success = await patchTopic(id)
    if (success) ok++; else fail++
    if (fail > 8) { console.log('\n⛔ Too many failures, stopping.'); break }
    await sleep(DELAY_MS)
  }

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`✅ Done: ${ok}  ❌ Failed: ${fail}`)
}

main().catch(e => { console.error(e); process.exit(1) })
