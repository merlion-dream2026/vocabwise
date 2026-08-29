// Detection-only scan for code-switching / gibberish Vietnamese across ALL Academic
// glossary explanation_vi rows — replaces the old blocklist-based fix-codeswitching.js
// (which only covered Book 1+2 and missed most real cases, see 2026-08-26 audit).
// Cheap classification-only prompt (no rewrite), so it's fast enough to run the full
// corpus via Groq automated, unlike the truncation-fix which needed Gemini Pro manual
// chunks for the heavier generate+critique pipeline.
//
// Writes flagged rows to exports/codeswitching-scan/flagged.json for review/fixing
// in a follow-up pass. Does NOT write to DB — read-only.
//
// Usage: node scripts/scan-codeswitching.js [--book 1|2|3] [--limit N]

const { createClient } = require('@supabase/supabase-js')
const { generateWithRetry } = require('./lib/contentValidate')
const fs = require('fs')
const path = require('path')
try { require('dotenv').config({ path: '.env.local' }) } catch {}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const args = process.argv.slice(2)
const bookArg = args.includes('--book') ? args[args.indexOf('--book') + 1] : null
const limitArg = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1], 10) : Infinity
const OUT_DIR = path.join(__dirname, '..', 'exports', 'codeswitching-scan')
const STATE_PATH = path.join(OUT_DIR, 'STATE.json')
const DELAY_MS = 2200

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function loadState() {
  if (!fs.existsSync(STATE_PATH)) return { scanned: {}, flagged: {} }
  return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'))
}
function saveState(s) { fs.mkdirSync(OUT_DIR, { recursive: true }); fs.writeFileSync(STATE_PATH, JSON.stringify(s, null, 2)) }

async function classify(text, word) {
  const prompt = `Đọc đoạn giải thích tiếng Việt sau (dành cho học sinh Việt Nam học từ vựng tiếng Anh "${word}"):

"""
${text}
"""

Kiểm tra 3 lỗi:
1. Từ tiếng Anh bị chèn giữa câu tiếng Việt mà lẽ ra phải dịch — BAO GỒM cả chính từ mục tiêu "${word}" nếu nó xuất hiện bên trong một câu tiếng Việt đang mô tả ví dụ/ngữ cảnh. CHỈ được giữ nguyên "${word}" khi nó đứng độc lập để định nghĩa hoặc nằm trong 1 câu ví dụ TOÀN TIẾNG ANH có ngoặc kép riêng.
2. Dịch sai nghĩa, sai từ loại, hoặc thông tin sai sự thật.
3. Từ/cụm từ tiếng Việt bị bịa ra, không có nghĩa, hoặc không phải tiếng Việt thật.

Chỉ trả lời JSON: {"ok": true} nếu sạch, hoặc {"ok": false, "issue": "<mô tả ngắn 1 câu>"} nếu có lỗi.`

  const raw = await generateWithRetry({ prompt, maxTokens: 400, temperature: 0.2, json: true })
  return JSON.parse(raw)
}

async function main() {
  let query = supabase.from('vw_glossary').select('id, topic_id, word, explanation_vi').eq('item_type', 'word').not('explanation_vi', 'is', null)
  if (bookArg) query = query.like('topic_id', `b${bookArg}-%`)

  const rows = []
  for (let page = 0; ; page++) {
    const { data: batch, error } = await query.range(page * 1000, page * 1000 + 999)
    if (error) { console.error(error.message); process.exit(1) }
    if (!batch || batch.length === 0) break
    rows.push(...batch)
    if (batch.length < 1000) break
  }

  const state = loadState()
  const pending = rows.filter(r => !state.scanned[r.id])
  console.log(`Total: ${rows.length} · Already scanned: ${rows.length - pending.length} · Pending: ${pending.length}`)

  let done = 0, consecutiveRateLimits = 0
  for (const row of pending) {
    if (done >= limitArg) break
    const tag = `${row.topic_id}/${row.word}`.padEnd(35)
    process.stdout.write(tag)
    try {
      const result = await classify(row.explanation_vi, row.word)
      state.scanned[row.id] = true
      if (!result.ok) {
        state.flagged[row.id] = { topic_id: row.topic_id, word: row.word, issue: result.issue }
        console.log(`⚠ ${result.issue}`)
      } else {
        console.log('✓')
      }
      done++
      consecutiveRateLimits = 0
      if (done % 20 === 0) saveState(state) // checkpoint periodically
    } catch (e) {
      if (e.message === 'RATE_LIMIT') {
        consecutiveRateLimits++
        if (consecutiveRateLimits >= 3) { console.log('✗ rate limited 3x — stopping, re-run later to resume'); break }
        console.log('✗ rate limited — waiting 60s'); await sleep(60000); continue
      }
      console.log(`✗ ${e.message}`)
    }
    await sleep(DELAY_MS)
  }

  saveState(state)
  const flaggedCount = Object.keys(state.flagged).length
  const scannedCount = Object.keys(state.scanned).length
  console.log(`\nThis run: ${done} scanned. Total progress: ${scannedCount}/${rows.length}. Flagged so far: ${flaggedCount}.`)
}

main().catch(e => { console.error(e); process.exit(1) })
