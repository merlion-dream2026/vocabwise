// Sinh danh sách ảnh cho GPT từ docs/icon-audit/audit-<đợt>.json.
// Run: node scripts/build-icon-gpt-list.mjs explorer-master <thư mục đợt> [số ảnh/batch] [từ-làm-trước,...]
// Bỏ qua dòng reuse: true. Từ dùng chung ảnh (cùng file) chỉ ra 1 dòng.
// Cột style: ảnh có xuất hiện ở Master = mature, còn lại = standard (mẫu prompt riêng trong 01-PROMPT-GPT).
import fs from 'node:fs'
const [name, out, size = '5', first = ''] = process.argv.slice(2)
const audit = JSON.parse(fs.readFileSync(`docs/icon-audit/audit-${name}.json`, 'utf8'))
const FIRST = first ? first.split(',') : []
const stem = (word, a) => a.file ?? word.toLowerCase().replace(/\s+/g, '-')

const items = new Map()
for (const [level, words] of Object.entries(audit)) {
  const all = JSON.parse(fs.readFileSync(`data/words/${level}.json`, 'utf8')).topics.flatMap(t => t.words)
  for (const [word, a] of Object.entries(words)) {
    if (!a.img || a.reuse) continue
    const f = stem(word, a)
    const prev = items.get(f)
    if (prev && prev.subject !== a.img) throw new Error(`${f}: 2 subject khác nhau`)
    const item = prev ?? { file: f, word, meaning: all.find(w => w.word === word)?.meaning ?? '', subject: a.img, style: 'standard' }
    if (level === 'master') item.style = 'mature'
    items.set(f, item)
  }
}
const rank = f => { const i = FIRST.indexOf(f); return i < 0 ? 999 : i }
const list = [...items.values()].sort((a, b) => rank(a.file) - rank(b.file) || a.file.localeCompare(b.file))
const csv = s => `"${String(s).replace(/"/g, '""')}"`
const lines = list.map((x, i) => [`batch-${String(Math.floor(i / +size) + 1).padStart(2, '0')}`, `${x.file}.png`, x.word, x.meaning, x.subject, x.style].map(csv).join(','))
fs.writeFileSync(`${out}/02-ICON-LIST.csv`, ['batch,file,word,meaning_vi,subject,style', ...lines].join('\n') + '\n')
console.log(list.length, 'ảnh,', Math.ceil(list.length / +size), 'batch; thiếu nghĩa:', list.filter(x => !x.meaning).map(x => x.file).join(',') || 'không')
