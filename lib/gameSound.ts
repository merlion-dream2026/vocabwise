// Correct/wrong feedback chimes for games — global on/off toggle shared across
// every game via localStorage, so muting once applies everywhere without each
// game needing its own setting.
const STORAGE_KEY = 'vw_game_sound_enabled'
const TOGGLE_EVENT = 'vocabwise:game-sound-toggle'

let correctAudio: HTMLAudioElement | null = null
let wrongAudio: HTMLAudioElement | null = null

function getAudio(kind: 'correct' | 'wrong'): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null
  if (kind === 'correct') {
    if (!correctAudio) correctAudio = new Audio('/sounds/correct.mp3')
    return correctAudio
  }
  if (!wrongAudio) wrongAudio = new Audio('/sounds/wrong.mp3')
  return wrongAudio
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

function play(kind: 'correct' | 'wrong') {
  if (!isGameSoundEnabled()) return
  const audio = getAudio(kind)
  if (!audio) return
  audio.currentTime = 0
  // Autoplay can be blocked before any user gesture — games always start with a
  // tap, so this is only a concern on the very first render, and failing silently
  // (no throw) is the right behavior for a non-critical feedback sound.
  audio.play().catch(() => {})
}

export function playCorrectSound() { play('correct') }
export function playWrongSound() { play('wrong') }
