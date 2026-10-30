#!/usr/bin/env node
// Golden set for the Azure pronunciation bars (docs/pronunciation-thresholds-plan.md, step 1).
// Scores labelled recordings with the app's own code (lib/azureSpeech.ts + lib/pronunciationScore.ts),
// then suggests the bar per metric that best separates "correct" from "wrong" clips, per group.
//
//   node --env-file=.env.local scripts/pron-golden-set.mjs <folder> [--bars bars.json]
//
// Folder:
//   <folder>/items.csv            optional: item,text,keyword,level,symbols,targets
//                                 (symbols/targets pipe-separated, e.g. iː|ɪ and sheep → Phonics verdict)
//   <folder>/adult/sheep__correct.m4a
//   <folder>/adult/sheep__wrong-ship.m4a      wrong-<type> = the typical error made on purpose
//   <folder>/kid/...                          subfolder = group (files directly in <folder> → "all")
// Without items.csv the item name is the text ("thank-you" → "thank you"), keyword = text, level = explorer.
// Any audio ffmpeg reads (m4a/mp3/webm/wav). Needs ffmpeg + AZURE_SPEECH_KEY/REGION.
// Output <folder>/results/: clips.csv, phonemes.csv, suggest.md. Azure answers are cached in
// results/raw/ so a rerun (new items, other bars) only spends quota on new clips.
// --bars: JSON from Superadmin (same shape as DEFAULT_BARS) to compare against instead of the defaults.

import { registerHooks } from 'node:module'
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

// The app's TS files import siblings without an extension ('./pronunciationScore') — let Node find them.
registerHooks({ resolve(spec, ctx, next) { try { return next(spec, ctx) } catch (e) { if (spec.startsWith('.')) return next(`${spec}.ts`, ctx); throw e } } })
const { assessPronunciation, azureConfigured } = await import('../lib/azureSpeech.ts')
const S = await import('../lib/pronunciationScore.ts')
const { normalize } = await import('../lib/pronunciation.ts')

const args = process.argv.slice(2)
const dir = args.find(a => !a.startsWith('--'))
const barsArg = args.includes('--bars') ? args[args.indexOf('--bars') + 1] : null
if (!dir) { console.error('Usage: node --env-file=.env.local scripts/pron-golden-set.mjs <folder> [--bars bars.json]'); process.exit(1) }
if (!azureConfigured()) { console.error('AZURE_SPEECH_KEY / AZURE_SPEECH_REGION missing (run with --env-file=.env.local)'); process.exit(1) }
const bars = barsArg ? S.sanitizeBars(JSON.parse(fs.readFileSync(barsArg, 'utf8'))) : S.DEFAULT_BARS

const AUDIO = /\.(m4a|mp3|wav|webm|ogg|aac|mp4|aiff)$/i
const NAME = /^(.+?)__(correct|wrong(?:-([\w-]+))?)(?:[._-]\d+)?\.[^.]+$/i // sheep__wrong-ship.m4a, sheep__correct-2.m4a

// ── items.csv ────────────────────────────────────────────────────────────────
const items = new Map()
const csvPath = path.join(dir, 'items.csv')
if (fs.existsSync(csvPath)) {
  const [head, ...rows] = fs.readFileSync(csvPath, 'utf8').split(/\r?\n/).filter(l => l.trim())
  const cols = head.split(',').map(c => c.trim().toLowerCase())
  for (const row of rows) {
    const v = splitCsv(row)
    const rec = Object.fromEntries(cols.map((c, i) => [c, (v[i] ?? '').trim()]))
    if (rec.item) items.set(rec.item.toLowerCase(), rec)
  }
}
function splitCsv(line) {
  const out = []; let cur = '', q = false
  for (const ch of line) {
    if (ch === '"') q = !q
    else if (ch === ',' && !q) { out.push(cur); cur = '' }
    else cur += ch
  }
  return [...out, cur]
}
const list = s => (s ?? '').split('|').map(x => x.trim()).filter(Boolean)

// ── collect clips ────────────────────────────────────────────────────────────
const clips = []
const walk = (d, group) => {
  for (const f of fs.readdirSync(d).sort()) {
    const p = path.join(d, f)
    if (fs.statSync(p).isDirectory()) { if (f !== 'results') walk(p, f); continue }
    if (!AUDIO.test(f)) continue
    const m = f.match(NAME)
    if (!m) { console.warn(`skip (name not <item>__correct|wrong-<type>): ${path.relative(dir, p)}`); continue }
    const item = m[1]
    const meta = items.get(item.toLowerCase()) ?? {}
    const text = meta.text || item.replace(/[-_]+/g, ' ')
    clips.push({
      file: path.relative(dir, p), abs: p, group, item, text,
      label: m[2].toLowerCase() === 'correct' ? 'correct' : 'wrong', errorType: m[3] ?? '',
      keyword: meta.keyword || text, level: meta.level || 'explorer',
      symbols: list(meta.symbols), targets: list(meta.targets),
    })
  }
}
walk(dir, 'all')
if (!clips.length) { console.error('No clips found.'); process.exit(1) }

// ── score (sequential: the F0 key allows ONE request at a time) ─────────────
const outDir = path.join(dir, 'results')
const rawDir = path.join(outDir, 'raw')
fs.mkdirSync(rawDir, { recursive: true })
const sleep = ms => new Promise(r => setTimeout(r, ms))

for (const [i, c] of clips.entries()) {
  const cache = path.join(rawDir, `${c.file.replace(/[\\/]/g, '__')}.json`)
  if (fs.existsSync(cache)) {
    const saved = JSON.parse(fs.readFileSync(cache, 'utf8'))
    if (saved.text === c.text) { c.result = saved.result; continue }
  }
  const wav = execFileSync('ffmpeg', ['-v', 'error', '-i', c.abs, '-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le', '-f', 'wav', 'pipe:1'], { maxBuffer: 64 << 20 })
  const body = wav.buffer.slice(wav.byteOffset, wav.byteOffset + wav.byteLength)
  let r
  for (let attempt = 0; attempt < 6; attempt++) {
    r = await assessPronunciation(body, c.text)
    if (r.kind !== 'unavailable' || ![429, -1].includes(r.status)) break
    await sleep(3000 * (attempt + 1)) // busy (other app using the shared key) / network → back off
  }
  if (r.kind === 'unavailable') { console.error(`Azure unavailable (HTTP ${r.status}) on ${c.file} — stopping; rerun continues from cache.`); process.exit(1) }
  c.result = r
  fs.writeFileSync(cache, JSON.stringify({ text: c.text, result: r }))
  process.stdout.write(`\r${i + 1}/${clips.length} ${c.file}`.padEnd(70))
}
process.stdout.write('\n')

// ── metrics per clip ─────────────────────────────────────────────────────────
const rows = clips.map(c => {
  if (c.result.kind !== 'ok') return { ...c, unclear: true, verdict: false }
  const a = c.result.assessment
  const isPhonics = c.symbols.length && c.targets.length
  const keySet = new Set((isPhonics ? c.targets : normalize(c.keyword).split(' ')).map(normalize).filter(Boolean))
  const keyWords = a.words.filter(w => keySet.has(normalize(w.word)) && w.error !== 'Insertion')
  const keyAcc = keyWords.length ? Math.min(...keyWords.map(w => (w.error === 'Omission' ? 0 : w.accuracy))) : 0
  let minPh = null
  if (isPhonics) {
    const v = S.phonicsVerdict(a, c.targets, c.symbols, bars)
    for (const w of v.words) for (const p of w.phonemes) if (p.focus && (!minPh || p.score < minPh.score)) minPh = p
  } else {
    for (const w of keyWords) for (const p of w.phonemes) if (!minPh || p.score < minPh.score) minPh = p
  }
  const verdict = isPhonics ? S.phonicsVerdict(a, c.targets, c.symbols, bars).ok : S.passes(a, c.keyword, c.level, bars)
  return { ...c, a, unclear: false, keyAcc, minPh, verdict }
})

// ── CSVs ─────────────────────────────────────────────────────────────────────
const esc = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s }
const csv = (file, header, data) => fs.writeFileSync(path.join(outDir, file), [header, ...data].map(r => r.map(esc).join(',')).join('\n') + '\n')
csv('clips.csv',
  ['group', 'item', 'file', 'label', 'error_type', 'text', 'keyword', 'level', 'bar_group', 'unclear', 'pron', 'accuracy', 'fluency', 'completeness', 'key_word_acc', 'min_key_phoneme', 'min_key_phoneme_score', 'min_key_phoneme_heard', 'verdict_now', 'verdict_right'],
  rows.map(r => [r.group, r.item, r.file, r.label, r.errorType, r.text, r.keyword, r.level, S.groupFor(r.symbols.length ? 'phonics' : r.level), r.unclear ? 1 : 0,
    r.a?.pronScore, r.a?.accuracy, r.a?.fluency, r.a?.completeness, r.keyAcc, r.minPh?.p, r.minPh?.score, r.minPh?.heard?.join(' '),
    r.verdict ? 'pass' : 'fail', r.verdict === (r.label === 'correct') ? 1 : 0]))
csv('phonemes.csv', ['group', 'item', 'file', 'label', 'word', 'word_acc', 'error', 'phoneme', 'score', 'heard'],
  rows.filter(r => r.a).flatMap(r => r.a.words.flatMap(w => w.phonemes.map(p => [r.group, r.item, r.file, r.label, w.word, w.accuracy, w.error, p.p, p.score, p.heard.join(' ')]))))

// ── suggested bars: the threshold t (pass if metric ≥ t) minimising false accept + false reject ──
const rate = (n, d) => (d ? `${Math.round((n / d) * 100)}%` : '–')
function best(data, metric) {
  const ok = data.filter(r => r.label === 'correct'), bad = data.filter(r => r.label === 'wrong')
  let top = null
  for (let t = 0; t <= 100; t++) {
    const fr = ok.filter(r => !(metric(r) >= t)).length, fa = bad.filter(r => metric(r) >= t).length
    if (!top || fa + fr < top.fa + top.fr) top = { t, fa, fr, hi: t }
    else if (fa + fr === top.fa + top.fr && top.hi === t - 1) top.hi = t // equally good range
  }
  return { ...top, nOk: ok.length, nBad: bad.length }
}
const METRICS = [
  ['Điểm tổng (pron)', r => r.a.pronScore],
  ['Từ khoá (key word)', r => r.keyAcc],
  ['Âm yếu nhất của từ khoá / âm bài', r => r.minPh?.score ?? r.keyAcc],
  ['Đầy đủ (completeness)', r => r.a.completeness],
]
const groups = [...new Set(rows.map(r => r.group))]
let md = `# Golden set — gợi ý ngưỡng (${new Date().toISOString().slice(0, 10)})\n\n`
md += `${clips.length} clip · ngưỡng so sánh: ${barsArg ? barsArg : 'mặc định trong code'}. FA = đọc sai mà đạt (mục tiêu ≤ 10%), FR = đọc đúng mà trượt (≤ 15%, trẻ em ≤ 10%).\n\n`
for (const g of groups) {
  const all = rows.filter(r => r.group === g)
  const data = all.filter(r => !r.unclear)
  const ok = data.filter(r => r.label === 'correct'), bad = data.filter(r => r.label === 'wrong')
  const fr = ok.filter(r => !r.verdict).length, fa = bad.filter(r => r.verdict).length
  md += `## Nhóm ${g} — ${ok.length} đúng · ${bad.length} sai${all.length - data.length ? ` · ${all.length - data.length} AI không nghe rõ` : ''}\n\n`
  md += `Ngưỡng hiện tại: **FA ${rate(fa, bad.length)}** (${fa}/${bad.length}) · **FR ${rate(fr, ok.length)}** (${fr}/${ok.length})\n\n`
  md += '| Chỉ số | Ngưỡng gợi ý | FA | FR |\n|---|---|---|---|\n'
  for (const [label, fn] of METRICS) {
    const b = best(data, fn)
    md += `| ${label} | ${b.t === b.hi ? b.t : `${b.t}–${b.hi}`} | ${rate(b.fa, b.nBad)} | ${rate(b.fr, b.nOk)} |\n`
  }
  const wrongVerdicts = data.filter(r => r.verdict !== (r.label === 'correct'))
  if (wrongVerdicts.length) {
    md += `\nChấm sai với ngưỡng hiện tại:\n\n`
    for (const r of wrongVerdicts) md += `- \`${r.file}\` (${r.label}${r.errorType ? ` ${r.errorType}` : ''}) → ${r.verdict ? 'đạt' : 'trượt'} · tổng ${r.a.pronScore} · từ khoá ${r.keyAcc}${r.minPh ? ` · âm yếu nhất /${r.minPh.p}/ ${r.minPh.score}` : ''}\n`
  }
  md += '\n'
}
md += 'Ngưỡng gợi ý tính riêng từng chỉ số; đổi trong Superadmin → Cài đặt → Ngưỡng chấm phát âm, rồi chạy lại với `--bars` để kiểm tra tổng hợp.\n'
fs.writeFileSync(path.join(outDir, 'suggest.md'), md)
console.log(md)
console.log(`→ ${path.resolve(outDir)}/ (clips.csv · phonemes.csv · suggest.md)`)
