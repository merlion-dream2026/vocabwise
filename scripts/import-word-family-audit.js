// Imports GPT Plus's word-family AUDIT reply (only words that needed a fix —
// see exports/word-family-audit/PROMPT.md) into data/words/{level}.json.
// Unlike import-word-family.js, most words are expected to be ABSENT from the
// result file (that means the audit confirmed "no family" was correct).
//
// Usage: node scripts/import-word-family-audit.js <level>

const fs = require('fs')
const path = require('path')

const level = process.argv[2]
if (!level) {
  console.error('Usage: node scripts/import-word-family-audit.js <level>')
  process.exit(1)
}

const VALID_POS = new Set(['n', 'v', 'adj', 'adv'])

const resultFile = path.join(__dirname, '..', 'exports', 'word-family-audit', `${level}-result.txt`)
const levelFile  = path.join(__dirname, '..', 'data', 'words', `${level}.json`)

if (!fs.existsSync(resultFile)) {
  console.error(`Result file not found: ${resultFile}`)
  process.exit(1)
}

const data = JSON.parse(fs.readFileSync(levelFile, 'utf8'))
const wordIndex = new Map()
for (const topic of data.topics) {
  for (const w of topic.words) wordIndex.set(w.word.toLowerCase(), w)
}

const rawLines = fs.readFileSync(resultFile, 'utf8').split('\n').map(l => l.trim()).filter(Boolean)
if (rawLines.length === 1 && rawLines[0].toUpperCase() === 'NO FIXES NEEDED') {
  console.log(`${level}: audit confirmed no fixes needed.`)
  process.exit(0)
}

let fixed = 0, skippedNoMatch = 0, skippedBadLine = 0, skippedNoRealFix = 0
const rejectedForms = []

for (const line of rawLines) {
  const m = line.match(/^word=(.+?)\|family=(.*)$/)
  if (!m) { skippedBadLine++; console.log(`  ⚠ unparsable line: ${line.slice(0, 80)}`); continue }

  const [, wordRaw, familyRaw] = m
  const wordKey = wordRaw.trim().toLowerCase()
  const wordObj = wordIndex.get(wordKey)
  if (!wordObj) { skippedNoMatch++; console.log(`  ⚠ no match in ${level}.json: "${wordRaw.trim()}"`); continue }

  const seenPos = new Set()
  const forms = []
  const entries = familyRaw.split(';').map(s => s.trim()).filter(Boolean)
  for (const entry of entries) {
    const parts = entry.split(':')
    if (parts.length < 3) { rejectedForms.push(`${wordRaw}: bad entry "${entry}"`); continue }
    const pos = parts[0].trim().toLowerCase()
    const formWord = parts[1].trim()
    const meaning = parts.slice(2).join(':').trim()
    if (!VALID_POS.has(pos) || seenPos.has(pos) || !formWord || !meaning) {
      rejectedForms.push(`${wordRaw}: rejected "${entry}"`)
      continue
    }
    if (!/^[a-zA-Z' -]+$/.test(formWord)) { rejectedForms.push(`${wordRaw}: non-alpha form "${formWord}"`); continue }
    seenPos.add(pos)
    forms.push({ pos, word: formWord, meaning })
  }

  if (forms.length < 2) { skippedNoRealFix++; console.log(`  ⚠ still <2 forms after validation, leaving as-is: "${wordRaw.trim()}"`); continue }

  console.log(`  ✓ ${wordObj.word}: ${wordObj.wordFamily.length} -> ${forms.length} forms (${forms.map(f => f.pos).join(',')})`)
  wordObj.wordFamily = forms
  fixed++
}

fs.writeFileSync(levelFile, JSON.stringify(data))

console.log('\n' + '─'.repeat(50))
console.log(`✅ Fixed: ${fixed} words in ${level}.json`)
if (skippedNoMatch > 0) console.log(`⚠  No match in level file: ${skippedNoMatch}`)
if (skippedBadLine > 0) console.log(`⚠  Unparsable lines: ${skippedBadLine}`)
if (skippedNoRealFix > 0) console.log(`⚠  Left as-is (didn't validate to >=2 forms): ${skippedNoRealFix}`)
if (rejectedForms.length > 0) {
  console.log(`⚠  Rejected individual forms: ${rejectedForms.length}`)
  rejectedForms.slice(0, 20).forEach(r => console.log(`   - ${r}`))
}
console.log('\nNext: node scripts/split-words-per-topic.js')
