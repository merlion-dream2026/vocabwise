'use client'

// Sort Words game — hear a word, tap which phoneme bucket it belongs to.
// Works for pairs with exactly 2 sounds. One word played at a time,
// user taps the /p/ bucket or /b/ bucket, etc.

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { speak } from '@/lib/speak'
import { recordPairGame, flushPhonics } from '@/lib/phonicsSync'
import Confetti from '@/components/Confetti'

type Sound = { symbol: string; keyword: string; emoji: string; vi: string }
type Pair  = { id: string; sounds: Sound[]; practice_words: string[] }
type Group = { id: string; title: string; emoji: string; gradient: string; bg: string; border: string; text: string; btn: string; bar: string; pairs: Pair[] }

// Map each practice word to the sound that "owns" it.
// We use a round-robin: odd-indexed words → sounds[0], even-indexed → sounds[1].
// (This matches the alternating pattern in our practice_words data: pan/ban/pet/bet/...)
type WordQuestion = { word: string; correctSoundIdx: number; pair: Pair }

function buildQuestions(group: Group): WordQuestion[] {
  const validPairs = group.pairs.filter(p => p.sounds.length === 2)
  const questions: WordQuestion[] = []
  for (const pair of validPairs) {
    for (let i = 0; i < Math.min(pair.practice_words.length, 6); i++) {
      questions.push({ word: pair.practice_words[i], correctSoundIdx: i % 2, pair })
    }
  }
  return questions.sort(() => Math.random() - 0.5).slice(0, 12)
}

type Phase = 'listening' | 'choosing' | 'result'

export default function SortWordsGame({ group, childId, backUrl }: { group: Group; childId: string; backUrl: string }) {
  const router = useRouter()
  const [questions] = useState<WordQuestion[]>(() => buildQuestions(group))
  const [idx, setIdx]       = useState(0)
  const [score, setScore]   = useState(0)
  const [phase, setPhase]   = useState<Phase>('listening')
  const [selected, setSelected] = useState<number | null>(null)
  const [gameDone, setGameDone]   = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const speakingRef = useRef(false)
  const hasNoValid = questions.length === 0

  const q = questions[idx] ?? null

  const playQuestion = useCallback((question: WordQuestion) => {
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

  const handleChoose = (soundIdx: number) => {
    if (phase !== 'choosing') return
    setSelected(soundIdx)
    setPhase('result')
    const correct = soundIdx === q.correctSoundIdx
    if (correct) {
      setScore(s => s + 1)
      speak(q.pair.sounds[soundIdx].keyword, { rate: 0.8 })
    } else {
      // Play correct word to reinforce
      speak(q.word, { rate: 0.75 })
    }
  }

  const advance = () => {
    const next = idx + 1
    if (next >= questions.length) {
      const finalScore = score + (selected === q.correctSoundIdx ? 1 : 0)
      if (finalScore / questions.length >= 0.7) {
        recordPairGame(group.id, 'sort-words')
        flushPhonics()
      }
      if (finalScore === questions.length) setShowConfetti(true)
      setGameDone(true)
    } else {
      setIdx(next)
    }
  }

  const restart = () => {
    setIdx(0); setScore(0); setSelected(null); setPhase('listening')
    setGameDone(false); setShowConfetti(false)
  }

  if (hasNoValid) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50 px-4">
      <p className="text-6xl mb-4">🎯</p>
      <p className="text-gray-600 font-bold text-center">Nhóm này cần đúng 2 âm để chơi.<br/>Thử game khác nhé!</p>
      <button onClick={() => router.push(backUrl)} className="mt-6 bg-amber-500 text-white font-black px-6 py-3 rounded-2xl">← Quay lại</button>
    </div>
  )

  if (gameDone) {
    const finalScore = score
    const total = questions.length
    const pct = Math.round((finalScore / total) * 100)
    return (
      <div className="flex flex-col min-h-screen">
        {showConfetti && <Confetti />}
        <div className={`bg-gradient-to-br ${group.gradient} px-4 pt-12 pb-8 text-white`}>
          <button onClick={() => router.push(backUrl)} className="text-white/80 font-bold text-sm flex items-center gap-1 mb-4">← {group.title}</button>
          <h1 className="text-2xl font-black">🎯 Phân loại âm</h1>
        </div>
        <div className="flex-1 bg-gradient-to-b from-amber-50 to-orange-50 flex flex-col items-center justify-center px-4 py-8">
          <div className="text-7xl mb-4">{finalScore === total ? '🏆' : finalScore >= total * 0.7 ? '⭐' : '💪'}</div>
          <h2 className="text-3xl font-black text-gray-800 mb-1">{finalScore}/{total}</h2>
          <p className="text-gray-500 font-bold text-xl mb-8">{pct}%</p>
          <div className="w-full space-y-3">
            <button onClick={restart} className={`w-full ${group.btn} text-white font-black text-xl py-4 rounded-2xl shadow-lg`}>🔄 Chơi lại</button>
            <button onClick={() => router.push(backUrl)} className="w-full bg-white border-2 border-gray-200 text-gray-600 font-bold text-xl py-4 rounded-2xl">← Chọn game khác</button>
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
          <h1 className="text-xl font-black">🎯 Phân loại âm</h1>
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

        {/* Word card */}
        <div className="bg-white rounded-3xl p-6 shadow-md w-full text-center">
          {phase === 'listening' && (
            <>
              <div className="text-6xl animate-bounce mb-2">🔊</div>
              <p className="text-gray-500 font-bold">Đang phát từ...</p>
            </>
          )}
          {(phase === 'choosing' || phase === 'result') && (
            <>
              <p className="text-4xl font-black text-gray-800 mb-1">{q.word}</p>
              <p className="text-xs text-gray-500 font-semibold mb-2">Từ này chứa âm nào?</p>
              {phase === 'choosing' && (
                <button onClick={() => { speakingRef.current = false; playQuestion(q) }}
                  className="bg-amber-100 text-amber-600 font-bold text-sm px-4 py-2 rounded-xl active:scale-90">
                  🔊 Nghe lại
                </button>
              )}
              {phase === 'result' && (
                <div className={`mt-2 rounded-xl p-2.5 ${selected === q.correctSoundIdx ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className="text-sm font-bold text-gray-700">
                    {selected === q.correctSoundIdx ? (
                      <>✅ "{q.word}" → <span className="font-mono text-green-600">/{q.pair.sounds[q.correctSoundIdx].symbol}/</span> &ldquo;{q.pair.sounds[q.correctSoundIdx].keyword}&rdquo;</>
                    ) : (
                      <>❌ "{q.word}" → <span className="font-mono text-green-600">/{q.pair.sounds[q.correctSoundIdx].symbol}/</span> &ldquo;{q.pair.sounds[q.correctSoundIdx].keyword}&rdquo;, không phải <span className="font-mono text-red-500">/{q.pair.sounds[selected ?? 0]?.symbol}/</span> &ldquo;{q.pair.sounds[selected ?? 0]?.keyword}&rdquo;</>
                    )}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Two phoneme buckets — IPA only while choosing; reveal after answer */}
        {(phase === 'choosing' || phase === 'result') && (
          <div className="grid grid-cols-2 gap-4 w-full">
            {q.pair.sounds.map((sound, i) => {
              const isCorrect  = i === q.correctSoundIdx
              const isSelected = selected === i
              const showResult = phase === 'result'
              let cls = 'bg-white border-2 border-amber-200 active:scale-95'
              if (showResult && isCorrect)                cls = 'bg-green-50 border-2 border-green-400'
              if (showResult && isSelected && !isCorrect) cls = 'bg-red-50 border-2 border-red-400'
              return (
                <button key={sound.symbol} onClick={() => handleChoose(i)} disabled={phase === 'result'}
                  className={`${cls} rounded-2xl p-5 text-center transition-all flex flex-col items-center gap-2`}>
                  {showResult && <span className="text-4xl">{sound.emoji}</span>}
                  <span className={`font-black font-mono ${showResult ? 'text-2xl' : 'text-4xl py-2'} ${showResult && isCorrect ? 'text-green-700' : showResult && isSelected ? 'text-red-600' : 'text-amber-700'}`}>
                    /{sound.symbol}/
                  </span>
                  {showResult && <span className="text-sm font-bold text-gray-600">{sound.keyword}</span>}
                  {showResult && isCorrect    && <span className="text-green-500 text-xs font-black">✓ Đúng</span>}
                  {showResult && isSelected && !isCorrect && <span className="text-red-400 text-xs font-black">✗ Sai</span>}
                </button>
              )
            })}
          </div>
        )}

        {phase === 'result' && (
          <button onClick={advance}
            className={`w-full font-black text-xl py-4 rounded-2xl shadow-md text-white ${selected === q.correctSoundIdx ? 'bg-green-500' : group.btn}`}>
            {idx + 1 >= questions.length ? 'Kết quả →' : 'Tiếp theo →'}
          </button>
        )}
      </div>
    </div>
  )
}
