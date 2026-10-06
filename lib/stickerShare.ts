// Renders one sticker-album section (a level/book) to a PNG and shares it — Web Share with the image
// attached where supported (phones), otherwise downloads the file. Drawn on a canvas so it needs no library.
export type ShareSticker = { emoji: string; name: string } | null   // null = not earned yet ("?")

export type ShareCardInput = {
  childName: string
  avatarSrc: string
  title: string          // e.g. "Seeker"
  tag: string            // e.g. "Pre-A1"
  stickers: ShareSticker[]   // one entry per slot, earned first
  earned: number
}

const W = 1080, PAD = 48, COLS = 5, CELL_H = 232
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath(); c.moveTo(x + r, y)
  c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r)
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath()
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src })
}

function wrap2(c: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(' '); const lines: string[] = []; let cur = ''
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w
    if (c.measureText(t).width <= maxW || !cur) cur = t
    else { lines.push(cur); cur = w }
  }
  if (cur) lines.push(cur)
  if (lines.length > 2) { lines.length = 2; lines[1] = lines[1].replace(/.{0,2}$/, '…') }
  return lines
}

export async function renderStickerCard(inp: ShareCardInput): Promise<Blob> {
  const rows = Math.ceil(inp.stickers.length / COLS)
  const HEAD = 250, FOOT = 110
  const H = HEAD + rows * CELL_H + FOOT
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H
  const c = canvas.getContext('2d')!
  const bg = c.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#a855f7'); bg.addColorStop(1, '#ec4899')
  c.fillStyle = bg; c.fillRect(0, 0, W, H)

  // white card
  c.fillStyle = '#ffffff'; roundRect(c, PAD, PAD, W - PAD * 2, H - PAD * 2, 56); c.fill()

  // header: title left, avatar + name centered, count right
  c.textBaseline = 'middle'
  c.fillStyle = '#1e293b'; c.font = `800 52px ${FONT}`; c.textAlign = 'left'
  c.fillText(inp.title, PAD + 44, PAD + 82)
  c.fillStyle = '#64748b'; c.font = `700 28px ${FONT}`
  c.fillText(inp.tag, PAD + 44, PAD + 134)

  const avatar = await loadImage(inp.avatarSrc)
  const cx = W / 2
  c.font = `800 38px ${FONT}`; const nameW = c.measureText(inp.childName).width
  const groupW = 84 + 16 + nameW; const gx = cx - groupW / 2 + 20
  if (avatar) { c.save(); c.beginPath(); c.arc(gx + 42, PAD + 100, 42, 0, Math.PI * 2); c.clip(); c.drawImage(avatar, gx, PAD + 58, 84, 84); c.restore() }
  c.fillStyle = '#334155'; c.textAlign = 'left'; c.fillText(inp.childName, gx + 100, PAD + 102)

  const badge = `${inp.earned}/${inp.stickers.length}`
  c.font = `800 40px ${FONT}`; const bw = c.measureText(badge).width + 56
  c.fillStyle = '#f3e8ff'; roundRect(c, W - PAD - 44 - bw, PAD + 56, bw, 76, 38); c.fill()
  c.fillStyle = '#7e22ce'; c.textAlign = 'center'; c.fillText(badge, W - PAD - 44 - bw / 2, PAD + 95)

  // grid
  const gridW = W - PAD * 2 - 60, cellW = gridW / COLS, x0 = PAD + 30, y0 = HEAD + 10
  inp.stickers.forEach((s, i) => {
    const col = i % COLS, row = Math.floor(i / COLS)
    const x = x0 + col * cellW + cellW / 2, y = y0 + row * CELL_H
    const size = 132
    c.save(); c.translate(x, y + size / 2 + 6); c.rotate(((i % 2 === 0 ? -6 : 6) * Math.PI) / 180)
    c.shadowColor = 'rgba(15,23,42,0.18)'; c.shadowBlur = 14; c.shadowOffsetY = 6
    c.fillStyle = '#ffffff'; roundRect(c, -size / 2, -size / 2, size, size, 34); c.fill()
    c.shadowColor = 'transparent'; c.lineWidth = 6; c.strokeStyle = s ? '#ffffff' : '#e2e8f0'; c.stroke()
    c.globalAlpha = s ? 1 : 0.35; c.fillStyle = '#334155'; c.textAlign = 'center'
    c.font = `${s ? 76 : 60}px ${FONT}`; c.fillText(s ? s.emoji : '❔', 0, 6)
    c.restore()
    if (s) {
      c.fillStyle = '#475569'; c.font = `600 24px ${FONT}`; c.textAlign = 'center'
      wrap2(c, s.name, cellW - 14).forEach((l, k) => c.fillText(l, x, y + size + 40 + k * 28))
    }
  })

  c.fillStyle = '#94a3b8'; c.font = `700 30px ${FONT}`; c.textAlign = 'center'
  const stamp = new Date().toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
  c.fillText(`VocabWise · vocabwise.id.vn · ${stamp}`, W / 2, H - PAD - 44)
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/png'))
}

/** Share the rendered card; returns how it went so the UI can say so. */
export async function shareStickerCard(inp: ShareCardInput): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const blob = await renderStickerCard(inp)
  const file = new File([blob], `stickers-${inp.title.toLowerCase().replace(/\s+/g, '-')}.png`, { type: 'image/png' })
  const text = `🎁 ${inp.childName} đã sưu tầm ${inp.earned}/${inp.stickers.length} sticker ${inp.title} trên VocabWise!`
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], text, title: 'Bộ sưu tập sticker VocabWise' }); return 'shared' }
    catch (e) { if ((e as Error).name === 'AbortError') return 'cancelled' }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = file.name; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
  return 'downloaded'
}
