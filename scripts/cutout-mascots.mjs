// Makes background-free copies of the mascot poses shown on the topic hubs, so the mascot can
// stand on the page instead of sitting on its grey tile. The source PNGs are opaque with a flat
// grey background; this flood-fills from the image border through near-grey pixels (so light
// areas inside the character — toes, belly — are never touched), gives edge pixels a soft alpha
// and un-premultiplies them against the grey so no grey halo shows on coloured pages.
//
// Source: public/mascots/{c}/{c}-{shot}.webp when the app already ships that shot, otherwise the
// approved 1254px original from MASCOT_SRC (Andie's "VocabWise mascots" folder, see docs/mascots/),
// resized to 512px like the other in-app poses.
//
// Usage: MASCOT_SRC="$HOME/Downloads/VocabWise mascots" node scripts/cutout-mascots.mjs
//        → writes public/mascots/{c}/{c}-{shot}-cut.webp (WebP q90, alpha kept). Re-run after replacing any source pose.
import sharp from 'sharp'
import path from 'node:path'
import fs from 'node:fs'

const CHARACTERS = ['rocky', 'bubi']
// Keep in sync with CutoutShot in lib/mascots.ts.
const SHOTS = [
  'pose-point', 'pose-cheer', 'pose-trophy', 'pose-wow', 'pose-jump',                                    // next step / finished topic
  'pose-cards', 'pose-listen', 'pose-speak', 'pose-write', 'pose-blocks', 'pose-bubble', 'pose-timer', 'pose-read', // next activity's prop
]
const SIZE = 512
const FLOOD = 34   // max colour distance from the background that the fill may travel through
const SOLID = 10   // at or below this distance a pixel is fully transparent

async function cutout(src, dst) {
  const { data, info } = await sharp(src).resize(SIZE, SIZE).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  const px = (i) => [data[i * 3], data[i * 3 + 1], data[i * 3 + 2]]

  // Background = per-channel median of the border pixels.
  const border = []
  for (let x = 0; x < w; x++) border.push(px(x), px((h - 1) * w + x))
  for (let y = 0; y < h; y++) border.push(px(y * w), px(y * w + w - 1))
  const bg = [0, 1, 2].map((c) => border.map((p) => p[c]).sort((a, b) => a - b)[border.length >> 1])

  const dist = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) {
    const [r, g, b] = px(i)
    dist[i] = Math.hypot(r - bg[0], g - bg[1], b - bg[2])
  }

  const reach = new Uint8Array(w * h)
  const stack = []
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x)
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1)
  while (stack.length) {
    const i = stack.pop()
    if (reach[i] || dist[i] > FLOOD) continue
    reach[i] = 1
    const x = i % w, y = (i / w) | 0
    if (x > 0) stack.push(i - 1)
    if (x < w - 1) stack.push(i + 1)
    if (y > 0) stack.push(i - w)
    if (y < h - 1) stack.push(i + w)
  }

  const out = Buffer.alloc(w * h * 4)
  let clear = 0
  for (let i = 0; i < w * h; i++) {
    let a = 1
    if (reach[i]) {
      a = Math.min(1, Math.max(0, (dist[i] - SOLID) / (FLOOD - SOLID)))
      clear++
    } else {
      // Anti-aliased edge pixels sit right next to the filled region: soften them too.
      const x = i % w, y = (i / w) | 0
      const nearBg = (x > 0 && reach[i - 1]) || (x < w - 1 && reach[i + 1]) || (y > 0 && reach[i - w]) || (y < h - 1 && reach[i + w])
      if (nearBg) a = Math.min(1, dist[i] / (FLOOD * 1.5))
    }
    const [r, g, b] = px(i)
    const un = (v, c) => (a > 0.01 ? Math.min(255, Math.max(0, Math.round((v - (1 - a) * bg[c]) / a))) : 0)
    out[i * 4] = un(r, 0); out[i * 4 + 1] = un(g, 1); out[i * 4 + 2] = un(b, 2); out[i * 4 + 3] = Math.round(a * 255)
  }

  await sharp(out, { raw: { width: w, height: h, channels: 4 } }).webp({ quality: 90, alphaQuality: 100, effort: 6 }).toFile(dst)
  console.log(`${path.basename(dst)}  bg=${bg.join(',')}  transparent=${Math.round((clear / (w * h)) * 100)}%`)
}

for (const c of CHARACTERS) {
  for (const s of SHOTS) {
    const dir = path.join('public', 'mascots', c)
    const shipped = path.join(dir, `${c}-${s}.webp`)
    const original = process.env.MASCOT_SRC ? path.join(process.env.MASCOT_SRC, c, `${c}-${s}.png`) : null
    const src = fs.existsSync(shipped) ? shipped : original
    if (!src || !fs.existsSync(src)) throw new Error(`${c}-${s}: not in public/mascots and MASCOT_SRC has no original`)
    await cutout(src, path.join(dir, `${c}-${s}-cut.webp`))
  }
}
