// Exports words whose `wordFamily` currently has exactly 1 item (i.e. the
// Word Family UI block is hidden for them) so an external LLM can audit
// whether that's genuinely correct or a missed family (see the "microscope"
// case: had only itself, but "microscopic" is a real common adjective).
//
// Usage: node scripts/export-word-family-audit.js [level]

const fs = require('fs')
const path = require('path')

const LEVELS = ['ranger', 'explorer', 'scholar', 'master']
const levelArg = process.argv[2]
const levels = levelArg ? [levelArg] : LEVELS

const OUT_DIR = path.join(__dirname, '..', 'exports', 'word-family-audit')
fs.mkdirSync(OUT_DIR, { recursive: true })

for (const level of levels) {
  const levelFile = path.join(__dirname, '..', 'data', 'words', `${level}.json`)
  const data = JSON.parse(fs.readFileSync(levelFile, 'utf8'))

  const lines = []
  for (const topic of data.topics) {
    for (const w of topic.words) {
      if (!Array.isArray(w.wordFamily) || w.wordFamily.length !== 1) continue
      const meaning = (w.meaning ?? '').replace(/[|=\n]/g, ' ').trim()
      lines.push(`word=${w.word}|pos=${w.class ?? ''}|meaning=${meaning}`)
    }
  }

  const outFile = path.join(OUT_DIR, `${level}.txt`)
  fs.writeFileSync(outFile, lines.join('\n') + '\n')
  console.log(`${level}: exported ${lines.length} single-item words -> ${path.relative(process.cwd(), outFile)}`)
}
