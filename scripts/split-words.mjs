/**
 * Split data/words.json into per-level files in data/words/.
 * Run once: node scripts/split-words.mjs
 * After running, commit the generated files in data/words/.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const wordsData = JSON.parse(readFileSync(join(root, 'data', 'words.json'), 'utf-8'))
const outDir = join(root, 'data', 'words')
mkdirSync(outDir, { recursive: true })

for (const [level, data] of Object.entries(wordsData)) {
  const outPath = join(outDir, `${level}.json`)
  writeFileSync(outPath, JSON.stringify(data), 'utf-8')
  console.log(`Wrote ${outPath}`)
}

console.log(`\nDone — split ${Object.keys(wordsData).length} levels.`)
console.log('Run "node scripts/split-words.mjs" once, then commit data/words/.')
