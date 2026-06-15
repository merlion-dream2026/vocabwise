'use strict'
// Generate passage-only DOCX for manual TTS (ElevenLabs web UI)
//
// Usage:
//   node scripts/gen-passage-docx.js book1   → exports/passages/book1-passages.docx
//   node scripts/gen-passage-docx.js book2
//   node scripts/gen-passage-docx.js book3
//   node scripts/gen-passage-docx.js all     → all 3 books

const { Document, Paragraph, TextRun, Packer, AlignmentType, PageBreak } = require('docx')
const fs   = require('fs')
const path = require('path')

const DATA_DIR  = path.join(__dirname, '../data/vocabwise')
const OUT_DIR   = path.join(__dirname, '../exports/passages')

const BOOK_META = {
  book1: { label: 'Book 1 — Starter (A1–A2)', prefix: 'b1-' },
  book2: { label: 'Book 2 — Progress (B1–B2)', prefix: 'b2-' },
  book3: { label: 'Book 3 — Mastery (C1–C2)', prefix: 'b3-' },
}

function stripMd(text) {
  return text.replace(/\*\*(.+?)\*\*/g, '$1')
}

function buildDoc(book) {
  const { label, prefix } = BOOK_META[book]
  const dir   = path.join(DATA_DIR, book)
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.json') && f.startsWith(prefix))
    .sort()

  const children = []

  // Cover heading
  children.push(
    new Paragraph({
      children: [new TextRun({ text: `VocabWise Academic — ${label}`, bold: true, size: 32, font: 'Calibri' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
    new Paragraph({
      children: [new TextRun({ text: `Reading Passages — ${files.length} topics`, size: 22, font: 'Calibri', color: '6B7280' })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 800 },
    })
  )

  files.forEach((file, idx) => {
    const json    = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'))
    const { topic_id, topic_title, topic_number, cefr_level } = json.meta
    const paragraphs = json.passage.paragraphs

    // Page break before each topic (except first)
    if (idx > 0) {
      children.push(new Paragraph({ children: [new PageBreak()] }))
    }

    // Topic header
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${topic_id.toUpperCase()}`, bold: true, size: 20, font: 'Calibri', color: '6B7280' }),
          new TextRun({ text: `  ·  ${cefr_level}`, size: 20, font: 'Calibri', color: '9CA3AF' }),
        ],
        spacing: { after: 80 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `${topic_number}. ${topic_title}`, bold: true, size: 28, font: 'Calibri' })],
        spacing: { after: 120 },
      }),
      new Paragraph({
        children: [new TextRun({ text: `${json.passage.word_count} words`, size: 18, font: 'Calibri', color: '9CA3AF', italics: true })],
        spacing: { after: 240 },
      }),
    )

    // Passage paragraphs (plain text, no markdown)
    paragraphs.forEach(p => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: stripMd(p.text_en), size: 22, font: 'Calibri' })],
          spacing: { after: 200 },
          alignment: AlignmentType.JUSTIFIED,
        })
      )
    })
  })

  return new Document({
    sections: [{ properties: {}, children }],
  })
}

async function main() {
  const args   = process.argv.slice(2)
  const target = args[0]

  if (!target) {
    console.log('Usage: node scripts/gen-passage-docx.js <book1|book2|book3|all>')
    process.exit(1)
  }

  const books = target === 'all' ? ['book1', 'book2', 'book3'] : [target]

  for (const book of books) {
    if (!BOOK_META[book]) { console.error(`Unknown book: ${book}`); continue }

    process.stdout.write(`⏳ ${book} → `)
    const doc     = buildDoc(book)
    const buffer  = await Packer.toBuffer(doc)
    const outPath = path.join(OUT_DIR, `${book}-passages.docx`)
    fs.writeFileSync(outPath, buffer)
    console.log(`✅ exports/passages/${book}-passages.docx  (${(buffer.length / 1024).toFixed(0)} KB)`)
  }
}

main().catch(err => { console.error(err.message); process.exit(1) })
