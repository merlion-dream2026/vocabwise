import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getFamilyProfile } from '@/lib/security'
import { getAISpeakLimit } from '@/lib/planUtils'
import { checkAndIncrementAISpeakUsage } from '@/lib/rateLimit'

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()
}

function soundex(s: string): string {
  if (!s) return ''
  const MAP: Record<string, string> = {
    B:'1',F:'1',P:'1',V:'1',
    C:'2',G:'2',J:'2',K:'2',Q:'2',S:'2',X:'2',Z:'2',
    D:'3',T:'3', L:'4', M:'5',N:'5', R:'6',
  }
  const u = s.toUpperCase()
  let code = u[0]
  let prev = MAP[u[0]] ?? '0'
  for (let i = 1; i < u.length && code.length < 4; i++) {
    const c = MAP[u[i]] ?? '0'
    if (c !== '0' && c !== prev) code += c
    prev = c !== '0' ? c : prev
  }
  return code.padEnd(4, '0')
}

/** Whisper đôi khi hallucinate sang ngôn ngữ khác → không có ký tự a-z nào */
function isEnglishLike(s: string): boolean {
  if (!s || s.trim().length < 2) return false
  // Only reject when there are NO ASCII letters (e.g. pure CJK/Vietnamese hallucination)
  // Em-dash, smart quotes added by Whisper still pass if the sentence has real letters
  return /[a-zA-Z]/.test(s)
}

function isCorrect(transcript: string, target: string, word: string, contrastWords: string[]): boolean {
  const t   = normalize(transcript)
  const tgt = normalize(target)
  const w   = normalize(word)

  const tWords   = t.split(' ').filter(Boolean)
  const tgtWords = tgt.split(' ').filter(Boolean)

  // 0. If transcript matches a contrast word (exact or Soundex) → wrong sound was said
  if (contrastWords.length > 0) {
    const contrasts = contrastWords.map(normalize)
    const saidContrast = contrasts.some(c => tWords.some(tok => tok === c || soundex(tok) === soundex(c)))
    if (saidContrast) return false
  }

  // 1. Exact / contains match
  if (t === tgt || t.includes(tgt)) return true

  // 2. Keyword must appear (exact or phonetic match)
  const hasKeyWord = tWords.some(tok => tok === w || soundex(tok) === soundex(w))
  if (!hasKeyWord) return false

  // 3. Single-word target: keyword present = sufficient
  if (tgtWords.length === 1) return true

  // 4. Sentence: keyword correct + ≥70% of ALL target words present (soundex-tolerant, any order)
  let matched = 0
  const used = new Set<number>()
  for (const tw of tgtWords) {
    for (let i = 0; i < tWords.length; i++) {
      if (!used.has(i) && (tWords[i] === tw || soundex(tWords[i]) === soundex(tw))) {
        matched++; used.add(i); break
      }
    }
  }
  return matched / tgtWords.length >= 0.7
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // AI Speak daily limit — skip for superadmin
  if (session.familyId !== 'superadmin') {
    const profile = await getFamilyProfile(session.familyId)
    const aiLimit = profile ? getAISpeakLimit(profile) : 5
    if (aiLimit !== null) {
      const allowed = await checkAndIncrementAISpeakUsage(session.familyId, aiLimit)
      if (!allowed) {
        return NextResponse.json(
          { error: 'Daily AI Speak limit reached. Upgrade to Pro for more.' },
          { status: 429 },
        )
      }
    }
  }

  let formData: FormData
  try { formData = await req.formData() } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const audio          = formData.get('audio')  as File   | null
  const target         = (formData.get('target')        as string | null) ?? ''
  const word           = (formData.get('word')          as string | null) ?? ''
  const contrastRaw    = (formData.get('contrastWords') as string | null) ?? ''
  const contrastWords  = contrastRaw ? contrastRaw.split(',').map(s => s.trim()).filter(Boolean) : []
  if (!audio || !target || !word) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GROQ_API_KEY not configured' }, { status: 500 })
  }

  const ALLOWED_AUDIO = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/x-m4a']
  const mimeBase = audio.type.split(';')[0].trim()
  if (!ALLOWED_AUDIO.includes(mimeBase)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
  }

  const ext = audio.type.includes('mp4') ? 'm4a'
    : audio.type.includes('ogg') ? 'ogg'
    : 'webm'

  const groqForm = new FormData()
  groqForm.append('file',            new Blob([await audio.arrayBuffer()], { type: audio.type }), `rec.${ext}`)
  groqForm.append('model',           'whisper-large-v3-turbo')
  groqForm.append('language',        'en')
  groqForm.append('temperature',     '0')          // deterministic → ít hallucinate hơn
  groqForm.append('prompt',          target.replace(/[^\x20-\x7E]/g, '').trim()) // ASCII only → tránh Whisper echo em-dash
  groqForm.append('response_format', 'json')

  let transcript = ''
  try {
    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: groqForm,
    })
    if (!res.ok) {
      console.error('Groq error:', res.status, await res.text())
      return NextResponse.json({ error: 'Transcription failed' }, { status: 502 })
    }
    const data = await res.json()
    transcript = (data.text ?? '').trim()
  } catch (e) {
    console.error('Groq fetch error:', e)
    return NextResponse.json({ error: 'Network error' }, { status: 502 })
  }

  // Nếu transcript chứa ký tự non-ASCII → Whisper hallucinate sang ngôn ngữ khác
  // → báo unclear thay vì sai (không phải lỗi của bé)
  const unclear = !isEnglishLike(transcript)
  const correct = unclear ? false : isCorrect(transcript, target, word, contrastWords)

  return NextResponse.json({ transcript, correct, unclear })
}
