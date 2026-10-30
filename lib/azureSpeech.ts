import { parseAzure, type Assessment } from './pronunciationScore'

// Azure AI Speech — Pronunciation Assessment over the REST API for short audio (≤30 s, WAV PCM
// 16 kHz mono). Ported from AXANH Global English; the F0 key is currently shared with AXANH:
// ~5 audio hours/month and ONE concurrent request, so busy (429), over-quota (403) or an
// unconfigured resource returns 'unavailable' and /api/score-pronunciation falls back to Whisper —
// kids never see an Azure error.
// Env: AZURE_SPEECH_KEY + AZURE_SPEECH_REGION (southeastasia), or AZURE_SPEECH_ENDPOINT instead of the region.

export const azureConfigured = () => !!process.env.AZURE_SPEECH_KEY && !!(process.env.AZURE_SPEECH_REGION || process.env.AZURE_SPEECH_ENDPOINT)

function endpoint() {
  const base = process.env.AZURE_SPEECH_ENDPOINT
    ? `${process.env.AZURE_SPEECH_ENDPOINT.replace(/\/$/, '')}/stt`
    : `https://${process.env.AZURE_SPEECH_REGION}.stt.speech.microsoft.com`
  return `${base}/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`
}

export type AzureResult =
  | { kind: 'ok'; assessment: Assessment }
  | { kind: 'unclear' }        // speech not recognised (silence / noise / not English)
  | { kind: 'unavailable'; status: number }

/** Phoneme granularity (IPA + Azure's top-3 guesses per phoneme) so Phonics can judge the exact
 *  sound and say "nghe giống /ɪ/"; word/sentence callers just read the word scores. */
export async function assessPronunciation(wav: ArrayBuffer, referenceText: string): Promise<AzureResult> {
  if (!azureConfigured()) return { kind: 'unavailable', status: 0 }
  const params = {
    ReferenceText: referenceText, GradingSystem: 'HundredMark', Granularity: 'Phoneme', Dimension: 'Comprehensive',
    EnableMiscue: 'True', PhonemeAlphabet: 'IPA', NBestPhonemeCount: 3,
  }
  try {
    const res = await fetch(endpoint(), {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': process.env.AZURE_SPEECH_KEY!,
        'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000',
        'Pronunciation-Assessment': Buffer.from(JSON.stringify(params), 'utf8').toString('base64'),
        Accept: 'application/json',
      },
      body: wav,
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) return { kind: 'unavailable', status: res.status }
    const assessment = parseAzure(await res.json())
    return assessment ? { kind: 'ok', assessment } : { kind: 'unclear' }
  } catch {
    return { kind: 'unavailable', status: -1 }
  }
}
