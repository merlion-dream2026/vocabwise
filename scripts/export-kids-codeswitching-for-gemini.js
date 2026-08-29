// Export kids_explanations (1,866 unique words) for a Gemini audit pass — ONLY
// targets code-switching in the example sentence (English word/phrase left
// untranslated inside a Vietnamese sentence, e.g. "I love bạn" instead of
// "I love you" (Tôi yêu bạn)). Narrower scope than the Academic round: does NOT
// ask Gemini to rewrite the definition — only patch the broken example line —
// to keep this pass cheap (per Andie: "không cần re-generate lại định nghĩa").
// Counterpart: scripts/import-kids-explanations.js
//
// Usage: node scripts/export-kids-codeswitching-for-gemini.js

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
try { require('dotenv').config({ path: '.env.local' }) } catch {}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const OUT_DIR = path.join(__dirname, '..', 'exports', 'kids-codeswitching-fix')
const CHUNK_SIZE = 50

async function main() {
  // meaning_vi isn't stored in kids_explanations (cache table only has word+explanation_vi)
  // — pull it from the word JSON source of truth for prompt context.
  const wordsDir = path.join(__dirname, '..', 'data', 'words')
  const meaningMap = new Map()
  for (const file of fs.readdirSync(wordsDir).filter(f => f.endsWith('.json'))) {
    const data = JSON.parse(fs.readFileSync(path.join(wordsDir, file), 'utf8'))
    for (const topic of data.topics) {
      for (const w of topic.words) {
        const key = w.word.toLowerCase()
        if (!meaningMap.has(key)) meaningMap.set(key, { pos: w.class ?? '', meaning_vi: w.meaning ?? '' })
      }
    }
  }

  const rows = []
  for (let page = 0; ; page++) {
    const { data: batch, error } = await supabase.from('kids_explanations').select('word, explanation_vi').range(page * 1000, page * 1000 + 999)
    if (error) { console.error(error.message); process.exit(1) }
    if (!batch || batch.length === 0) break
    rows.push(...batch)
    if (batch.length < 1000) break
  }
  rows.sort((a, b) => a.word.localeCompare(b.word))
  console.log(`Total rows: ${rows.length}`)

  fs.mkdirSync(OUT_DIR, { recursive: true })
  const chunks = []
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) chunks.push(rows.slice(i, i + CHUNK_SIZE))

  chunks.forEach((chunk, idx) => {
    const lines = []
    for (const r of chunk) {
      const meta = meaningMap.get(r.word.toLowerCase()) ?? { pos: '', meaning_vi: '' }
      lines.push(`[[${r.word}]]`)
      lines.push(`WORD: ${r.word}${meta.pos ? ` (${meta.pos})` : ''}`)
      lines.push(`MEANING: ${meta.meaning_vi}`)
      lines.push(`EXPLANATION: ${r.explanation_vi}`)
      lines.push('')
    }
    const file = path.join(OUT_DIR, `chunk-${String(idx + 1).padStart(2, '0')}.md`)
    fs.writeFileSync(file, lines.join('\n'))
  })

  console.log(`${chunks.length} chunk file(s) written to ${OUT_DIR} (${CHUNK_SIZE} items/chunk)`)
}

main().catch(e => { console.error(e); process.exit(1) })
