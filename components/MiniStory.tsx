'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { PRESS } from '@/components/TopicHub'

// Daily topic "Mini Story": a short story using the topic's words (bold in `en`/`vi`), read-aloud
// (recorded mp3, falling back to browser TTS), a Vietnamese toggle and a fill-the-blank exercise
// built from the bolded words. Includes the one-time Scholar narrator-voice notice.
// Mount with key={topicId} so all state (and any playing audio) resets per topic.

export type Story = { emojis: string[]; en: string; vi: string }
type StoryBlank = { word: string; options: string[] }
type ParsedExercise = { parts: string[]; blanks: StoryBlank[] }

function shuffleArr<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function parseExercise(en: string, words: { word: string }[]): ParsedExercise | null {
  const wordMap = new Map(words.map(w => [w.word.toLowerCase(), w.word]))
  const boldMatches = Array.from(en.matchAll(/\*\*(.+?)\*\*/g))
  const vocabBolds = boldMatches.filter(m => wordMap.has(m[1].toLowerCase()))
  if (vocabBolds.length === 0) return null

  const blanks: StoryBlank[] = vocabBolds.map(m => {
    const correct = wordMap.get(m[1].toLowerCase()) ?? m[1]
    const distractors = shuffleArr(words.filter(w => w.word.toLowerCase() !== m[1].toLowerCase())).slice(0, 3).map(w => w.word)
    return { word: correct, options: shuffleArr([correct, ...distractors]) }
  })

  const parts: string[] = []
  let remaining = en
  for (const m of vocabBolds) {
    const idx = remaining.indexOf(`**${m[1]}**`)
    parts.push(remaining.slice(0, idx).replace(/\*\*/g, ''))
    remaining = remaining.slice(idx + m[0].length)
  }
  parts.push(remaining.replace(/\*\*/g, ''))

  return { parts, blanks }
}

function renderHighlighted(text: string) {
  return text.split(/\*\*(.+?)\*\*/).map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="text-amber-700 bg-amber-100 rounded px-0.5 font-bold not-italic">{part}</strong>
      : <span key={i}>{part}</span>
  )
}

export default function MiniStory({ story, words, level, topicId, topicIdx, childId }: {
  story: Story; words: { word: string }[]; level: string; topicId: string; topicIdx: number; childId: string
}) {
  const [showVI, setShowVI] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [showVoiceNotice, setShowVoiceNotice] = useState(false)
  const [showExercise, setShowExercise] = useState(false)
  const [storyOpen, setStoryOpen] = useState(false)
  const [exerciseAnswers, setExerciseAnswers] = useState<Record<number, string>>({})
  const [exerciseSubmitted, setExerciseSubmitted] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const storyRef = useRef<HTMLDivElement | null>(null)

  // Built once per mount (stable shuffled options).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const parsedExercise = useMemo(() => parseExercise(story.en, words), [])

  // Auto-scroll to Mini Story when arriving via nudge (e.g. from Flashcard completion screen)
  useEffect(() => {
    if (window.location.hash === '#mini-story') {
      setStoryOpen(true)
      setTimeout(() => storyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 200)
    }
  }, [])

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
    }
  }, [])

  // One-time notice: Mini Story narrator switches to a male voice from Scholar onward
  useEffect(() => {
    if (level === 'scholar' && !localStorage.getItem(`voicechange_${childId}`)) {
      setShowVoiceNotice(true)
    }
  }, [level, childId])

  function dismissVoiceNotice() {
    localStorage.setItem(`voicechange_${childId}`, '1')
    setShowVoiceNotice(false)
  }

  function handleSpeak() {
    if (typeof window === 'undefined') return
    if (speaking) {
      audioRef.current?.pause()
      audioRef.current = null
      window.speechSynthesis?.cancel()
      setSpeaking(false)
      return
    }
    const topicNum = String(topicIdx + 1).padStart(2, '0')
    const mp3Src = `/audio/stories/${level}.${topicNum}.${topicId}.mp3`
    const audio = new Audio(mp3Src)
    audioRef.current = audio

    let fellBack = false
    const fallbackToTTS = () => {
      if (fellBack || audioRef.current !== audio) return
      fellBack = true
      audioRef.current = null
      const plain = story.en.replace(/\*\*/g, '')
      const utt = new SpeechSynthesisUtterance(plain)
      utt.lang = 'en-US'; utt.rate = 0.85
      utt.onend = () => setSpeaking(false)
      setSpeaking(true)
      window.speechSynthesis.speak(utt)
    }

    audio.addEventListener('ended', () => {
      if (audioRef.current !== audio) return
      setSpeaking(false)
      audioRef.current = null
    }, { once: true })
    audio.addEventListener('error', fallbackToTTS, { once: true })

    setSpeaking(true)
    audio.play().catch(fallbackToTTS)
  }

  function resetExercise() {
    setExerciseAnswers({})
    setExerciseSubmitted(false)
  }

  const exerciseScore = parsedExercise
    ? parsedExercise.blanks.filter((b, i) => exerciseAnswers[i]?.toLowerCase() === b.word.toLowerCase()).length
    : 0
  const allAnswered = parsedExercise
    ? parsedExercise.blanks.every((_, i) => !!exerciseAnswers[i])
    : false

  return (
    <>
      {/* One-time voice-change notice (Scholar onward) */}
      {showVoiceNotice && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3 flex items-start gap-2">
          <span className="text-lg leading-none flex-shrink-0">🎙️</span>
          <p className="flex-1 text-sm text-indigo-700 leading-relaxed">
            <span className="font-bold">Giọng đọc mới! 😊</span> Giúp bạn làm quen nhiều giọng tiếng Anh khác nhau
          </p>
          <button
            onClick={dismissVoiceNotice}
            aria-label="Đóng"
            className="text-indigo-400 hover:text-indigo-600 text-sm leading-none flex-shrink-0"
          >
            ✕
          </button>
        </div>
      )}

      <div ref={storyRef} className="rounded-3xl border-2 border-b-[4px] border-purple-200 border-b-purple-300 bg-purple-50 p-4 scroll-mt-4">
        {/* Story header */}
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex min-w-0 items-center gap-1.5 whitespace-nowrap rounded-full border-b-[3px] border-purple-800 bg-purple-600 px-3 py-1.5 text-sm font-bold text-white">
            📖 Mini Story
          </span>
          <div className="flex flex-shrink-0 items-center gap-2">
            <button
              onClick={handleSpeak}
              className={`flex items-center gap-1 whitespace-nowrap rounded-full border-b-[3px] px-3 py-1.5 text-xs font-bold ${PRESS} ${
                speaking ? 'border-red-700 bg-red-500 text-white' : 'border-amber-600 bg-amber-400 text-amber-950'
              }`}
            >
              {speaking ? '⏹ Dừng' : '🔊 Nghe'}
            </button>
            <button
              onClick={() => setStoryOpen(v => !v)}
              aria-expanded={storyOpen}
              aria-label={storyOpen ? 'Thu gọn' : 'Mở truyện'}
              className={`flex h-8 w-8 items-center justify-center rounded-full border-b-[3px] border-purple-300 bg-white text-sm font-bold text-purple-700 ${PRESS}`}
            >
              {storyOpen ? '▴' : '▾'}
            </button>
          </div>
        </div>
        {!storyOpen && <p className="mt-2 text-xs font-semibold text-purple-700/80">🚀 Nâng trình nghe, đọc hiểu và làm bài tập cùng Mini Story</p>}

        {storyOpen && (!showExercise || !parsedExercise ? (
          /* ── Read mode ── */
          <div className="mt-3 rounded-2xl bg-white p-3">
            <div className="text-gray-700 text-sm leading-relaxed mb-2">
              {renderHighlighted(story.en)}
            </div>
            <button
              onClick={() => setShowVI(v => !v)}
              className="text-xs text-gray-400 hover:text-gray-600 font-semibold flex items-center gap-1 transition-colors"
            >
              {showVI ? '🙈 Ẩn tiếng Việt' : '👁 Xem tiếng Việt'}
            </button>
            {showVI && (
              <div className="mt-2 bg-amber-50 rounded-xl p-3 text-sm text-gray-600 leading-relaxed border border-amber-100">
                {renderHighlighted(story.vi)}
              </div>
            )}
            {parsedExercise && (
              <button
                onClick={() => { setShowExercise(true); resetExercise() }}
                className={`mt-3 w-full rounded-2xl border-b-[4px] border-amber-600 bg-amber-400 px-4 py-3 text-sm font-bold text-amber-950 ${PRESS}`}
              >
                📝 Làm bài tập
              </button>
            )}
          </div>
        ) : (
          /* ── Exercise mode ── */
          <div className="mt-3 rounded-2xl bg-white p-3">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">📝 Điền từ vào chỗ trống</p>
              <button
                onClick={() => setShowExercise(false)}
                className="text-xs text-gray-400 hover:text-gray-600 font-semibold"
              >
                ← Đọc lại
              </button>
            </div>

            {/* Story with inline dropdowns */}
            <div className="text-sm text-gray-700 leading-loose mb-4 bg-gray-50 rounded-xl p-3">
              {parsedExercise.parts.map((part, i) => (
                <span key={i}>
                  {part}
                  {i < parsedExercise.blanks.length && (() => {
                    const ans = exerciseAnswers[i]
                    const blank = parsedExercise.blanks[i]
                    const isCorrect = exerciseSubmitted && ans?.toLowerCase() === blank.word.toLowerCase()
                    const isWrong = exerciseSubmitted && ans && ans.toLowerCase() !== blank.word.toLowerCase()
                    return (
                      <select
                        value={ans ?? ''}
                        onChange={e => !exerciseSubmitted && setExerciseAnswers(a => ({ ...a, [i]: e.target.value }))}
                        disabled={exerciseSubmitted}
                        className={`inline-block mx-0.5 border-2 rounded-lg px-1 py-0.5 text-xs font-bold bg-white cursor-pointer
                          ${isCorrect ? 'border-green-400 text-green-700 bg-green-50'
                            : isWrong ? 'border-red-400 text-red-600 bg-red-50'
                            : ans ? 'border-blue-400 text-blue-700'
                            : 'border-dashed border-gray-300 text-gray-400'}`}
                      >
                        <option value="">_ _ _</option>
                        {blank.options.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )
                  })()}
                </span>
              ))}
            </div>

            {/* Wrong answers correction */}
            {exerciseSubmitted && parsedExercise.blanks.some((b, i) => exerciseAnswers[i]?.toLowerCase() !== b.word.toLowerCase()) && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 text-xs space-y-1">
                {parsedExercise.blanks.map((b, i) =>
                  exerciseAnswers[i]?.toLowerCase() !== b.word.toLowerCase() ? (
                    <p key={i} className="text-gray-600">
                      Ô {i + 1}: <span className="line-through text-red-400">{exerciseAnswers[i] || '—'}</span>
                      {' → '}<span className="font-bold text-green-600">{b.word}</span>
                    </p>
                  ) : null
                )}
              </div>
            )}

            {!exerciseSubmitted ? (
              <button
                onClick={() => setExerciseSubmitted(true)}
                disabled={!allAnswered}
                className={`w-full rounded-2xl border-b-[4px] py-3 text-sm font-bold ${PRESS} ${
                  allAnswered ? 'border-amber-600 bg-amber-400 text-amber-950' : 'border-slate-200 bg-slate-100 text-slate-300'
                }`}
              >
                Kiểm tra ✓
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-center font-black text-base">
                  {exerciseScore === parsedExercise.blanks.length ? '🏆 Hoàn hảo!' : `${exerciseScore}/${parsedExercise.blanks.length} đúng`}
                </p>
                <button onClick={resetExercise} className={`w-full rounded-2xl border-b-[4px] border-slate-300 bg-slate-100 py-3 text-sm font-bold text-slate-600 ${PRESS}`}>
                  🔄 Thử lại
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
