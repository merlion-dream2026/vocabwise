'use strict'
// Usage:
//   node scripts/gen-docx.js book1 b1-t01   → single topic
//   node scripts/gen-docx.js book1           → all topics in book1
//   node scripts/gen-docx.js all             → all books

const {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  Packer, AlignmentType, BorderStyle, ShadingType, WidthType,
  UnderlineType, Footer, PageNumber,
} = require('docx')
const fs   = require('fs')
const path = require('path')

// ── Book-specific color palettes (print-friendly: light backgrounds, dark accents) ──
const BOOK_COLORS = {
  book1: {
    dark:    '064E3B',  // emerald-900 — banner bg, numbered cells
    accent:  '059669',  // emerald-600 — section bars, text highlights
    mid:     '6EE7B7',  // emerald-300 — borders
    light:   'ECFDF5',  // emerald-50  — light backgrounds (saves ink)
    banner:  '6EE7B7',  // subtext in dark banner
  },
  book2: {
    dark:    '1E3A8A',  // blue-900
    accent:  '1D4ED8',  // blue-700
    mid:     '93C5FD',  // blue-300
    light:   'EFF6FF',  // blue-50
    banner:  'BFDBFE',  // blue-200 — subtext in banner
  },
  book3: {
    dark:    '4C1D95',  // violet-900
    accent:  '6D28D9',  // violet-700
    mid:     'C4B5FD',  // violet-300
    light:   'F5F3FF',  // violet-50
    banner:  'DDD6FE',  // violet-200 — subtext in banner
  },
}

// ── Neutral tokens (book-independent) ────────────────────────────────────────
const C = {
  grayXS: 'F9FAFB',
  grayS:  'F3F4F6',
  grayM:  'E5E7EB',
  amber:  'B45309',
  amberXL:'FFFBEB',
  red:    'DC2626',
  white:  'FFFFFF',
  text:   '1F2937',
  sub:    '6B7280',
}

// Font sizes in half-points
const SZ = { xs: 18, sm: 20, md: 22, lg: 28, xl: 36, hero: 56 }

const noBorder = {
  top: { style: BorderStyle.NONE, size: 0, space: 0 },
  bottom: { style: BorderStyle.NONE, size: 0, space: 0 },
  left: { style: BorderStyle.NONE, size: 0, space: 0 },
  right: { style: BorderStyle.NONE, size: 0, space: 0 },
}
const gridBorder = {
  top: { style: BorderStyle.SINGLE, size: 4, color: C.grayM },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: C.grayM },
  left: { style: BorderStyle.SINGLE, size: 4, color: C.grayM },
  right: { style: BorderStyle.SINGLE, size: 4, color: C.grayM },
  insideH: { style: BorderStyle.SINGLE, size: 4, color: C.grayM },
  insideV: { style: BorderStyle.SINGLE, size: 4, color: C.grayM },
}

// ── Primitive helpers ─────────────────────────────────────────────────────────
function r(text, opts = {}) {
  return new TextRun({ text, font: 'Calibri', ...opts })
}

function md(text, base = {}) {
  // Parse **word** → bold + accent-colored TextRuns
  return text.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    r(part, i % 2 === 1 ? { bold: true, color: base._accent ?? C.text, ...base } : base)
  )
}

function highlight(text, base = {}) {
  // Parse [word] → underlined red TextRuns (error-fix exercises)
  return text.split(/\[(.+?)\]/g).map((part, i) =>
    r(part, i % 2 === 1
      ? { bold: true, color: C.red, underline: { type: UnderlineType.SINGLE, color: C.red }, ...base }
      : base
    )
  )
}

function p(runs, opts = {}) {
  const children = typeof runs === 'string' ? [r(runs)] : runs
  return new Paragraph({ children, ...opts })
}

function gap(before = 0, after = 0) {
  return p([r('')], { spacing: { before, after } })
}

function cell(children, { shade, width, borders, margins, span } = {}) {
  return new TableCell({
    children: Array.isArray(children) ? children : [children],
    ...(shade  ? { shading: { type: ShadingType.SOLID, color: shade } } : {}),
    ...(width  ? { width:  { size: width, type: WidthType.DXA } } : {}),
    ...(span   ? { columnSpan: span } : {}),
    borders:   borders ?? noBorder,
    margins:   margins ?? { top: 80, bottom: 80, left: 120, right: 120 },
  })
}

function row(cells) { return new TableRow({ children: cells }) }

function tbl(rows, borders = null) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: borders ?? {
      top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
      insideH: { style: BorderStyle.NONE }, insideV: { style: BorderStyle.NONE },
    },
    rows,
  })
}

// ── Structural elements (book-color aware) ────────────────────────────────────
function sectionBar(label, note, bc) {
  return p(
    [
      r(label, { bold: true, color: bc.dark, size: SZ.lg, allCaps: true }),
      ...(note ? [r('   ' + note, { color: C.sub, size: SZ.sm })] : []),
    ],
    {
      spacing: { before: 300, after: 160 },
      border: { bottom: { style: BorderStyle.THICK, size: 16, color: bc.accent, space: 4 } },
    }
  )
}

function exBar(n, title, bc) {
  return tbl([row([
    cell(
      [p([r(`EX ${n}`, { bold: true, color: C.white, size: SZ.sm })],
        { spacing: { before: 0, after: 0 } })],
      { shade: bc.dark, width: 700, margins: { top: 100, bottom: 100, left: 160, right: 160 } }
    ),
    cell(
      [p([r(title, { bold: true, color: bc.dark, size: SZ.sm })],
        { spacing: { before: 0, after: 0 } })],
      { shade: bc.light, margins: { top: 100, bottom: 100, left: 160, right: 160 } }
    ),
  ])])
}

function makeFooter() {
  return new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        r('VocabWise  ©', { color: C.sub, size: SZ.xs }),
        r('   ·   Andie Nguyen   ·   ', { color: C.sub, size: SZ.xs }),
        new TextRun({ children: [PageNumber.CURRENT], font: 'Calibri', color: C.sub, size: SZ.xs }),
        r('  /  ', { color: C.sub, size: SZ.xs }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], font: 'Calibri', color: C.sub, size: SZ.xs }),
      ],
    })],
  })
}

// ── Section builders ──────────────────────────────────────────────────────────
function buildHeader(meta, bc) {
  const banner = tbl([row([
    cell([
      p([
        r('VocabWise ', { color: bc.banner, size: SZ.sm }),
        r(`Book ${meta.book}`, { bold: true, color: C.white, size: SZ.sm }),
        r(`  ·  ${meta.cefr_level}`, { color: bc.banner, size: SZ.sm }),
      ], { alignment: AlignmentType.RIGHT, spacing: { before: 0, after: 80 } }),
      p([
        r(`TOPIC ${meta.topic_number}`, { color: bc.banner, size: SZ.sm, allCaps: true }),
        r('   ·   ', { color: bc.mid, size: SZ.sm }),
        r((meta.theme_title_vi ?? meta.theme_title).toUpperCase(), { color: bc.banner, size: SZ.sm }),
      ], { spacing: { before: 0, after: 100 } }),
      p([r(meta.topic_title, { bold: true, color: C.white, size: SZ.hero })],
        { spacing: { before: 0, after: 80 } }),
      p([r(meta.topic_title_vi ?? '', { color: bc.banner, size: SZ.xl })],
        { spacing: { before: 0, after: 0 } }),
    ], { shade: bc.dark, margins: { top: 320, bottom: 320, left: 400, right: 400 } }),
  ])])

  return [banner, gap(160, 0)]
}

function buildPassage(passage, bc) {
  const items = [sectionBar('Reading Passage · Bài Đọc', `${passage.word_count} words`, bc)]

  for (const para of passage.paragraphs) {
    items.push(tbl([row([
      cell([
        p(md(para.text_en, { size: SZ.md, _accent: bc.accent }), {
          alignment: AlignmentType.JUSTIFIED,
          spacing: { before: 0, after: 120 },
        }),
        p(md(para.text_vi, { size: SZ.sm, color: C.sub, italics: true, _accent: bc.accent }), {
          alignment: AlignmentType.JUSTIFIED,
          spacing: { before: 0, after: 0 },
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.grayM, space: 4 } },
        }),
      ], {
        shade: bc.light,
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: bc.mid, space: 0 },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: bc.mid, space: 0 },
          left: { style: BorderStyle.THICK, size: 12, color: bc.accent, space: 0 },
          right: { style: BorderStyle.SINGLE, size: 4, color: bc.mid, space: 0 },
        },
        margins: { top: 180, bottom: 180, left: 220, right: 220 },
      }),
    ])]))
    items.push(gap(60, 0))
  }

  return items
}

function buildVocabulary(glossary, bc) {
  const items = [sectionBar('Vocabulary · Từ Vựng', `${glossary.length} words`, bc)]

  for (const item of glossary) {
    const shade = item.id % 2 === 0 ? bc.light : C.white
    const wf    = item.word_family
    const wfStr = wf
      ? Object.entries(wf).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('   ·   ')
      : ''

    const r1 = row([
      cell(
        [p([r(`${item.id}`, { bold: true, color: C.white, size: SZ.sm })],
          { spacing: { before: 0, after: 0 } })],
        { shade: bc.dark, width: 380, margins: { top: 100, bottom: 100, left: 120, right: 60 } }
      ),
      cell(
        [p([
          r(item.word + '  ', { bold: true, color: bc.dark, size: SZ.lg }),
          r(item.ipa + '  ',  { color: bc.accent, size: SZ.sm, font: 'Arial' }),
          r(item.pos,          { color: C.sub, size: SZ.sm, italics: true }),
        ], { spacing: { before: 0, after: 0 } })],
        { shade, margins: { top: 100, bottom: 100, left: 140, right: 60 } }
      ),
      cell(
        [p([r(item.meaning_vi, { bold: true, color: C.text, size: SZ.md })],
          { spacing: { before: 0, after: 0 } })],
        { shade, width: 2800, margins: { top: 100, bottom: 100, left: 60, right: 180 } }
      ),
    ])

    const r2 = row([
      cell([p([r('')], { spacing: { before: 0, after: 0 } })],
        { shade, width: 380 }),
      cell([
        p([
          r('✎  ', { color: bc.accent, size: SZ.sm }),
          ...item.example_en.split(/\*\*(.+?)\*\*/g).map((t, i) =>
            r(t, i % 2 === 1
              ? { bold: true, italics: true, color: bc.accent, size: SZ.sm }
              : { italics: true, color: C.text, size: SZ.sm }
            )
          ),
        ], { spacing: { before: 0, after: 40 } }),
        p([r('     ' + item.example_vi, { italics: true, color: C.sub, size: SZ.xs })],
          { spacing: { before: 0, after: 0 } }),
      ], { shade, span: 2, margins: { top: 60, bottom: 100, left: 140, right: 180 } }),
    ])

    items.push(tbl([r1, r2]))

    if (wfStr) {
      items.push(p([
        r('Word family  ', { bold: true, color: bc.accent, size: SZ.xs }),
        r(wfStr, { color: C.text, size: SZ.xs }),
      ], { indent: { left: 380 }, spacing: { before: 40, after: 0 } }))
    }

    if (item.false_friend) {
      items.push(p([
        r('⚠ False friend  ', { bold: true, color: C.amber, size: SZ.xs }),
        r(item.false_friend.explanation_vi, { color: '92400E', size: SZ.xs }),
      ], {
        shading: { type: ShadingType.SOLID, color: C.amberXL },
        indent: { left: 380 },
        spacing: { before: 40, after: 0 },
        border: { left: { style: BorderStyle.THICK, size: 12, color: C.amber, space: 6 } },
      }))
    }

    items.push(gap(80, 0))
  }

  return items
}

function buildExercises(exercises, bc) {
  const items = [sectionBar('Exercises · Bài Tập', '', bc)]

  function getEx(n) {
    const key = Object.keys(exercises).find(k => k.startsWith(`ex${n}_`))
    return key ? exercises[key] : null
  }

  function inst(text) {
    return p([r(text, { italics: true, color: C.sub, size: SZ.sm })],
      { spacing: { before: 100, after: 160 } })
  }

  const TITLES = {
    E1: 'Matching', E3: 'Choose the Best Answer', E4: 'Fill in the Blanks',
    E5: 'True / False / Not Given', E6: 'Word Forms',
    E7: 'Sentence Building', E8: 'Error Correction',
  }

  for (let n = 1; n <= 5; n++) {
    const ex = getEx(n)
    if (!ex) continue
    const title = TITLES[ex.type] ?? ex.type
    items.push(exBar(n, title, bc))
    items.push(inst(ex.instruction))

    // ── E1: Matching ──────────────────────────────────────
    if (ex.type === 'E1') {
      const headerRow = row([
        cell([p([r('Words', { bold: true, color: C.white, size: SZ.sm })],
          { spacing: { before: 0, after: 0 } })], { shade: bc.dark }),
        cell([p([r('Definitions', { bold: true, color: C.white, size: SZ.sm })],
          { spacing: { before: 0, after: 0 } })], { shade: bc.dark }),
      ])
      const dataRows = ex.items.map((item, i) => {
        const opt   = (ex.options ?? [])[i]
        const shade = i % 2 === 0 ? C.white : bc.light
        return row([
          cell([p([
            r(`${item.id}.  `, { bold: true, color: bc.dark, size: SZ.md }),
            r(item.word, { size: SZ.md }),
          ], { spacing: { before: 0, after: 0 } })], { shade }),
          cell([p(opt
            ? [r(`${opt.id}.  `, { bold: true, color: bc.dark, size: SZ.md }), r(opt.text, { size: SZ.md })]
            : [r('', { size: SZ.md })],
            { spacing: { before: 0, after: 0 } })], { shade }),
        ])
      })
      items.push(tbl([headerRow, ...dataRows], gridBorder))
    }

    // ── E3: MCQ ───────────────────────────────────────────
    else if (ex.type === 'E3') {
      for (const item of ex.items) {
        const sent = item.sentence.replace(/_____/g, '____________')
        items.push(p([
          r(`${item.id}.  `, { bold: true, color: bc.dark, size: SZ.md }),
          r(sent, { size: SZ.md }),
        ], { spacing: { before: 100, after: 40 } }))
        const opts = item.options.map((o, i) => `${String.fromCharCode(65 + i)}.  ${o}`).join('      ')
        items.push(p([r(opts, { color: C.sub, size: SZ.sm })],
          { indent: { left: 400 }, spacing: { before: 0, after: 100 } }))
      }
    }

    // ── E4: Gap Fill ──────────────────────────────────────
    else if (ex.type === 'E4') {
      if (ex.word_bank) {
        items.push(p([
          r('Word bank:   ', { bold: true, color: bc.dark, size: SZ.sm }),
          r(ex.word_bank.join('   ·   '), { color: C.text, size: SZ.sm }),
        ], {
          shading: { type: ShadingType.SOLID, color: bc.light },
          spacing: { before: 0, after: 140 },
          border: {
            top:    { style: BorderStyle.SINGLE, size: 6, color: bc.mid },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: bc.mid },
            left:   { style: BorderStyle.THICK,  size: 12, color: bc.accent },
            right:  { style: BorderStyle.SINGLE, size: 6, color: bc.mid },
          },
          indent: { left: 120, right: 120 },
        }))
      }
      for (const item of ex.items) {
        const sent = item.sentence.replace(/_____/g, '____________')
        items.push(p([
          r(`${item.id}.  `, { bold: true, color: bc.dark, size: SZ.md }),
          r(sent, { size: SZ.md }),
        ], { spacing: { before: 80, after: 80 } }))
      }
    }

    // ── E5: True / False / Not Given ──────────────────────
    else if (ex.type === 'E5') {
      for (const item of ex.items) {
        items.push(p([
          r(`${item.id}.  `, { bold: true, color: bc.dark, size: SZ.md }),
          r(item.statement, { size: SZ.md }),
        ], { spacing: { before: 100, after: 40 } }))
        items.push(p([r('□ True      □ False      □ Not Given', { color: C.sub, size: SZ.sm })],
          { indent: { left: 400 }, spacing: { before: 0, after: 80 } }))
      }
    }

    // ── E6: Word Forms ────────────────────────────────────
    else if (ex.type === 'E6') {
      for (const item of ex.items) {
        const sent  = item.sentence.replace(/_____/g, '____________')
        const parts = sent.split(/(\([A-Z]+\))/)
        items.push(p(
          parts.flatMap((part, i) =>
            /^\([A-Z]+\)$/.test(part)
              ? [r('  ' + part, { bold: true, color: bc.dark, size: SZ.md })]
              : [r(i === 0 ? `${item.id}.  ${part}` : part, { size: SZ.md })]
          ),
          { spacing: { before: 80, after: 80 } }
        ))
      }
    }

    // ── E7: Sentence Reordering ───────────────────────────
    else if (ex.type === 'E7') {
      for (const item of ex.items) {
        const scrambled = (item.words ?? []).join('   ·   ')
        items.push(p([
          r(`${item.id}.  `, { bold: true, color: bc.dark, size: SZ.md }),
          r(scrambled, { color: bc.accent, size: SZ.md, bold: true }),
        ], { spacing: { before: 100, after: 40 } }))
        items.push(p([r('→  _______________________________________________', { color: C.sub, size: SZ.sm })],
          { indent: { left: 400 }, spacing: { before: 0, after: 80 } }))
      }
    }

    // ── E8: Error Fix ─────────────────────────────────────
    else if (ex.type === 'E8') {
      for (const item of ex.items) {
        items.push(new Paragraph({
          children: [
            r(`${item.id}.  `, { bold: true, color: bc.dark, size: SZ.md }),
            ...highlight(item.sentence, { size: SZ.md }),
          ],
          spacing: { before: 100, after: 40 },
        }))
        const opts = Object.entries(item.options).map(([k, v]) => `${k}.  ${v}`).join('      ')
        items.push(p([r(opts, { color: C.sub, size: SZ.sm })],
          { indent: { left: 400 }, spacing: { before: 0, after: 100 } }))
      }
    }

    items.push(gap(120, 0))
  }

  return items
}

function buildAnswerKey(answer_key, bc) {
  const exNums = Object.keys(answer_key).sort()
  const maxQ   = Math.max(...exNums.map(k => Object.keys(answer_key[k]).length))

  const headerRow = row([
    cell([p([r('#', { bold: true, color: C.white, size: SZ.sm })],
      { spacing: { before: 0, after: 0 } })],
      { shade: bc.dark, width: 500 }),
    ...exNums.map(k => cell(
      [p([r(k.toUpperCase(), { bold: true, color: C.white, size: SZ.sm })],
        { spacing: { before: 0, after: 0 } })],
      { shade: bc.dark }
    )),
  ])

  const ansRows = Array.from({ length: maxQ }, (_, i) => {
    const q  = i + 1
    const bg = i % 2 === 0 ? bc.light : C.white
    return row([
      cell([p([r(`${q}`, { bold: true, color: bc.dark, size: SZ.md })],
        { spacing: { before: 0, after: 0 } })],
        { shade: bg, width: 500 }),
      ...exNums.map(k => {
        const ans = answer_key[k]?.[String(q)] ?? '—'
        return cell(
          [p([r(ans, { bold: true, color: C.text, size: SZ.md })],
            { spacing: { before: 0, after: 0 } })],
          { shade: bg }
        )
      }),
    ])
  })

  return [
    new Paragraph({ pageBreakBefore: true, children: [] }),
    sectionBar('Answer Key · Đáp Án', '', bc),
    tbl([headerRow, ...ansRows], gridBorder),
  ]
}

// ── Generate one topic ─────────────────────────────────────────────────────────
async function generateTopic(book, topicId, bc) {
  const jsonPath = path.join(__dirname, '..', 'data', 'vocabwise', book, `${topicId}.json`)
  if (!fs.existsSync(jsonPath)) {
    console.warn(`  ⚠  Skipped (not found): ${jsonPath}`)
    return
  }

  const data  = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
  const { meta, passage, glossary, exercises, answer_key } = data

  const children = [
    ...buildHeader(meta, bc),
    ...buildPassage(passage, bc),
    gap(200, 0),
    ...buildVocabulary(glossary, bc),
    gap(200, 0),
    ...buildExercises(exercises, bc),
    ...buildAnswerKey(answer_key, bc),
  ]

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size:   { width: 11906, height: 16838 },              // A4 portrait
          margin: { top: 720, right: 720, bottom: 900, left: 720 }, // Narrow 0.5"
        },
      },
      footers: { default: makeFooter() },
      children,
    }],
  })

  const outPath = path.join(process.cwd(), `vocabwise-${book}-${topicId}.docx`)
  const buf     = await Packer.toBuffer(doc)
  fs.writeFileSync(outPath, buf)
  console.log(`  ✅  ${outPath}`)
}

// ── MAIN ───────────────────────────────────────────────────────────────────────
;(async () => {
  const [,, bookArg, topicArg] = process.argv
  const dataRoot = path.join(__dirname, '..', 'data', 'vocabwise')

  const targets = []  // [{book, topicId}]

  if (!bookArg || bookArg === 'all') {
    // all books
    for (const book of ['book1', 'book2', 'book3']) {
      const dir = path.join(dataRoot, book)
      if (!fs.existsSync(dir)) continue
      fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().forEach(f => {
        targets.push({ book, topicId: f.replace('.json', '') })
      })
    }
  } else if (!topicArg) {
    // all topics in one book
    const dir = path.join(dataRoot, bookArg)
    if (!fs.existsSync(dir)) { console.error(`❌  Book not found: ${bookArg}`); process.exit(1) }
    fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort().forEach(f => {
      targets.push({ book: bookArg, topicId: f.replace('.json', '') })
    })
  } else {
    // single topic
    targets.push({ book: bookArg, topicId: topicArg })
  }

  if (targets.length === 0) { console.error('❌  No topics found.'); process.exit(1) }

  console.log(`Generating ${targets.length} file(s)...\n`)
  for (const { book, topicId } of targets) {
    const bc = BOOK_COLORS[book] ?? BOOK_COLORS.book2
    await generateTopic(book, topicId, bc)
  }
  console.log('\nDone.')
})()
