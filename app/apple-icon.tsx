import { ImageResponse } from 'next/og'
import { LogoMark } from '@/components/BrandLogo'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

// iOS rounds the corners itself → square tile.
export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex' }}>
      <LogoMark size={180} radius={0} />
    </div>,
    { ...size }
  )
}
