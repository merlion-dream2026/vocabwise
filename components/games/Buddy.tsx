'use client'

import { useMascotCharacter } from '@/components/Mascot'
import { DEFAULT_MASCOT, MASCOT_NAMES, mascotCutSrc, type CutoutShot, type MascotCharacter } from '@/lib/mascots'

// The child's own mascot (children.mascot, picked in the app) plays the hero of every arcade game;
// the other one is the friendly rival (🏎️ race). Until the child's choice has loaded, Rocky stands in.

const EMOJI: Record<MascotCharacter, string> = { rocky: '🐘', bubi: '🐬' }

export function useBuddy() {
  const me = useMascotCharacter() ?? DEFAULT_MASCOT
  const rival: MascotCharacter = me === 'rocky' ? 'bubi' : 'rocky'
  return { me, name: MASCOT_NAMES[me], emoji: EMOJI[me], rival, rivalName: MASCOT_NAMES[rival], rivalEmoji: EMOJI[rival] }
}

/** The buddy as a cut-out (transparent) picture; `who` overrides the child's own mascot. */
export function BuddyImg({ shot = 'pose-cheer', who, className = '', style }: {
  shot?: CutoutShot; who?: MascotCharacter; className?: string; style?: React.CSSProperties
}) {
  const { me } = useBuddy()
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={mascotCutSrc(who ?? me, shot)} alt="" className={className} style={style} />
}

/** Same, as an SVG <image> (inside the rocket's porthole). */
export function BuddySvgImage(props: { x: string; y: string; width: string; height: string; clipPath?: string; preserveAspectRatio?: string }) {
  const { me } = useBuddy()
  return <image href={mascotCutSrc(me, 'pose-cheer')} {...props} />
}
