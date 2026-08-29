// Merge diff-format fixes (OLD example snippet → NEW example snippet) into
// kids_explanations.explanation_vi via literal string replacement — does NOT
// touch anything else in the definition. Counterpart to the subagent-driven
// audit pass (see exports/kids-codeswitching-fix/PROMPT-DIFF.md).
//
// Input format per block:
//   [[word]]
//   OLD: "...exact original broken snippet..."
//   NEW: "<EN sentence>" (<VN translation>)
//
// Usage:
//   node scripts/merge-kids-example-diffs.js exports/kids-codeswitching-fix/diff-*.md [--dry-run]

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
try { require('dotenv').config({ path: '.env.local' }) } catch {}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const files = args.filter(a => !a.startsWith('--'))

if (files.length === 0) {
  console.error('Usage: node scripts/merge-kids-example-diffs.js <diff-file.md> [more files...] [--dry-run]')
  process.exit(1)
}

function parseBlocks(text) {
  const blocks = {}
  const re = /\[\[([^\]]+)\]\]\s*\nOLD:\s*([\s\S]*?)\nNEW:\s*([\s\S]*?)(?=\n\[\[|$)/g
  let m
  while ((m = re.exec(text))) {
    const key = m[1].trim()
    const oldText = m[2].trim().replace(/^"|"$/g, '')
    const newText = m[3].trim()
    if (key && oldText && newText) blocks[key] = { oldText, newText }
  }
  return blocks
}

// Normalize for a fallback fuzzy match if the exact substring isn't found
// (curly vs straight quotes, stray whitespace are the usual culprits).
function normalize(s) {
  return s.replace(/[""]/g, '"').replace(/['']/g, "'").replace(/\s+/g, ' ').trim()
}

async function main() {
  const allBlocks = {}
  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8')
    const blocks = parseBlocks(text)
    console.log(`${f}: ${Object.keys(blocks).length} blocks parsed`)
    Object.assign(allBlocks, blocks)
  }
  console.log(`\nTotal parsed: ${Object.keys(allBlocks).length}`)

  let written = 0, skipped = 0, noMatch = 0
  for (const [word, { oldText, newText }] of Object.entries(allBlocks)) {
    const { data, error: readErr } = await supabase.from('kids_explanations').select('explanation_vi').eq('word', word.toLowerCase()).single()
    if (readErr || !data) { console.log(`✗ ${word} — not found in DB`); skipped++; continue }

    const current = data.explanation_vi
    let updated = null
    if (current.includes(oldText)) {
      updated = current.replace(oldText, newText)
    } else {
      // fallback: normalized match
      const normCurrent = normalize(current)
      const normOld = normalize(oldText)
      if (normCurrent.includes(normOld)) {
        // find the actual (non-normalized) span by locating normalized index isn't safe to splice back —
        // flag for manual review instead of guessing.
        console.log(`⚠ ${word} — OLD matches only after normalization, skipping auto-merge (needs manual check)`)
        noMatch++
        continue
      }
      console.log(`✗ ${word} — OLD snippet not found in current text`)
      noMatch++
      continue
    }

    if (dryRun) { console.log(`✓ ${word} [dry-run]`); written++; continue }

    const { error: writeErr } = await supabase.from('kids_explanations').update({ explanation_vi: updated }).eq('word', word.toLowerCase())
    if (writeErr) { console.log(`✗ ${word} — DB error: ${writeErr.message}`); skipped++ }
    else { console.log(`✓ ${word}`); written++ }
  }

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`${dryRun ? 'Would write' : 'Written'}: ${written} · No-match (needs review): ${noMatch} · Skipped: ${skipped}`)
}

main().catch(e => { console.error(e); process.exit(1) })
