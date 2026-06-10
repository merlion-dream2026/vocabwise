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
  if (onStart) utter.onstart = onStart
  if (onEnd) utter.onend = onEnd
  if (onError) utter.onerror = onError

  const doSpeak = () => {
    const voices = window.speechSynthesis.getVoices()
    if (voices.length === 0) {
      onNoVoice?.()
      if (!noVoiceEventFired) {
        noVoiceEventFired = true
        window.dispatchEvent(new CustomEvent('vocabwise:no-voice'))
      }
      return
    }
    const voice = pickVoice(voices)
    if (voice) utter.voice = voice
    window.speechSynthesis.speak(utter)
  }

  if (window.speechSynthesis.getVoices().length > 0) {
    doSpeak()
  } else {
    // voiceschanged may not fire on iOS — add timeout fallback
    let fired = false
    const handler = () => { fired = true; doSpeak() }
    window.speechSynthesis.addEventListener('voiceschanged', handler, { once: true })
    setTimeout(() => { if (!fired) doSpeak() }, 500)
  }
}
