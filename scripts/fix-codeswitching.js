// ═══════════════════════════════════════════════════════════════════════════
// Detect and fix code-switching in vw_glossary explanation_vi (Book 1 & 2).
// Code-switching = English words used inline inside Vietnamese sentences.
//
// Strategy: detect → targeted correction (not full regeneration).
// ~4x more token-efficient than regenerating all entries.
//
// Usage:
//   node scripts/fix-codeswitching.js --book 1          → detect + fix Book 1
//   node scripts/fix-codeswitching.js --book 2          → detect + fix Book 2
//   node scripts/fix-codeswitching.js --book 1 --detect-only → show flagged, no fix
//   node scripts/fix-codeswitching.js --book 1 --dry-run     → count only
//
// Requires env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY
// ═══════════════════════════════════════════════════════════════════════════

const { createClient } = require('@supabase/supabase-js')

try { require('dotenv').config({ path: '.env.local' }) } catch {}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
const GROQ_API_KEY = process.env.GROQ_API_KEY

if (!SUPABASE_URL || !SERVICE_KEY || !GROQ_API_KEY) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY')
  process.exit(1)
}

const supabase   = createClient(SUPABASE_URL, SERVICE_KEY)
const args       = process.argv.slice(2)
const bookArg    = args.includes('--book')  ? args[args.indexOf('--book')  + 1] : null
const modelArg   = args.includes('--model') ? args[args.indexOf('--model') + 1] : '8b'
const detectOnly = args.includes('--detect-only')
const dryRun     = args.includes('--dry-run')
const DELAY_MS   = 2200

const MODEL_ID = 'openai/gpt-oss-120b' // llama-3.1-8b-instant decommissioned by Groq (2026-08); --model 70b|8b now both resolve here

if (!bookArg) { console.error('Usage: --book 1|2|3 [--model 8b|70b]'); process.exit(1) }

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ─── Detection ───────────────────────────────────────────────────────────────

const VI_CHARS = /[àáảãạăắặẳẵâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđÀÁẢÃẠĂẮẶẲẴÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ]/

// Blocklist: English verbs/nouns commonly used as inline code-switches in IELTS explanations
// These have clear Vietnamese equivalents but AI lazily inserts English instead
const CODE_SWITCH_BLOCKLIST = new Set([
  // Verbs
  'consider','achieve','perform','create','manage','express','challenge','involve',
  'develop','approach','describe','indicate','suggest','require','ensure','maintain',
  'support','improve','affect','reflect','connect','compare','contrast','relate',
  'determine','identify','distinguish','contribute','influence','enable','prevent',
  'reduce','increase','apply','implement','analyze','evaluate','demonstrate',
  'establish','promote','enhance','generate','monitor','prioritize','validate',
  'represent','associate','communicate','emphasize','indicate','highlight',
  'reference','represent','respond','utilize','experience','encourage','recognize',
  // Common daily verbs also code-switched
  'notice','lend','hire','handle','share','join','check','offer','match',
  'build','start','stop','help','open','close','send','follow','pick','pay',
  'care','serve','cause','show','keep','meet','lose','gain','reach','plan',
  // Nouns
  'performance','achievement','management','approach','challenge','consideration',
  'comparison','evaluation','contribution','impact','relationship','combination',
  'requirement','improvement','prevention','reduction','application','implementation',
  'experience','opportunity','responsibility','development','understanding',
])

function isInlineCodeSwitch(sentence, targetWord) {
  // True code-switch: English word must have Vietnamese context BOTH before AND after it
  // Filters out: English example sentences, synonyms listed at start of line
  const pos = sentence.toLowerCase().indexOf(targetWord.toLowerCase())
  if (pos === -1) return false
  const before = sentence.slice(0, pos)
  const after  = sentence.slice(pos + targetWord.length)
  return VI_CHARS.test(before) && VI_CHARS.test(after)
}

function detectCodeSwitching(word, explanationVi) {
  const wordLower = word.toLowerCase()

  // Strip: target word itself, IPA /.../, bold **...**, markdown headers
  let text = explanationVi
    .replace(new RegExp(`\\b${wordLower.replace(/[-‑]/g,'[-‑]')}[a-z]*\\b`, 'gi'), ' ')
    .replace(/\/[^\s/]{1,40}\//g, ' ')
    .replace(/\*{1,3}[^*\n]*\*{1,3}/g, ' ')
    .replace(/^#+\s.*/gm, ' ')

  const sentences = text.split(/[.\n;!?]/)
  const flaggedWords = []

  for (const sentence of sentences) {
    if (!VI_CHARS.test(sentence)) continue // skip pure-English sentences

    for (const w of CODE_SWITCH_BLOCKLIST) {
      const re = new RegExp(`\\b${w}\\b`, 'i')
      if (re.test(sentence) && isInlineCodeSwitch(sentence, w)) {
        flaggedWords.push(w)
      }
    }
  }

  return { flagged: flaggedWords.length >= 1, words: [...new Set(flaggedWords)] }
}

// ─── Fix ─────────────────────────────────────────────────────────────────────

async function fixCodeSwitching(word, explanationVi, codeSwitchWords) {
  const prompt = `Đoạn giải nghĩa từ tiếng Anh bên dưới có lỗi code-switching: dùng từ tiếng Anh (${codeSwitchWords.join(', ')}) trong câu tiếng Việt.

Từ mục tiêu (KHÔNG phải lỗi, giữ nguyên): "${word}"

Nhiệm vụ: Thay các từ tiếng Anh bị code-switch bằng từ tiếng Việt tương đương. Giữ nguyên toàn bộ cấu trúc, format markdown, và nội dung. Chỉ sửa đúng chỗ bị lỗi.
Chỉ trả về đoạn đã sửa, không giải thích thêm.

Đoạn cần sửa:
${explanationVi}`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL_ID,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
      temperature: 0.3,
    }),
  })

  if (res.status === 429) throw new Error('RATE_LIMIT')
  if (!res.ok) throw new Error(`HTTP_${res.status}`)

  const d = await res.json()
  return d.choices?.[0]?.message?.content?.trim() ?? ''
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const { data: items, error } = await supabase
    .from('vw_glossary')
    .select('id, word, explanation_vi, topic_id')
    .eq('item_type', 'word')
    .not('explanation_vi', 'is', null)
    .like('topic_id', `b${bookArg}-%`)
    .order('id')

  if (error) { console.error('DB error:', error.message); process.exit(1) }

  // Run detection
  const flagged = (items ?? []).filter(item => {
    const { flagged } = detectCodeSwitching(item.word, item.explanation_vi)
    return flagged
  }).map(item => ({
    ...item,
    codeWords: detectCodeSwitching(item.word, item.explanation_vi).words
  }))

  const total  = items?.length ?? 0
  const pct    = ((flagged.length / total) * 100).toFixed(1)

  console.log(`\n📖 Book ${bookArg}: ${total} entries scanned`)
  console.log(`🔍 Code-switching detected: ${flagged.length} entries (${pct}%)`)

  if (dryRun || flagged.length === 0) {
    if (flagged.length > 0) {
      console.log('\nSample flagged entries:')
      flagged.slice(0, 5).forEach(f => console.log(`  • ${f.word.padEnd(25)} → [${f.codeWords.join(', ')}]`))
    }
    console.log('\n(dry-run — no changes made)')
    return
  }

  if (detectOnly) {
    console.log('\nFlagged entries:')
    flagged.forEach(f => console.log(`  • ${f.word.padEnd(25)} [${f.codeWords.join(', ')}]`))
    return
  }

  console.log(`\nFixing ${flagged.length} entries with ${MODEL_ID} (targeted correction)...`)
  console.log('Starting in 3 seconds...')
  await sleep(3000)

  let fixed = 0, failed = 0
  for (let i = 0; i < flagged.length; i++) {
    const item = flagged[i]
    process.stdout.write(`[${String(i+1).padStart(3)}/${flagged.length}] ${item.word.padEnd(25)} [${item.codeWords.join(', ')}]`)

    try {
      const corrected = await fixCodeSwitching(item.word, item.explanation_vi, item.codeWords)
      if (!corrected) { console.log(' ⚠ empty'); failed++; await sleep(DELAY_MS); continue }

      const { error: dbErr } = await supabase
        .from('vw_glossary')
        .update({ explanation_vi: corrected })
        .eq('id', item.id)

      if (dbErr) { console.log(` ✗ DB: ${dbErr.message}`); failed++ }
      else { console.log(' ✓'); fixed++ }
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
  console.log(`✅ Done: ${fixed} fixed · ${failed} failed`)
}

main().catch(console.error)
