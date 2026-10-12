'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useGameSync } from '@/lib/GameSyncContext'
import { playSfx, playWrongSound } from '@/lib/gameSound'
import { speak as speakWord } from '@/lib/speak'
import { starsFor } from '@/lib/topicMastery'
import {
  buildRocketQuestions, rocketScorePct, rocketSeconds, ROCKET_PARTS, type ArcadeWord, type RocketQuestion,
} from '@/lib/arcadeGames'
import Confetti from '@/components/Confetti'
import GameResultScreen from '@/components/GameResultScreen'
import { GameHeader, PrimaryButton, AnswerButton, type AnswerState } from '@/components/ChunkyUI'
import { RocketArt, PlanetScene, type RocketStage } from '@/components/games/RocketArt'

type Topic = { id: string; name: string; emoji: string; color: string; words: ArcadeWord[] }
type Props = { topic: Topic; level: string; backUrl: string }
type Phase = 'ready' | 'play' | 'countdown' | 'launch' | 'planet' | 'fizzle' | 'done'

const HEADER = 'bg-gradient-to-br from-indigo-600 to-violet-600'
const PROMPT: Record<RocketQuestion['kind'], string> = {
  vi: 'Từ tiếng Anh nào?',
  listen: 'Nghe và chọn từ đúng',
  en: 'Từ này nghĩa là gì?',
}
// Fixed star field (no Math.random in render).
const STARS = [[8, 12], [22, 40], [35, 8], [48, 28], [62, 14], [76, 36], [88, 10], [15, 62], [84, 58], [55, 50], [30, 78], [70, 74]]

export default function RocketGame({ topic, level, backUrl }: Props) {
  const router = useRouter()
  const { recordAnswer, recordActivity, addScore, recordGameResult, flush } = useGameSync()
  const totalSeconds = rocketSeconds(level)

  const [queue, setQueue] = useState<RocketQuestion[]>(() => buildRocketQuestions(topic.words))
  const [phase, setPhase] = useState<Phase>('ready')
  const [built, setBuilt] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [timeLeft, setTimeLeft] = useState(totalSeconds)
  const [picked, setPicked] = useState<string | null>(null)
  const [count, setCount] = useState(3)
  const [wrongWords, setWrongWords] = useState<string[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const missed = useRef(new Set<string>())
  const recorded = useRef(false) // result saved for this flight (on landing / out of fuel, before the result screen)
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())

  const current = queue[0]
  const speak = (w: string) => speakWord(w, { rate: 0.85 })

  const later = (fn: () => void, ms: number) => {
    const t = setTimeout(() => { timers.current.delete(t); fn() }, ms)
    timers.current.add(t)
  }
  useEffect(() => () => { timers.current.forEach(clearTimeout) }, [])

  // Fuel clock — one for the whole flight.
  useEffect(() => {
    if (phase !== 'play') return
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  useEffect(() => {
    if (phase === 'play' && timeLeft <= 0) { playWrongSound(); setPhase('fizzle') }
  }, [timeLeft, phase])

  // Say the word for listening (and English → meaning) questions as each one comes up.
  useEffect(() => {
    if (phase === 'play' && current && current.kind !== 'vi') speak(current.target.word)
  }, [phase, current])

  // 3-2-1 → lift-off → planet.
  useEffect(() => {
    if (phase !== 'countdown') return
    playSfx('beep')
    if (count <= 0) {
      setPhase('launch')
      playSfx('launch')
      later(() => { setPhase('planet'); playSfx('trophy'); setShowConfetti(true) }, 2700)
      return
    }
    const t = setTimeout(() => setCount((c) => c - 1), 900)
    return () => clearTimeout(t)
  }, [phase, count])

  const scorePct = rocketScorePct(built, wrong, timeLeft, totalSeconds)

  useEffect(() => {
    if (!['planet', 'fizzle', 'done'].includes(phase) || recorded.current) return
    recorded.current = true
    recordActivity(level)
    addScore(level, built) // 🟢 recognition tier — 1x XP (see FAQ "XP theo độ khó")
    recordGameResult(level, topic.id, 'rocket', scorePct, 100)
    flush()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Right → the next part bolts on. Wrong → show the answer, then the question goes to the back of
  // the queue: the rocket only flies once all 10 words have been answered correctly.
  function answer(choice: ArcadeWord) {
    if (phase !== 'play' || picked !== null) return
    setPicked(choice.word)
    const w = current.target.word
    if (choice.word === w) {
      playSfx('clunk')
      speak(w)
      if (!missed.current.has(w)) recordAnswer(level, topic.id, current.target, true)
      const b = built + 1
      setBuilt(b)
      later(() => {
        setPicked(null)
        if (b >= ROCKET_PARTS) { setCount(3); setPhase('countdown') }
        else setQueue((q) => q.slice(1))
      }, 750)
    } else {
      playWrongSound()
      setWrong((n) => n + 1)
      if (!missed.current.has(w)) {
        missed.current.add(w)
        recordAnswer(level, topic.id, current.target, false)
        setWrongWords((ww) => [...ww, w])
      }
      // Fresh object so the "say the word" effect fires again even when it's the last question left.
      later(() => { setPicked(null); setQueue((q) => [...q.slice(1), { ...q[0] }]) }, 1300)
    }
  }

  const restart = () => {
    timers.current.forEach(clearTimeout)
    timers.current.clear()
    missed.current = new Set()
    recorded.current = false
    setQueue(buildRocketQuestions(topic.words))
    setBuilt(0)
    setWrong(0)
    setTimeLeft(totalSeconds)
    setPicked(null)
    setWrongWords([])
    setShowConfetti(false)
    setPhase('ready')
  }
  const exit = () => router.push(backUrl)

  if (phase === 'done') {
    const launched = built >= ROCKET_PARTS
    return (
      <div className="flex flex-col min-h-screen">
        {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
        <GameHeader colorCls={HEADER} title="🚀 Phóng Tên Lửa" subtitle={topic.name} onBack={exit} />
        <div className="flex-1 bg-gradient-to-b from-indigo-50 to-violet-50 flex flex-col items-center justify-center px-4 py-8">
          <GameResultScreen
            score={scorePct} total={100} xpEarned={built} stars={starsFor(scorePct)} wrongWords={wrongWords}
            scoreLine={launched ? 'Tên lửa đã bay vào vũ trụ! 🚀' : `Lắp được ${built}/${ROCKET_PARTS} bộ phận`}
            extra={launched
              ? <>Trả lời sai {wrong} lần · ⛽ còn {Math.max(0, timeLeft)} giây<br />Ít lần sai và còn nhiều nhiên liệu để được 3 sao!</>
              : <>Hết nhiên liệu trước khi lắp xong.<br />Thử lại nhanh hơn một chút nhé!</>}
            onRestart={restart} onExit={exit}
          />
        </div>
      </div>
    )
  }

  const stage: RocketStage = phase === 'countdown' ? 'countdown' : phase === 'launch' ? 'launch' : phase === 'fizzle' ? 'fizzle' : 'build'
  const fuelPct = (Math.max(0, timeLeft) / totalSeconds) * 100
  const stateOf = (c: ArcadeWord): AnswerState => {
    if (picked === null) return 'idle'
    if (c.word === current.target.word) return 'correct'
    return c.word === picked ? 'wrong' : 'dim'
  }

  return (
    <div className="flex flex-col min-h-screen">
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
      <GameHeader
        colorCls={HEADER} title="🚀 Phóng Tên Lửa" subtitle={topic.name} onBack={exit}
        right={<>{built}/{ROCKET_PARTS}</>}
        timer={phase === 'ready' || phase === 'planet' ? undefined
          : { pct: fuelPct, secondsLeft: Math.max(0, timeLeft), urgent: fuelPct <= 20, fillCls: 'bg-yellow-300' }}
      />

      <div className="flex-1 bg-gradient-to-b from-indigo-50 to-violet-50 px-4 py-4">
        <div className="mx-auto max-w-xl space-y-3">
          {/* Sky with the rocket */}
          <div className="relative h-[40vh] min-h-[240px] overflow-hidden rounded-3xl border-b-[5px] border-indigo-950 bg-gradient-to-b from-indigo-950 via-indigo-800 to-sky-500">
            {STARS.map(([x, y], i) => (
              <span key={i} className="absolute h-1 w-1 animate-pulse rounded-full bg-white" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.2}s` }} />
            ))}
            {phase === 'planet'
              ? <PlanetScene topicEmoji={topic.emoji} />
              : <RocketArt built={built} stage={stage} className="absolute inset-x-0 bottom-1 mx-auto h-[92%]" />}
            {phase === 'countdown' && count > 0 && (
              <span key={count} className="absolute inset-0 flex animate-ping items-center justify-center text-7xl font-black text-yellow-300 [animation-iteration-count:1]">{count}</span>
            )}
            {phase === 'launch' && <span className="absolute inset-x-0 top-4 text-center text-2xl font-black text-yellow-300 drop-shadow">Phóng! 🚀</span>}
          </div>

          {phase === 'ready' && (
            <div className="rounded-3xl border-2 border-b-[5px] border-indigo-200 bg-white p-5 text-center">
              <h2 className="text-xl font-bold text-indigo-900">Lắp tên lửa và bay vào vũ trụ!</h2>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                Mỗi câu đúng lắp thêm 1 bộ phận. Đủ {ROCKET_PARTS} bộ phận trước khi hết ⛽ nhiên liệu là tên lửa cất cánh!
              </p>
              <p className="mt-2 text-sm font-bold text-indigo-700">{ROCKET_PARTS} câu · ⛽ {totalSeconds} giây</p>
              <PrimaryButton className="mt-4" onClick={() => { playSfx('ready'); setPhase('play') }}>Bắt đầu lắp 🔧</PrimaryButton>
            </div>
          )}

          {phase === 'play' && current && (
            <div className="space-y-3">
              <div className="rounded-3xl border-2 border-b-[5px] border-indigo-200 bg-white px-4 py-3 text-center">
                <p className="text-xs font-bold uppercase tracking-wider text-indigo-500">{PROMPT[current.kind]}</p>
                {current.kind === 'vi' && (
                  <p className="mt-1 flex items-center justify-center gap-2 text-2xl font-bold text-slate-800">
                    <span className="text-4xl" aria-hidden>{current.target.emoji}</span>{current.target.meaning}
                  </p>
                )}
                {current.kind === 'listen' && (
                  <button type="button" onClick={() => speak(current.target.word)}
                    className="mt-1 inline-flex items-center gap-2 rounded-2xl border-2 border-b-[4px] border-indigo-200 bg-indigo-50 px-5 py-2 text-lg font-bold text-indigo-800">
                    <span className="text-3xl">🔊</span>{picked ? current.target.word : 'Nghe lại'}
                  </button>
                )}
                {current.kind === 'en' && (
                  <button type="button" onClick={() => speak(current.target.word)} className="mt-1 text-3xl font-bold text-slate-800">
                    {current.target.word} <span className="text-xl">🔊</span>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {current.choices.map((c) => (
                  <AnswerButton key={c.word} state={stateOf(c)} disabled={picked !== null} onClick={() => answer(c)}>
                    {current.kind === 'en' ? <span className="text-base">{c.emoji} {c.meaning}</span> : c.word}
                  </AnswerButton>
                ))}
              </div>
            </div>
          )}

          {(phase === 'countdown' || phase === 'launch') && (
            <p className="text-center text-lg font-bold text-indigo-800">Chuẩn bị cất cánh… 🧑‍🚀</p>
          )}

          {phase === 'planet' && (
            <div className="rounded-3xl border-2 border-b-[5px] border-violet-200 bg-white p-5 text-center">
              <h2 className="text-xl font-bold text-violet-900">Đã đáp xuống hành tinh {topic.emoji}!</h2>
              <p className="mt-1 text-sm font-semibold text-slate-600">Rocky cắm cờ chủ đề “{topic.name}” lên hành tinh mới 🎉</p>
              <PrimaryButton tone="purple" className="mt-4" onClick={() => setPhase('done')}>Xem kết quả ⭐</PrimaryButton>
            </div>
          )}

          {phase === 'fizzle' && (
            <div className="rounded-3xl border-2 border-b-[5px] border-slate-200 bg-white p-5 text-center">
              <h2 className="text-xl font-bold text-slate-800">Ối, hết nhiên liệu rồi! 💨</h2>
              <p className="mt-1 text-sm font-semibold text-slate-600">Tên lửa mới lắp được {built}/{ROCKET_PARTS} bộ phận.</p>
              <PrimaryButton tone="slate" className="mt-4" onClick={() => setPhase('done')}>Xem kết quả</PrimaryButton>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
