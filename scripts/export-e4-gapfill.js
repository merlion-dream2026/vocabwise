// Export E4 (ex3_gap_fill) items across a book to Markdown for GPT Plus logic
// audit. Re-import counterpart: --import. Grading reads item.answer directly
// (not the top-level answer_key), but we keep answer_key.ex3 in sync too.
//
// Usage:
//   node scripts/export-e4-gapfill.js --book 1 --split 1        → export
//   node scripts/export-e4-gapfill.js --book 1 --import <file>  → import corrected md back

const fs   = require('fs')
const path = require('path')

const ROOT    = path.join(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'exports', 'e4-audit')
const ARROW   = '→'

// Same mojibake-repair heuristic as export-e3-mcq.js — GPT's own file-export step
// sometimes double-mangles UTF-8, collapsing em-dash/curly-quotes/apostrophes to "â".
function restoreMojibakePunctuation(s) {
  return s
    // Any UTF-8 2-byte char starting with lead byte 0xC2 (U+0080-U+00BF, e.g. °, ·, ×)
    // mis-decodes as Latin-1 into a stray "Â" immediately followed by the already-correct
    // trailing character — just drop the stray "Â" (e.g. "0Â°C" -> "0°C").
    .replace(/Â(?=.)/g, '')
    .replace(/â(\S(?:.*?\S)?)â/g, '"$1"')
    .replace(/(\s)â(\s)/g, '$1—$2')
    .replace(/([a-zA-Z])â([a-zA-Z])/g, "$1'$2")
    .replace(/([a-zA-Z])â(?=[\s,.;:])/g, "$1'")
}

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
  const ex = d.exercises?.ex3_gap_fill
  if (!ex) return null
  const lines = [`<!-- topic: ${topicId} -->`, `word_bank: ${ex.word_bank.join(' · ')}`]
  for (const it of ex.items) {
    lines.push(`${it.id}. ${it.sentence}  ${ARROW}  ${it.answer}`)
  }
  lines.push(`<!-- /topic -->`, '')
  return lines
}

function doExport() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const books = doAll ? [1, 2, 3] : [parseInt(bookArg)]
  const header = [
    '# E4 — Gap Fill audit',
    '> Chỉ đánh dấu câu có 2+ từ trong word_bank đều điền hợp lý do thiếu ngữ cảnh. Giữ format dòng y hệt, giữ nguyên word_bank.',
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
    const ex = d.exercises?.ex3_gap_fill
    if (!ex) continue

    const bankMatch = content.match(/word_bank:\s*(.+)/)
    // "·" (middle dot) mojibakes to "Â·" (stray "Â" + literal dot) via the same UTF-8
    // double-encoding as the "â" cases — split on either form and trim leftover "Â".
    const newBank = bankMatch ? bankMatch[1].split(/Â?·/).map(w => w.trim()).filter(Boolean) : null
    const bankForCheck = (newBank ?? ex.word_bank).map(w => w.toLowerCase())

    let changed = false
    if (newBank && JSON.stringify(newBank) !== JSON.stringify(ex.word_bank)) {
      ex.word_bank = newBank
      changed = true
    }

    const itemChunks = content.split(/\n(?=\d+\.\s)/).filter(b => /^\d+\./.test(b.trim()))
    for (const chunk of itemChunks) {
      const line = chunk.trim().split('\n')[0]
      // Greedy sentence capture: a mid-sentence em-dash (mojibake'd to the same "â" as the
      // arrow) must not be mistaken for the id/answer separator, so match the LAST "â"/"→"
      // in the line, not the first.
      const m = line.match(/^(\d+)\.\s+(.+)\s+(?:→|â)\s+(.+)/)
      if (!m) continue
      const id       = parseInt(m[1])
      const sentence = restoreMojibakePunctuation(m[2].trim())
      const answer   = restoreMojibakePunctuation(m[3].trim())
      if (!bankForCheck.includes(answer.toLowerCase())) { console.log(`  ❌ ${topicId}#${id}: answer "${answer}" not in word_bank, skip`); continue }

      const item = ex.items.find(it => it.id === id)
      if (!item) continue
      if (item.sentence === sentence && item.answer === answer) continue

      const suspect = `${sentence} ${answer}`.match(/Ã©|Ã |á»|áº|Æ°|Ä[^a-zA-Z ]|â/g)
      if (suspect) console.log(`  ⚠️  ${topicId}#${id}: possible leftover mojibake ${JSON.stringify(suspect)} — check manually`)

      item.sentence = sentence
      item.answer   = answer
      if (d.answer_key?.ex3) d.answer_key.ex3[String(id)] = answer
      changed = true
      itemsChanged++
    }
    if (changed) {
      fs.writeFileSync(file, JSON.stringify(d, null, 2), 'utf-8')
      updated++
      console.log(`✅ ${topicId}: written`)
    }
  }
  console.log(`\n✅ Updated ${updated} topic(s), ${itemsChanged} item(s) changed. Nhớ chạy: node scripts/vw-seed.js --book ${book} --dir data/vocabwise/book${book}/ để reseed Supabase.`)
}

if (importAt) doImport()
else doExport()
