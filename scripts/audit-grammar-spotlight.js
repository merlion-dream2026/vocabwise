// ═══════════════════════════════════════════════════════════════════════════
// Audit grammar_spotlight exercises (ex1_mcq / ex2_scramble / ex3_gap_fill) for
// items that have MORE THAN ONE objectively correct answer — e.g. an MCQ
// comparing two arbitrary things by price/size with no stated fact to justify
// the "official" answer. Uses Cerebras gpt-oss-120b (same integration as
// patch-grammar-spotlight.js). Report-only by default; nothing is written to
// source JSON until --apply, and --apply re-validates every fix before writing.
//
// Usage:
//   node scripts/audit-grammar-spotlight.js --book 1                → run audit, write report
//   node scripts/audit-grammar-spotlight.js --book 1 --topic 4      → single topic (re-check after a fix)
//   node scripts/audit-grammar-spotlight.js --book 1 --apply        → apply validated fixes from report to JSON
//
// Requires env: CEREBRAS_API_KEY and/or GROQ_API_KEY (select with --provider)
// ═══════════════════════════════════════════════════════════════════════════

const fs   = require('fs')
const path = require('path')

try { require('dotenv').config({ path: '.env.local' }) } catch {}

const args      = process.argv.slice(2)
const provider  = args.includes('--provider') ? args[args.indexOf('--provider') + 1] : 'cerebras'

const PROVIDERS = {
  cerebras: { key: process.env.CEREBRAS_API_KEY, base: 'https://api.cerebras.ai/v1', model: 'gpt-oss-120b' },
  groq:     { key: process.env.GROQ_API_KEY,     base: 'https://api.groq.com/openai/v1', model: 'openai/gpt-oss-120b' },
}
if (!PROVIDERS[provider]) { console.error(`Unknown --provider "${provider}" (use cerebras or groq)`); process.exit(1) }
const { key: API_KEY, base: API_BASE, model: MODEL } = PROVIDERS[provider]
const DELAY_MS = 10000

if (!API_KEY) { console.error(`Missing API key for provider "${provider}"`); process.exit(1) }

const bookArg  = args.includes('--book')  ? args[args.indexOf('--book')  + 1] : null
const topicArg = args.includes('--topic') ? args[args.indexOf('--topic') + 1] : null
const fromArg  = args.includes('--from')  ? parseInt(args[args.indexOf('--from')  + 1]) : null
const toArg    = args.includes('--to')    ? parseInt(args[args.indexOf('--to')    + 1]) : null
const apply    = args.includes('--apply')

if (!bookArg) { console.error('Usage: node audit-grammar-spotlight.js --book 1 [--topic 4] [--apply]'); process.exit(1) }

const bookNum   = parseInt(bookArg)
const DATA_DIR  = path.join(__dirname, '..', 'data', 'vocabwise', `book${bookNum}`)
const REPORT_DIR = path.join(__dirname, '..', 'data', 'grammar-spotlight')
const REPORT_PATH = path.join(REPORT_DIR, `audit-book${bookNum}.json`)

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function buildPrompt(gs) {
  const mcqBlock = (gs.ex1_mcq?.items ?? []).map(it =>
    `${it.id}. ${it.sentence}\n   options: ${it.options.map((o, i) => `${String.fromCharCode(65 + i)}) ${o}`).join(' | ')}\n   answer: ${it.answer}`
  ).join('\n')

  const scrambleBlock = (gs.ex2_scramble?.items ?? []).map(it =>
    `${it.id}. words: [${it.words.join(', ')}]\n   answer: ${it.answer}`
  ).join('\n')

  const gapBlock = (gs.ex3_gap_fill?.items ?? []).map(it =>
    `${it.id}. ${it.sentence}\n   answer: ${it.answer}`
  ).join('\n')

  return `You are auditing English grammar practice exercises (CEFR ${gs.level}, grammar point: ${gs.grammar_point}) for LOGICAL VALIDITY. You are NOT rewriting content or improving prose — only flagging items where the exercise has more than one objectively correct answer.

Flag an item ONLY if, using just the information stated in the sentence (plus extremely obvious/universal facts — e.g. "a laptop is usually more expensive than a tablet" is fine because it states "usually" and is common knowledge), more than one option/word/ordering would be equally correct.
Example of a BAD item (must flag): "The red dress is _____ than the blue one." with answer "cheaper" — color has no bearing on price, so "more expensive" fits exactly as well. No fact is stated to justify one answer over the other.
Example of a GOOD item (do NOT flag): "A smartphone is usually _____ than a basic phone." with answer "more expensive" — "usually" plus common knowledge justifies a single expected answer.

For each FLAGGED item, propose a minimal fix that keeps testing the EXACT SAME grammar structure (same comparative/superlative/tense form) at the same CEFR level. Prefer: (a) adding a qualifier like "usually" / "in general" plus swapping to a pair of things where that qualifier is genuinely true, or (b) stating an explicit fact in the sentence. Do not change what grammar point is being tested.

FORMAT RULES (strict — output gets rejected by a parser if violated):
- Options are plain strings — do NOT prefix them with "A) ", "B. ", etc. Keep exactly the same style as the source (no letter/number labels).
- If the original sentence contains a blank marker "_____", your fixed sentence MUST also contain "_____" in the same style — never replace it with the filled-in word. If the original had NO blank (e.g. a short-answer Yes/No question with the blank only in the answer), do not invent one.
- "answer" must be copied verbatim from one of the "options" you return (ex1_mcq) — same casing, same string.

Return ONLY valid JSON, no markdown fences, no commentary:
{
  "issues": [
    {
      "exercise": "ex1_mcq",
      "item_id": 3,
      "problem": "<1 câu tiếng Việt giải thích tại sao ambiguous>",
      "fix": { "sentence": "...", "options": ["...","...","...","..."], "answer": "..." }
    }
  ]
}
For ex2_scramble fixes use: "fix": { "words": ["...", ...], "answer": "..." }
For ex3_gap_fill fixes use: "fix": { "sentence": "...", "answer": "..." }
If nothing needs fixing, return {"issues": []}. Only include items that need fixing — do not list unflagged items.

EX1_MCQ (instruction: ${gs.ex1_mcq?.instruction ?? ''}):
${mcqBlock || '(none)'}

EX2_SCRAMBLE (instruction: ${gs.ex2_scramble?.instruction ?? ''}):
${scrambleBlock || '(none)'}

EX3_GAP_FILL (instruction: ${gs.ex3_gap_fill?.instruction ?? ''}, word_bank: ${(gs.ex3_gap_fill?.word_bank ?? []).join(', ')}):
${gapBlock || '(none)'}`
}

async function callAPI(prompt, retries = 4) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(`${API_BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 9000,
      }),
    })
    if (res.status === 429) {
      const wait = attempt * 5000
      console.log(`  ⏳ Rate limited, waiting ${wait / 1000}s...`)
      await sleep(wait)
      continue
    }
    if (!res.ok) throw new Error(`${provider} ${res.status}: ${await res.text()}`)
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      const reason = data.choices?.[0]?.finish_reason ?? 'unknown'
      console.log(`  ⚠️  empty content (finish_reason: ${reason}), retrying...`)
      await sleep(2000)
      continue
    }
    return content.trim()
  }
  throw new Error('empty response after retries')
}

function stripFences(raw) {
  return raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
}

// Strip model-added letter prefixes ("A) ", "B. ", "C: ") that don't belong in our schema
function stripLetterPrefix(s) {
  return typeof s === 'string' ? s.replace(/^[A-D][).:]\s+/, '').trim() : s
}

// Model frequently rewrites a sentence to add justifying context but forgets to keep
// the "_____" blank, filling in the answer word instead. If the answer text appears
// exactly once in the sentence, swap it back for "_____" rather than dropping the fix.
function reinsertBlank(sentence, answer) {
  if (!sentence || !answer) return sentence
  const re = new RegExp(`\\b${answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
  const matches = sentence.match(re)
  if (matches && matches.length === 1) return sentence.replace(re, '_____')
  return sentence
}

// ── Validation (per-item, never trust the model blindly) ────────────────────
// Mutates issue.fix in place to normalize recoverable formatting slips (letter
// prefixes) — the goal is to salvage genuinely-flagged content issues, not just
// reject anything that deviates from the exact requested shape.
function validateIssue(issue, gs) {
  if (!issue || typeof issue !== 'object') return 'not an object'
  const { exercise, item_id, fix } = issue
  if (!['ex1_mcq', 'ex2_scramble', 'ex3_gap_fill'].includes(exercise)) return `unknown exercise "${exercise}"`
  const items = gs[exercise]?.items ?? []
  const original = items.find(it => it.id === item_id)
  if (!original) return `item_id ${item_id} not found in ${exercise}`
  if (!fix || typeof fix !== 'object') return 'missing fix object'

  // Only require the "_____" blank marker if the ORIGINAL sentence used one —
  // some items (e.g. short-answer Yes/No questions) never had a blank at all.
  const needsBlank = typeof original.sentence === 'string' && original.sentence.includes('_____')

  if (exercise === 'ex1_mcq') {
    if (Array.isArray(fix.options)) fix.options = fix.options.map(stripLetterPrefix)
    if (typeof fix.answer === 'string') fix.answer = stripLetterPrefix(fix.answer)
    if (needsBlank && typeof fix.sentence === 'string' && !fix.sentence.includes('_____')) {
      fix.sentence = reinsertBlank(fix.sentence, fix.answer)
    }
    if (typeof fix.sentence !== 'string' || !fix.sentence.trim() || (needsBlank && !fix.sentence.includes('_____'))) return 'ex1_mcq fix.sentence invalid'
    if (!Array.isArray(fix.options) || fix.options.length !== 4 || fix.options.some(o => typeof o !== 'string' || !o.trim())) return 'ex1_mcq fix.options invalid'
    if (typeof fix.answer !== 'string' || !fix.options.includes(fix.answer)) return 'ex1_mcq fix.answer not in options'
  } else if (exercise === 'ex2_scramble') {
    if (!Array.isArray(fix.words) || fix.words.length < 2 || fix.words.some(w => typeof w !== 'string' || !w.trim())) return 'ex2_scramble fix.words invalid'
    if (typeof fix.answer !== 'string' || !fix.answer.trim()) return 'ex2_scramble fix.answer invalid'
    const charBag = s => s.toLowerCase().replace(/[^a-z0-9]/g, '').split('').sort().join('')
    if (charBag(fix.words.join('')) !== charBag(fix.answer)) return 'ex2_scramble words/answer mismatch (tiles cannot reconstruct the answer)'
  } else if (exercise === 'ex3_gap_fill') {
    if (needsBlank && typeof fix.sentence === 'string' && !fix.sentence.includes('_____')) {
      fix.sentence = reinsertBlank(fix.sentence, fix.answer)
    }
    if (typeof fix.sentence !== 'string' || !fix.sentence.trim() || (needsBlank && !fix.sentence.includes('_____'))) return 'ex3_gap_fill fix.sentence invalid'
    if (typeof fix.answer !== 'string' || !fix.answer.trim()) return 'ex3_gap_fill fix.answer invalid'
  }
  return null // valid
}

async function auditTopic(topicId) {
  const jsonPath = path.join(DATA_DIR, `${topicId}.json`)
  if (!fs.existsSync(jsonPath)) { console.log('  ⚠️  Not found'); return { topicId, issues: [], failed: true } }
  const json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
  const gs = json.grammar_spotlight
  if (!gs) { console.log('  ⚠️  No grammar_spotlight'); return { topicId, issues: [], failed: true } }

  const prompt = buildPrompt(gs)
  let parsed
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const raw = stripFences(await callAPI(prompt))
      if (!raw) throw new Error('empty response content')
      parsed = JSON.parse(raw)
      break
    } catch (e) {
      if (attempt < 4) { console.log(`  ⚠️  parse error (attempt ${attempt}/4): ${e.message.slice(0, 60)}`); await sleep(3000 * attempt) }
      else { console.log(`  ❌ Error: ${e.message}`); return { topicId, issues: [], failed: true } }
    }
  }

  const rawIssues = Array.isArray(parsed?.issues) ? parsed.issues : []
  const valid = [], dropped = []
  for (const raw of rawIssues) {
    const issue = { ...raw, exercise: typeof raw.exercise === 'string' ? raw.exercise.toLowerCase() : raw.exercise }
    const err = validateIssue(issue, gs)
    if (err) dropped.push({ issue, err })
    else valid.push(issue)
  }
  if (dropped.length) {
    console.log(`  ⚠️  dropped ${dropped.length} invalid issue(s): ${dropped.map(d => d.err).join('; ')}`)
    for (const d of dropped) console.log(`     raw: ${JSON.stringify(d.issue)}`)
  }
  console.log(valid.length ? `  🚩 ${valid.length} issue(s) flagged` : '  ✅ clean')
  return { topicId, issues: valid, failed: false }
}

const force = args.includes('--force')

async function runAudit() {
  const files = fs.readdirSync(DATA_DIR).filter(f => /^b\d-t\d+\.json$/.test(f)).sort()
  let topics = files.map(f => f.replace('.json', ''))
  if (topicArg) {
    const padded = topicArg.padStart(2, '0')
    topics = topics.filter(id => id === `b${bookNum}-t${padded}`)
  }
  if (fromArg != null || toArg != null) {
    topics = topics.filter(id => {
      const n = parseInt(id.match(/-t(\d+)$/)[1])
      return (fromArg == null || n >= fromArg) && (toArg == null || n <= toArg)
    })
  }

  console.log(`\n🔍 Audit Grammar Spotlight — Book ${bookNum} (${topics.length} topics, ${provider} ${MODEL})`)
  console.log('─'.repeat(50))

  const readReport = () => fs.existsSync(REPORT_PATH) ? JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8')) : {}
  let report = readReport()

  // Re-reads the file fresh and overlays only THIS topic's result — safe when a second
  // process (e.g. a different --provider) is concurrently writing other topics.
  const writeOne = (id, value) => {
    fs.mkdirSync(REPORT_DIR, { recursive: true })
    const fresh = readReport()
    fresh[id] = value
    fs.writeFileSync(REPORT_PATH, JSON.stringify(fresh, null, 2), 'utf-8')
    return fresh
  }

  let skipped = 0
  for (const id of topics) {
    if (!force && report[id] && report[id] !== '__error__') { skipped++; continue }
    console.log(`\n[${id}]`)
    const result = await auditTopic(id)
    report = writeOne(id, result.failed ? '__error__' : result.issues) // incremental — survives interruption/crash, concurrent-safe
    await sleep(DELAY_MS)
  }
  if (skipped) console.log(`\n(skipped ${skipped} already-audited topic(s) — use --force to re-audit)`)

  report = readReport()
  const errored = Object.entries(report).filter(([, v]) => v === '__error__').map(([k]) => k)
  const totalIssues = Object.values(report).filter(Array.isArray).reduce((s, arr) => s + arr.length, 0)
  console.log(`\n${'─'.repeat(50)}`)
  console.log(`✅ Audit done. ${totalIssues} issue(s) across ${Object.keys(report).length} topics → ${REPORT_PATH}`)
  if (errored.length) console.log(`⚠️  ${errored.length} topic(s) failed after retries, re-run the same command to retry them: ${errored.join(', ')}`)
  console.log(`   Review the report, then run with --apply to write fixes.`)
}

// ── Apply: re-validate against CURRENT json (may have changed since audit), write ──
function runApply() {
  if (!fs.existsSync(REPORT_PATH)) { console.error(`No report at ${REPORT_PATH}. Run audit first.`); process.exit(1) }
  const report = JSON.parse(fs.readFileSync(REPORT_PATH, 'utf-8'))

  let topicsChanged = 0, itemsApplied = 0, itemsSkipped = 0

  for (const [topicId, issues] of Object.entries(report)) {
    if (!Array.isArray(issues) || !issues.length) continue
    if (topicArg) {
      const padded = topicArg.padStart(2, '0')
      if (topicId !== `b${bookNum}-t${padded}`) continue
    }
    const jsonPath = path.join(DATA_DIR, `${topicId}.json`)
    if (!fs.existsSync(jsonPath)) { console.log(`⚠️  ${topicId}: JSON not found, skip`); continue }
    const json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
    const gs = json.grammar_spotlight
    if (!gs) { console.log(`⚠️  ${topicId}: no grammar_spotlight, skip`); continue }

    let changed = false
    for (const issue of issues) {
      const err = validateIssue(issue, gs)
      if (err) { console.log(`  ⚠️  ${topicId} ${issue.exercise}#${issue.item_id}: re-validation failed (${err}), skip`); itemsSkipped++; continue }
      const items = gs[issue.exercise].items
      const idx = items.findIndex(it => it.id === issue.item_id)
      items[idx] = { ...items[idx], ...issue.fix }
      changed = true
      itemsApplied++
    }
    if (changed) {
      fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2), 'utf-8')
      topicsChanged++
      console.log(`  ✅ ${topicId}: written`)
    }
  }

  console.log(`\n✅ Applied ${itemsApplied} fix(es) across ${topicsChanged} topic(s). ${itemsSkipped} skipped (re-validation failed).`)
}

if (apply) runApply()
else runAudit().catch(e => { console.error(e); process.exit(1) })
