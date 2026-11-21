import { ImageResponse } from 'next/og'
import { readFile } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'
import type { TrophyCard } from '@/lib/trophyShare'

// Images for the "topic conquered" share: a portrait certificate (shared as a photo to Zalo/FB)
// and a 1200×630 link preview (og:image of /c/{token}, the fallback when a phone can't share files).
// Be Vietnam Pro is bundled because the default ImageResponse font has no Vietnamese diacritics.
// No network at render time: topic emoji are local Twemoji SVGs (assets/emoji, copied for every
// Daily topic emoji from @twemoji/svg — add the file if a new topic uses a new emoji), stars are SVG.

let fontsP: Promise<{ name: string; data: Buffer; weight: 700 | 900; style: 'normal' }[]> | null = null
function fonts() {
  fontsP ??= Promise.all(([700, 900] as const).map(async (weight) => ({
    name: 'BeVietnamPro', weight, style: 'normal' as const,
    data: await readFile(join(process.cwd(), 'assets', 'fonts', `BeVietnamPro-${weight === 900 ? 'Black' : 'Bold'}.ttf`)),
  })))
  return fontsP
}

// Satori can't decode WebP — convert the trophy cutout to a PNG data URL once per mascot.
const mascotCache = new Map<string, Promise<string>>()
function mascotPng(mascot: string) {
  let p = mascotCache.get(mascot)
  if (!p) {
    p = readFile(join(process.cwd(), 'public', 'mascots', mascot, `${mascot}-pose-trophy-cut.webp`))
      .then((buf) => sharp(buf).png().toBuffer())
      .then((png) => `data:image/png;base64,${png.toString('base64')}`)
    mascotCache.set(mascot, p)
  }
  return p
}

// Twemoji file name: code points joined by '-', FE0F dropped unless it's a ZWJ sequence.
async function emojiSrc(emoji: string): Promise<string | null> {
  let cps = [...emoji].map((c) => c.codePointAt(0)!.toString(16))
  if (!emoji.includes('\u200d')) cps = cps.filter((c) => c !== 'fe0f')
  try {
    const svg = await readFile(join(process.cwd(), 'assets', 'emoji', `${cps.join('-')}.svg`))
    return `data:image/svg+xml;base64,${svg.toString('base64')}`
  } catch { return null }
}

const TopicLine = ({ c, emoji, size, color }: { c: TrophyCard; emoji: string | null; size: number; color: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: size * 0.25, color }}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    {emoji && <img src={emoji} width={size} height={size} alt="" />}
    <div style={{ display: 'flex', fontSize: size, fontWeight: 900, lineHeight: 1.15, maxWidth: 820 }}>{c.topicName}</div>
  </div>
)

function Star({ size, edge = '#e8a200' }: { size: number; edge?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 1.8l3.1 6.6 7.1.9-5.2 4.9 1.3 7.1L12 17.8l-6.3 3.5 1.3-7.1L1.8 9.3l7.1-.9z"
        fill="#ffd23f" stroke={edge} strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  )
}

const Stars = ({ size, gap, edge }: { size: number; gap: number; edge?: string }) => (
  <div style={{ display: 'flex', gap }}>{[0, 1, 2].map((i) => <Star key={i} size={size} edge={edge} />)}</div>
)

const Pill = ({ children, bg, color }: { children: string; bg: string; color: string }) => (
  <div style={{ display: 'flex', background: bg, color, borderRadius: 999, padding: '10px 26px', fontSize: 30, fontWeight: 700 }}>{children}</div>
)

// Shrink long topic names so they stay on ≤2 lines.
const topicSize = (s: string, base: number) => (s.length <= 16 ? base : s.length <= 24 ? base * 0.82 : base * 0.68)

export const CERT_SIZE = { width: 1080, height: 1350 }
export const OG_SIZE = { width: 1200, height: 630 }

export async function renderCertificate(c: TrophyCard) {
  const [f, mascot, emoji] = await Promise.all([fonts(), mascotPng(c.mascot), emojiSrc(c.topicEmoji)])
  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
        fontFamily: 'BeVietnamPro', color: 'white', position: 'relative',
        background: 'linear-gradient(160deg, #3b2a8a 0%, #7c3aed 55%, #ec4899 100%)',
      }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1350, display: 'flex',
          background: 'radial-gradient(circle at 50% 36%, rgba(255,215,94,0.55) 0%, rgba(255,215,94,0) 42%)' }} />
        <div style={{ position: 'absolute', left: 30, top: 30, width: 1020, height: 1290, display: 'flex',
          border: '7px solid #ecb94f', borderRadius: 36 }} />
        <div style={{ position: 'absolute', left: 46, top: 46, width: 988, height: 1258, display: 'flex',
          border: '2px solid rgba(236,185,79,0.55)', borderRadius: 26 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 92, fontSize: 40, fontWeight: 900, letterSpacing: 10, color: '#ffd75e' }}>
          <Star size={40} /><div style={{ display: 'flex' }}>GIẤY KHEN</div><Star size={40} />
        </div>
        <div style={{ display: 'flex', marginTop: 10, fontSize: 32, fontWeight: 700, opacity: 0.85 }}>
          VocabWise Daily · Trình độ {c.levelLabel}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mascot} height={430} style={{ marginTop: 18 }} alt="" />
        <div style={{ display: 'flex', marginTop: 6, fontSize: 36, fontWeight: 700, opacity: 0.9 }}>Chúc mừng bé</div>
        <div style={{ display: 'flex', fontSize: c.childName.length > 10 ? 96 : 132, fontWeight: 900, lineHeight: 1.1,
          color: '#ffd75e', textShadow: '0 6px 0 rgba(0,0,0,0.25)' }}>{c.childName}</div>
        <div style={{ display: 'flex', marginTop: 8, fontSize: 36, fontWeight: 700, opacity: 0.9 }}>đã chinh phục chủ đề</div>
        <div style={{ display: 'flex', marginTop: 10 }}>
          <TopicLine c={c} emoji={emoji} size={topicSize(c.topicName, 64)} color="white" />
        </div>
        <div style={{ display: 'flex', marginTop: 22 }}><Stars size={78} gap={18} /></div>
        <div style={{ display: 'flex', gap: 16, marginTop: 26 }}>
          <Pill bg="rgba(255,255,255,0.18)" color="white">{`${c.wordCount} từ mới`}</Pill>
          <Pill bg="rgba(255,255,255,0.18)" color="white">{c.date}</Pill>
        </div>
        <div style={{ position: 'absolute', bottom: 80, left: 0, width: 1080, display: 'flex', justifyContent: 'center',
          fontSize: 30, fontWeight: 700, opacity: 0.85 }}>vocabwise.id.vn</div>
      </div>
    ),
    { ...CERT_SIZE, fonts: f },
  )
}

export async function renderPreview(c: TrophyCard) {
  const [f, mascot, emoji] = await Promise.all([fonts(), mascotPng(c.mascot), emojiSrc(c.topicEmoji)])
  return new ImageResponse(
    (
      <div style={{
        width: '100%', height: '100%', display: 'flex', fontFamily: 'BeVietnamPro', color: '#3b1a00', position: 'relative',
        background: 'radial-gradient(circle at 22% 45%, #fff3c4 0%, #ffd75e 30%, #ff9a3c 68%, #f2547d 100%)',
      }}>
        <div style={{ width: 470, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mascot} height={560} alt="" />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: 56, paddingRight: 40 }}>
          <div style={{ display: 'flex' }}>
            <div style={{ display: 'flex', background: '#3b2a8a', color: 'white', fontSize: 26, fontWeight: 900, letterSpacing: 2,
              padding: '10px 24px', borderRadius: 999 }}>{`THÀNH TÍCH MỚI · ${c.levelLabel}`}</div>
          </div>
          <div style={{ display: 'flex', marginTop: 18, fontSize: c.childName.length > 10 ? 72 : 96, fontWeight: 900, lineHeight: 1.05,
            color: 'white', textShadow: '0 6px 0 #c2410c' }}>{c.childName}</div>
          <div style={{ display: 'flex', marginTop: 6, fontSize: 36, fontWeight: 700 }}>đã chinh phục chủ đề</div>
          <div style={{ display: 'flex', marginTop: 6 }}>
            <TopicLine c={c} emoji={emoji} size={topicSize(c.topicName, 56)} color="#3b2a8a" />
          </div>
          <div style={{ display: 'flex', marginTop: 20 }}><Stars size={64} gap={12} edge="#9a3412" /></div>
          <div style={{ display: 'flex', gap: 14, marginTop: 22 }}>
            <Pill bg="rgba(255,255,255,0.78)" color="#3b1a00">{`${c.wordCount} từ mới`}</Pill>
          </div>
        </div>
        <div style={{ position: 'absolute', right: 32, bottom: 24, display: 'flex', color: 'white', fontSize: 28, fontWeight: 900 }}>VocabWise Daily</div>
      </div>
    ),
    { ...OG_SIZE, fonts: f },
  )
}
