// Kiểm tra một batch ảnh GPT: đủ file, PNG 1024, nền trong suốt, nền mờ / ô caro giả; xuất bảng ảnh cỡ lớn + 64px trên nền trắng và tối.
// Run: node scripts/check-icon-batch.mjs <thư mục gốc Drive> batch-01 <contact.png>
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
const [root, batch, out] = process.argv.slice(2)
const rows = fs.readFileSync(path.join(root, '02-ICON-LIST.csv'), 'utf8').trim().split('\n').slice(1)
  .map(l => l.match(/"((?:[^"]|"")*)"/g).map(s => s.slice(1, -1)))
  .filter(r => r[0] === batch)
const dir = path.join(root, '03-GPT-OUTPUT', batch)
const CELL = 200, COLS = 5
const comps = []
const label = (t, w) => Buffer.from(`<svg width="${w}" height="20"><text x="4" y="15" font-size="14" font-family="Arial">${t}</text></svg>`)
for (const [i, r] of rows.entries()) {
  const f = path.join(dir, r[1])
  const x = (i % COLS) * (CELL + 10), y = Math.floor(i / COLS) * (CELL + 96)
  if (!fs.existsSync(f)) { console.log(`${r[1]}: THIẾU`); continue }
  let m, data, info
  try {
    m = await sharp(f).metadata()
    ;({ data, info } = await sharp(f).ensureAlpha().raw().toBuffer({ resolveWithObject: true }))
  } catch (e) { console.log(`${r[1]}: HỎNG (${e.message}) ${fs.statSync(f).size} bytes`); continue }
  const { width: W, height: H } = info
  let clear = 0, haze = 0, x0 = W, y0 = H, x1 = 0, y1 = 0
  for (let py = 0; py < H; py++) for (let px = 0; px < W; px++) {
    const a = data[(py * W + px) * 4 + 3]
    if (a >= 10 && a < 245) haze++
    if (a < 10) clear++
    else { x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py); y1 = Math.max(y1, py) }
  }
  const corners = [[0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1]].map(([a, b]) => data[(b * W + a) * 4 + 3])
  const issues = []
  if (m.format !== 'png' || W !== 1024 || H !== 1024) issues.push(`${m.format} ${W}x${H}`)
  if (corners.some(a => a > 10)) issues.push('góc không trong suốt')
  if (clear / (W * H) < 0.05) issues.push('gần như không có nền trong suốt')
  // Viền khử răng cưa chỉ chiếm dưới 1%; nhiều hơn 3% là có lớp nền mờ, chỉ lộ ra trên nền tối.
  if (haze / (W * H) > 0.03) issues.push(`nền mờ ${(100 * haze / W / H).toFixed(0)}%`)
  console.log(`${r[1]}: clear ${(100 * clear / W / H).toFixed(0)}% fill ${Math.round((x1 - x0) / W * 100)}x${Math.round((y1 - y0) / H * 100)} ${issues.join('; ') || 'ok'}`)
  comps.push({ input: await sharp(f).resize(CELL, CELL).flatten({ background: '#fff' }).png().toBuffer(), left: x, top: y })
  comps.push({ input: await sharp(f).resize(64, 64).flatten({ background: '#fff' }).png().toBuffer(), left: x, top: y + CELL + 2 })
  comps.push({ input: await sharp(f).resize(64, 64).flatten({ background: '#1e293b' }).png().toBuffer(), left: x + 66, top: y + CELL + 2 })
  comps.push({ input: label(r[2], CELL), left: x, top: y + CELL + 68 })
}
const nRows = Math.ceil(rows.length / COLS)
await sharp({ create: { width: COLS * (CELL + 10), height: nRows * (CELL + 96), channels: 3, background: '#e2e8f0' } })
  .composite(comps).png().toFile(out)
