// Export grammar_spotlight from all topic JSONs → one Markdown file per book.
// Import back: node scripts/export-grammar-spotlight.js --import --book 1
//
// Usage:
//   node scripts/export-grammar-spotlight.js           → export all books
//   node scripts/export-grammar-spotlight.js --book 1  → export book 1 only
//   node scripts/export-grammar-spotlight.js --import --book 1  → import back
//   node scripts/export-grammar-spotlight.js --import  → import all books
//
// Output: data/grammar-spotlight/book1.md (book2.md, book3.md)

const fs   = require('fs')
const path = require('path')

const args      = process.argv.slice(2)
const bookArg   = args.includes('--book') ? args[args.indexOf('--book') + 1] : null
const isImport  = args.includes('--import')
const books     = bookArg ? [parseInt(bookArg)] : [1, 2, 3]
const OUT_DIR   = path.join(__dirname, '..', 'data', 'grammar-spotlight')

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

// ── EXPORT ────────────────────────────────────────────────────────────────────
function exportBook(bookNum) {
  const dataDir = path.join(__dirname, '..', 'data', 'vocabwise', `book${bookNum}`)
  const files   = fs.readdirSync(dataDir).filter(f => f.match(/^b\d-t\d+\.json$/)).sort()

  const lines = [
    `# Grammar Spotlight — Book ${bookNum}`,
    ``,
    `> Chỉnh sửa nội dung trong file này, sau đó chạy:`,
    `> \`node scripts/export-grammar-spotlight.js --import --book ${bookNum}\``,
    ``,
  ]

  let count = 0
  for (const f of files) {
    const topicId = f.replace('.json', '')
    const json    = JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf-8'))
    const gs      = json.grammar_spotlight
    if (!gs) continue

    const form = [
      `✚ ${gs.form.positive}`,
      gs.form.negative ? `✖ ${gs.form.negative}` : '',
      gs.form.question ? `? ${gs.form.question}` : '',
      gs.form.variant  ? `↳ ${gs.form.variant}`  : '',
    ].filter(Boolean).join('\n')

    const usageNotes = (gs.usage_notes ?? []).map((n, i) => {
      const text = typeof n === 'string' ? n : n.text
      const exs  = typeof n === 'string' ? [] : (n.examples ?? [])
      const exLines = exs.map(e => `  - ${e}`).join('\n')
      return exLines ? `${i + 1}. ${text}\n${exLines}` : `${i + 1}. ${text}`
    }).join('\n')

    const inContext = (gs.in_context ?? []).map((en, i) => {
      const vi = gs.in_context_vi?.[i] ?? ''
      return `- EN: ${en}\n  VI: ${vi}`
    }).join('\n')

    lines.push(
      `<!-- topic: ${topicId} -->`,
      `## ${topicId} · ${json.passage?.paragraphs ? (json.vw_topics?.topic_title ?? '') : ''} ${gs.grammar_point} · ${gs.level}`,
      ``,
      `**Tiếng Việt:** ${gs.vi_grammar_point}`,
      ``,
      `### Cấu trúc`,
      `\`\`\``,
      form,
      `\`\`\``,
      ``,
      `### Giải thích`,
      gs.rule_vi,
      ``,
      `### Lưu ý`,
      usageNotes || '_(chưa có)_',
      ``,
      `### Lỗi thường gặp`,
      gs.common_error,
      ``,
      `### Trong bài đọc`,
      inContext || '_(chưa có)_',
      ``,
      `<!-- /topic -->`,
      ``,
    )
    count++
  }

  const outPath = path.join(OUT_DIR, `book${bookNum}.md`)
  fs.writeFileSync(outPath, lines.join('\n'), 'utf-8')
  console.log(`✅ Book ${bookNum}: ${count} topics → ${outPath}`)
}

// ── IMPORT ────────────────────────────────────────────────────────────────────
function importBook(bookNum) {
  const mdPath  = path.join(OUT_DIR, `book${bookNum}.md`)
  const dataDir = path.join(__dirname, '..', 'data', 'vocabwise', `book${bookNum}`)

  if (!fs.existsSync(mdPath)) { console.error(`Not found: ${mdPath}`); return }

  const md      = fs.readFileSync(mdPath, 'utf-8')
  const blocks  = md.split(/<!-- topic: (b\d-t\d+) -->/).slice(1)
  // blocks = [topicId, content, topicId, content, ...]

  let updated = 0, skipped = 0

  for (let i = 0; i < blocks.length; i += 2) {
    const topicId = blocks[i].trim()
    const content = blocks[i + 1] ?? ''

    const jsonPath = path.join(dataDir, `${topicId}.json`)
    if (!fs.existsSync(jsonPath)) { console.log(`  ⚠️  ${topicId}: JSON not found`); skipped++; continue }

    const json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
    if (!json.grammar_spotlight) { skipped++; continue }

    // Extract sections
    const extract = (header, nextHeaders) => {
      const pattern = new RegExp(
        `### ${header}\\n([\\s\\S]*?)(?=\\n### (?:${nextHeaders.join('|')})|<!-- \\/topic -->|$)`
      )
      return content.match(pattern)?.[1]?.trim() ?? null
    }

    const ruleVi     = extract('Giải thích', ['Lưu ý', 'Lỗi thường gặp', 'Trong bài đọc'])
    const commonErr  = extract('Lỗi thường gặp', ['Trong bài đọc'])
    const inCtxBlock = extract('Trong bài đọc', [])

    // Parse usage_notes
    const luuYBlock = extract('Lưu ý', ['Lỗi thường gặp', 'Trong bài đọc'])
    const usageNotes = luuYBlock && !luuYBlock.startsWith('_(') ?
      luuYBlock.split(/\n(?=\d+\. )/).map(block => {
        const [first, ...rest] = block.split('\n')
        const text     = first.replace(/^\d+\. /, '').trim()
        const examples = rest.filter(l => l.trim().startsWith('- ')).map(l => l.replace(/^\s*- /, '').trim())
        return { text, examples }
      }).filter(n => n.text) : null

    // Parse in_context + in_context_vi
    let inContext   = null
    let inContextVi = null
    if (inCtxBlock && !inCtxBlock.startsWith('_(')) {
      const pairs = inCtxBlock.split(/\n(?=- EN:)/).map(block => {
        const en = block.match(/- EN: (.+)/)?.[1]?.trim() ?? ''
        const vi = block.match(/\n\s*VI: (.+)/)?.[1]?.trim() ?? ''
        return { en, vi }
      }).filter(p => p.en)
      if (pairs.length) {
        inContext   = pairs.map(p => p.en)
        inContextVi = pairs.map(p => p.vi)
      }
    }

    // Apply updates (only if field extracted successfully)
    if (ruleVi)     json.grammar_spotlight.rule_vi     = ruleVi
    if (commonErr)  json.grammar_spotlight.common_error = commonErr
    if (usageNotes) json.grammar_spotlight.usage_notes  = usageNotes
    if (inContext)  json.grammar_spotlight.in_context   = inContext
    if (inContextVi) json.grammar_spotlight.in_context_vi = inContextVi

    // Parse form (inside ``` block)
    const formBlock = content.match(/### Cấu trúc\n```\n([\s\S]*?)```/)?.[1]?.trim()
    if (formBlock) {
      const form = {}
      for (const line of formBlock.split('\n')) {
        if (line.startsWith('✚ ')) form.positive = line.slice(2).trim()
        else if (line.startsWith('✖ ')) form.negative = line.slice(2).trim()
        else if (line.startsWith('? ')) form.question = line.slice(2).trim()
        else if (line.startsWith('↳ ')) form.variant  = line.slice(2).trim()
      }
      if (form.positive) json.grammar_spotlight.form = form
    }

    fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2), 'utf-8')
    updated++
  }

  console.log(`✅ Book ${bookNum}: updated ${updated}, skipped ${skipped}`)
}

// ── Main ──────────────────────────────────────────────────────────────────────
for (const book of books) {
  if (isImport) importBook(book)
  else exportBook(book)
}
