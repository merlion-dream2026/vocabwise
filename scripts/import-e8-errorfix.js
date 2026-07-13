// Import GPT-audited fixes for E8 ErrorFix items back into topic JSON files.
// Expects a Markdown file of diff blocks in the same format produced by
// scripts/export-e8-errorfix.js — only fields that changed need to be present.
// Usage: node scripts/import-e8-errorfix.js exports/e8-audit/book1-fixes.md
//
// Validates every block BEFORE writing anything (all-or-nothing) — a single bad
// block should not leave some topic files patched and others not.
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

// Header may or may not carry a Markdown "### " prefix — GPT output pasted from a
// chat UI often loses it since "### [...]" renders as an actual heading there.
function parseFixFile(text) {
  const blocks = text.split(/^#{0,6}\s*\[(?=book\d+\/)/m).slice(1)
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

function extractBracket(sentence) {
  const m = sentence.match(/\[([^\]]+)\]/)
  return m ? m[1] : null
}

function diffFields(before, after) {
  const changed = []
  for (const k of ['sentence', 'highlighted', 'options', 'answer', 'explanation', 'explanation_vi']) {
    if (JSON.stringify(before[k]) !== JSON.stringify(after[k])) changed.push(k)
  }
  return changed
}

function applyFixes(fixPath) {
  const text = fs.readFileSync(fixPath, 'utf8')
  const fixes = parseFixFile(text)
  console.log(`Parsed ${fixes.length} fix block(s) from ${fixPath}\n`)

  const dataCache = new Map() // "book/topicId" -> { filePath, data }
  const errors = []
  const changeLog = []

  for (const fix of fixes) {
    const key = `${fix.book}/${fix.topicId}`

    if (!dataCache.has(key)) {
      const filePath = path.join(ROOT, 'data', 'vocabwise', `book${fix.book}`, `${fix.topicId}.json`)
      if (!fs.existsSync(filePath)) {
        errors.push(`${key}: file not found at ${filePath}`)
        continue
      }
      dataCache.set(key, { filePath, data: JSON.parse(fs.readFileSync(filePath, 'utf8')) })
    }
    const entry = dataCache.get(key)
    if (!entry) continue

    const items = entry.data.exercises?.ex5_error_fix?.items
    if (!items) { errors.push(`${key}: no exercises.ex5_error_fix.items`); continue }
    const item = items.find(i => i.id === fix.itemId)
    if (!item) { errors.push(`${key} item${fix.itemId}: not found`); continue }

    const before = JSON.parse(JSON.stringify(item))
    const { options, __reason, ...scalarFields } = fix.fields

    if (options) Object.assign(item.options, options)
    Object.assign(item, scalarFields)

    if (!['A', 'B', 'C'].includes(item.answer)) {
      errors.push(`${key} item${item.id}: invalid answer "${item.answer}"`)
    }
    const optVals = Object.values(item.options)
    if (new Set(optVals).size !== 3) {
      errors.push(`${key} item${item.id}: duplicate option text ${JSON.stringify(item.options)}`)
    }
    if (scalarFields.sentence !== undefined) {
      const bracket = extractBracket(item.sentence)
      if (bracket === null) {
        errors.push(`${key} item${item.id}: new SENTENCE has no [bracket]`)
      } else if (bracket !== item.highlighted && scalarFields.highlighted === undefined) {
        errors.push(`${key} item${item.id}: SENTENCE bracket "${bracket}" != HIGHLIGHTED "${item.highlighted}" — fix must set HIGHLIGHTED too`)
      }
    }

    if (entry.data.answer_key?.ex5) entry.data.answer_key.ex5[String(item.id)] = item.answer

    changeLog.push({ key, itemId: item.id, changed: diffFields(before, item), reason: __reason })
  }

  if (errors.length > 0) {
    console.error(`${errors.length} error(s) — ABORTED, no files written:\n`)
    errors.forEach(e => console.error('  - ' + e))
    process.exit(1)
  }

  for (const { filePath, data } of dataCache.values()) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
  }

  console.log(`Applied ${changeLog.length} item fix(es) across ${dataCache.size} topic file(s):\n`)
  for (const c of changeLog) {
    console.log(`  [${c.key} item${c.itemId}] changed: ${c.changed.join(', ')}${c.reason ? ' — ' + c.reason : ''}`)
  }
}

const fixPath = process.argv[2]
if (!fixPath) {
  console.error('Usage: node scripts/import-e8-errorfix.js <fixes.md>')
  process.exit(1)
}
applyFixes(fixPath)
