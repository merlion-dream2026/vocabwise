// Import Gemini's rewritten explanation_vi text back into vw_glossary. Validates
// every block mechanically before writing — never trust external LLM output
// blindly (see feedback_export_audit_import_workflow memory).
//
// Usage:
//   node scripts/import-gemini-explanations.js exports/truncation-fix/result-1.md [result-2.md ...]
//   node scripts/import-gemini-explanations.js exports/truncation-fix/result-1.md --dry-run

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
try { require('dotenv').config({ path: '.env.local' }) } catch {}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const files = args.filter(a => !a.startsWith('--'))

if (files.length === 0) {
  console.error('Usage: node scripts/import-gemini-explanations.js <result-file.md> [more files...] [--dry-run]')
  process.exit(1)
}

function looksTruncated(text) { return !/[.!?"”)*]\s*$/.test(text) }

function parseBlocks(text) {
  const blocks = {}
  const re = /\[\[([^\]]+)\]\]\s*\n([\s\S]*?)(?=\n\[\[|$)/g
  let m
  while ((m = re.exec(text))) {
    const key = m[1].trim()
    const body = m[2].trim()
    if (key && body) blocks[key] = body
  }
  return blocks
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

  let written = 0, skipped = 0
  for (const [key, body] of Object.entries(allBlocks)) {
    const [topicId, word] = key.split('/')
    if (!topicId || !word) { console.log(`✗ ${key} — malformed key`); skipped++; continue }

    if (body.length < 60) { console.log(`✗ ${key} — too short (${body.length} chars)`); skipped++; continue }
    if (looksTruncated(body)) { console.log(`✗ ${key} — still looks truncated`); skipped++; continue }
    if (/^#{1,6}\s/m.test(body)) { console.log(`✗ ${key} — contains markdown heading`); skipped++; continue }

    if (dryRun) { console.log(`✓ ${key} (${body.length} chars) [dry-run]`); written++; continue }

    const { error, count } = await supabase
      .from('vw_glossary')
      .update({ explanation_vi: body })
      .eq('topic_id', topicId)
      .eq('word', word)
      .select('id', { count: 'exact' })

    if (error) { console.log(`✗ ${key} — DB error: ${error.message}`); skipped++ }
    else if (count === 0) { console.log(`✗ ${key} — no matching row in DB`); skipped++ }
    else { console.log(`✓ ${key} (${body.length} chars)`); written++ }
  }

  console.log(`\n${'─'.repeat(50)}`)
  console.log(`${dryRun ? 'Would write' : 'Written'}: ${written} · Skipped: ${skipped}`)
  console.log(`Note: mechanical checks only catch truncation/formatting. Spot-check a sample for code-switching/mistranslation/gibberish before trusting the whole batch.`)
}

main().catch(e => { console.error(e); process.exit(1) })
