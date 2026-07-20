// One-off fix: QC pass on gen-word-family import found ~19 English homograph
// pairs (record, output, witness, ...) where the verb sense genuinely differs
// from the noun sense, but the imported `meaning` just copied the noun gloss.
// Corrects the verb-form meaning in place across all 4 levels.
//
// Usage: node scripts/fix-word-family-glosses.js

const fs = require('fs')
const path = require('path')

const LEVELS = ['ranger', 'explorer', 'scholar', 'master']

// key: `${word.toLowerCase()}:${pos}` -> corrected meaning
const FIXES = {
  'schedule:v': 'lên lịch, sắp xếp',
  'plot:v': 'lập kế hoạch, âm mưu',
  'output:v': 'tạo ra, xuất ra',
  'witness:v': 'chứng kiến',
  'record:v': 'ghi âm, ghi lại',
  'target:v': 'nhắm đến, nhắm mục tiêu',
  'feature:v': 'có sự góp mặt của, nổi bật với',
  'sample:v': 'lấy mẫu, thử',
  'budget:v': 'lập ngân sách, phân bổ chi tiêu',
  'tax:v': 'đánh thuế',
  'credit:v': 'ghi công, công nhận',
}

let fixed = 0
for (const level of LEVELS) {
  const levelFile = path.join(__dirname, '..', 'data', 'words', `${level}.json`)
  const data = JSON.parse(fs.readFileSync(levelFile, 'utf8'))
  for (const topic of data.topics) {
    for (const w of topic.words) {
      if (!Array.isArray(w.wordFamily)) continue
      for (const f of w.wordFamily) {
        const key = `${f.word.toLowerCase()}:${f.pos}`
        if (FIXES[key] && f.meaning !== FIXES[key]) {
          console.log(`${level}: ${w.word} — ${f.pos}:${f.word} "${f.meaning}" -> "${FIXES[key]}"`)
          f.meaning = FIXES[key]
          fixed++
        }
      }
    }
  }
  fs.writeFileSync(levelFile, JSON.stringify(data))
}

console.log(`\n✅ Fixed ${fixed} glosses across ${LEVELS.length} levels.`)
