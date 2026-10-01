import { describe, it, expect, beforeEach, vi } from 'vitest'

// lib/gameSound.ts is written for the browser (window.localStorage, window.Audio,
// window.dispatchEvent). The suite runs in Node, so we stub just enough of `window`
// for the module's actual logic to run for real — no mocking of gameSound itself.
class FakeAudio {
  src: string
  currentTime = 0
  constructor(src: string) { this.src = src }
  play(): Promise<void> { return Promise.resolve() }
}

function installFakeWindow() {
  const store = new Map<string, string>()
  const target = new EventTarget()
  const fakeWindow = {
    localStorage: {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => { store.set(k, v) },
    },
    Audio: FakeAudio,
    dispatchEvent: (e: Event) => target.dispatchEvent(e),
    addEventListener: (type: string, cb: EventListenerOrEventListenerObject) => target.addEventListener(type, cb),
    removeEventListener: (type: string, cb: EventListenerOrEventListenerObject) => target.removeEventListener(type, cb),
  }
  // Minimal browser stub, not a real Window — only the members lib/gameSound.ts actually uses.
  globalThis.window = fakeWindow as unknown as Window & typeof globalThis
  // lib/gameSound.ts calls the bare `new Audio(...)`, not `window.Audio(...)`. In a real browser
  // those are the same thing (window properties are implicit globals); Node has no such aliasing,
  // so the stub needs both.
  globalThis.Audio = FakeAudio as unknown as typeof Audio
}

describe('lib/gameSound — does the on/off toggle actually mute playback?', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
    installFakeWindow()
  })

  it('plays both sounds by default, before any preference is ever set', async () => {
    const playSpy = vi.spyOn(FakeAudio.prototype, 'play')
    const { playCorrectSound, playWrongSound, isGameSoundEnabled } = await import('@/lib/gameSound')
    expect(isGameSoundEnabled()).toBe(true)
    playCorrectSound()
    playWrongSound()
    expect(playSpy).toHaveBeenCalledTimes(2)
  })

  it('setGameSoundEnabled(false) silences subsequent playCorrectSound/playWrongSound', async () => {
    const playSpy = vi.spyOn(FakeAudio.prototype, 'play')
    const { playCorrectSound, playWrongSound, setGameSoundEnabled, isGameSoundEnabled } = await import('@/lib/gameSound')

    setGameSoundEnabled(false)
    expect(isGameSoundEnabled()).toBe(false)

    playCorrectSound()
    playWrongSound()
    expect(playSpy).not.toHaveBeenCalled()
  })

  it('re-enabling after a mute lets sound play again', async () => {
    const playSpy = vi.spyOn(FakeAudio.prototype, 'play')
    const { playCorrectSound, setGameSoundEnabled } = await import('@/lib/gameSound')

    setGameSoundEnabled(false)
    playCorrectSound()
    expect(playSpy).not.toHaveBeenCalled()

    setGameSoundEnabled(true)
    playCorrectSound()
    expect(playSpy).toHaveBeenCalledTimes(1)
  })

  it('onGameSoundToggle fires with the new value — this is what flips the 🔊/🔇 icon in GameSoundToggle.tsx', async () => {
    const { setGameSoundEnabled, onGameSoundToggle } = await import('@/lib/gameSound')
    const received: boolean[] = []
    const unsubscribe = onGameSoundToggle((enabled) => received.push(enabled))

    setGameSoundEnabled(false)
    setGameSoundEnabled(true)

    expect(received).toEqual([false, true])
    unsubscribe()
  })

  it('preference persists across a fresh module load (simulates navigating from one game to another)', async () => {
    const mod1 = await import('@/lib/gameSound')
    mod1.setGameSoundEnabled(false)

    vi.resetModules() // reloads the module (new correctAudio/wrongAudio singletons); our fake localStorage is untouched
    const mod2 = await import('@/lib/gameSound')
    expect(mod2.isGameSoundEnabled()).toBe(false)

    const playSpy = vi.spyOn(FakeAudio.prototype, 'play')
    mod2.playCorrectSound()
    expect(playSpy).not.toHaveBeenCalled()
  })
})
