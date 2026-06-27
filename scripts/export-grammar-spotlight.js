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
//
// Markdown sections per topic:
//   ### Cấu trúc · Giải thích · Lưu ý · Lỗi thường gặp · Trong bài đọc
//   ### Bài tập 1 — Trắc nghiệm  (ex1_mcq)
//   ### Bài tập 2 — Sắp xếp câu  (ex2_scramble)
//   ### Bài tập 3 — Điền từ       (ex3_gap_fill)

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

    // ── Exercise 1: MCQ ──────────────────────────────────────────────────────
    const mcq = gs.ex1_mcq
    let ex1Lines = '_(chưa có)_'
    if (mcq?.items?.length) {
      ex1Lines = `**Hướng dẫn:** ${mcq.instruction ?? ''}\n\n` +
        mcq.items.map(item => {
          const opts = (item.options ?? []).map((o, i) => `${String.fromCharCode(65 + i)}. ${o}`).join('  |  ')
          return `${item.id}. ${item.sentence}\n   ${opts}  →  ${item.answer}`
        }).join('\n')
    }

    // ── Exercise 2: Scramble ─────────────────────────────────────────────────
    const scr = gs.ex2_scramble
    let ex2Lines = '_(chưa có)_'
    if (scr?.items?.length) {
      ex2Lines = `**Hướng dẫn:** ${scr.instruction ?? ''}\n\n` +
        scr.items.map(item => {
          const words = (item.words ?? []).map(w => `[${w}]`).join(' ')
          return `${item.id}. ${words}  →  ${item.answer}`
        }).join('\n')
    }

    // ── Exercise 3: Gap fill ─────────────────────────────────────────────────
    const gap = gs.ex3_gap_fill
    let ex3Lines = '_(chưa có)_'
    if (gap?.items?.length) {
      const bank = (gap.word_bank ?? []).join(' · ')
      ex3Lines = `**Hướng dẫn:** ${gap.instruction ?? ''}\n` +
        `**Từ gợi ý:** ${bank}\n\n` +
        gap.items.map(item => `${item.id}. ${item.sentence}  →  ${item.answer}`).join('\n')
    }

    lines.push(
      `<!-- topic: ${topicId} -->`,
      `## ${topicId} · ${gs.grammar_point} · ${gs.level}`,
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
      `### Bài tập 1 — Trắc nghiệm`,
      ex1Lines,
      ``,
      `### Bài tập 2 — Sắp xếp câu`,
      ex2Lines,
      ``,
      `### Bài tập 3 — Điền từ`,
      ex3Lines,
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

  let updated = 0, skipped = 0

  for (let i = 0; i < blocks.length; i += 2) {
    const topicId = blocks[i].trim()
    const content = blocks[i + 1] ?? ''

    const jsonPath = path.join(dataDir, `${topicId}.json`)
    if (!fs.existsSync(jsonPath)) { console.log(`  ⚠️  ${topicId}: JSON not found`); skipped++; continue }

    const json = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
    if (!json.grammar_spotlight) { skipped++; continue }

    // Section headers (order matters for regex boundary)
    const ALL_HEADERS = [
      'Lưu ý', 'Lỗi thường gặp', 'Trong bài đọc',
      'Bài tập 1 — Trắc nghiệm', 'Bài tập 2 — Sắp xếp câu', 'Bài tập 3 — Điền từ',
    ]

    const extract = (header, nextHeaders) => {
      const nh  = nextHeaders.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      const pat = new RegExp(
        `### ${header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n([\\s\\S]*?)(?=\\n### (?:${nh.join('|')})|<!-- \\/topic -->|$)`
      )
      return content.match(pat)?.[1]?.trim() ?? null
    }

    // ── Theory fields ────────────────────────────────────────────────────────
    const ruleVi     = extract('Giải thích', ALL_HEADERS.slice(0))
    const luuYBlock  = extract('Lưu ý', ALL_HEADERS.slice(1))
    const commonErr  = extract('Lỗi thường gặp', ALL_HEADERS.slice(2))
    const inCtxBlock = extract('Trong bài đọc', ALL_HEADERS.slice(3))

    const usageNotes = luuYBlock && !luuYBlock.startsWith('_(') ?
      luuYBlock.split(/\n(?=\d+\. )/).map(block => {
        const [first, ...rest] = block.split('\n')
        const text     = first.replace(/^\d+\. /, '').trim()
        const examples = rest.filter(l => l.trim().startsWith('- ')).map(l => l.replace(/^\s*- /, '').trim())
        return { text, examples }
      }).filter(n => n.text) : null

    let inContext = null, inContextVi = null
    if (inCtxBlock && !inCtxBlock.startsWith('_(')) {
      const pairs = inCtxBlock.split(/\n(?=- EN:)/).map(block => ({
        en: block.match(/- EN: (.+)/)?.[1]?.trim() ?? '',
        vi: block.match(/\n\s*VI: (.+)/)?.[1]?.trim() ?? '',
      })).filter(p => p.en)
      if (pairs.length) { inContext = pairs.map(p => p.en); inContextVi = pairs.map(p => p.vi) }
    }

    if (ruleVi)      json.grammar_spotlight.rule_vi      = ruleVi
    if (commonErr)   json.grammar_spotlight.common_error  = commonErr
    if (usageNotes)  json.grammar_spotlight.usage_notes   = usageNotes
    if (inContext)   json.grammar_spotlight.in_context    = inContext
    if (inContextVi) json.grammar_spotlight.in_context_vi = inContextVi

    const formBlock = content.match(/### Cấu trúc\n```\n([\s\S]*?)```/)?.[1]?.trim()
    if (formBlock) {
      const form = {}
      for (const line of formBlock.split('\n')) {
        if (line.startsWith('✚ '))      form.positive = line.slice(2).trim()
        else if (line.startsWith('✖ ')) form.negative = line.slice(2).trim()
        else if (line.startsWith('? ')) form.question = line.slice(2).trim()
        else if (line.startsWith('↳ ')) form.variant  = line.slice(2).trim()
      }
      if (form.positive) json.grammar_spotlight.form = form
    }

    // ── Exercise 1: MCQ ──────────────────────────────────────────────────────
    const mcqBlock = extract('Bài tập 1 — Trắc nghiệm', ALL_HEADERS.slice(4))
    if (mcqBlock && !mcqBlock.startsWith('_(')) {
      const instrMatch = mcqBlock.match(/\*\*Hướng dẫn:\*\*\s*(.+)/)
      const instruction = instrMatch?.[1]?.trim() ?? ''
      const itemChunks  = mcqBlock.split(/\n(?=\d+\. )/).filter(b => /^\d+\./.test(b.trim()))
      const items = itemChunks.map(chunk => {
        const lines   = chunk.trim().split('\n')
        const id      = parseInt(lines[0].match(/^(\d+)\./)?.[1])
        const sentence = lines[0].replace(/^\d+\.\s*/, '').trim()
        const optLine  = (lines[1] ?? '').trim()
        const optMatch = optLine.match(/A\.\s*(.+?)\s+\|\s+B\.\s*(.+?)\s+\|\s+C\.\s*(.+?)\s+\|\s+D\.\s*(.+?)\s+→\s+(.+)/)
        if (!optMatch) return null
        return {
          id,
          sentence,
          options: [optMatch[1].trim(), optMatch[2].trim(), optMatch[3].trim(), optMatch[4].trim()],
          answer:  optMatch[5].trim(),
        }
      }).filter(Boolean)
      if (instruction && items.length) json.grammar_spotlight.ex1_mcq = { instruction, items }
    }

    // ── Exercise 2: Scramble ─────────────────────────────────────────────────
    const scrBlock = extract('Bài tập 2 — Sắp xếp câu', ALL_HEADERS.slice(5))
    if (scrBlock && !scrBlock.startsWith('_(')) {
      const instrMatch  = scrBlock.match(/\*\*Hướng dẫn:\*\*\s*(.+)/)
      const instruction = instrMatch?.[1]?.trim() ?? ''
      const itemChunks  = scrBlock.split(/\n(?=\d+\. )/).filter(b => /^\d+\./.test(b.trim()))
      const items = itemChunks.map(chunk => {
        const line    = chunk.trim().split('\n')[0]
        const id      = parseInt(line.match(/^(\d+)\./)?.[1])
        const words   = [...line.matchAll(/\[([^\]]+)\]/g)].map(m => m[1])
        const answer  = line.match(/→\s*(.+)/)?.[1]?.trim() ?? ''
        if (!id || !words.length) return null
        return { id, words, answer }
      }).filter(Boolean)
      if (instruction && items.length) json.grammar_spotlight.ex2_scramble = { instruction, items }
    }

    // ── Exercise 3: Gap fill ─────────────────────────────────────────────────
    const gapBlock = extract('Bài tập 3 — Điền từ', [])
    if (gapBlock && !gapBlock.startsWith('_(')) {
      const instrMatch  = gapBlock.match(/\*\*Hướng dẫn:\*\*\s*(.+)/)
      const instruction = instrMatch?.[1]?.trim() ?? ''
      const bankMatch   = gapBlock.match(/\*\*Từ gợi ý:\*\*\s*(.+)/)
      const word_bank   = bankMatch ? bankMatch[1].split(/\s*·\s*/).map(w => w.trim()).filter(Boolean) : []
      const itemChunks  = gapBlock.split(/\n(?=\d+\. )/).filter(b => /^\d+\./.test(b.trim()))
      const items = itemChunks.map(chunk => {
        const line   = chunk.trim().split('\n')[0]
        const id     = parseInt(line.match(/^(\d+)\./)?.[1])
        const parts  = line.replace(/^\d+\.\s*/, '').split(/\s*→\s*/)
        const sentence = parts[0]?.trim() ?? ''
        const answer   = parts[1]?.trim() ?? ''
        if (!id || !sentence) return null
        return { id, sentence, answer }
      }).filter(Boolean)
      if (instruction && items.length) json.grammar_spotlight.ex3_gap_fill = { instruction, word_bank, items }
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
