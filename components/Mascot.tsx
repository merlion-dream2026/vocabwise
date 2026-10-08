'use client'
import { createContext, useContext } from 'react'
import Image from 'next/image'
import { DEFAULT_MASCOT, MASCOT_TILE_BG, badgeShot, mascotSrc, type MascotCharacter, type MascotShot } from '@/lib/mascots'

// Current child's mascot, provided by ChildMascotProvider (components/MascotContext.tsx).
// null = still resolving. Outside any provider: DEFAULT_MASCOT.
export const MascotCtx = createContext<MascotCharacter | null>(DEFAULT_MASCOT)
export function useMascotCharacter(): MascotCharacter | null {
  return useContext(MascotCtx)
}

// A mascot image on a rounded grey tile. The PNGs are opaque with a grey background, so the tile
// matches that grey instead of pretending the art is a cutout. Square art, contain-fit: nothing cropped.
// `alt` omitted → decorative (alt=""); pass a short label when the image itself carries meaning.
// `character` omitted → the current child's mascot; while that resolves, only the empty tile shows.
// `blink` (pose-idle only — the blink frame is drawn on the idle canvas) overlays the closed-eye
// frame for ~120 ms every 4.5 s; off under prefers-reduced-motion (static idle stays).
export default function Mascot({
  shot, size, character: characterProp, alt, blink = false, priority = false, className = '',
}: {
  shot: MascotShot
  size: number           // rendered width = height, px
  character?: MascotCharacter
  alt?: string
  blink?: boolean
  priority?: boolean
  className?: string
}) {
  const fromCtx = useMascotCharacter()
  const character = characterProp ?? fromCtx
  const withBlink = blink && shot === 'pose-idle'
  return (
    <span
      className={`relative inline-block flex-shrink-0 overflow-hidden rounded-2xl ${className}`}
      style={{ width: size, height: size, backgroundColor: MASCOT_TILE_BG }}
    >
      {character && (
        <Image src={mascotSrc(character, shot)} alt={alt ?? ''} width={size} height={size} priority={priority}
          className="h-full w-full object-contain" />
      )}
      {character && withBlink && (
        <Image src={mascotSrc(character, 'anim-blink')} alt="" aria-hidden width={size} height={size}
          className="mascot-blink absolute inset-0 h-full w-full object-contain" />
      )}
    </span>
  )
}

// Badge art for a lib/badges.ts id; falls back to the badge's emoji when no art is mapped.
export function BadgeArt({ id, emoji, size, alt, character, className = '' }: {
  id: string; emoji: string; size: number; alt?: string; character?: MascotCharacter; className?: string
}) {
  const shot = badgeShot(id)
  if (!shot) return <span className={className} style={{ fontSize: size * 0.75 }} role={alt ? 'img' : undefined} aria-label={alt} aria-hidden={alt ? undefined : true}>{emoji}</span>
  return <Mascot shot={shot} size={size} character={character} alt={alt} className={className} />
}
