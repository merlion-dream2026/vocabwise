/**
 * Scan public/audio/stories/ and write audioSize (bytes) into each topic in words.json.
 * Run once: node scripts/measure-audio-sizes.js
 */

const fs   = require('fs')
const path = require('path')

const wordsPath = path.join(__dirname, '../data/words.json')
const audioDir  = path.join(__dirname, '../public/audio/stories')

const words = JSON.parse(fs.readFileSync(wordsPath, 'utf8'))

// Build map: "level:topicId" → file size in bytes
// Filename format: {level}.{nn}.{topicId}.mp3
const audioSizes = {}
for (const file of fs.readdirSync(audioDir)) {
  if (!file.endsWith('.mp3')) continue
  const base  = file.slice(0, -4)           // strip .mp3
  const dot1  = base.indexOf('.')
  const dot2  = base.indexOf('.', dot1 + 1)
  if (dot1 < 0 || dot2 < 0) continue
  const level   = base.slice(0, dot1)
  const topicId = base.slice(dot2 + 1)
  const size    = fs.statSync(path.join(audioDir, file)).size
  audioSizes[`${level}:${topicId}`] = size
}

let matched = 0, missing = 0
for (const [level, levelData] of Object.entries(words)) {
  if (!levelData.topics) continue
  for (const topic of levelData.topics) {
    const size = audioSizes[`${level}:${topic.id}`] ?? 0
    topic.audioSize = size
    size > 0 ? matched++ : missing++
  }
}

fs.writeFileSync(wordsPath, JSON.stringify(words, null, 2))
console.log(`Done — ${matched} topics with audio, ${missing} without`)
console.log('Audio files found:', Object.keys(audioSizes).length)
