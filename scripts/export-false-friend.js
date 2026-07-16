// Export Academic glossary words for a "false friend / confusable word" audit via
// GPT Plus, then re-import the results into glossary[].false_friend.
//
// Two modes:
//   Full audit  — items with false_friend == null. GPT decides IF a false friend
//                  exists and, if so, supplies word + explanation + examples.
//   Backfill    — items that already have {word_vi/word, explanation_vi} from an
//                  earlier round but no example sentences. Legacy word_vi is often
//                  unreliable (Vietnamese gloss or heteronym note, not a clean
//                  English word), so GPT re-derives/confirms FALSE_FRIEND from the
//                  (reliable, human-written) EXPLANATION instead of trusting it.
//
// Output layout — prompt is written ONCE and reused; data files carry no
// instructions, so you paste the prompt into GPT Plus a single time and attach
// however many book/part data files you want processed in that conversation:
//   exports/false-friend-audit/PROMPT-full-audit.md   ← paste this once
//   exports/false-friend-audit/PROMPT-backfill.md     ← paste this once
//   exports/false-friend-audit/book{N}-part{P}.md      ← attach these (full audit)
//   exports/false-friend-audit/book{N}-backfill.md     ← attach these (backfill)
//
// Usage:
//   node scripts/export-false-friend.js --book 1 --split 4              → full-audit export
//   node scripts/export-false-friend.js --book 1 --backfill --split 2   → backfill export
//   node scripts/export-false-friend.js --import <result.md>            → import (auto-detects
//                                                                          mode per block)
//
// Import validates every block BEFORE writing anything (all-or-nothing) — a single
// bad block should not leave some topic files patched and others not.

const fs   = require('fs')
const path = require('path')

const ROOT    = path.join(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'exports', 'false-friend-audit')

const args       = process.argv.slice(2)
const bookArg    = args.includes('--book') ? args[args.indexOf('--book') + 1] : null
const splitArg   = args.includes('--split') ? parseInt(args[args.indexOf('--split') + 1]) : 1
const importAt   = args.includes('--import') ? args[args.indexOf('--import') + 1] : null
const backfillMode = args.includes('--backfill')

function restoreMojibakePunctuation(s) {
  return s
    .replace(/Â(?=.)/g, '')
    .replace(/â(\S(?:.*?\S)?)â/g, '"$1"')
    .replace(/(\s)â(\s)/g, '$1—$2')
    .replace(/([a-zA-Z])â([a-zA-Z])/g, "$1'$2")
    .replace(/([a-zA-Z])â(?=[\s,.;:])/g, "$1'")
}

function topicFiles(book) {
  const dir = path.join(ROOT, 'data', 'vocabwise', `book${book}`)
  return fs.readdirSync(dir).filter(f => /^b\d-t\d+\.json$/.test(f)).sort().map(f => path.join(dir, f))
}

// ---------- export ----------

function topicLines(file, mode) {
  const topicId = path.basename(file, '.json')
  const d = JSON.parse(fs.readFileSync(file, 'utf-8'))
  const items = (d.glossary || []).filter(it => {
    if (it.type === 'collocation' || !it.word) return false
    // A handful of legacy entries store false_friend as a raw string instead of
    // {word_vi, explanation_vi} — not safely backfillable by field access, skip them.
    return mode === 'backfill'
      ? !!it.false_friend && typeof it.false_friend === 'object'
      : !it.false_friend
  })
  if (!items.length) return null
  const lines = [`<!-- topic: ${topicId} -->`]
  for (const it of items) {
    if (mode === 'backfill') {
      // Legacy word_vi is unreliable — don't show it as a pre-decided answer, let
      // GPT re-derive FALSE_FRIEND from the (human-written, reliable) explanation.
      lines.push(`${it.id}. ${it.word} (${it.pos || '?'}) — ${it.false_friend.explanation_vi}`)
    } else {
      lines.push(`${it.id}. ${it.word} (${it.pos || '?'}) - ${(it.meaning_vi || '').split(';')[0]}`)
    }
  }
  lines.push(`<!-- /topic -->`, '')
  return lines
}

const FULL_AUDIT_PROMPT = [
  '# False Friend / Confusable Word audit — full',
  '',
  'Bạn là chuyên gia ngôn ngữ hỗ trợ học sinh Việt Nam học từ vựng tiếng Anh (mục tiêu IELTS/SAT).',
  '',
  'Mỗi file đính kèm chứa danh sách từ theo từng topic, định dạng:',
  '<!-- topic: b1-t01 -->',
  '1. word (pos) - nghĩa tiếng Việt',
  '...',
  '<!-- /topic -->',
  '',
  'Với mỗi từ trong danh sách, xét: từ này có "false friend" hoặc từ dễ nhầm (confusable) PHỔ BIẾN với học sinh Việt Nam không? Chỉ tính những nhầm lẫn thực sự hay gặp — KHÔNG cố ép ra một từ nếu không có nhầm lẫn nào đáng kể.',
  '',
  'CHỈ trả lời cho những từ CÓ false friend — bỏ qua hoàn toàn (không viết gì) những từ không có, để giữ câu trả lời gọn.',
  '',
  'Với mỗi từ có false friend, trả lời đúng format sau, không dùng markdown heading (không có ###), không in đậm cả dòng:',
  '',
  '[<topic_id>/item<id>]',
  'ORIGINAL_WORD: [từ gốc, chép lại y hệt từ trong danh sách]',
  'FALSE_FRIEND: [từ hay bị nhầm]',
  'EXPLANATION_VI: [1-2 câu giải thích ngắn gọn sự khác biệt, bằng tiếng Việt]',
  'EXAMPLE_EN: [câu tiếng Anh dùng từ gốc]',
  'EXAMPLE_VI: [dịch câu trên]',
  'FF_EXAMPLE_EN: [câu tiếng Anh dùng false friend]',
  'FF_EXAMPLE_VI: [dịch câu trên]',
  '',
  'QUAN TRỌNG: EXAMPLE_EN và FF_EXAMPLE_EN phải dùng CHUNG một bối cảnh/tình huống (càng giống nhau càng tốt) và chỉ khác nhau ở từ được dùng, để khi đặt 2 câu cạnh nhau học sinh thấy rõ ngay điểm khác biệt. Tránh 2 câu ở 2 chủ đề hoàn toàn khác nhau.',
  '',
  'Giữ nguyên topic_id và item id y hệt trong ngoặc vuông của danh sách gốc.',
  '',
  'Với MỖI file đính kèm, xuất 1 file .md kết quả riêng để tải xuống (dùng tính năng tạo file/canvas) — đặt tên file kết quả bằng cách lấy tên file gốc, bỏ đuôi ".md", thêm "-result.md" (vd file đính kèm "book1-part1.md" → xuất "book1-part1-result.md"). Mỗi file kết quả chỉ chứa các block [topic_id/item...] theo đúng format trên — không thêm lời chào, giải thích, hay tóm tắt nào khác ngoài các block. Nếu có nhiều file đính kèm, xử lý và xuất kết quả cho TẤT CẢ, không chỉ file đầu tiên.',
].join('\n')

const BACKFILL_PROMPT = [
  '# False Friend / Confusable Word audit — backfill examples',
  '',
  'Bạn là chuyên gia ngôn ngữ hỗ trợ học sinh Việt Nam học từ vựng tiếng Anh (mục tiêu IELTS/SAT).',
  '',
  'Mỗi file đính kèm chứa danh sách từ theo từng topic, định dạng:',
  '<!-- topic: b1-t01 -->',
  '4. word (pos) — giải thích false friend đã có sẵn (EXPLANATION)',
  '...',
  '<!-- /topic -->',
  '',
  'Các từ này ĐÃ được xác định là có false friend/confusable, kèm giải thích (EXPLANATION) viết sẵn — giải thích này đáng tin cậy, KHÔNG cần đánh giá lại nội dung này.',
  '',
  'Nhiệm vụ: (1) đọc EXPLANATION, xác định xem đó có phải 1 CẶP 2 TỪ TIẾNG ANH KHÁC NHAU hay không (vd "dinner" vs "diner"), hay chỉ là 1 từ duy nhất có nhiều nghĩa/cách đọc khác nhau (heteronym, vd "live" /lɪv/ vs /laɪv/ — cùng 1 từ, không phải 2 từ). (2) Viết 2 câu ví dụ.',
  '',
  'Trả lời đúng format sau, không dùng markdown heading (không có ###), không in đậm cả dòng:',
  '',
  '[<topic_id>/item<id>]',
  'ORIGINAL_WORD: [từ gốc, chép lại y hệt từ trong danh sách]',
  'FALSE_FRIEND: [nếu EXPLANATION nói về 2 từ khác nhau, ghi từ tiếng Anh còn lại ở đây (vd "diner"). NẾU chỉ là 1 từ nhiều nghĩa (heteronym) — không có từ thứ 2 — để TRỐNG dòng này (không ghi gì sau dấu :)]',
  'EXAMPLE_EN: [câu tiếng Anh dùng từ gốc]',
  'EXAMPLE_VI: [dịch câu trên]',
  'FF_EXAMPLE_EN: [câu tiếng Anh minh hoạ nghĩa/cách dùng thứ 2 — dùng false friend nếu có, hoặc dùng lại từ gốc với nghĩa khác nếu là heteronym]',
  'FF_EXAMPLE_VI: [dịch câu trên]',
  '',
  'QUAN TRỌNG: 2 câu ví dụ phải dùng CHUNG một bối cảnh/tình huống (càng giống nhau càng tốt) và chỉ khác nhau ở từ được dùng, để khi đặt cạnh nhau học sinh thấy rõ ngay điểm khác biệt.',
  '',
  'Trả lời cho TẤT CẢ các dòng trong file (không có dòng nào bị bỏ qua, vì false friend đã được xác nhận từ trước).',
  '',
  'Với MỖI file đính kèm, xuất 1 file .md kết quả riêng để tải xuống (dùng tính năng tạo file/canvas) — đặt tên file kết quả bằng cách lấy tên file gốc, bỏ đuôi ".md", thêm "-result.md" (vd file đính kèm "book1-backfill.md" → xuất "book1-backfill-result.md"). Mỗi file kết quả chỉ chứa các block [topic_id/item...] theo đúng format trên — không thêm lời chào, giải thích, hay tóm tắt nào khác ngoài các block. Nếu có nhiều file đính kèm, xử lý và xuất kết quả cho TẤT CẢ, không chỉ file đầu tiên.',
].join('\n')

function doExport() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  fs.writeFileSync(path.join(OUT_DIR, 'PROMPT-full-audit.md'), FULL_AUDIT_PROMPT, 'utf-8')
  fs.writeFileSync(path.join(OUT_DIR, 'PROMPT-backfill.md'), BACKFILL_PROMPT, 'utf-8')

  const mode = backfillMode ? 'backfill' : 'full'
  const allTopicLines = topicFiles(parseInt(bookArg)).map(f => topicLines(f, mode)).filter(Boolean)
  if (!allTopicLines.length) { console.log('Không có topic nào cần export ở mode này.'); return }
  const chunkSize = Math.ceil(allTopicLines.length / splitArg)
  const suffix = backfillMode ? '-backfill' : ''
  for (let part = 0; part < splitArg; part++) {
    const chunk = allTopicLines.slice(part * chunkSize, (part + 1) * chunkSize)
    if (!chunk.length) continue
    const name = splitArg > 1 ? `book${bookArg}${suffix}-part${part + 1}.md` : `book${bookArg}${suffix}.md`
    const text = chunk.flat().join('\n')
    fs.writeFileSync(path.join(OUT_DIR, name), text, 'utf-8')
    console.log(`✅ ${name}: ${chunk.length} topics, ${text.length} chars`)
  }
  console.log(`\nPrompt (dán 1 lần vào GPT Plus): ${path.join(OUT_DIR, backfillMode ? 'PROMPT-backfill.md' : 'PROMPT-full-audit.md')}`)
  console.log(`Rồi attach các file book...md ở trên vào cùng chat.`)
}

// ---------- import ----------

const FIELD_MAP = {
  ORIGINAL_WORD:  '__originalWord',
  FALSE_FRIEND:   'word',
  EXPLANATION_VI: 'explanation_vi',
  EXAMPLE_EN:     'example_en',
  EXAMPLE_VI:     'example_vi',
  FF_EXAMPLE_EN:  'ff_example_en',
  FF_EXAMPLE_VI:  'ff_example_vi',
}
const EXAMPLE_FIELDS = ['example_en', 'example_vi', 'ff_example_en', 'ff_example_vi']
const FULL_REQUIRED_FIELDS = ['word', 'explanation_vi', ...EXAMPLE_FIELDS]

// Header may or may not carry a Markdown "### " prefix — GPT output pasted from a
// chat UI often loses it since "### [...]" renders as an actual heading there.
function parseFixFile(text) {
  const blocks = text.split(/^#{0,6}\s*\[(?=b\d+-t\d+\/item\d+\])/m).slice(1)
  return blocks.map(block => {
    const [idLine, ...rest] = block.split('\n')
    const id = idLine.replace(/\]\s*$/, '').trim()
    const m = id.match(/^(b(\d+)-t\d+)\/item(\d+)$/)
    if (!m) throw new Error(`Bad block id: [${id}]`)
    const [, topicId, book, itemId] = m

    const fields = {}
    for (const line of rest) {
      const fm = line.match(/^([A-Z_]+):\s?(.*)$/)
      if (!fm) continue
      const [, key, value] = fm
      if (!FIELD_MAP[key]) continue
      // Mojibake repair targets English text only — Vietnamese fields legitimately
      // contain "â" as a normal letter (e.g. "tâm"), which the repair would corrupt.
      const isEnglishField = key === 'ORIGINAL_WORD' || key === 'FALSE_FRIEND' || key === 'EXAMPLE_EN' || key === 'FF_EXAMPLE_EN'
      fields[FIELD_MAP[key]] = isEnglishField ? restoreMojibakePunctuation(value.trim()) : value.trim()
    }
    return { book: Number(book), topicId, itemId: Number(itemId), fields }
  })
}

function doImport() {
  const text = fs.readFileSync(importAt, 'utf-8')
  const blocks = parseFixFile(text)
  console.log(`Parsed ${blocks.length} false-friend block(s) from ${importAt}\n`)

  const dataCache = new Map() // "book/topicId" -> { filePath, data }
  const errors = []
  const changeLog = []

  for (const b of blocks) {
    const key = `${b.book}/${b.topicId}`
    if (!dataCache.has(key)) {
      const filePath = path.join(ROOT, 'data', 'vocabwise', `book${b.book}`, `${b.topicId}.json`)
      if (!fs.existsSync(filePath)) { errors.push(`${key}: file not found at ${filePath}`); continue }
      dataCache.set(key, { filePath, data: JSON.parse(fs.readFileSync(filePath, 'utf-8')) })
    }
    const entry = dataCache.get(key)
    if (!entry) continue

    const item = (entry.data.glossary || []).find(it => it.id === b.itemId)
    if (!item) { errors.push(`${key} item${b.itemId}: not found in glossary`); continue }

    const { __originalWord, ...ffFields } = b.fields
    if (!__originalWord) { errors.push(`${key} item${b.itemId}: missing ORIGINAL_WORD`); continue }
    if (__originalWord.toLowerCase() !== (item.word || '').toLowerCase()) {
      errors.push(`${key} item${b.itemId}: ORIGINAL_WORD "${__originalWord}" != glossary word "${item.word}" — numbering drift?`)
      continue
    }

    // Mode is determined by the ITEM's existing state, not by which fields the
    // block happens to carry — both modes may include a FALSE_FRIEND line now
    // (backfill uses it to let GPT re-derive a clean word from EXPLANATION,
    // since legacy word_vi is often unreliable).
    const isBackfill = !!item.false_friend

    if (isBackfill) {
      if (typeof item.false_friend !== 'object') { errors.push(`${key} item${b.itemId}: existing false_friend is a raw string, not backfillable automatically — handle manually`); continue }
      if (ffFields.word && ffFields.word.toLowerCase() === item.word.toLowerCase()) { errors.push(`${key} item${b.itemId}: FALSE_FRIEND same as original word — should be left blank for heteronyms`); continue }
      const missing = EXAMPLE_FIELDS.filter(f => !ffFields[f])
      if (missing.length) { errors.push(`${key} item${b.itemId}: missing/empty field(s) ${missing.join(', ')}`); continue }
      item.__pendingFalseFriend = {
        word: ffFields.word || '',
        explanation_vi: item.false_friend.explanation_vi,
        example_en: ffFields.example_en, example_vi: ffFields.example_vi,
        ff_example_en: ffFields.ff_example_en, ff_example_vi: ffFields.ff_example_vi,
      }
    } else {
      const missingBase = FULL_REQUIRED_FIELDS.filter(f => f !== 'word' && !ffFields[f])
      if (!ffFields.word) missingBase.push('word')
      if (missingBase.length) { errors.push(`${key} item${b.itemId}: missing/empty field(s) ${missingBase.join(', ')}`); continue }
      // GPT sometimes echoes ORIGINAL_WORD back as FALSE_FRIEND for a heteronym
      // (same spelling, different meaning/stress, e.g. object (n.) vs object (v.))
      // rather than leaving the field blank — normalize to blank rather than
      // erroring, matching how backfill mode represents "no distinct 2nd word".
      if (ffFields.word.toLowerCase() === item.word.toLowerCase()) ffFields.word = ''
      item.__pendingFalseFriend = ffFields
    }

    const pending = item.__pendingFalseFriend
    if (!pending.example_en.toLowerCase().includes(item.word.toLowerCase().slice(0, 4))) {
      console.log(`  ⚠️  ${key} item${b.itemId}: EXAMPLE_EN may not actually contain "${item.word}" — check manually`)
    }
    if (!pending.ff_example_en.toLowerCase().includes(pending.word.toLowerCase().slice(0, 4))) {
      console.log(`  ⚠️  ${key} item${b.itemId}: FF_EXAMPLE_EN may not actually contain "${pending.word}" — check manually`)
    }
    changeLog.push({ key, itemId: b.itemId, word: item.word, falseFriend: pending.word, mode: isBackfill ? 'backfill' : 'full' })
  }

  if (errors.length > 0) {
    console.error(`${errors.length} error(s) — ABORTED, no files written:\n`)
    errors.forEach(e => console.error('  - ' + e))
    process.exit(1)
  }

  for (const { filePath, data } of dataCache.values()) {
    for (const item of data.glossary || []) {
      if (item.__pendingFalseFriend) {
        item.false_friend = item.__pendingFalseFriend
        delete item.__pendingFalseFriend
      }
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
  }

  console.log(`Applied ${changeLog.length} false_friend entr(y/ies) across ${dataCache.size} topic file(s):\n`)
  for (const c of changeLog) console.log(`  [${c.key} item${c.itemId}] (${c.mode}) ${c.word} ≠ ${c.falseFriend}`)
  const books = [...new Set(changeLog.map(c => c.key.split('/')[0]))]
  console.log(`\nNhớ chạy: ${books.map(b => `node scripts/vw-seed.js --book ${b} --dir data/vocabwise/book${b}/`).join(' && ')} để reseed Supabase.`)
}

if (importAt) doImport()
else doExport()
