// ═══════════════════════════════════════════════════════════════════════════
// Detect truncated explanation_vi entries in vw_glossary and reset to NULL.
// After running this, use gen-glossary-explanations.js to regenerate.
//
// Usage:
//   node scripts/fix-truncations.js --book 1          → detect + fix Book 1
//   node scripts/fix-truncations.js --book 2          → detect + fix Book 2
//   node scripts/fix-truncations.js --book 3          → detect + fix Book 3
//   node scripts/fix-truncations.js                   → all books
//   node scripts/fix-truncations.js --dry-run         → count only, no changes
//
// Truncation = explanation_vi ends with a letter, digit, comma, dash, colon,
// or semicolon instead of proper sentence-ending punctuation.
// ═══════════════════════════════════════════════════════════════════════════

const { createClient } = require('@supabase/supabase-js')

try { require('dotenv').config({ path: '.env.local' }) } catch {}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
const args     = process.argv.slice(2)
const bookArg  = args.includes('--book') ? args[args.indexOf('--book') + 1] : null
const dryRun   = args.includes('--dry-run')

// Last non-whitespace char should be one of these — anything else = truncated
const OK_ENDINGS = new Set([
  '.', '!', '?', '…',
  '"', '"',   // curly double quotes
  '’', "'",   // curly/straight single quotes (end of example in quotes)
  ')', ']',   // closing brackets
  '*', '_',   // end of markdown bold/italic
])

function isTruncated(text) {
  const trimmed = text.replace(/\s+$/, '')
  if (!trimmed) return true
  return !OK_ENDINGS.has(trimmed[trimmed.length - 1])
}

async function fetchAll(bookFilter) {
  const PAGE = 1000
  let all = [], from = 0
  while (true) {
    let q = supabase
      .from('vw_glossary')
      .select('id, word, topic_id, explanation_vi')
      .eq('item_type', 'word')
      .not('explanation_vi', 'is', null)
      .order('id')
      .range(from, from + PAGE - 1)
    if (bookFilter) q = q.like('topic_id', `b${bookFilter}-%`)
    const { data, error } = await q
    if (error) { console.error('DB error:', error.message); process.exit(1) }
    all = all.concat(data ?? [])
    if (!data || data.length < PAGE) break
    from += PAGE
  }
  return all
}

async function main() {
  const items = await fetchAll(bookArg)

  const truncated = (items ?? []).filter(item => isTruncated(item.explanation_vi))

  const total = items?.length ?? 0
  const pct   = ((truncated.length / total) * 100).toFixed(1)

  console.log(`\n📖 Scanned: ${total} entries${bookArg ? ` (Book ${bookArg})` : ' (all books)'}`)
  console.log(`✂️  Truncated: ${truncated.length} entries (${pct}%)`)

  if (truncated.length > 0) {
    console.log('\nSample truncated entries:')
    truncated.slice(0, 8).forEach(e => {
      const snippet = e.explanation_vi.trimEnd().slice(-60).replace(/\n/g, '↵')
      console.log(`  • ${e.word.padEnd(22)} (${e.topic_id})  …${snippet}`)
    })
  }

  if (dryRun || truncated.length === 0) {
    console.log('\n(dry-run — no changes made)')
    return
  }

  const ids = truncated.map(e => e.id)
  const BATCH = 100
  let nulled = 0

  for (let i = 0; i < ids.length; i += BATCH) {
    const batch = ids.slice(i, i + BATCH)
    const { error: upErr } = await supabase
      .from('vw_glossary')
      .update({ explanation_vi: null })
      .in('id', batch)

    if (upErr) { console.error('Update error:', upErr.message); process.exit(1) }
    nulled += batch.length
    process.stdout.write(`\rNulled ${nulled}/${truncated.length}...`)
  }

  console.log(`\n✅ Done — ${nulled} entries reset to NULL.`)
  console.log(`\nNext step:`)
  if (bookArg) {
    console.log(`  node scripts/gen-glossary-explanations.js --book ${bookArg} --model cerebras`)
  } else {
    console.log(`  node scripts/gen-glossary-explanations.js --model cerebras`)
  }
}

main().catch(console.error)
