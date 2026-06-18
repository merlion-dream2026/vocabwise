import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'VocabWise — Học từ vựng tiếng Anh cho bé'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

async function loadVietnameseFont(text: string) {
  const url = `https://fonts.googleapis.com/css2?family=Noto+Sans:wght@700;900&text=${encodeURIComponent(text)}`
  const css = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  }).then(r => r.text())
  const resource = css.match(/src: url\((.+?)\) format\('(opentype|truetype|woff2)'\)/)
  if (!resource) throw new Error('Font not found')
  return fetch(resource[1]).then(r => r.arrayBuffer())
}

export default async function Image() {
  const text = 'VocabWise Học từ vựng tiếng Anh — vui, hiệu quả, không áp lực 4.500+ từ vựng 6 cấp độ 10+ trò chơi'
  const fontData = await loadVietnameseFont(text).catch(() => null)

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'NotoSans, sans-serif',
          padding: '60px',
        }}
      >
        <div style={{ fontSize: 80, marginBottom: 24 }}>📚</div>
        <div style={{ fontSize: 68, fontWeight: 900, color: 'white', letterSpacing: '-2px', marginBottom: 16 }}>
          VocabWise
        </div>
        <div style={{ fontSize: 30, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginBottom: 40, lineHeight: 1.4 }}>
          Học từ vựng tiếng Anh — vui, hiệu quả, không áp lực
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {['4.500+ từ vựng', '6 cấp độ', '10+ trò chơi'].map(item => (
            <div key={item} style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 50,
              padding: '10px 28px',
              fontSize: 22,
              color: 'white',
              fontWeight: 700,
            }}>
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
      ...(fontData ? {
        fonts: [{
          name: 'NotoSans',
          data: fontData,
          style: 'normal',
        }],
      } : {}),
    }
  )
}
