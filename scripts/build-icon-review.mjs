// Dựng trang duyệt icon từ docs/icon-audit/audit-*.json.
// Run: node scripts/build-icon-review.mjs starter-seeker
import fs from 'node:fs'
const name = process.argv[2]
const audit = JSON.parse(fs.readFileSync(`docs/icon-audit/audit-${name}.json`, 'utf8'))
const src = fs.readFileSync('lib/wordIcon.ts', 'utf8') + fs.readFileSync('lib/wordIconExtension.ts', 'utf8')
const phosphor = {}
for (const [, k, v] of src.matchAll(/^\s*'?([a-zA-Z][\w \-]*)'?\s*:\s*'([A-Z]\w+)'/gm)) phosphor[k.toLowerCase()] = v
const svgs = new Set(fs.readdirSync('public/icons').map(f => f.replace(/\.\w+$/, '')))
const phIcon = n => n.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

const warnings = []
const rows = []
for (const [level, items] of Object.entries(audit)) {
  const topics = Object.values(JSON.parse(fs.readFileSync(`data/words/${level}.json`, 'utf8')))
    .flatMap(t => Array.isArray(t) ? t : [t]).filter(t => t?.words)
  const seen = new Set()
  for (const t of topics) {
    const finals = {}
    for (const w of t.words) {
      const a = items[w.word]
      if (a) seen.add(w.word)
      if (a?.img) continue
      const keepsPhosphor = phosphor[w.word.toLowerCase()] && !a?.dropP
      if (keepsPhosphor || svgs.has(w.word.toLowerCase())) continue
      const e = a?.emoji ?? w.emoji
      if (finals[e]) warnings.push(`${level}/${t.id}: ${finals[e]} và ${w.word} cùng ${e}`)
      finals[e] = w.word
    }
    for (const w of t.words) {
      const a = items[w.word]
      if (!a) continue
      const k = w.word.toLowerCase()
      const cur = phosphor[k] ? `Phosphor: ${phosphor[k]}` : w.emoji
      const to = a.reuse ? a.img : a.img ? `Ảnh riêng: ${a.img}` : a.emoji ?? w.emoji
      rows.push({ level, topic: t.name, id: t.id, word: w.word, meaning: w.meaning, cur, to, type: a.reuse ? 'reuse' : a.img ? 'img' : 'emoji', why: a.why })
    }
  }
  for (const w of Object.keys(items)) if (!seen.has(w)) warnings.push(`${level}: không tìm thấy từ "${w}"`)
}

const html = `<!doctype html><meta charset="utf-8"><title>Duyệt icon: ${esc(name)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/duotone/style.css">
<style>
.ph-duotone{font-size:36px;display:block;margin-bottom:2px}.thumb{width:48px;height:48px;display:block}
body{font:15px system-ui;margin:0;background:#f8fafc;color:#1e293b}
header{position:sticky;top:0;background:#fff;padding:12px 16px;border-bottom:1px solid #e2e8f0;display:flex;gap:12px;flex-wrap:wrap;align-items:center;z-index:1}
main{padding:12px 16px}table{border-collapse:collapse;width:100%;background:#fff}
td,th{padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:left;vertical-align:middle}
th{background:#f1f5f9;font-size:13px}.big{font-size:32px;line-height:1;white-space:nowrap}.small{font-size:13px;color:#475569}
.img{font-size:13px;color:#7c2d12;background:#fff7ed;border-radius:6px;padding:4px 8px;display:inline-block}
tr.rej{background:#fef2f2}tr.rej .to{text-decoration:line-through;opacity:.5}
input[type=text]{width:100%;min-width:130px;padding:5px;font-size:14px;box-sizing:border-box}
button{padding:8px 14px;border-radius:8px;border:1px solid #cbd5e1;background:#fff;font-size:14px;cursor:pointer}
button.main{background:#db2777;color:#fff;border:0}select{padding:7px;font-size:14px}
</style>
<header><b>Duyệt icon</b><span class="small">Mặc định là duyệt hết. Anh chỉ cần bỏ tick dòng không ưng hoặc ghi chú.</span>
<select id="f"><option value="">Tất cả</option><option value="img">Cần ảnh riêng</option><option value="emoji">Đổi emoji / bỏ Phosphor</option><option value="reuse">Dùng lại ảnh có sẵn</option>${Object.keys(audit).map(l => `<option value="${l}">${l}</option>`).join('')}</select>
<span id="sum" class="small"></span><button class="main" id="dl">Tải quyết định</button></header>
<main><table><thead><tr><th>Duyệt</th><th>Level / chủ đề</th><th>Từ</th><th>Hiện tại</th><th>Đề xuất</th><th>Lý do</th><th>Ghi chú của anh</th></tr></thead><tbody>
${rows.map((r, i) => `<tr data-i="${i}" data-type="${r.type}" data-level="${r.level}">
<td><input type="checkbox" class="ok" checked></td><td class="small">${r.level}<br>${esc(r.topic)}</td>
<td><b>${esc(r.word)}</b><br><span class="small">${esc(r.meaning)}</span></td>
<td class="${r.cur.startsWith('Phosphor') ? 'small' : 'big'}">${r.cur.startsWith('Phosphor') ? `<i class="ph-duotone ph-${phIcon(r.cur.slice(10))}"></i>` : ''}${esc(r.cur)}</td>
<td class="to">${r.type === 'reuse' ? `<img class="thumb" src="../../public/icons/words/${esc(r.word)}.webp" alt=""><span class="small">Ảnh đã có</span>` : r.type === 'img' ? `<span class="img">${esc(r.to)}</span>` : `<span class="big">${esc(r.to)}</span>`}</td>
<td class="small">${esc(r.why)}</td><td><input type="text" class="note" placeholder="vd: dùng 🌳"></td></tr>`).join('')}
</tbody></table></main>
<script>
const NAME=${JSON.stringify(name)},ROWS=${JSON.stringify(rows.map(r => ({ level: r.level, id: r.id, word: r.word })))},KEY='icon-review-'+NAME;
const saved=JSON.parse(localStorage.getItem(KEY)||'{}'),trs=[...document.querySelectorAll('tbody tr')];
function sum(){document.getElementById('sum').textContent=trs.filter(t=>t.querySelector('.ok').checked).length+'/'+trs.length+' dòng được duyệt'}
function save(){const o={};trs.forEach(t=>{const ok=t.querySelector('.ok').checked,n=t.querySelector('.note').value;t.classList.toggle('rej',!ok);if(!ok||n)o[t.dataset.i]={ok,note:n}});localStorage.setItem(KEY,JSON.stringify(o));sum()}
trs.forEach(t=>{const s=saved[t.dataset.i];if(s){t.querySelector('.ok').checked=s.ok;t.querySelector('.note').value=s.note||''}t.addEventListener('input',save)});save();
document.getElementById('f').onchange=e=>{const v=e.target.value;trs.forEach(t=>{t.style.display=!v||t.dataset.type===v||t.dataset.level===v?'':'none'})};
document.getElementById('dl').onclick=()=>{const out=trs.map(t=>({...ROWS[t.dataset.i],ok:t.querySelector('.ok').checked,note:t.querySelector('.note').value})).filter(r=>!r.ok||r.note);
const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(out,null,1)],{type:'application/json'}));a.download='decisions-'+NAME+'.json';a.click()};
</script>`
fs.writeFileSync(`docs/icon-audit/review-${name}.html`, html)
const imgs = new Set(rows.filter(r => r.type === 'img').map(r => r.word))
console.log(`rows=${rows.length} images(unique)=${imgs.size} emoji/phosphor=${rows.filter(r => r.type !== 'img').length}`)
console.log(warnings.length ? 'WARN\n' + warnings.join('\n') : 'no warnings')
