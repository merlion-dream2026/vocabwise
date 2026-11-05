// Sinh danh sách ảnh cho GPT từ docs/icon-audit/audit-*.json + legacy-icons.json.
// Run: node scripts/build-icon-gpt-list.mjs starter-seeker <thư mục ra> [số ảnh/batch]
import fs from 'node:fs'
const [name, out, size = '10'] = process.argv.slice(2)
const audit = JSON.parse(fs.readFileSync(`docs/icon-audit/audit-${name}.json`, 'utf8'))
const legacy = JSON.parse(fs.readFileSync('docs/icon-audit/legacy-icons.json', 'utf8'))
const SAMPLES = ['submarine', 'lighthouse']
const FIRST = ['pier', 'sailor', 'current', 'harbour', 'coast', 'tide', 'starfish', 'waterfall', 'bounce', 'sand']

const meaning = {}
for (const level of ['starter', 'seeker', 'explorer', 'ranger', 'scholar', 'master']) {
  for (const t of JSON.parse(fs.readFileSync(`data/words/${level}.json`, 'utf8')).topics) {
    for (const w of t.words) if (audit[level]?.[w.word] || legacy[w.word]) meaning[w.word] ??= w.meaning
  }
}
const subject = {}
for (const items of Object.values(audit)) for (const [w, a] of Object.entries(items)) if (a.img) subject[w] = a.img
for (const [w, d] of Object.entries(legacy)) subject[w] ??= d

const rest = Object.keys(subject).filter(w => !SAMPLES.includes(w)).sort((a, b) => {
  const [x, y] = [FIRST.indexOf(a), FIRST.indexOf(b)]
  return (x < 0 ? 999 : x) - (y < 0 ? 999 : y) || a.localeCompare(b)
})
const csv = s => `"${String(s).replace(/"/g, '""')}"`
const rows = SAMPLES.map(w => ['batch-00', w])
rest.forEach((w, i) => rows.push([`batch-${String(Math.floor(i / +size) + 1).padStart(2, '0')}`, w]))
const lines = rows.map(([b, w]) => [b, `${w}.png`, w, meaning[w] ?? '', subject[w]].map(csv).join(','))
fs.writeFileSync(`${out}/02-ICON-LIST.csv`, ['batch,file,word,meaning_vi,subject', ...lines].join('\n') + '\n')
const counts = {}
for (const [b] of rows) counts[b] = (counts[b] ?? 0) + 1
console.log(rows.length, 'icons', counts)
console.log('missing meaning:', rows.filter(([, w]) => !meaning[w]).map(([, w]) => w).join(',') || 'none')
