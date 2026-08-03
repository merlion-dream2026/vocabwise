import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { checkAndIncrementIeltsSpeakingUsage } from '@/lib/rateLimit'
import { getFamilyProfile } from '@/lib/security'
import { getIeltsSpeakingLimit } from '@/lib/planUtils'

export const maxDuration = 60

const ALLOWED_AUDIO = [
  'audio/webm',
  'audio/ogg',
  'audio/mp4',
  'audio/mpeg',
  'audio/wav',
  'audio/m4a',
  'audio/x-m4a',
]
const MAX_AUDIO_BYTES = 5 * 1024 * 1024

function extensionForMime(mime: string): string {
  if (mime.includes('mp4') || mime.includes('m4a')) return 'm4a'
  if (mime.includes('ogg')) return 'ogg'
  if (mime.includes('wav')) return 'wav'
  if (mime.includes('mpeg')) return 'mp3'
  return 'webm'
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (session.familyId !== 'superadmin') {
    const profile = await getFamilyProfile(session.familyId)
    const limit = profile ? getIeltsSpeakingLimit(profile) : 0
    if (limit === 0) {
      return NextResponse.json(
        { error: 'AI Speak (IELTS Speaking Coach) dành cho gói Pro. Dùng thử miễn phí trong 7 ngày đầu hoặc nâng cấp để tiếp tục luyện.' },
        { status: 403 },
      )
    }
    if (limit !== null) {
      const allowed = await checkAndIncrementIeltsSpeakingUsage(session.familyId, 'transcribe', limit)
      if (!allowed) {
        return NextResponse.json(
          { error: `Bạn đã dùng hết ${limit} lượt ghi âm AI Speak hôm nay trong giai đoạn dùng thử. Nâng cấp Pro để luyện không giới hạn.` },
          { status: 429 },
        )
      }
    }
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const audio = formData.get('audio') as File | null
  const question = String(formData.get('question') ?? '').trim().slice(0, 500)
  if (!audio) return NextResponse.json({ error: 'Missing audio' }, { status: 400 })

  const mimeBase = audio.type.split(';')[0].trim()
  if (!ALLOWED_AUDIO.includes(mimeBase)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  }
  if (audio.size <= 0 || audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: 'Audio file too large or empty' }, { status: 413 })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 })
  }

  const groqForm = new FormData()
  groqForm.append(
    'file',
    new Blob([await audio.arrayBuffer()], { type: audio.type }),
    `ielts-answer.${extensionForMime(mimeBase)}`,
  )
  groqForm.append('model', 'whisper-large-v3-turbo')
  groqForm.append('language', 'en')
  groqForm.append('temperature', '0')
  groqForm.append('response_format', 'json')
  if (question) {
    groqForm.append(
      'prompt',
      `IELTS Speaking question: ${question.replace(/[^\x20-\x7E]/g, '').trim()}`,
    )
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: groqForm,
    })

    if (!response.ok) {
      console.error('[ieltsSpeaking] Groq transcription error:', response.status, await response.text())
      return NextResponse.json({ error: 'Transcription failed' }, { status: 502 })
    }

    const data = await response.json()
    const transcript = typeof data.text === 'string' ? data.text.trim() : ''
    if (!transcript) {
      return NextResponse.json({ error: 'Không nhận diện được lời nói. Hãy thử nói rõ và gần micro hơn.' }, { status: 422 })
    }

    return NextResponse.json({ transcript })
  } catch (error) {
    console.error('[ieltsSpeaking] Groq transcription fetch failed:', error)
    return NextResponse.json({ error: 'Network error' }, { status: 502 })
  }
}
