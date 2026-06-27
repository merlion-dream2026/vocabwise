// ═══════════════════════════════════════════════════════════════════════════
// Pre-generate explanation_vi for all Kids words via Groq 8b-instant.
// Saves to kids_explanations table → served instantly, zero runtime API calls.
//
// Usage:
//   node scripts/gen-kids-explanations.js           → all 2,400 words
//   node scripts/gen-kids-explanations.js --level seeker → one level only
//   node scripts/gen-kids-explanations.js --dry-run → preview count only
//
// Token budget (8b-instant free tier: 500k TPD):
//   ~200 tokens/word → ~2,500 words/day → all 2,400 words in 1 day
//
// Requires env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY
// ═══════════════════════════════════════════════════════════════════════════

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

try { require('dotenv').config({ path: '.env.local' }) } catch {}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
const GROQ_API_KEY = process.env.GROQ_API_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase   = createClient(SUPABASE_URL, SERVICE_KEY)
const args       = process.argv.slice(2)
const levelArg   = args.includes('--level') ? args[args.indexOf('--level') + 1] : null
const modelArg   = args.includes('--model') ? args[args.indexOf('--model') + 1] : '8b'
const dryRun     = args.includes('--dry-run')
const DELAY_MS   = 2200

const MODEL_ID  = modelArg === 'cerebras' ? 'gpt-oss-120b' : 'llama-3.1-8b-instant'
const MODEL_TPD = modelArg === 'cerebras' ? 1_000_000 : 500_000
const API_BASE  = modelArg === 'cerebras' ? 'https://api.cerebras.ai/v1' : 'https://api.groq.com/openai/v1'
const API_KEY   = modelArg === 'cerebras' ? process.env.CEREBRAS_API_KEY : GROQ_API_KEY

if (!API_KEY) {
  console.error(`Missing env var: ${modelArg === 'cerebras' ? 'CEREBRAS_API_KEY' : 'GROQ_API_KEY'}`)
  process.exit(1)
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function generateExplanation(word, pos, meaning_vi, example_en) {
  const prompt = `Giải thích từ tiếng Anh "${word}"${pos ? ` (${pos})` : ''} cho học sinh Việt Nam học tiếng Anh.
Nghĩa: ${meaning_vi}
Ví dụ: ${example_en}

Viết 2-3 câu ngắn bằng tiếng Việt: khi nào dùng từ này trong cuộc sống, và 1 ví dụ mới gần gũi dễ nhớ. Không lặp lại ví dụ gốc. Dùng ngôn ngữ đơn giản, dễ hiểu.`

  const res = await fetch(`${API_BASE}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL_ID,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: modelArg === 'cerebras' ? 300 : 250,
      temperature: 0.7,
    }),
  })

  if (res.status === 429) throw new Error('RATE_LIMIT')
  if (!res.ok) throw new Error(`HTTP_${res.status}`)

  const d = await res.json()
  return d.choices?.[0]?.message?.content?.trim() ?? ''
}

async function main() {
  const wordsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/words.json'), 'utf8'))

  // Collect all unique words (lowercase key) with metadata
  const wordMap = new Map()
  for (const [level, levelData] of Object.entries(wordsData)) {
    if (levelArg && level !== levelArg) continue
    for (const topic of levelData.topics) {
      for (const w of topic.words) {
        const key = w.word.toLowerCase()
        if (!wordMap.has(key)) {
          wordMap.set(key, { word: w.word, pos: w.class ?? '', meaning_vi: w.meaning ?? '', example_en: w.examples?.[0]?.en ?? '' })
        }
      }
    }
  }

  // Filter out already-generated
  const { data: existing } = await supabase.from('kids_explanations').select('word')
  const done = new Set((existing ?? []).map(r => r.word))
  const pending = [...wordMap.values()].filter(w => !done.has(w.word.toLowerCase()))

  const estTokens = pending.length * 200
  console.log(`\n📚 Words to process: ${pending.length} (${done.size} already done)`)
  console.log(`🤖 Model: ${MODEL_ID}`)
  console.log(`⏱  Est. time: ${Math.ceil(pending.length * DELAY_MS / 60000)} min at ${Math.round(60000 / DELAY_MS)} RPM`)
  console.log(`🔋 Est. tokens: ~${estTokens.toLocaleString()} → ~${Math.ceil(estTokens / MODEL_TPD)} day(s)`)

  if (dryRun) { console.log('\n(dry-run — no changes made)'); return }
  if (pending.length === 0) { console.log('\n✅ All words already generated!'); return }

  console.log('\nStarting in 3 seconds... (Ctrl+C to abort)')
  await sleep(3000)

  let generated = 0, failed = 0
  for (let i = 0; i < pending.length; i++) {
    const item = pending[i]
    const label = item.word.padEnd(20)
    process.stdout.write(`[${String(i + 1).padStart(4)}/${pending.length}] ${label}`)

    try {
      const explanation = await generateExplanation(item.word, item.pos, item.meaning_vi, item.example_en)
      if (!explanation) { console.log(' ⚠ empty'); failed++; await sleep(DELAY_MS); continue }

      const { error } = await supabase.from('kids_explanations').upsert({ word: item.word.toLowerCase(), explanation_vi: explanation })
      if (error) { console.log(` ✗ DB: ${error.message}`); failed++ }
      else { console.log(' ✓'); generated++ }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg === 'RATE_LIMIT') {
        console.log(' ✗ RATE_LIMIT')
        console.log('\n⏸  Rate limited — waiting 60s...')
        await sleep(60000)
        i-- // retry same word
        continue
      }
      console.log(` ✗ ${msg}`)
      failed++
    }

    await sleep(DELAY_MS)
  }

  console.log('\n' + '─'.repeat(50))
  console.log(`✅ Done: ${generated} generated · ${failed} failed · ${done.size} skipped`)
  if (failed > 0) console.log('Remaining without explanation: run script again to retry failed items.')
}

main().catch(console.error)
