// Feedback sounds (game answers, results, trophy, onboarding) — global on/off toggle
// shared across the app via localStorage, so muting once applies everywhere without
// each screen needing its own setting. Files: public/sounds/{kind}.mp3 (Pixabay, no attribution needed;
// the arcade-game set clunk/launch/whack/peek/reel/bump/flip is Kenney.nl CC0; beep/boing/splash are generated).
const STORAGE_KEY = 'vw_game_sound_enabled'
const TOGGLE_EVENT = 'vocabwise:game-sound-toggle'

export type Sfx = 'correct' | 'wrong' | 'complete' | 'trophy' | 'swoosh' | 'pop' | 'ready'
  | 'clunk' | 'launch' | 'beep' | 'whack' | 'boing' | 'peek' | 'splash' | 'reel' | 'bump' | 'flip'

const cache: Partial<Record<Sfx, HTMLAudioElement>> = {}

function getAudio(kind: Sfx): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null
  return (cache[kind] ??= new Audio(`/sounds/${kind}.mp3`))
}

export function isGameSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true
  const v = window.localStorage.getItem(STORAGE_KEY)
  return v === null ? true : v === '1'
}

export function setGameSoundEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, enabled ? '1' : '0')
  window.dispatchEvent(new CustomEvent(TOGGLE_EVENT, { detail: enabled }))
}

export function onGameSoundToggle(cb: (enabled: boolean) => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const handler = (e: Event) => cb((e as CustomEvent<boolean>).detail)
  window.addEventListener(TOGGLE_EVENT, handler)
  return () => window.removeEventListener(TOGGLE_EVENT, handler)
}

export function playSfx(kind: Sfx) {
  if (!isGameSoundEnabled()) return
  const audio = getAudio(kind)
  if (!audio) return
  audio.currentTime = 0
  // Autoplay can be blocked before any user gesture — games always start with a
  // tap, so this is only a concern on the very first render, and failing silently
  // (no throw) is the right behavior for a non-critical feedback sound.
  audio.play().catch(() => {})
}

export function playCorrectSound() { playSfx('correct') }
export function playWrongSound() { playSfx('wrong') }
