// Nạp icon GPT vào app. Chạy lại an toàn nhiều lần, mỗi lần nạp thêm batch mới.
// Run: node scripts/import-icons.mjs starter-seeker <thư mục gốc Drive> batch-02 batch-03 ...
// Sau đó: node scripts/split-words-per-topic.js
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const [name, root, ...batches] = process.argv.slice(2)
const audit = JSON.parse(fs.readFileSync(`docs/icon-audit/audit-${name}.json`, 'utf8'))
const legacy = JSON.parse(fs.readFileSync('docs/icon-audit/legacy-icons.json', 'utf8'))
const OUT = 'public/icons/words'
fs.mkdirSync(OUT, { recursive: true })

const rows = fs.readFileSync(path.join(root, '02-ICON-LIST.csv'), 'utf8').trim().split('\n').slice(1)
  .map(l => l.match(/"((?:[^"]|"")*)"/g).map(s => s.slice(1, -1)))
let done = 0
const bad = []
for (const [batch, file, word] of rows) {
  if (!batches.includes(batch)) continue
  const src = path.join(root, '03-GPT-OUTPUT', batch, file)
  try {
    // GPT vẽ sát mép (tới 97% khung) nên cắt nền thừa rồi đặt lại lề đều: 256px, lề 16px.
    const trimmed = await sharp(src).trim({ threshold: 8 }).toBuffer()
    await sharp(trimmed)
      .resize(224, 224, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({ top: 16, bottom: 16, left: 16, right: 16, background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 82, alphaQuality: 90 })
      .toFile(path.join(OUT, `${word}.webp`))
    done++
  } catch (e) {
    bad.push(`${batch}/${file}: ${e.message}`)
  }
}

const have = new Set(fs.readdirSync(OUT).map(f => f.replace(/\.webp$/, '')))
const sense = {}
for (const [level, items] of Object.entries(audit)) {
  const p = `data/words/${level}.json`
  const raw = fs.readFileSync(p, 'utf8')
  const data = JSON.parse(raw)
  for (const t of data.topics) {
    for (const w of t.words) {
      const a = items[w.word]
      if (!a) continue
      if (a.emoji) w.emoji = a.emoji
      if (a.img && have.has(w.word)) sense[`${w.word.toLowerCase()}|${w.emoji}`] = `/icons/words/${w.word}.webp`
    }
  }
  fs.writeFileSync(p, JSON.stringify(data) + (raw.endsWith('\n') ? '\n' : ''))
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
const size = fs.readdirSync(OUT).reduce((n, f) => n + fs.statSync(path.join(OUT, f)).size, 0)
console.log(`nạp ${done} ảnh; tổng ${have.size} ảnh, ${(size / 1024).toFixed(0)}KB; sense=${Object.keys(sorted).length} word=${Object.keys(byWord).length}`)
if (bad.length) console.log('LỖI\n' + bad.join('\n'))
