'use client'
import { createContext, useContext, type ReactNode } from 'react'
import Image from 'next/image'
import { DEFAULT_MASCOT, MASCOT_TILE_BG, badgeShot, mascotCutSrc, mascotSrc, type CutoutShot, type MascotCharacter, type MascotShot } from '@/lib/mascots'

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
// `fluid` → fills its container's width (square), capped at `size` px — for side-by-side cards.
// `blink` (pose-idle only — the blink frame is drawn on the idle canvas) overlays the closed-eye
// frame for ~120 ms every 4.5 s; off under prefers-reduced-motion (static idle stays).
export default function Mascot({
  shot, size, character: characterProp, alt, blink = false, fluid = false, priority = false, className = '',
}: {
  shot: MascotShot
  size: number           // rendered width = height, px (max width when `fluid`)
  character?: MascotCharacter
  alt?: string
  blink?: boolean
  fluid?: boolean
  priority?: boolean
  className?: string
}) {
  const fromCtx = useMascotCharacter()
  const character = characterProp ?? fromCtx
  const withBlink = blink && shot === 'pose-idle'
  return (
    <span
      className={`relative inline-block flex-shrink-0 overflow-hidden rounded-2xl ${className}`}
      style={fluid
        ? { width: '100%', maxWidth: size, aspectRatio: '1 / 1', backgroundColor: MASCOT_TILE_BG }
        : { width: size, height: size, backgroundColor: MASCOT_TILE_BG }}
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

// The current child's mascot with no tile: a background-free cutout that stands on the page,
// with a soft drop shadow. Decorative (the copy beside it carries the message).
export function MascotCutout({ shot, size, className = '' }: { shot: CutoutShot; size: number; className?: string }) {
  const character = useMascotCharacter()
  return (
    <span className={`inline-block flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      {character && (
        <Image src={mascotCutSrc(character, shot)} alt="" width={size} height={size}
          className="h-full w-full object-contain drop-shadow-[0_4px_5px_rgba(0,0,0,0.14)]" />
      )}
    </span>
  )
}

// A speech bubble whose tail points left, at a mascot standing beside it.
export function SpeechBubble({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative rounded-2xl border-2 border-slate-200 bg-white px-3 py-2 text-left ${className}`}>
      <span aria-hidden className="absolute -left-[8px] bottom-3 h-3 w-3 rotate-45 border-b-2 border-l-2 border-slate-200 bg-white" />
      {children}
    </div>
  )
}
