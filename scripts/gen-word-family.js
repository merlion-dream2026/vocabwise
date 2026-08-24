// ═══════════════════════════════════════════════════════════════════════════
// Generate `wordFamily` (n/v/adj/adv related forms + short VI meaning) for
// Daily words, writing straight back into data/words/{level}.json (the
// single source of truth for Daily content — see CLAUDE.md). Re-run
// scripts/split-words-per-topic.js after this.
//
// Default model is Cerebras gpt-oss-120b — Groq's llama-3.1-8b-instant was
// tested first and hallucinated too often for this task (invented fake verb
// forms for concrete nouns like "airport", invented unrelated words like
// "banana" -> "banal"). 120b was accurate in manual spot-checks: correctly
// returns a single-item family for concrete nouns instead of inventing one.
// (llama-3.1-8b-instant has since been decommissioned by Groq entirely, 2026-08 —
// --model 8b now falls back to gpt-oss-120b via Groq instead, which was already
// the more accurate choice for this task.)
//
// Usage:
//   node scripts/gen-word-family.js --level ranger
//   node scripts/gen-word-family.js --level explorer --dry-run
//   node scripts/gen-word-family.js --level scholar --force   (regenerate all, incl. already-filled)
//   node scripts/gen-word-family.js --level master --model 8b (fallback to Groq if Cerebras quota runs out)
//
// Requires env: CEREBRAS_API_KEY (fallback GROQ_API_KEY via --model 8b)
// ═══════════════════════════════════════════════════════════════════════════

const fs = require('fs')
const path = require('path')

try { require('dotenv').config({ path: '.env.local' }) } catch {}

const args      = process.argv.slice(2)
const levelArg  = args.includes('--level') ? args[args.indexOf('--level') + 1] : null
const modelArg  = args.includes('--model') ? args[args.indexOf('--model') + 1] : '120b'
const dryRun    = args.includes('--dry-run')
const force     = args.includes('--force')
const DELAY_MS  = 2200

if (!levelArg) {
  console.error('Missing --level (ranger | explorer | scholar | master)')
  process.exit(1)
}

const MODEL_ID = modelArg === '8b' ? 'openai/gpt-oss-120b' : 'gpt-oss-120b'
const API_BASE = modelArg === '8b' ? 'https://api.groq.com/openai/v1' : 'https://api.cerebras.ai/v1'
const API_KEY  = modelArg === '8b' ? process.env.GROQ_API_KEY : process.env.CEREBRAS_API_KEY
const MAX_TOKENS = 900 // gpt-oss-120b spends hidden reasoning tokens before the JSON answer — same on both providers now

if (!API_KEY) {
  console.error(`Missing env var: ${modelArg === '8b' ? 'GROQ_API_KEY' : 'CEREBRAS_API_KEY'}`)
  process.exit(1)
}

const VALID_POS = new Set(['n', 'v', 'adj', 'adv'])

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function buildPrompt(word, pos, meaningVi) {
  return `Cho từ tiếng Anh "${word}" (${pos}), nghĩa tiếng Việt: "${meaningVi}".

Liệt kê word family (họ từ CÙNG GỐC, CÓ THẬT trong từ điển) của từ này: dạng danh từ (n), động từ (v), tính từ (adj), trạng từ (adv) — chỉ liệt kê dạng thật sự tồn tại và thông dụng. Bao gồm cả dạng của chính từ gốc. Mỗi pos chỉ 1 từ (chọn dạng phổ biến nhất, ưu tiên KHÔNG trùng chính tả với từ gốc nếu có dạng khác).

Nếu từ là danh từ cụ thể (đồ vật/con vật/thực phẩm/địa điểm) không có dạng liên quan nào khác, chỉ trả về đúng chính nó (1 phần tử). KHÔNG bịa từ, KHÔNG liệt kê từ ghép (compound words) không liên quan.

Trả JSON thuần: {"forms":[{"pos":"n","word":"...","meaning":"nghĩa Việt ngắn"}]}`
}

async function generateWordFamily(word, pos, meaningVi) {
  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL_ID,
      messages: [{ role: 'user', content: buildPrompt(word, pos, meaningVi) }],
      max_tokens: MAX_TOKENS,
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }),
  })

  if (res.status === 429) throw new Error('RATE_LIMIT')
  if (!res.ok) throw new Error(`HTTP_${res.status}`)

  const d = await res.json()
  const raw = d.choices?.[0]?.message?.content?.trim() ?? ''
  if (!raw) throw new Error('EMPTY_RESPONSE') // likely finish_reason: length (reasoning ate the budget)

  let parsed
  try { parsed = JSON.parse(raw) } catch { throw new Error('BAD_JSON') }
  if (!Array.isArray(parsed.forms)) throw new Error('BAD_SHAPE')

  const seenPos = new Set()
  const forms = []
  for (const f of parsed.forms) {
    if (!f || typeof f.pos !== 'string' || typeof f.word !== 'string' || typeof f.meaning !== 'string') continue
    const p = f.pos.trim().toLowerCase()
    const w = f.word.trim()
    const m = f.meaning.trim()
    if (!VALID_POS.has(p) || seenPos.has(p) || !w || !m) continue
    if (!/^[a-zA-Z' -]+$/.test(w)) continue
    // Defense-in-depth: same spelling as base word but a different pos than the
    // base word's own class is the single most common hallucination pattern
    // observed in testing (e.g. "airport" invented as a verb).
    if (w.toLowerCase() === word.toLowerCase() && p !== pos) continue
    seenPos.add(p)
    forms.push({ pos: p, word: w, meaning: m })
  }
  return forms
}

async function main() {
  const levelFile = path.join(__dirname, '..', 'data', 'words', `${levelArg}.json`)
  if (!fs.existsSync(levelFile)) {
    console.error(`Level file not found: ${levelFile}`)
    process.exit(1)
  }

  const data = JSON.parse(fs.readFileSync(levelFile, 'utf8'))
  const targets = []
  for (const topic of data.topics) {
    for (const w of topic.words) {
      if (w.class === 'phrase') continue
      if (!force && Array.isArray(w.wordFamily) && w.wordFamily.length > 0) continue
      targets.push(w)
    }
  }

  console.log(`\n📚 Level: ${levelArg} — words to process: ${targets.length}`)
  console.log(`🤖 Model: ${MODEL_ID}`)
  console.log(`⏱  Est. time: ${Math.ceil(targets.length * DELAY_MS / 60000)} min`)

  if (dryRun) { console.log('\n(dry-run — no changes made)'); return }
  if (targets.length === 0) { console.log('\n✅ Nothing to do.'); return }

  console.log('\nStarting in 3 seconds... (Ctrl+C to abort)')
  await sleep(3000)

  let generated = 0, empty = 0, failed = 0

  for (let i = 0; i < targets.length; i++) {
    const w = targets[i]
    const label = w.word.padEnd(20)
    process.stdout.write(`[${String(i + 1).padStart(4)}/${targets.length}] ${label}`)

    try {
      const forms = await generateWordFamily(w.word, w.class ?? '', w.meaning ?? '')
      w.wordFamily = forms
      fs.writeFileSync(levelFile, JSON.stringify(data))
      if (forms.length === 0) { console.log(' ○ empty'); empty++ }
      else { console.log(` ✓ ${forms.map(f => f.pos).join(',')}`); generated++ }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg === 'RATE_LIMIT') {
        console.log(' ✗ RATE_LIMIT')
        console.log('\n⏸  Rate limited — waiting 60s...')
        await sleep(60000)
        i--
        continue
      }
      console.log(` ✗ ${msg}`)
      failed++
    }

    await sleep(DELAY_MS)
  }

  console.log('\n' + '─'.repeat(50))
  console.log(`✅ Done: ${generated} generated · ${empty} empty · ${failed} failed`)
  if (failed > 0) console.log('Run the same command again to retry failed items (already-filled words are skipped).')
}

main().catch(console.error)
