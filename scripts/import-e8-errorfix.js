// Import GPT-audited fixes for E8 ErrorFix items back into topic JSON files.
// Expects a Markdown file of diff blocks in the same format produced by
// scripts/export-e8-errorfix.js — only fields that changed need to be present.
// Usage: node scripts/import-e8-errorfix.js exports/e8-audit/book1-fixes.md
const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..')

const FIELD_MAP = {
  SENTENCE: 'sentence',
  HIGHLIGHTED: 'highlighted',
  ANSWER: 'answer',
  EXPLANATION_EN: 'explanation',
  EXPLANATION_VI: 'explanation_vi',
}

function parseFixFile(text) {
  const blocks = text.split(/^### \[/m).slice(1)
  return blocks.map(block => {
    const [idLine, ...rest] = block.split('\n')
    const id = idLine.replace(/\]\s*$/, '').trim()
    const m = id.match(/^book(\d)\/(b\d+-t\d+)\/item(\d+)$/)
    if (!m) throw new Error(`Bad block id: [${id}]`)
    const [, book, topicId, itemId] = m

    const fields = {}
    for (const line of rest) {
      const fm = line.match(/^([A-Z_]+):\s?(.*)$/)
      if (!fm) continue
      const [, key, value] = fm
      if (key === 'A' || key === 'B' || key === 'C') {
        fields.options = fields.options || {}
        fields.options[key] = value
      } else if (FIELD_MAP[key]) {
        fields[FIELD_MAP[key]] = value
      } else if (key === 'REASON_VI') {
        fields.__reason = value
      }
    }
    return { book: Number(book), topicId, itemId: Number(itemId), fields }
  })
}

function applyFixes(fixPath) {
  const text = fs.readFileSync(fixPath, 'utf8')
  const fixes = parseFixFile(text)
  console.log(`Parsed ${fixes.length} fix block(s) from ${fixPath}`)

  const byTopic = new Map()
  for (const fix of fixes) {
    const key = `${fix.book}/${fix.topicId}`
    if (!byTopic.has(key)) byTopic.set(key, [])
    byTopic.get(key).push(fix)
  }

  let filesChanged = 0
  for (const [key, topicFixes] of byTopic) {
    const [book, topicId] = key.split('/')
    const filePath = path.join(ROOT, 'data', 'vocabwise', `book${book}`, `${topicId}.json`)
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    const items = data.exercises?.ex5_error_fix?.items
    if (!items) throw new Error(`No ex5_error_fix in ${filePath}`)

    for (const fix of topicFixes) {
      const item = items.find(i => i.id === fix.itemId)
      if (!item) throw new Error(`item${fix.itemId} not found in ${topicId}`)

      const { options, __reason, ...scalarFields } = fix.fields
      if (options) Object.assign(item.options, options)
      Object.assign(item, scalarFields)
      if (__reason) console.log(`    [${topicId} item${item.id}] ${__reason}`)

      // Guard rails — answer must point at an actual option, all three must be distinct
      if (!['A', 'B', 'C'].includes(item.answer)) throw new Error(`${topicId} item${item.id}: invalid answer "${item.answer}"`)
      const vals = Object.values(item.options)
      if (new Set(vals).size !== 3) throw new Error(`${topicId} item${item.id}: duplicate options`)

      // Keep answer_key.ex5 in sync (it duplicates E8 answers for the print/reference key)
      if (data.answer_key?.ex5) data.answer_key.ex5[String(item.id)] = item.answer
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
    filesChanged++
    console.log(`  updated ${topicId} (${topicFixes.length} item fix(es))`)
  }

  console.log(`Done — ${filesChanged} topic file(s) updated.`)
}

const fixPath = process.argv[2]
if (!fixPath) {
  console.error('Usage: node scripts/import-e8-errorfix.js <fixes.md>')
  process.exit(1)
}
applyFixes(fixPath)
