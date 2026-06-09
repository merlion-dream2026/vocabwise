'use client'

// Word Stress module — hear a word, tap the stressed syllable.
// Based on Cambridge PIU Elementary Section B (Units 28-32).

import { useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { speak } from '@/lib/speak'
import Confetti from '@/components/Confetti'
import wordStressData from '@/data/wordStress.json'

type StressWord = { word: string; syllables: string[]; stress: number; emoji: string; vi: string }
type Group = { id: string; title: string; subtitle: string; emoji: string; words: StressWord[] }

const TOTAL_PER_ROUND = 10

function shuffle<T>(arr: T[]): T[] { return [...arr].sort(() => Math.random() - 0.5) }

function buildRound(groups: Group[]): StressWord[] {
  const all = groups.flatMap(g => g.words)
  return shuffle(all).slice(0, TOTAL_PER_ROUND)
}

type Phase = 'listening' | 'choosing' | 'result'

export default function WordStressPage() {
  const router = useRouter()
  const { childId } = useParams<{ childId: string }>()

  const groups = wordStressData.groups as Group[]
  const [questions] = useState<StressWord[]>(() => buildRound(groups))
  const [idx, setIdx]     = useState(0)
  const [score, setScore] = useState(0)
  const [phase, setPhase] = useState<Phase>('listening')
  const [selected, setSelected] = useState<number | null>(null)
  const [gameDone, setGameDone] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)
  const speakingRef = useRef(false)

  const q = questions[idx]

  const playWord = useCallback((word: string, onDone?: () => void) => {
    if (speakingRef.current) return
    speakingRef.current = true
    speak(word, {
      rate: 0.7,
      onEnd:  () => { speakingRef.current = false; onDone?.() },
      onError: () => { speakingRef.current = false; onDone?.() },
    })
  }, [])

  const startGame = () => {
    setGameStarted(true)
    setPhase('listening')
    setTimeout(() => playWord(q.word, () => setPhase('choosing')), 300)
  }

  const handleChoose = (syllableIdx: number) => {
    if (phase !== 'choosing') return
    setSelected(syllableIdx)
    setPhase('result')
    const correct = syllableIdx === q.stress
    if (correct) {
      setScore(s => s + 1)
      speak(q.word, { rate: 0.8 })
    } else {
      speak(q.word, { rate: 0.7 })
    }
  }

  const advance = () => {
    const next = idx + 1
    if (next >= questions.length) {
      const finalScore = score + (selected === q.stress ? 1 : 0)
      if (finalScore === questions.length) setShowConfetti(true)
      setGameDone(true)
    } else {
      setIdx(next)
      setSelected(null)
      setPhase('listening')
      speakingRef.current = false
      setTimeout(() => playWord(questions[next].word, () => setPhase('choosing')), 400)
    }
  }

  const restart = () => {
    setIdx(0); setScore(0); setSelected(null); setPhase('listening')
    setGameDone(false); setShowConfetti(false); setGameStarted(false)
    speakingRef.current = false
  }

  if (gameDone) {
    const finalScore = score
    const total = questions.length
    const pct = Math.round((finalScore / total) * 100)
    return (
      <div className="flex flex-col min-h-screen">
        {showConfetti && <Confetti />}
        <div className="bg-gradient-to-br from-teal-400 to-cyan-500 px-4 pt-12 pb-8 text-white">
          <button onClick={() => router.back()} className="text-white/80 font-bold text-sm flex items-center gap-1 mb-4">← Phát âm</button>
          <h1 className="text-2xl font-black">📢 Trọng âm từ</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 bg-teal-50">
          <div className="text-7xl mb-4">{finalScore === total ? '🏆' : finalScore >= total * 0.7 ? '⭐' : '💪'}</div>
          <h2 className="text-3xl font-black text-gray-800 mb-1">{finalScore}/{total}</h2>
          <p className="text-gray-500 font-bold text-xl mb-8">{pct}%</p>
          <div className="w-full max-w-sm space-y-3">
            <button onClick={restart} className="w-full bg-teal-500 text-white font-black text-xl py-4 rounded-2xl shadow-lg">🔄 Chơi lại</button>
            <button onClick={() => router.back()} className="w-full bg-white border-2 border-gray-200 text-gray-600 font-bold text-xl py-4 rounded-2xl">← Quay lại</button>
          </div>
        </div>
      </div>
    )
  }

  if (!gameStarted) return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-gradient-to-br from-teal-400 to-cyan-500 px-4 pt-12 pb-8 text-white">
        <button onClick={() => router.back()} className="text-white/80 font-bold text-sm flex items-center gap-1 mb-4">← Phát âm</button>
        <h1 className="text-2xl font-black">📢 Trọng âm từ</h1>
        <p className="text-white/80 text-sm mt-1">Nghe → tap âm tiết được nhấn mạnh</p>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-5 bg-teal-50">
        {/* Word stress groups preview */}
        <div className="w-full max-w-sm space-y-3">
          {groups.map(g => (
            <div key={g.id} className="bg-white rounded-2xl border-2 border-teal-100 p-4">
              <p className="font-black text-teal-700 text-sm mb-2">{g.emoji} {g.title}</p>
              <p className="text-gray-400 text-xs font-semibold mb-3">{g.subtitle}</p>
              <div className="flex flex-wrap gap-2">
                {g.words.slice(0, 4).map(w => (
                  <div key={w.word} className="flex gap-0.5">
                    {w.syllables.map((syl, i) => (
                      <span key={i} className={`text-xs font-bold px-1.5 py-0.5 rounded ${i === w.stress ? 'bg-teal-400 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {syl}
                      </span>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="w-full max-w-sm bg-teal-50 border-2 border-teal-200 rounded-2xl px-4 py-3">
          <p className="text-teal-700 font-bold text-sm">🎯 Cách chơi:</p>
          <p className="text-teal-600 text-xs mt-1">Nghe từ → bấm vào âm tiết màu đậm nhất (được nhấn)</p>
        </div>
        <button onClick={startGame} className="w-full max-w-sm bg-teal-500 text-white font-black text-xl py-4 rounded-2xl shadow-lg active:scale-95 transition-all">
          ▶️ Bắt đầu ({TOTAL_PER_ROUND} câu)
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-gradient-to-br from-teal-400 to-cyan-500 px-4 pt-12 pb-4 text-white">
        <button onClick={() => router.back()} className="text-white/80 font-bold text-sm flex items-center gap-1 mb-3">← Phát âm</button>
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-black">📢 Trọng âm từ</h1>
          <span className="bg-white/20 px-3 py-1 rounded-full font-black text-sm">{idx + 1}/{questions.length}</span>
        </div>
        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div className="h-full bg-white/70 rounded-full transition-all" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} />
        </div>
      </div>

      <div className="flex-1 bg-teal-50 flex flex-col items-center justify-center px-4 gap-5">
        {/* Score dots */}
        <div className="flex gap-2">
          {Array.from({ length: questions.length }).map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${i < score ? 'bg-green-400' : 'bg-gray-200'}`} />
          ))}
        </div>

        {/* Word + emoji */}
        <div className="bg-white rounded-3xl p-6 shadow-md w-full max-w-sm text-center">
          {phase === 'listening' && (
            <>
              <div className="text-5xl mb-2 animate-bounce">{q.emoji}</div>
              <div className="text-4xl font-black text-gray-800 animate-pulse">{q.word}</div>
              <p className="text-gray-400 text-sm mt-2">Đang phát âm...</p>
            </>
          )}
          {(phase === 'choosing' || phase === 'result') && (
            <>
              <div className="text-5xl mb-2">{q.emoji}</div>
              <div className="text-3xl font-black text-gray-800 mb-1">{q.word}</div>
              <p className="text-xs text-gray-400 font-semibold">{q.vi}</p>
              {phase === 'choosing' && (
                <button onClick={() => { speakingRef.current = false; playWord(q.word, () => setPhase('choosing')) }}
                  className="mt-3 bg-teal-100 text-teal-600 font-bold text-sm px-4 py-2 rounded-xl active:scale-90">
                  🔊 Nghe lại
                </button>
              )}
            </>
          )}
        </div>

        {/* Question */}
        {(phase === 'choosing' || phase === 'result') && (
          <div className="w-full max-w-sm">
            <p className="text-center text-gray-600 font-bold text-sm mb-3">
              {phase === 'choosing' ? 'Âm tiết nào được nhấn mạnh?' : (selected === q.stress ? '✅ Đúng rồi!' : `❌ Đúng là: "${q.syllables[q.stress].toUpperCase()}"`)}
            </p>
            <div className="flex justify-center gap-3 flex-wrap">
              {q.syllables.map((syl, i) => {
                const isCorrect = i === q.stress
                const isSelected = selected === i
                const showResult = phase === 'result'
                let cls = 'bg-white border-2 border-teal-300 text-gray-700 active:scale-90'
                if (showResult && isCorrect)            cls = 'bg-green-400 border-2 border-green-500 text-white'
                if (showResult && isSelected && !isCorrect) cls = 'bg-red-300 border-2 border-red-400 text-white'
                return (
                  <button key={i} onClick={() => handleChoose(i)} disabled={phase === 'result'}
                    className={`${cls} rounded-2xl px-6 py-4 font-black text-2xl transition-all min-w-[72px]`}>
                    {syl}
                    {showResult && isCorrect && <div className="text-xs font-bold mt-1">nhấn đây</div>}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {phase === 'result' && (
          <button onClick={advance}
            className={`w-full max-w-sm font-black text-xl py-4 rounded-2xl shadow-md text-white ${selected === q.stress ? 'bg-green-500' : 'bg-teal-500'}`}>
            {idx + 1 >= questions.length ? 'Kết quả →' : 'Tiếp theo →'}
          </button>
        )}
      </div>
    </div>
  )
}
