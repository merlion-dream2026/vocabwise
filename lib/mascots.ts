// Rocky (elephant) + Bubi (dolphin) mascot map — the only place that knows which mascot files exist.
// Files live in public/mascots/{character}/{character}-{shot}.webp: downsized WebP (q90) copies of the
// approved originals (grey background baked in, no alpha). Inventory + provenance: docs/mascots/.

export const MASCOT_CHARACTERS = ['rocky', 'bubi'] as const
export type MascotCharacter = typeof MASCOT_CHARACTERS[number]

export function isMascotCharacter(v: unknown): v is MascotCharacter {
  return typeof v === 'string' && (MASCOT_CHARACTERS as readonly string[]).includes(v)
}

export type MascotShot =
  | 'pose-idle' | 'pose-wave' | 'pose-think' | 'pose-cheer' | 'pose-point' | 'pose-lost' | 'pose-oops'
  | 'pose-cards' | 'pose-gift' | 'pose-magnify'
  | 'portrait-seeker' | 'portrait-starter' | 'portrait-ranger' | 'portrait-explorer' | 'portrait-scholar' | 'portrait-master'
  | 'badge-first-word' | 'badge-words' | 'badge-master-1' | 'badge-master-5' | 'badge-master-10'
  | 'badge-xp' | 'badge-perfect' | 'badge-phonics'
  | 'streak-3' | 'streak-7' | 'streak-14' | 'streak-30'
  | 'anim-blink'
  | 'scene-onboarding-1' | 'scene-onboarding-2' | 'scene-onboarding-3'   // 2:3 portrait scenes, own background

// Fallback when no child is in scope or the child hasn't picked one (children.mascot is NULL).
export const DEFAULT_MASCOT: MascotCharacter = 'rocky'

export const MASCOT_NAMES: Record<MascotCharacter, string> = { rocky: 'Rocky', bubi: 'Bubi' }

// Grey baked into every non-scene PNG (sampled ~rgb(211,211,211)). Tiles use it so the art edge disappears.
export const MASCOT_TILE_BG = '#d3d3d3'

// Shots with no file for a character. bubi pose-think was never found locally → falls back to pose-idle.
const MISSING: Record<MascotCharacter, readonly MascotShot[]> = { rocky: [], bubi: ['pose-think'] }

export function mascotSrc(character: MascotCharacter, shot: MascotShot): string {
  const s = MISSING[character].includes(shot) ? 'pose-idle' : shot
  return `/mascots/${character}/${character}-${s}.webp`
}

// Background-free copies ({shot}-cut.webp, made by scripts/cutout-mascots.mjs) for the shots that
// stand directly on the topic hubs instead of on a grey tile.
// Keep in sync with SHOTS in scripts/cutout-mascots.mjs.
export type CutoutShot =
  | 'pose-point' | 'pose-cheer' | 'pose-trophy' | 'pose-wow' | 'pose-jump'
  | 'pose-cards' | 'pose-listen' | 'pose-speak' | 'pose-write' | 'pose-blocks' | 'pose-bubble' | 'pose-timer' | 'pose-read'
export function mascotCutSrc(character: MascotCharacter, shot: CutoutShot): string {
  return `/mascots/${character}/${character}-${shot}-cut.webp`
}

// Beside the next-step button the mascot holds the prop of that activity; anything not listed
// (true/false, quiz, matching, Academic exercises…) gets the plain pointing pose.
const NEXT_STEP_SHOTS: Record<string, CutoutShot> = {
  flashcard: 'pose-cards', memory: 'pose-cards',
  listen: 'pose-listen',
  speak: 'pose-speak',
  sentence: 'pose-write', fillletter: 'pose-write', gapfill: 'pose-write', spell: 'pose-write',
  sentenceorder: 'pose-blocks',
  bubble: 'pose-bubble',
  speedround: 'pose-timer', typing: 'pose-timer',
  passage: 'pose-read',
}
export const nextStepShot = (activity: string): CutoutShot => NEXT_STEP_SHOTS[activity] ?? 'pose-point'

// A finished topic shows one of these at random, each with its own line.
export const CELEBRATIONS: readonly { shot: CutoutShot; says: string; scale?: number }[] = [
  { shot: 'pose-cheer', says: 'Quá đỉnh! Mình tự hào về bạn lắm!' },
  { shot: 'pose-trophy', says: 'Cúp này là của bạn đó!', scale: 1.1 },   // tall, narrow art → a touch bigger
  { shot: 'pose-wow', says: 'Wow, bạn giỏi quá trời luôn!' },
  { shot: 'pose-jump', says: 'Yeah! Mình vui quá đi mất!' },
]

// Shared welcome scene (Rocky + Bubi together), landscape.
export const DUO_WAVE_SCENE = { src: '/mascots/rocky-bubi-scene-duo-wave.webp', width: 1024, height: 683 } as const

// lib/badges.ts id → badge art. words_* and xp_* tiers share one image (no per-tier art exists).
const BADGE_SHOT: Record<string, MascotShot> = {
  first_word: 'badge-first-word',
  words_50: 'badge-words', words_100: 'badge-words', words_300: 'badge-words',
  streak_3: 'streak-3', streak_7: 'streak-7', streak_14: 'streak-14', streak_30: 'streak-30',
  master_1: 'badge-master-1', master_5: 'badge-master-5', master_10: 'badge-master-10',
  xp_100: 'badge-xp', xp_500: 'badge-xp', xp_1000: 'badge-xp',
  perfect: 'badge-perfect',
  phonics_start: 'badge-phonics', phonics_5: 'badge-phonics', phonics_15: 'badge-phonics',
}

export function badgeShot(badgeId: string): MascotShot | null {
  return BADGE_SHOT[badgeId] ?? null
}
