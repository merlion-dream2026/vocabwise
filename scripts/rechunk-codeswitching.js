// One-off: merge chunk-02-remaining.md + chunk-03-remaining.md + chunk-04..24.md
// (everything not yet reviewed by Gemini) and re-split into smaller chunks —
// 100 items/chunk proved too large: worst-case (~750-800 chars/item when every
// item needs a rewrite) blew past the 50k-char chat paste limit twice in a row.
// New size: 50 items/chunk (~40k chars worst-case, ~10k buffer).

const fs = require('fs')
const path = require('path')

const DIR = path.join(__dirname, '..', 'exports', 'codeswitching-fix')
const NEW_CHUNK_SIZE = 50

function parseBlocks(text) {
  // Each block: [[id/word]]\nWORD: ...\nMEANING: ...\nEXPLANATION: ...\n\n
  const re = /\[\[([^\]]+)\]\]\nWORD:.*\nMEANING:.*\nEXPLANATION:[\s\S]*?(?=\n\[\[|$)/g
  return text.match(re) || []
}

const sourceFiles = [
  'chunk-02-remaining.md',
  'chunk-03-remaining.md',
  ...Array.from({ length: 21 }, (_, i) => `chunk-${String(i + 4).padStart(2, '0')}.md`),
]

let allBlocks = []
for (const f of sourceFiles) {
  const p = path.join(DIR, f)
  if (!fs.existsSync(p)) { console.error(`Missing: ${f}`); process.exit(1) }
  const blocks = parseBlocks(fs.readFileSync(p, 'utf8'))
  allBlocks.push(...blocks.map(b => b.trim()))
}
console.log(`Total remaining items: ${allBlocks.length}`)

// Delete old chunk-04..24 and the two remaining files
for (const f of sourceFiles) fs.unlinkSync(path.join(DIR, f))

const newChunks = []
for (let i = 0; i < allBlocks.length; i += NEW_CHUNK_SIZE) newChunks.push(allBlocks.slice(i, i + NEW_CHUNK_SIZE))

newChunks.forEach((chunk, idx) => {
  const num = idx + 4 // continue numbering after chunk-01..03 (already done)
  const file = path.join(DIR, `chunk-${String(num).padStart(2, '0')}.md`)
  fs.writeFileSync(file, chunk.join('\n\n') + '\n')
})

console.log(`${newChunks.length} new chunk file(s) written (chunk-04.md .. chunk-${String(newChunks.length + 3).padStart(2, '0')}.md), ${NEW_CHUNK_SIZE} items/chunk`)
console.log(`Last chunk size: ${allBlocks.length - (newChunks.length - 1) * NEW_CHUNK_SIZE} items`)
