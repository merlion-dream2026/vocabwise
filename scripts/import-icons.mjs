// Nạp icon GPT vào app. Chạy lại an toàn nhiều lần, mỗi lần nạp thêm batch mới.
// Luôn gộp MỌI docs/icon-audit/audit-*.json, nên ảnh của các đợt trước không bị mất.
// Run: node scripts/import-icons.mjs <thư mục đợt trên Drive> batch-02 batch-03 ...
// Không truyền batch: chỉ áp dụng đổi emoji, bỏ Phosphor, nối ảnh có sẵn.
// Sau đó: node scripts/split-words-per-topic.js
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { renderIcon } from './lib/iconRender.mjs'

const [root, ...batches] = process.argv.slice(2)
const audits = fs.readdirSync('docs/icon-audit').filter(f => /^audit-.*\.json$/.test(f))
  .map(f => JSON.parse(fs.readFileSync(`docs/icon-audit/${f}`, 'utf8')))
const legacy = JSON.parse(fs.readFileSync('docs/icon-audit/legacy-icons.json', 'utf8'))
const OUT = 'public/icons/words'
const stem = (word, a) => a?.file ?? word.toLowerCase().replace(/\s+/g, '-')
fs.mkdirSync(path.join(OUT, 'zoom'), { recursive: true })

let done = 0
const bad = []
if (batches.length) {
  const rows = fs.readFileSync(path.join(root, '02-ICON-LIST.csv'), 'utf8').trim().split('\n').slice(1)
    .map(l => l.match(/"((?:[^"]|"")*)"/g).map(s => s.slice(1, -1)))
  for (const [batch, file] of rows) {
    if (!batches.includes(batch)) continue
    const src = path.join(root, '03-GPT-OUTPUT', batch, file)
    try {
      // 256px cho thẻ/game, 512px cho popup phóng to (WordIcon zoomable).
      const webp = file.replace(/\.png$/, '.webp')
      await sharp(await renderIcon(src, 256)).webp({ quality: 82, alphaQuality: 90 }).toFile(path.join(OUT, webp))
      await sharp(await renderIcon(src, 512)).webp({ quality: 82, alphaQuality: 90 }).toFile(path.join(OUT, 'zoom', webp))
      done++
    } catch (e) {
      bad.push(`${batch}/${file}: ${e.message}`)
    }
  }
}

const have = new Set(fs.readdirSync(OUT).filter(f => f.endsWith('.webp')).map(f => f.slice(0, -5)))
const sense = {}
const dropP = new Set()
for (const audit of audits) {
  for (const [level, items] of Object.entries(audit)) {
    const p = `data/words/${level}.json`
    const raw = fs.readFileSync(p, 'utf8')
    const data = JSON.parse(raw)
    for (const t of data.topics) {
      for (const w of t.words) {
        const a = items[w.word]
        if (!a) continue
        if (a.emoji) w.emoji = a.emoji
        if (a.dropP) dropP.add(w.word.toLowerCase())
        const f = stem(w.word, a)
        if (a.img && have.has(f)) sense[`${w.word.toLowerCase()}|${w.emoji}`] = `/icons/words/${f}.webp`
      }
    }
    fs.writeFileSync(p, JSON.stringify(data) + (raw.endsWith('\n') ? '\n' : ''))
  }
}

// Bỏ Phosphor của từ cụ thể: map gắn theo chữ nên có hiệu lực ở mọi level.
let dropped = 0
for (const p of ['lib/wordIcon.ts', 'lib/wordIconExtension.ts']) {
  const lines = fs.readFileSync(p, 'utf8').split('\n')
  const kept = lines.filter(l => {
    const m = l.match(/^\s*'?([a-zA-Z][\w \-]*)'?\s*:\s*'[A-Z]\w+'/)
    return !(m && dropP.has(m[1].toLowerCase()))
  })
  dropped += lines.length - kept.length
  fs.writeFileSync(p, kept.join('\n'))
}

const byWord = Object.fromEntries(Object.keys(legacy).filter(w => have.has(w)).sort().map(w => [w, `/icons/words/${w}.webp`]))
const sorted = Object.fromEntries(Object.entries(sense).sort(([a], [b]) => a.localeCompare(b)))
fs.writeFileSync('lib/wordImageIcons.ts', `// AUTO-GENERATED — do not edit manually; run scripts/import-icons.mjs
// Key = "word|emoji": emoji is per-level in data/words, so the key picks one sense
// (remote = TV remote in Seeker, "remote place" in Ranger).
export const SENSE_IMAGES: Record<string, string> = ${JSON.stringify(sorted, null, 2)}

// Replacements for the older word-keyed icons in lib/wordIcon.ts.
export const WORD_IMAGES: Record<string, string> = ${JSON.stringify(byWord, null, 2)}
`)
const size = fs.readdirSync(OUT).filter(f => f.endsWith('.webp')).reduce((n, f) => n + fs.statSync(path.join(OUT, f)).size, 0)
console.log(`nạp ${done} ảnh; tổng ${have.size} ảnh, ${(size / 1024).toFixed(0)}KB; sense=${Object.keys(sorted).length} word=${Object.keys(byWord).length}; bỏ Phosphor ${dropped} dòng`)
if (bad.length) console.log('LỖI\n' + bad.join('\n'))
