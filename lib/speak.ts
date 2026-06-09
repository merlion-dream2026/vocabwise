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
}

export function speak(text: string, options: SpeakOptions = {}) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  const { rate = 0.9, pitch = 1.0, onStart, onEnd, onError } = options

  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'en-US'
  utter.rate = rate
  utter.pitch = pitch
  if (onStart) utter.onstart = onStart
  if (onEnd) utter.onend = onEnd
  if (onError) utter.onerror = onError

  const doSpeak = () => {
    const voice = pickVoice(window.speechSynthesis.getVoices())
    if (voice) utter.voice = voice
    window.speechSynthesis.speak(utter)
  }

  if (window.speechSynthesis.getVoices().length > 0) {
    doSpeak()
  } else {
    window.speechSynthesis.addEventListener('voiceschanged', doSpeak, { once: true })
  }
}
