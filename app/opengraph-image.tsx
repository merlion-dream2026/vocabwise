import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'VocabWise — Học từ vựng tiếng Anh cho bé'
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
        <div style={{ fontSize: 68, fontWeight: 900, color: 'white', letterSpacing: '-2px', marginBottom: 16 }}>
          VocabWise
        </div>
        <div style={{ fontSize: 30, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginBottom: 40, lineHeight: 1.4 }}>
          Hoc tu vung tieng Anh — vui, hieu qua, khong ap luc
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {['4.500+ tu vung', '6 cap do', '10+ tro choi'].map(item => (
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
    { ...size }
  )
}
