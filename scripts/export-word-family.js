// Exports words missing `wordFamily` from data/words/{level}.json into plain-text
// chunks for the GPT Plus export/audit/import workflow (see memory
// feedback_export_audit_import_workflow). Paste each exports/word-family/{level}.txt
// into ChatGPT together with exports/word-family/PROMPT.md, save the reply as
// exports/word-family/{level}-result.txt, then run scripts/import-word-family.js.
//
// Usage: node scripts/export-word-family.js [level]   (default: all 4 levels)

const fs = require('fs')
const path = require('path')

const LEVELS = ['ranger', 'explorer', 'scholar', 'master']
const levelArg = process.argv[2]
const levels = levelArg ? [levelArg] : LEVELS

const OUT_DIR = path.join(__dirname, '..', 'exports', 'word-family')
fs.mkdirSync(OUT_DIR, { recursive: true })

for (const level of levels) {
  const levelFile = path.join(__dirname, '..', 'data', 'words', `${level}.json`)
  const data = JSON.parse(fs.readFileSync(levelFile, 'utf8'))

  const lines = []
  for (const topic of data.topics) {
    for (const w of topic.words) {
      if (w.class === 'phrase') continue
      if (Array.isArray(w.wordFamily) && w.wordFamily.length > 0) continue
      const meaning = (w.meaning ?? '').replace(/[|=\n]/g, ' ').trim()
      lines.push(`word=${w.word}|pos=${w.class ?? ''}|meaning=${meaning}`)
    }
  }

  const outFile = path.join(OUT_DIR, `${level}.txt`)
  fs.writeFileSync(outFile, lines.join('\n') + '\n')
  console.log(`${level}: exported ${lines.length} words -> ${path.relative(process.cwd(), outFile)}`)
}
