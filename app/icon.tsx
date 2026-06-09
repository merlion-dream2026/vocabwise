import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #9333ea 0%, #db2777 100%)',
        borderRadius: '96px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ fontSize: 300, lineHeight: 1, display: 'flex' }}>📚</div>
    </div>,
    { ...size }
  )
}
