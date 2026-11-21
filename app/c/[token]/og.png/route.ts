import { NextResponse } from 'next/server'
import { loadTrophyCard } from '@/lib/trophyShare'
import { renderPreview } from '@/lib/trophyCardImage'

// GET /c/{token}/og.png — 1200×630 link preview (og:image of /c/{token}).
export async function GET(_req: Request, props: { params: Promise<{ token: string }> }) {
  const card = await loadTrophyCard((await props.params).token)
  if (!card) return new NextResponse('Not found', { status: 404 })
  const img = await renderPreview(card)
  img.headers.set('Cache-Control', 'public, max-age=31536000, immutable') // token is signed → content never changes
  return img
}
