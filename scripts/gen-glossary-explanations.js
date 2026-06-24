// ═══════════════════════════════════════════════════════════════════════════
// Pre-generate explanation_vi for all vw_glossary words via Groq 8b-instant.
// Saves to DB → UI shows instantly with zero API calls at runtime.
//
// Usage:
//   node scripts/gen-glossary-explanations.js           → all books
//   node scripts/gen-glossary-explanations.js --book 1  → Book 1 only (~900 words)
//   node scripts/gen-glossary-explanations.js --book 2  → Book 2 only
//   node scripts/gen-glossary-explanations.js --book 3  → Book 3 only (~600 words)
//   node scripts/gen-glossary-explanations.js --dry-run → preview count only
//
// Token budget (8b-instant free tier: 500k TPD):
//   ~370 tokens/word → max ~1,350 words/day
//   Book 1 (900 words) = ~1 day | Book 2 (900) = ~1 day | Book 3 (600) = ~1 day
//
// Requires env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY
// ═══════════════════════════════════════════════════════════════════════════

const { createClient } = require('@supabase/supabase-js')

// Try loading .env.local if available
try { require('dotenv').config({ path: '.env.local' }) } catch {}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
const GROQ_API_KEY = process.env.GROQ_API_KEY

if (!SUPABASE_URL || !SERVICE_KEY || !GROQ_API_KEY) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const args    = process.argv.slice(2)
const bookArg = args.includes('--book') ? args[args.indexOf('--book') + 1] : null
const dryRun  = args.includes('--dry-run')
const DELAY_MS = 2200  // ~27 RPM, safely under 30 RPM limit

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function generateExplanation(word, pos, meaning_vi, example_en) {
  const prompt = `Giải thích từ tiếng Anh "${word}"${pos ? ` (${pos})` : ''} cho học sinh Việt Nam học IELTS.
Nghĩa: ${meaning_vi}
Ví dụ: ${example_en}

Viết 3-4 câu ngắn bằng tiếng Việt: ngữ cảnh thường dùng, phân biệt với từ đồng nghĩa nếu có, và 1 ví dụ mới dễ nhớ. Không lặp lại ví dụ gốc.`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 250,
      temperature: 0.7,
    }),
  })

  if (res.status === 429) throw new Error('RATE_LIMIT')
  if (!res.ok) throw new Error(`HTTP_${res.status}`)

  const d = await res.json()
  return d.choices?.[0]?.message?.content?.trim() ?? ''
}

async function main() {
  // Build query — only words (not collocations), missing explanation_vi
  let query = supabase
    .from('vw_glossary')
    .select('id, word, pos, meaning_vi, example_en, topic_id')
    .is('explanation_vi', null)
    .eq('item_type', 'word')
    .order('id')

  if (bookArg) {
    query = query.like('topic_id', `b${bookArg}-%`)
  }

  const { data: items, error } = await query
  if (error) { console.error('DB error:', error.message); process.exit(1) }

  const total = items?.length ?? 0
  const estTokens = total * 370
  const estDays   = Math.ceil(estTokens / 500000)

  console.log(`\n📚 Words to process: ${total}`)
  console.log(`⏱  Est. time: ${Math.ceil(total * DELAY_MS / 60000)} min at ${Math.round(60000 / DELAY_MS)} RPM`)
  console.log(`🔋 Est. tokens: ~${estTokens.toLocaleString()} → ~${estDays} day(s) of 8b-instant free quota`)

  if (dryRun || total === 0) {
    if (total === 0) console.log('\n✅ All words already have explanations!')
    else console.log('\n(dry-run — no changes made)')
    return
  }

  console.log('\nStarting in 3 seconds... (Ctrl+C to abort)\n')
  await sleep(3000)

  let ok = 0, fail = 0, skipped = 0

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const tag  = `[${String(i + 1).padStart(4, ' ')}/${total}] ${item.word.padEnd(20)} (${item.topic_id})`

    try {
      const explanation = await generateExplanation(item.word, item.pos, item.meaning_vi, item.example_en)

      if (!explanation) { process.stdout.write(`${tag} ⚠ empty\n`); skipped++; continue }

      const { error: dbErr } = await supabase
        .from('vw_glossary')
        .update({ explanation_vi: explanation })
        .eq('id', item.id)

      if (dbErr) throw new Error(dbErr.message)

      process.stdout.write(`${tag} ✓\n`)
      ok++
    } catch (e) {
      const msg = e.message
      process.stdout.write(`${tag} ✗ ${msg}\n`)
      fail++
      // On rate limit, pause 60s then retry
      if (msg === 'RATE_LIMIT') {
        console.log('\n⏸  Rate limited — waiting 60s...')
        await sleep(60000)
        i-- // retry same item
        continue
      }
    }

    if (i < items.length - 1) await sleep(DELAY_MS)
  }

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`✅ Done: ${ok} generated · ${fail} failed · ${skipped} skipped`)
  console.log(`Remaining without explanation: run script again to retry failed items.`)
}

main().catch(e => { console.error(e); process.exit(1) })
