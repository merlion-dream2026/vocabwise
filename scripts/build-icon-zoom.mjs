// Tạo bản phóng to 512px (public/icons/words/zoom/) cho mọi ảnh minh hoạ đang dùng.
// Mỗi ảnh 256px có thể có nhiều file gốc cùng tên trên Drive (batch + redo, có khi Andie giữ bản cũ),
// nên dựng lại bản 256 từ từng ứng viên và chọn file khớp nhất với ảnh đang dùng.
// Không tìm được gốc khớp → phóng ảnh 256 lên 512 (không nét hơn, nhưng đường dẫn zoom luôn có).
// Run: node scripts/build-icon-zoom.mjs <thư mục Icon fix> <thư mục Icon fix 2> [tên...]
import fs from 'node:fs'
import path from 'node:path'
import { renderIcon } from './lib/iconRender.mjs'

const args = process.argv.slice(2)
const roots = args.filter(a => fs.existsSync(path.join(a, '03-GPT-OUTPUT')))
const only = new Set(args.filter(a => !roots.includes(a)))
const SRC = 'public/icons/words'
const OUT = path.join(SRC, 'zoom')
fs.mkdirSync(OUT, { recursive: true })

const candidates = {}
for (const root of roots) {
  const out = path.join(root, '03-GPT-OUTPUT')
  for (const dir of fs.readdirSync(out)) {
    const d = path.join(out, dir)
    if (!fs.statSync(d).isDirectory()) continue
    for (const f of fs.readdirSync(d)) {
      if (!f.endsWith('.png')) continue
      ;(candidates[f.slice(0, -4)] ??= []).push(path.join(d, f))
    }
  }
}

const sharp = (await import('sharp')).default
const raw = async buf => (await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })).data
// Sai khác trung bình trên RGBA đã nhân alpha (0–255): ảnh khớp đúng thường dưới 3.
const diff = (a, b) => {
  let s = 0
  for (let i = 0; i < a.length; i += 4) {
    const fa = a[i + 3] / 255, fb = b[i + 3] / 255
    s += Math.abs(a[i] * fa - b[i] * fb) + Math.abs(a[i + 1] * fa - b[i + 1] * fb)
      + Math.abs(a[i + 2] * fa - b[i + 2] * fb) + Math.abs(a[i + 3] - b[i + 3])
  }
  return s / a.length
}

const report = []
for (const f of fs.readdirSync(SRC).filter(f => f.endsWith('.webp')).sort()) {
  const name = f.slice(0, -5)
  if (only.size && !only.has(name)) continue
  const cur = await raw(path.join(SRC, f))
  let best = null
  for (const c of candidates[name] ?? []) {
    for (const alphaFloor of [0, 40]) {
      const d = diff(cur, await raw(await renderIcon(c, 256, alphaFloor)))
      if (!best || d < best.d) best = { c, d, alphaFloor }
    }
  }
  const dest = path.join(OUT, f)
  if (best && best.d < 6) {
    await sharp(await renderIcon(best.c, 512, best.alphaFloor)).webp({ quality: 82, alphaQuality: 90 }).toFile(dest)
    report.push(`${name}: ${path.relative(path.dirname(path.dirname(path.dirname(best.c))), best.c)} (lệch ${best.d.toFixed(1)})`)
  } else {
    await sharp(path.join(SRC, f)).resize(512, 512).webp({ quality: 82, alphaQuality: 90 }).toFile(dest)
    report.push(`${name}: KHÔNG CÓ GỐC KHỚP, phóng từ 256${best ? ` (gần nhất lệch ${best.d.toFixed(1)})` : ''}`)
  }
}
console.log(report.join('\n'))
console.log(`xong ${report.length} ảnh; không có gốc: ${report.filter(r => r.includes('KHÔNG')).length}`)
