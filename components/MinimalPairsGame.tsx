'use client'

// Minimal pairs game — Cambridge PIU methodology:
// Play a WORD (not isolated phoneme) → student identifies which sound they heard.
// On wrong: replay correct word then chosen word as contrast ("pan" vs "ban").

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { speak } from '@/lib/speak'
import { recordPairGame, flushPhonics } from '@/lib/phonicsSync'
import { playCorrectSound, playWrongSound } from '@/lib/gameSound'
import Confetti from '@/components/Confetti'

type Sound = { symbol: string; keyword: string; emoji: string; vi: string }
type Pair  = { id: string; sounds: Sound[]; practice_words: string[] }
type Group = { id: string; title: string; emoji: string; gradient: string; bg: string; border: string; text: string; btn: string; bar: string; pairs: Pair[] }

type Question = { pairId: string; choices: Sound[]; answer: Sound; word: string }

const TOTAL_QUESTIONS = 10

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

function buildQuestions(group: Group, pairIdFilter?: string[]): Question[] {
  const validPairs = group.pairs.filter(p =>
    p.sounds.length >= 2 && (pairIdFilter ? pairIdFilter.includes(p.id) : true)
  )
  if (validPairs.length === 0) return []
  const questions: Question[] = []
  for (const pair of validPairs) {
    const words0 = pair.practice_words.filter((_, i) => i % 2 === 0)
    const words1 = pair.practice_words.filter((_, i) => i % 2 === 1)
    // Fallback to keyword if no practice_words
    const w0 = words0.length ? words0 : [pair.sounds[0].keyword]
    const w1 = words1.length ? words1 : [pair.sounds[1].keyword]
    for (const w of w0) questions.push({ pairId: pair.id, choices: shuffle(pair.sounds), answer: pair.sounds[0], word: w })
    for (const w of w1) questions.push({ pairId: pair.id, choices: shuffle(pair.sounds), answer: pair.sounds[1], word: w })
  }
  return shuffle(questions).slice(0, pairIdFilter ? questions.length : TOTAL_QUESTIONS)
}

type Phase = 'listening' | 'choosing' | 'result'

export default function MinimalPairsGame({ group, childId: _childId, backUrl }: { group: Group; childId: string; backUrl: string }) {
  const router = useRouter()
  const [allQuestions] = useState<Question[]>(() => buildQuestions(group))
  const [questions, setQuestions] = useState<Question[]>(allQuestions)
  const [isPracticeMode, setIsPracticeMode] = useState(false)
  const [idx, setIdx]     = useState(0)
  const [score, setScore] = useState(0)
  const [wrongPairIds, setWrongPairIds] = useState<string[]>([])
  const [phase, setPhase]   = useState<Phase>('listening')
  const [selected, setSelected] = useState<Sound | null>(null)
  const [gameDone, setGameDone] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const speakingRef = useRef(false)

  const hasNoValidPairs = allQuestions.length === 0
  const q = questions[idx] ?? null

  // Speak the answer keyword — Cambridge PIU: hear the WORD, not the isolated phoneme
  const playQuestion = useCallback((question: Question) => {
    if (speakingRef.current) return
    speakingRef.current = true
    setPhase('listening')
    speak(question.word, {
      rate: 0.75,
      onEnd:  () => { speakingRef.current = false; setPhase('choosing') },
      onError: () => { speakingRef.current = false; setPhase('choosing') },
    })
  }, [])

  useEffect(() => {
    if (!q || gameDone) return
    setSelected(null)
    setPhase('listening')
    speakingRef.current = false
    const t = setTimeout(() => playQuestion(q), 400)
    return () => { clearTimeout(t); window.speechSynthesis?.cancel() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, gameDone])

  const handleChoose = (sound: Sound) => {
    if (phase !== 'choosing') return
    setSelected(sound)
    setPhase('result')
    const correct = sound.symbol === q.answer.symbol
    if (correct) {
      setScore(s => s + 1)
      speak(q.answer.keyword, { rate: 0.8 })
      playCorrectSound()
    } else {
      // Contrast: play correct word → then chosen word ("pan"…"ban")
      // This is the core Cambridge PIU contrast exercise
      setWrongPairIds(ids => ids.includes(q.pairId) ? ids : [...ids, q.pairId])
      playWrongSound()
      speak(q.answer.keyword, {
        rate: 0.75,
        onEnd: () => setTimeout(() => speak(sound.keyword, { rate: 0.75 }), 500),
      })
    }
  }

  const advance = () => {
    const next = idx + 1
    if (next >= questions.length) {
      const finalScore = score + (selected?.symbol === q.answer.symbol ? 1 : 0)
      if (!isPracticeMode && finalScore / questions.length >= 0.7) {
        recordPairGame(group.id, 'minimal-pairs')
        flushPhonics()
      }
      if (finalScore === questions.length) setShowConfetti(true)
      setGameDone(true)
    } else {
      setIdx(next)
    }
  }

  const restart = () => {
    setQuestions(allQuestions); setIsPracticeMode(false)
    setIdx(0); setScore(0); setWrongPairIds([]); setSelected(null)
    setPhase('listening'); setGameDone(false); setShowConfetti(false)
  }

  const restartWeak = () => {
    const weakQuestions = buildQuestions(group, wrongPairIds)
    if (weakQuestions.length === 0) { restart(); return }
    setQuestions(weakQuestions); setIsPracticeMode(true)
    setIdx(0); setScore(0); setWrongPairIds([]); setSelected(null)
    setPhase('listening'); setGameDone(false); setShowConfetti(false)
  }

  if (hasNoValidPairs) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 px-4">
      <p className="text-6xl mb-4">🎵</p>
      <p className="text-gray-600 font-bold text-center">Nhóm này không có cặp âm đối lập.<br/>Thử game Nghe & Chọn nhé!</p>
      <button onClick={() => router.push(backUrl)} className="mt-6 bg-amber-500 text-white font-black px-6 py-3 rounded-2xl">← Quay lại</button>
    </div>
  )

  if (gameDone) {
    const finalScore = score
    const total = questions.length
    const pct = Math.round((finalScore / total) * 100)
    const passed = !isPracticeMode && finalScore / total >= 0.7
    const hasFailed = !isPracticeMode && finalScore / total < 0.7 && wrongPairIds.length > 0

    return (
      <div className="flex flex-col min-h-screen">
        {showConfetti && <Confetti />}
        <div className={`bg-gradient-to-br ${group.gradient} px-4 pt-12 pb-8 text-white`}>
          <button onClick={() => router.push(backUrl)} className="text-white/80 font-bold text-sm flex items-center gap-1 mb-4">← {group.title}</button>
          <h1 className="text-2xl font-black">🎧 Nghe & Phân biệt</h1>
        </div>
        <div className="flex-1 bg-gradient-to-b from-amber-50 to-orange-50 flex flex-col items-center justify-center px-4 py-8">
          <div className="text-7xl mb-4">{finalScore === total ? '🏆' : finalScore >= total * 0.7 ? '⭐' : '💪'}</div>
          <h2 className="text-3xl font-black text-gray-800 mb-1">{finalScore}/{total} chính xác</h2>
          <p className="text-gray-500 font-bold text-xl mb-3">{pct}%</p>
          {isPracticeMode && <p className="text-amber-600 text-sm font-bold mb-4">🔄 Chế độ ôn lại (không tính vào thành thạo)</p>}
          {passed && <p className="text-green-600 font-bold text-sm mb-4">✅ Đạt ≥70% — tính vào thành thạo!</p>}
          {hasFailed && (
            <p className="text-orange-500 font-bold text-sm mb-4">Chưa đạt — cần ≥70%</p>
          )}
          <div className="w-full space-y-3">
            {hasFailed && (
              <button onClick={restartWeak}
                className="w-full bg-orange-400 text-white font-black text-lg py-4 rounded-2xl shadow-lg">
                🔄 Ôn lại {wrongPairIds.length} cặp âm sai
              </button>
            )}
            <button onClick={restart} className={`w-full ${group.btn} text-white font-black text-xl py-4 rounded-2xl shadow-lg`}>
              🔄 Chơi lại từ đầu
            </button>
            <button onClick={() => router.push(backUrl)} className="w-full bg-white border-2 border-gray-200 text-gray-600 font-bold text-xl py-4 rounded-2xl">
              ← Chọn game khác
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className={`bg-gradient-to-br ${group.gradient} px-4 pt-12 pb-4 text-white`}>
        <button onClick={() => router.push(backUrl)} className="text-white/80 font-bold text-sm flex items-center gap-1 mb-3">← {group.title}</button>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-black">
            🎧 Nghe & Phân biệt
            {isPracticeMode && <span className="ml-2 text-sm font-bold text-white/70">· ôn lại</span>}
          </h1>
          <span className="bg-white/20 px-3 py-1 rounded-full font-black text-sm">{idx + 1}/{questions.length}</span>
        </div>
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white/70 rounded-full transition-all" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 bg-gradient-to-b from-amber-50 to-orange-50 flex flex-col items-center justify-center px-4 gap-5">
        {/* Score dots */}
        <div className="flex gap-2">
          {Array.from({ length: questions.length }).map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i < score ? 'bg-green-400' : 'bg-gray-200'}`} />
          ))}
        </div>

        {/* Question card */}
        <div className="bg-white rounded-3xl p-6 shadow-md w-full text-center">
          {phase === 'listening' && (
            <>
              <div className="text-6xl mb-3 animate-pulse">🔊</div>
              <p className="text-gray-700 font-black text-base">Đang phát từ...</p>
              <p className="text-gray-500 text-sm mt-1">Nghe rồi chọn âm bạn nghe được</p>
            </>
          )}
          {phase === 'choosing' && (
            <>
              <p className="text-4xl font-black text-gray-800 mb-1">{q.word}</p>
              <p className="text-gray-600 font-bold text-base">Từ này chứa âm nào?</p>
              <button
                onClick={() => { speakingRef.current = false; playQuestion(q) }}
                className="mt-3 bg-amber-100 text-amber-600 font-bold text-sm px-4 py-2 rounded-xl active:scale-90 transition-all"
              >
                🔊 Nghe lại
              </button>
            </>
          )}
          {phase === 'result' && selected && (
            <>
              <div className="text-5xl mb-2">{selected.symbol === q.answer.symbol ? '✅' : '❌'}</div>
              {selected.symbol === q.answer.symbol ? (
                <div>
                  <p className="font-black text-gray-800 text-base">
                    Đúng! &nbsp;<span className="font-mono text-amber-700 text-lg">/{q.answer.symbol}/</span>
                  </p>
                  <p className="text-gray-600 text-sm mt-0.5 font-semibold">
                    &quot;{q.word}&quot; có âm <span className="font-mono text-green-600">/{q.answer.symbol}/</span> — &quot;{q.answer.keyword}&quot;
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-black text-gray-800 text-sm mb-1.5">
                    &quot;{q.word}&quot; có âm <span className="font-mono text-green-600">/{q.answer.symbol}/</span> &quot;{q.answer.keyword}&quot;
                    &nbsp;—&nbsp;không phải <span className="font-mono text-red-500">/{selected.symbol}/</span> &quot;{selected.keyword}&quot;
                  </p>
                  <button
                    onClick={() => speak(q.answer.keyword, {
                      rate: 0.75,
                      onEnd: () => setTimeout(() => speak(selected.keyword, { rate: 0.75 }), 600),
                    })}
                    className="mt-1 text-amber-500 font-bold text-sm underline"
                  >
                    🔊 &quot;{q.answer.keyword}&quot; vs &quot;{selected.keyword}&quot;
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Choice buttons — only IPA symbol shown while choosing; reveal after answer */}
        {(phase === 'choosing' || phase === 'result') && (
          <div className={`grid gap-3 w-full ${q.choices.length === 2 ? 'grid-cols-2' : q.choices.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {q.choices.map(sound => {
              const isAnswer   = sound.symbol === q.answer.symbol
              const isSelected = selected?.symbol === sound.symbol
              const showResult = phase === 'result'
              let bg = 'bg-white border-2 border-amber-200 active:scale-95'
              if (showResult && isAnswer)                bg = 'bg-green-50 border-2 border-green-400'
              if (showResult && isSelected && !isAnswer) bg = 'bg-red-50 border-2 border-red-400'
              return (
                <button key={sound.symbol} onClick={() => handleChoose(sound)}
                  disabled={phase === 'result'}
                  className={`${bg} rounded-2xl p-4 text-center transition-all`}>
                  {/* Reveal emoji + keyword only after answered */}
                  {showResult && <div className="text-3xl mb-1">{sound.emoji}</div>}
                  <div className={`font-black font-mono ${showResult ? 'text-xl' : 'text-3xl py-2'} ${showResult && isAnswer ? 'text-green-700' : showResult && isSelected ? 'text-red-600' : 'text-amber-700'}`}>
                    /{sound.symbol}/
                  </div>
                  {showResult && <div className="text-sm font-bold text-gray-600 mt-0.5">{sound.keyword}</div>}
                  {showResult && isAnswer    && <div className="text-green-500 text-xs font-black mt-1">✓ Đúng</div>}
                  {showResult && isSelected && !isAnswer && <div className="text-red-400 text-xs font-black mt-1">✗ Sai</div>}
                </button>
              )
            })}
          </div>
        )}

        {phase === 'result' && (
          <button onClick={advance}
            className={`w-full font-black text-xl py-4 rounded-2xl shadow-md text-white ${selected?.symbol === q.answer.symbol ? 'bg-green-500' : group.btn}`}>
            {idx + 1 >= questions.length ? 'Kết quả →' : 'Tiếp theo →'}
          </button>
        )}
      </div>
    </div>
  )
}
