// Export E3 (ex2_mcq_context) items across a book (or all 3 books) to Markdown
// for GPT Plus logic audit. Re-import counterpart: --import.
// Grading reads item.answer directly (not the top-level answer_key), but we
// keep answer_key.ex2 in sync too for consistency.
//
// Usage:
//   node scripts/export-e3-mcq.js --book 1                   → export book 1
//   node scripts/export-e3-mcq.js --all                      → export all 3 books, chunked
//   node scripts/export-e3-mcq.js --book 1 --import <file>   → import corrected md back

const fs   = require('fs')
const path = require('path')

const ROOT    = path.join(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'exports', 'e3-audit')
const ARROW   = '→'

const args     = process.argv.slice(2)
const bookArg  = args.includes('--book') ? args[args.indexOf('--book') + 1] : null
const doAll    = args.includes('--all')
const splitArg = args.includes('--split') ? parseInt(args[args.indexOf('--split') + 1]) : 1
const importAt = args.includes('--import') ? args[args.indexOf('--import') + 1] : null

function topicFiles(book) {
  const dir = path.join(ROOT, 'data', 'vocabwise', `book${book}`)
  return fs.readdirSync(dir).filter(f => /^b\d-t\d+\.json$/.test(f)).sort().map(f => path.join(dir, f))
}

function topicLines(file) {
  const topicId = path.basename(file, '.json')
  const d  = JSON.parse(fs.readFileSync(file, 'utf-8'))
  const ex = d.exercises?.ex2_mcq_context
  if (!ex) return null
  const lines = [`<!-- topic: ${topicId} -->`]
  for (const it of ex.items) {
    lines.push(`${it.id}. ${it.sentence}`)
    const opts = it.options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join('  |  ')
    lines.push(`   ${opts}  ${ARROW}  ${it.answer}`)
  }
  lines.push(`<!-- /topic -->`, '')
  return lines
}

function doExport() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const books = doAll ? [1, 2, 3] : [parseInt(bookArg)]
  const header = [
    '# E3 — MCQ Context audit',
    '> Chỉ đánh dấu câu có 2+ đáp án đều đúng do thiếu ngữ cảnh. Giữ format dòng y hệt.',
    '',
  ]

  for (const b of books) {
    const allTopicLines = topicFiles(b).map(topicLines).filter(Boolean)
    const chunkSize = Math.ceil(allTopicLines.length / splitArg)
    for (let part = 0; part < splitArg; part++) {
      const chunk = allTopicLines.slice(part * chunkSize, (part + 1) * chunkSize)
      if (!chunk.length) continue
      const text = [...header, ...chunk.flat()].join('\n')
      const name = splitArg > 1 ? `book${b}-part${part + 1}.md` : `book${b}.md`
      fs.writeFileSync(path.join(OUT_DIR, name), text, 'utf-8')
      console.log(`✅ ${name}: ${chunk.length} topics, ${text.length} chars`)
    }
  }
}

function doImport() {
  const book = parseInt(bookArg)
  const md   = fs.readFileSync(importAt, 'utf-8')
  const blocks = md.split(/<!-- topic: (b\d-t\d+) -->/).slice(1)
  let updated = 0, itemsChanged = 0

  for (let i = 0; i < blocks.length; i += 2) {
    const topicId = blocks[i].trim()
    const content = blocks[i + 1] ?? ''
    const file = path.join(ROOT, 'data', 'vocabwise', `book${book}`, `${topicId}.json`)
    if (!fs.existsSync(file)) { console.log(`⚠️  ${topicId}: not found`); continue }
    const d  = JSON.parse(fs.readFileSync(file, 'utf-8'))
    const ex = d.exercises?.ex2_mcq_context
    if (!ex) continue

    const itemChunks = content.split(/\n(?=\d+\.\s)/).filter(b => /^\d+\./.test(b.trim()))
    let changed = false
    for (const chunk of itemChunks) {
      const lines = chunk.trim().split('\n')
      const idMatch = lines[0].match(/^(\d+)\.\s*(.+)/)
      if (!idMatch) continue
      const id = parseInt(idMatch[1])
      // GPT's own file-export step sometimes double-mangles UTF-8 (mojibake), corrupting the
      // em-dash and other accented characters to "â"/"Ã©"-style artifacts. Only the em-dash
      // shows up mid-sentence (real arrows only ever appear on the options line below), so
      // restoring " â " -> " — " here is safe and recovers the intended punctuation.
      const sentence = idMatch[2].trim().replace(/\sâ\s/g, ' — ')
      const optLine = (lines[1] ?? '').trim()
      const m = optLine.match(/A\.\s*(.+?)\s+\|\s+B\.\s*(.+?)\s+\|\s+C\.\s*(.+?)\s+\|\s+D\.\s*(.+?)\s+(?:→|â)\s+(.+)/)
      if (!m) continue
      const options = [m[1].trim(), m[2].trim(), m[3].trim(), m[4].trim()]
      const answer  = m[5].trim()
      if (!options.includes(answer)) { console.log(`  ❌ ${topicId}#${id}: answer not in options, skip`); continue }

      const item = ex.items.find(it => it.id === id)
      if (!item) continue
      if (item.sentence === sentence && JSON.stringify(item.options) === JSON.stringify(options) && item.answer === answer) continue

      // Safety net: flag any other leftover mojibake byte-patterns (Ã©, á», áº, Æ°, Ä+non-letter)
      // that this parser doesn't know how to repair, so they get a manual look instead of
      // silently landing in the JSON (happened once with "café" -> "cafÃ©", "đồng" -> "Äá»ng").
      const suspect = [sentence, ...options, answer].join(' ').match(/Ã©|Ã |á»|áº|Æ°|Ä[^a-zA-Z ]/g)
      if (suspect) console.log(`  ⚠️  ${topicId}#${id}: possible leftover mojibake ${JSON.stringify(suspect)} — check manually`)

      item.sentence = sentence
      item.options  = options
      item.answer   = answer
      if (d.answer_key?.ex2) d.answer_key.ex2[String(id)] = answer
      changed = true
      itemsChanged++
    }
    if (changed) {
      fs.writeFileSync(file, JSON.stringify(d, null, 2), 'utf-8')
      updated++
      console.log(`✅ ${topicId}: written`)
    }
  }
  console.log(`\n✅ Updated ${updated} topic(s), ${itemsChanged} item(s) changed. Nhớ chạy: node scripts/vw-seed.js --book ${book} để reseed Supabase.`)
}

if (importAt) doImport()
else doExport()
