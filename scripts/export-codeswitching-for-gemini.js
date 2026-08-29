// Export ALL Academic glossary explanation_vi (existing content, not regenerated from
// scratch) to chunked files for a Gemini Pro audit pass — code-switching / mistranslation
// / gibberish Vietnamese. Counterpart: scripts/import-gemini-explanations.js (reused as-is
// — it already writes whatever [[topic_id/word]] blocks it's given, partial output is fine).
//
// Usage: node scripts/export-codeswitching-for-gemini.js [--book 1|2|3]

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
try { require('dotenv').config({ path: '.env.local' }) } catch {}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const OUT_DIR = path.join(__dirname, '..', 'exports', 'codeswitching-fix')
const CHUNK_SIZE = 50 // worst-case (~750-800 chars/item when every item needs a rewrite) stays under the 50k-char chat paste limit with buffer; 100 proved too large (hit the cap twice)
const bookArg = process.argv.includes('--book') ? process.argv[process.argv.indexOf('--book') + 1] : null

async function main() {
  const rows = []
  for (let page = 0; ; page++) {
    let query = supabase.from('vw_glossary').select('topic_id, word, pos, meaning_vi, example_en, explanation_vi').eq('item_type', 'word').not('explanation_vi', 'is', null)
    if (bookArg) query = query.like('topic_id', `b${bookArg}-%`)
    const { data: batch, error } = await query.range(page * 1000, page * 1000 + 999)
    if (error) { console.error(error.message); process.exit(1) }
    if (!batch || batch.length === 0) break
    rows.push(...batch)
    if (batch.length < 1000) break
  }
  rows.sort((a, b) => a.topic_id.localeCompare(b.topic_id))
  console.log(`Total rows: ${rows.length}`)

  fs.mkdirSync(OUT_DIR, { recursive: true })
  const chunks = []
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) chunks.push(rows.slice(i, i + CHUNK_SIZE))

  chunks.forEach((chunk, idx) => {
    const lines = []
    for (const r of chunk) {
      lines.push(`[[${r.topic_id}/${r.word}]]`)
      lines.push(`WORD: ${r.word}${r.pos ? ` (${r.pos})` : ''}`)
      lines.push(`MEANING: ${r.meaning_vi}`)
      lines.push(`EXPLANATION: ${r.explanation_vi}`)
      lines.push('')
    }
    const file = path.join(OUT_DIR, `chunk-${String(idx + 1).padStart(2, '0')}.md`)
    fs.writeFileSync(file, lines.join('\n'))
  })

  console.log(`${chunks.length} chunk file(s) written to ${OUT_DIR} (${CHUNK_SIZE} items/chunk)`)
}

main().catch(e => { console.error(e); process.exit(1) })
