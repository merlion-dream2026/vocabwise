let noVoiceEventFired = false

// Priority list: most natural → least natural, across browsers/OS
const PREFERRED_VOICES = [
  'Samantha',                         // macOS / iOS — best quality
  'Alex',                             // macOS classic
  'Google US English',                // Chrome desktop
  'Microsoft Aria Online (Natural)',  // Edge neural
  'Microsoft Jenny Online (Natural)', // Edge neural
  'Microsoft Guy Online (Natural)',   // Edge neural
  'Karen',                            // macOS/iOS Australian
]

function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  for (const name of PREFERRED_VOICES) {
    const v = voices.find((v) => v.name.includes(name) && v.lang.startsWith('en'))
    if (v) return v
  }
  return voices.find((v) => v.lang === 'en-US') ?? voices.find((v) => v.lang.startsWith('en'))
}

// Kick off the async voice-list load when the module is imported (page mount), so by the
// first tap the preferred voice is usually ready.
if (typeof window !== 'undefined') window.speechSynthesis?.getVoices()

type SpeakOptions = {
  rate?: number
  pitch?: number
  onStart?: () => void
  onEnd?: () => void
  onError?: () => void
  onNoVoice?: () => void
}

export function speak(text: string, options: SpeakOptions = {}) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  const { rate = 0.9, pitch = 1.0, onStart, onEnd, onError, onNoVoice } = options

  // iOS Safari bug: speechSynthesis gets stuck paused after tab switch / screen lock
  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume()
  }
  window.speechSynthesis.cancel()

  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'en-US'
  utter.rate = rate
  utter.pitch = pitch
  let started = false
  utter.onstart = () => { started = true; onStart?.() }
  if (onEnd) utter.onend = onEnd
  if (onError) utter.onerror = onError

  // Speak right away, still inside the tap. iOS Safari only lets speech start from a user
  // gesture, and the voice list loads async — waiting for 'voiceschanged' first used to push
  // speak() out of the gesture, so the first tap after opening a page was silent. No voice
  // list yet → the browser's default en-US voice; the preferred one kicks in once loaded.
  const voices = window.speechSynthesis.getVoices()
  const voice = pickVoice(voices)
  if (voice) utter.voice = voice
  window.speechSynthesis.speak(utter)

  if (voices.length === 0) {
    setTimeout(() => {
      if (started || window.speechSynthesis.getVoices().length > 0) return
      onNoVoice?.()
      if (!noVoiceEventFired) {
        noVoiceEventFired = true
        window.dispatchEvent(new CustomEvent('vocabwise:no-voice'))
      }
    }, 1000)
  }
}
