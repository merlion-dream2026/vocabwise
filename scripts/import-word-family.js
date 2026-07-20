// Imports GPT Plus's word-family reply into data/words/{level}.json.
// Expects exports/word-family/{level}-result.txt containing lines like:
//   word=decide|family=v:decide:quyết định;n:decision:quyết định
// (see exports/word-family/PROMPT.md for the exact output contract)
//
// Usage: node scripts/import-word-family.js <level>

const fs = require('fs')
const path = require('path')

const level = process.argv[2]
if (!level) {
  console.error('Usage: node scripts/import-word-family.js <level>')
  process.exit(1)
}

const VALID_POS = new Set(['n', 'v', 'adj', 'adv'])

const resultFile = path.join(__dirname, '..', 'exports', 'word-family', `${level}-result.txt`)
const levelFile  = path.join(__dirname, '..', 'data', 'words', `${level}.json`)

if (!fs.existsSync(resultFile)) {
  console.error(`Result file not found: ${resultFile}`)
  process.exit(1)
}

const data = JSON.parse(fs.readFileSync(levelFile, 'utf8'))
const wordIndex = new Map() // lowercase word -> { wordObj, pos }
for (const topic of data.topics) {
  for (const w of topic.words) {
    wordIndex.set(w.word.toLowerCase(), w)
  }
}

const lines = fs.readFileSync(resultFile, 'utf8').split('\n').map(l => l.trim()).filter(Boolean)

let imported = 0, emptyFamily = 0, skippedNoMatch = 0, skippedBadLine = 0
const rejectedForms = []

for (const line of lines) {
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
    const meaning = parts.slice(2).join(':').trim() // meaning may itself contain ':'
    if (!VALID_POS.has(pos) || seenPos.has(pos) || !formWord || !meaning) {
      rejectedForms.push(`${wordRaw}: rejected "${entry}"`)
      continue
    }
    if (!/^[a-zA-Z' -]+$/.test(formWord)) { rejectedForms.push(`${wordRaw}: non-alpha form "${formWord}"`); continue }
    // Note: no same-spelling-different-pos guard here (unlike gen-word-family.js's
    // API path). That heuristic was calibrated against a weak model that invented
    // a fake verb for "airport" — but zero-derivation (discount/trust/support/
    // download as both n and v) is extremely common and legitimate in English,
    // and GPT Plus output didn't exhibit the airport-style hallucination in QC.
    seenPos.add(pos)
    forms.push({ pos, word: formWord, meaning })
  }

  wordObj.wordFamily = forms
  if (forms.length === 0) emptyFamily++
  imported++
}

fs.writeFileSync(levelFile, JSON.stringify(data))

console.log('\n' + '─'.repeat(50))
console.log(`✅ Imported: ${imported} words (${emptyFamily} with empty family) into ${level}.json`)
if (skippedNoMatch > 0) console.log(`⚠  No match in level file: ${skippedNoMatch}`)
if (skippedBadLine > 0) console.log(`⚠  Unparsable lines: ${skippedBadLine}`)
if (rejectedForms.length > 0) {
  console.log(`⚠  Rejected individual forms (kept the rest of that word's family): ${rejectedForms.length}`)
  rejectedForms.slice(0, 20).forEach(r => console.log(`   - ${r}`))
  if (rejectedForms.length > 20) console.log(`   ... and ${rejectedForms.length - 20} more`)
}
console.log('\nNext: node scripts/split-words-per-topic.js')
