// Export all E8 ErrorFix items (exercises.ex5_error_fix) to per-book Markdown files
// for external audit (GPT). Re-import counterpart: scripts/import-e8-errorfix.js
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'exports', 'e8-audit')

function exportBook(book) {
  const dir = path.join(ROOT, 'data', 'vocabwise', `book${book}`)
  const files = fs.readdirSync(dir).filter(f => /^b\d+-t\d+\.json$/.test(f)).sort()

  const lines = []
  for (const file of files) {
    const topicId = file.replace('.json', '')
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))
    const ex = data.exercises?.ex5_error_fix
    if (!ex) continue

    for (const item of ex.items) {
      lines.push(`### [book${book}/${topicId}/item${item.id}]`)
      lines.push(`SENTENCE: ${item.sentence}`)
      lines.push(`HIGHLIGHTED: ${item.highlighted}`)
      lines.push(`A: ${item.options.A}`)
      lines.push(`B: ${item.options.B}`)
      lines.push(`C: ${item.options.C}`)
      lines.push(`ANSWER: ${item.answer}`)
      lines.push(`EXPLANATION_EN: ${item.explanation}`)
      if (item.explanation_vi) lines.push(`EXPLANATION_VI: ${item.explanation_vi}`)
      lines.push('')
    }
  }

  fs.mkdirSync(OUT_DIR, { recursive: true })
  const outPath = path.join(OUT_DIR, `book${book}.md`)
  fs.writeFileSync(outPath, lines.join('\n'))
  console.log(`book${book}: ${files.length} topics → ${outPath}`)
}

for (const book of [1, 2, 3]) exportBook(book)
