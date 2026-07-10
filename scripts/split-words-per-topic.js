// Splits data/words/{level}.json (30 topics each) into data/words/{level}/{topicId}.json
// so /api/words/{level}/{topicId} can serve ~3-5KB instead of the full 88-204KB level file.
// Run: node scripts/split-words-per-topic.js
// Re-run whenever data/words/{level}.json content changes (topic content edits, new levels).

const fs = require('fs')
const path = require('path')

const WORDS_DIR = path.join(__dirname, '..', 'data', 'words')
const LEVELS = ['seeker', 'starter', 'ranger', 'explorer', 'scholar', 'master']

let totalTopics = 0

for (const level of LEVELS) {
  const levelFile = path.join(WORDS_DIR, `${level}.json`)
  if (!fs.existsSync(levelFile)) {
    console.warn(`skip ${level}: ${levelFile} not found`)
    continue
  }

  const data = JSON.parse(fs.readFileSync(levelFile, 'utf-8'))
  const topics = data.topics ?? []

  const outDir = path.join(WORDS_DIR, level)
  fs.mkdirSync(outDir, { recursive: true })

  for (const topic of topics) {
    const outFile = path.join(outDir, `${topic.id}.json`)
    fs.writeFileSync(outFile, JSON.stringify(topic))
    totalTopics++
  }

  console.log(`${level}: wrote ${topics.length} topic files to data/words/${level}/`)
}

console.log(`\nDone — ${totalTopics} topic files written.`)
