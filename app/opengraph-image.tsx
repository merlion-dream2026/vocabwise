import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'VocabWise — Learn English Vocabulary'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
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
          fontFamily: 'sans-serif',
          padding: '60px',
        }}
      >
        <div style={{ fontSize: 80, marginBottom: 24 }}>📚</div>
        <div style={{ fontSize: 72, fontWeight: 900, color: 'white', letterSpacing: '-2px', marginBottom: 16 }}>
          VocabWise
        </div>
        <div style={{ fontSize: 32, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginBottom: 40, lineHeight: 1.4 }}>
          Learn English — Fun, Effective & Bilingual
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {['2,400+ words', '6 levels', '10 games'].map(item => (
            <div key={item} style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 50,
              padding: '10px 28px',
              fontSize: 24,
              color: 'white',
              fontWeight: 700,
            }}>
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
