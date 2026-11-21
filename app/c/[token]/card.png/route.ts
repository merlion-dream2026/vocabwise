import { NextResponse } from 'next/server'
import { loadTrophyCard } from '@/lib/trophyShare'
import { renderCertificate } from '@/lib/trophyCardImage'

// GET /c/{token}/card.png — portrait certificate the share button sends as a photo.
export async function GET(_req: Request, props: { params: Promise<{ token: string }> }) {
  const card = await loadTrophyCard((await props.params).token)
  if (!card) return new NextResponse('Not found', { status: 404 })
  const img = await renderCertificate(card)
  img.headers.set('Cache-Control', 'public, max-age=31536000, immutable') // token is signed → content never changes
  return img
}
