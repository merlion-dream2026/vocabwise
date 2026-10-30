import type { Assessment } from './pronunciationScore'
import { toWav16k } from './wav'

// Client side of /api/score-pronunciation for Phát âm cùng AI, Phonics luyện nói and the quick
// record button. Sends the clip as 16 kHz WAV so the server can score it with Azure; if the browser
// can't convert it, sends the original (webm/m4a) and the server uses Whisper as before.
export type ScoreResponse = {
  transcript: string; correct: boolean; unclear: boolean
  engine?: 'azure' | 'whisper'; assessment?: Assessment; azureOff?: boolean
}

// Server says Azure isn't configured → skip the WAV conversion (~0.5 s/clip) for the rest of the session
const OFF_KEY = 'vw-azure-off'
const azureOff = () => { try { return sessionStorage.getItem(OFF_KEY) === '1' } catch { return false } }
const ext = (mime: string) => (mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm')

export async function scorePronunciation(blob: Blob, mimeType: string, fields: Record<string, string>): Promise<ScoreResponse> {
  let file = new File([blob], `rec.${ext(mimeType)}`, { type: mimeType })
  if (!azureOff()) {
    try { file = new File([await toWav16k(blob)], 'rec.wav', { type: 'audio/wav' }) } catch { /* old browser → Whisper */ }
  }
  const fd = new FormData()
  fd.append('audio', file)
  for (const [k, v] of Object.entries(fields)) fd.append(k, v)
  const res = await fetch('/api/score-pronunciation', { method: 'POST', body: fd })
  if (!res.ok) throw new Error(await res.text())
  const data = (await res.json()) as ScoreResponse
  if (data.azureOff) { try { sessionStorage.setItem(OFF_KEY, '1') } catch { /* no storage */ } }
  return data
}
