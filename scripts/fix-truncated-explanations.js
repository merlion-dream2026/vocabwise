// Regenerate vw_glossary.explanation_vi rows left truncated mid-sentence (missing
// finish_reason check in the original generation script — root cause fixed in
// scripts/lib/contentValidate.js's generateWithRetry). Also runs the new semantic
// critique pass so the same batch closes out code-switching/mistranslation for
// these rows too, not just truncation.
//
// Detects truncation by an improved heuristic (no trailing sentence punctuation,
// tolerating markdown italics) rather than the old <60-char threshold, which
// missed most real cases.
//
// Usage: node scripts/fix-truncated-explanations.js [--dry-run] [--book 1|2|3]

const { createClient } = require('@supabase/supabase-js')
const { generateWithRetry, critiqueVietnameseText } = require('./lib/contentValidate')
try { require('dotenv').config({ path: '.env.local' }) } catch {}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const bookArg = args.includes('--book') ? args[args.indexOf('--book') + 1] : null
const DELAY_MS = 2500

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
function looksTruncated(text) { return !/[.!?"”)*]\s*$/.test(text) }

function buildPrompt(word, pos, meaning_vi, example_en) {
  return `Giải thích từ tiếng Anh "${word}"${pos ? ` (${pos})` : ''} cho học sinh Việt Nam học IELTS.
Nghĩa: ${meaning_vi}
Ví dụ: ${example_en}

Viết 3-4 câu ngắn bằng tiếng Việt: ngữ cảnh thường dùng, phân biệt với từ đồng nghĩa nếu có, và 1 ví dụ mới dễ nhớ. Không lặp lại ví dụ gốc.

QUY TẮC BẮT BUỘC: Toàn bộ nội dung phải viết hoàn toàn bằng tiếng Việt. Tuyệt đối không dùng từ tiếng Anh trong câu tiếng Việt (ví dụ sai: "bạn nên consider"; đúng: "bạn nên cân nhắc"). Chỉ chấp nhận từ tiếng Anh ở tiêu đề hoặc ký hiệu phiên âm IPA.`
}

async function main() {
  // PostgREST caps a single select() at 1000 rows on this project — paginate.
  const rows = []
  for (let page = 0; ; page++) {
    let query = supabase.from('vw_glossary').select('id, topic_id, word, pos, meaning_vi, example_en, explanation_vi').eq('item_type', 'word').not('explanation_vi', 'is', null)
    if (bookArg) query = query.like('topic_id', `b${bookArg}-%`)
    const { data: batch, error } = await query.range(page * 1000, page * 1000 + 999)
    if (error) { console.error(error.message); process.exit(1) }
    if (!batch || batch.length === 0) break
    rows.push(...batch)
    if (batch.length < 1000) break
  }

  const targets = rows.filter(r => looksTruncated(r.explanation_vi))
  console.log(`Scanned: ${rows.length} · Truncated: ${targets.length}`)
  if (dryRun) { targets.forEach(t => console.log(` ${t.topic_id}/${t.word}`)); return }
  if (targets.length === 0) return

  console.log('\nStarting in 3s... (Ctrl+C to abort)\n')
  await sleep(3000)

  let fixed = 0, failed = 0, consecutiveRateLimits = 0
  for (let i = 0; i < targets.length; i++) {
    const t = targets[i]
    const tag = `[${String(i + 1).padStart(4)}/${targets.length}] ${t.topic_id}/${t.word}`.padEnd(35)
    process.stdout.write(tag)
    try {
      const prompt = buildPrompt(t.word, t.pos, t.meaning_vi, t.example_en)
      const draft = await generateWithRetry({ prompt, maxTokens: 450, temperature: 0.7 })
      if (!draft || draft.length < 60) { console.log('✗ generation too short'); failed++; await sleep(DELAY_MS); continue }
      const final = await critiqueVietnameseText(draft, t.word)
      const { error: dbErr } = await supabase.from('vw_glossary').update({ explanation_vi: final }).eq('id', t.id)
      if (dbErr) { console.log(`✗ DB: ${dbErr.message}`); failed++ }
      else { console.log(`✓ (${final.length} chars${final !== draft ? ', critique fixed' : ''})`); fixed++ }
      consecutiveRateLimits = 0
    } catch (e) {
      if (e.message === 'RATE_LIMIT') {
        consecutiveRateLimits++
        if (consecutiveRateLimits >= 3) {
          console.log('✗ rate limited 3x in a row — likely daily TPD exhausted, stopping. Re-run later/tomorrow to resume.')
          break
        }
        console.log('✗ rate limited — waiting 60s')
        await sleep(60000); i--; continue
      }
      console.log(`✗ ${e.message}`); failed++
      consecutiveRateLimits = 0
    }
    await sleep(DELAY_MS)
  }
  console.log(`\nThis run: ${fixed} fixed, ${failed} failed. Re-run the script anytime — it only targets rows still truncated.`)
}

main().catch(e => { console.error(e); process.exit(1) })
