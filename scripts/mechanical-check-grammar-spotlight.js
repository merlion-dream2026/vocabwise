// Zero-API mechanical validity check for grammar_spotlight exercises, across all 3 books.
// Catches structural bugs no reasoning is needed for: duplicate MCQ options, answer
// missing from options/word_bank, scramble answer using words not in the given set.
//
// Usage: node scripts/mechanical-check-grammar-spotlight.js

const fs   = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')
let totalIssues = 0

function norm(s) { return String(s).toLowerCase().trim() }

// Char-multiset key: strips spaces/punctuation so multi-word tiles (e.g. "by contrast")
// don't cause false mismatches against a whitespace-split answer.
function charBag(s) {
  return norm(s).replace(/[^a-z0-9]/g, '').split('').sort().join('')
}

for (const book of [1, 2, 3]) {
  const dir = path.join(ROOT, 'data', 'vocabwise', `book${book}`)
  const files = fs.readdirSync(dir).filter(f => /^b\d-t\d+\.json$/.test(f)).sort()

  for (const f of files) {
    const topicId = f.replace('.json', '')
    const json = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8'))
    const gs = json.grammar_spotlight
    if (!gs) continue

    // ex1_mcq: duplicate options, answer not in options
    for (const it of gs.ex1_mcq?.items ?? []) {
      const norms = it.options.map(norm)
      const dupes = norms.filter((o, i) => norms.indexOf(o) !== i)
      if (dupes.length) { console.log(`[${topicId}] ex1_mcq#${it.id}: duplicate option(s) ${JSON.stringify([...new Set(dupes)])}`); totalIssues++ }
      if (!norms.includes(norm(it.answer))) { console.log(`[${topicId}] ex1_mcq#${it.id}: answer "${it.answer}" not in options`); totalIssues++ }
    }

    // ex2_scramble: answer must be a re-ordering of exactly the given tiles (char-multiset match,
    // so multi-word tiles like "by contrast" don't false-positive against a whitespace-split answer)
    for (const it of gs.ex2_scramble?.items ?? []) {
      const givenKey = charBag(it.words.join(''))
      const ansKey    = charBag(it.answer)
      if (givenKey !== ansKey) {
        console.log(`[${topicId}] ex2_scramble#${it.id}: answer doesn't reconstruct from given tiles — given=${JSON.stringify(it.words)} answer="${it.answer}"`)
        totalIssues++
      }
    }

    // ex3_gap_fill: answer not in word_bank; duplicate word_bank entries
    const bank = (gs.ex3_gap_fill?.word_bank ?? []).map(norm)
    const bankDupes = bank.filter((w, i) => bank.indexOf(w) !== i)
    if (bankDupes.length) { console.log(`[${topicId}] ex3_gap_fill: duplicate word_bank entries ${JSON.stringify([...new Set(bankDupes)])}`); totalIssues++ }
    for (const it of gs.ex3_gap_fill?.items ?? []) {
      if (!bank.includes(norm(it.answer))) { console.log(`[${topicId}] ex3_gap_fill#${it.id}: answer "${it.answer}" not in word_bank`); totalIssues++ }
    }
  }
}

console.log(`\n${totalIssues === 0 ? '✅ No mechanical issues found.' : `⚠️  ${totalIssues} mechanical issue(s) found across all 3 books.`}`)
