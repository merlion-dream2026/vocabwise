// Zero-API mechanical validity check for E7 (ex4_reordering, Book 2/3): the given word
// tiles must be able to reconstruct the answer sentence exactly (same char multiset,
// ignoring whitespace/punctuation) — same check as grammar_spotlight's ex2_scramble.
//
// Usage: node scripts/mechanical-check-e7-reordering.js

const fs   = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
let totalIssues = 0

function charBag(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]/g, '').split('').sort().join('')
}

for (const book of [2, 3]) {
  const dir = path.join(ROOT, 'data', 'vocabwise', `book${book}`)
  const files = fs.readdirSync(dir).filter(f => /^b\d-t\d+\.json$/.test(f)).sort()

  for (const f of files) {
    const topicId = f.replace('.json', '')
    const json = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'))
    const ex = json.exercises?.ex4_reordering
    if (!ex) continue

    for (const it of ex.items) {
      const givenKey = charBag(it.words.join(''))
      const ansKey    = charBag(it.answer)
      if (givenKey !== ansKey) {
        console.log(`[${topicId}] ex4_reordering#${it.id}: answer doesn't reconstruct from given tiles — given=${JSON.stringify(it.words)} answer="${it.answer}"`)
        totalIssues++
      }
    }
  }
}

console.log(`\n${totalIssues === 0 ? '✅ No mechanical issues found.' : `⚠️  ${totalIssues} mechanical issue(s) found across Book 2/3.`}`)
