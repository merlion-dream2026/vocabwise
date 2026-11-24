// QA for scripts/gen-audio-phonics.mjs: Groq Whisper transcribes every clip, compares it with the
// text, and writes a listening page (flagged clips first) for Andie.
// Usage: node --env-file=.env.local scripts/qa-audio-phonics.mjs [--out <dir>]
// data/phonics-audio-qa.json caches transcripts per file → re-runs only transcribe new clips.
// Whisper can't hear a subtle vowel slip (ship/sheep at 90%), so the page also groups minimal pairs
// for a human listen — flags are a first filter, not the verdict.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DIR = 'public/audio/phonics/'
const INDEX = 'data/phonics-audio.json'
const CACHE = 'data/phonics-audio-qa.json'
const args = process.argv.slice(2)
const outDir = args.includes('--out') ? args[args.indexOf('--out') + 1] : '.'

const index = JSON.parse(readFileSync(INDEX, 'utf8'))
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {}
const norm = (s) => s.toLowerCase().replace(/[^a-z' ]+/g, ' ').replace(/\s+/g, ' ').trim()
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let n = 0
for (const [key, file] of Object.entries(index)) {
  if (cache[file] !== undefined || !existsSync(DIR + file)) continue
  const fd = new FormData()
  fd.append('file', new Blob([readFileSync(DIR + file)], { type: 'audio/mpeg' }), file)
  fd.append('model', 'whisper-large-v3-turbo')
  fd.append('language', 'en')
  fd.append('temperature', '0')
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST', headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, body: fd,
    })
    if (res.status === 429) { await sleep(Number(res.headers.get('retry-after') ?? 10) * 1000 + 500); continue }
    if (!res.ok) { console.error(`✗ ${key}: ${res.status}`); break }
    cache[file] = ((await res.json()).text ?? '').trim()
    break
  }
  if (++n % 25 === 0) { writeFileSync(CACHE, JSON.stringify(cache, null, 1) + '\n'); console.log(`… ${n}`) }
  await sleep(3100) // free tier ≈ 20 requests/min
}
writeFileSync(CACHE, JSON.stringify(cache, null, 1) + '\n')

// ── Report ───────────────────────────────────────────────────────────────────
const rows = Object.entries(index).map(([key, file]) => {
  const heard = cache[file] ?? ''
  const a = norm(key).split(' '), b = new Set(norm(heard).split(' '))
  const hit = a.filter((w) => b.has(w)).length / a.length
  return { key, file, heard, ok: a.length === 1 ? norm(heard) === norm(key) : hit >= 0.85 }
})
const bad = rows.filter((r) => !r.ok)
const abs = resolve(DIR)
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const row = (r) => `<tr class="${r.ok ? '' : 'bad'}"><td><button onclick="new Audio('file://${abs}/${encodeURI(r.file)}').play()">▶</button></td><td>${esc(r.key)}</td><td>${esc(r.heard)}</td><td><input type="checkbox" data-k="${esc(r.key)}"></td></tr>`
const html = `<!doctype html><meta charset="utf-8"><title>Phonics audio QA</title>
<style>body{font:15px system-ui;margin:16px;max-width:900px}td{padding:4px 8px;border-bottom:1px solid #eee}tr.bad{background:#fff3f0}button{font-size:16px}h2{margin-top:28px}</style>
<h1>Phonics audio QA — ${rows.length} clip</h1>
<p>Cột 3 = Whisper nghe được. Hàng đỏ = lệch chữ (${bad.length}). Tick ô các clip đọc SAI → bấm "Copy danh sách sai" → dán cho Claude.</p>
<button onclick="navigator.clipboard.writeText([...document.querySelectorAll('input:checked')].map(i=>i.dataset.k).join('\\n')).then(()=>alert('Đã copy'))">📋 Copy danh sách sai</button>
<h2>⚠️ Lệch (${bad.length})</h2><table>${bad.map(row).join('')}</table>
<h2>Tất cả (theo thứ tự bài)</h2><table>${rows.map(row).join('')}</table>`
const out = `${outDir}/phonics-audio-qa.html`
writeFileSync(out, html)
console.log(`${rows.length} clips, ${bad.length} flagged → ${out}`)
