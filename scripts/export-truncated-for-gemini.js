// Export all remaining truncated vw_glossary.explanation_vi rows to chunked
// plain-text files for a manual Gemini Pro pass (bypasses Groq's free-tier TPD
// bottleneck). Counterpart: scripts/import-gemini-explanations.js
//
// Usage: node scripts/export-truncated-for-gemini.js

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
try { require('dotenv').config({ path: '.env.local' }) } catch {}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const OUT_DIR = path.join(__dirname, '..', 'exports', 'truncation-fix')
const CHUNK_SIZE = 70

function looksTruncated(text) { return !/[.!?"”)*]\s*$/.test(text) }

async function main() {
  const rows = []
  for (let page = 0; ; page++) {
    const { data: batch, error } = await supabase
      .from('vw_glossary')
      .select('topic_id, word, pos, meaning_vi, example_en, explanation_vi')
      .eq('item_type', 'word')
      .not('explanation_vi', 'is', null)
      .range(page * 1000, page * 1000 + 999)
    if (error) { console.error(error.message); process.exit(1) }
    if (!batch || batch.length === 0) break
    rows.push(...batch)
    if (batch.length < 1000) break
  }

  const targets = rows.filter(r => looksTruncated(r.explanation_vi)).sort((a, b) => a.topic_id.localeCompare(b.topic_id))
  console.log(`Truncated rows: ${targets.length}`)

  fs.mkdirSync(OUT_DIR, { recursive: true })
  const chunks = []
  for (let i = 0; i < targets.length; i += CHUNK_SIZE) chunks.push(targets.slice(i, i + CHUNK_SIZE))

  chunks.forEach((chunk, idx) => {
    const lines = []
    for (const r of chunk) {
      lines.push(`[[${r.topic_id}/${r.word}]]`)
      lines.push(`WORD: ${r.word}${r.pos ? ` (${r.pos})` : ''}`)
      lines.push(`MEANING: ${r.meaning_vi}`)
      lines.push(`EXAMPLE: ${r.example_en}`)
      lines.push('')
    }
    const file = path.join(OUT_DIR, `chunk-${idx + 1}.md`)
    fs.writeFileSync(file, lines.join('\n'))
    console.log(`chunk-${idx + 1}.md — ${chunk.length} items`)
  })

  console.log(`\n${chunks.length} chunk file(s) written to ${OUT_DIR}`)
}

main().catch(e => { console.error(e); process.exit(1) })
