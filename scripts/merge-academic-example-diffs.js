// Merge diff-format fixes (OLD example snippet → NEW example snippet) into
// vw_glossary.explanation_vi via literal string replacement — does NOT touch
// anything else in the definition. Academic variant of merge-kids-example-diffs.js
// (Academic rows are keyed by topic_id+word, not word alone — word repeats
// across topics/books).
//
// Input format per block:
//   [[topic_id/word]]
//   OLD: "...exact original broken snippet..."
//   NEW: "<EN sentence>" (<VN translation>)
//
// Usage:
//   node scripts/merge-academic-example-diffs.js exports/codeswitching-fix/diff-*.md [--dry-run]

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
try { require('dotenv').config({ path: '.env.local' }) } catch {}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const files = args.filter(a => !a.startsWith('--'))

if (files.length === 0) {
  console.error('Usage: node scripts/merge-academic-example-diffs.js <diff-file.md> [more files...] [--dry-run]')
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

// Escape regex metachars, then let any literal space match 1+ whitespace chars
// of any kind — Unicode narrow-no-break-space (U+202F) and curly vs straight
// quotes are the recurring culprits (see Daily/Kids run 2026-08-29).
function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }
// Unicode escapes used explicitly (not literal curly chars) — a prior version
// typed literal “ ” characters here and they silently collapsed to plain ASCII
// " when the file was written, so the "flexible" fallback never actually
// matched curly quotes. Verify with a char-code check if this file is ever
// hand-edited again.
const DQUOTE_CLASS = '["“”]'
const SQUOTE_CLASS = "['‘’]"
function flexRe(s) {
  const normalizedQuotes = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'")
  const pattern = escapeRe(normalizedQuotes)
    .replace(/ /g, '\\s+')
    .replace(/"/g, DQUOTE_CLASS)
    .replace(/'/g, SQUOTE_CLASS)
  return new RegExp(pattern)
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
  for (const [key, { oldText, newText }] of Object.entries(allBlocks)) {
    const [topicId, word] = key.split('/')
    if (!topicId || !word) { console.log(`✗ ${key} — malformed key`); skipped++; continue }

    const { data, error: readErr } = await supabase.from('vw_glossary').select('explanation_vi').eq('topic_id', topicId).eq('word', word).single()
    if (readErr || !data) { console.log(`✗ ${key} — not found in DB`); skipped++; continue }

    const current = data.explanation_vi
    let updated = null

    if (current.includes(oldText)) {
      updated = current.replace(oldText, newText)
    } else {
      const re = flexRe(oldText)
      const m = current.match(re)
      if (m) {
        updated = current.replace(re, newText)
        console.log(`~ ${key} — matched via flexible whitespace/quote match`)
      } else {
        console.log(`✗ ${key} — OLD snippet not found (even flexibly), needs manual review`)
        noMatch++
        continue
      }
    }

    if (dryRun) { console.log(`✓ ${key} [dry-run]`); written++; continue }

    const { error: writeErr } = await supabase.from('vw_glossary').update({ explanation_vi: updated }).eq('topic_id', topicId).eq('word', word)
    if (writeErr) { console.log(`✗ ${key} — DB error: ${writeErr.message}`); skipped++ }
    else { console.log(`✓ ${key}`); written++ }
  }

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`${dryRun ? 'Would write' : 'Written'}: ${written} · No-match (needs manual review): ${noMatch} · Skipped: ${skipped}`)
}

main().catch(e => { console.error(e); process.exit(1) })
