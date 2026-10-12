'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useGameSync } from '@/lib/GameSyncContext'
import { playSfx, playCorrectSound, playWrongSound } from '@/lib/gameSound'
import { speak as speakWord } from '@/lib/speak'
import { starsFor } from '@/lib/topicMastery'
import {
  buildWhackQuestions, nextWhackWord, whackPace, whackScorePct,
  WHACK_QUESTIONS, WHACK_HEARTS, WHACK_SECONDS, WHACK_HOLES, type ArcadeWord, type WhackQuestion,
} from '@/lib/arcadeGames'
import Confetti from '@/components/Confetti'
import GameResultScreen from '@/components/GameResultScreen'
import { GameHeader, PrimaryButton, buzz } from '@/components/ChunkyUI'
import { Critter, type CritterKind } from '@/components/games/Critters'

type Topic = { id: string; name: string; emoji: string; color: string; words: ArcadeWord[] }
type Props = { topic: Topic; level: string; backUrl: string }

type MoleState = 'up' | 'hit' | 'tease' | 'down'
type Mole = { id: number; hole: number; word: ArcadeWord; kind: CritterKind; state: MoleState }
type Phase = 'ready' | 'play' | 'between' | 'win' | 'done'

const HEADER = 'bg-gradient-to-br from-lime-500 to-green-600'
// Hammer cursor on desktop; touch screens get the hammer swing drawn at the tap point instead.
const HAMMER_CURSOR = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='44' height='44'><text x='2' y='34' font-size='32'>🔨</text></svg>") 10 10, pointer`

export default function WhackGame({ topic, level, backUrl }: Props) {
  const router = useRouter()
  const { recordAnswer, recordActivity, addScore, recordGameResult, flush } = useGameSync()
  const pace = whackPace(level)

  const [queue, setQueue] = useState<WhackQuestion[]>(() => buildWhackQuestions(topic.words))
  const [phase, setPhase] = useState<Phase>('ready')
  const [round, setRound] = useState(0)              // bumps on every new question — restarts timers/spawner
  const [moles, setMoles] = useState<Mole[]>([])
  const [correct, setCorrect] = useState(0)
  const [hearts, setHearts] = useState(WHACK_HEARTS)
  const [secondsLeft, setSecondsLeft] = useState(WHACK_SECONDS)
  const [reveal, setReveal] = useState(false)          // time ran out: show the answer on the board
  const [wrongWords, setWrongWords] = useState<string[]>([])
  const [hammer, setHammer] = useState<{ id: number; x: number; y: number } | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)

  const molesRef = useRef<Mole[]>([])
  const nextId = useRef(0)
  const sinceTarget = useRef(0)
  const missed = useRef(new Set<string>())             // targets already recorded as wrong
  const recorded = useRef(false)                       // result saved for this play (on the win scene or game over)
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())
  const fieldRef = useRef<HTMLDivElement>(null)

  const current = queue[0]
  molesRef.current = moles

  const later = (fn: () => void, ms: number) => {
    const t = setTimeout(() => { timers.current.delete(t); fn() }, ms)
    timers.current.add(t)
  }
  useEffect(() => () => { timers.current.forEach(clearTimeout) }, [])

  const hide = (id: number) => {
    setMoles((ms) => ms.map((m) => (m.id === id && (m.state === 'up' || m.state === 'tease') ? { ...m, state: 'down' } : m)))
    later(() => setMoles((ms) => ms.filter((m) => m.id !== id)), 260)
  }

  // Spawner: a critter pops up every gapMs while fewer than maxUp are out.
  useEffect(() => {
    if (phase !== 'play' || !current) return
    const spawn = () => {
      const live = molesRef.current
      const up = live.filter((m) => m.state === 'up')
      if (up.length >= pace.maxUp) return
      const busy = new Set(live.map((m) => m.hole))
      const free = Array.from({ length: WHACK_HOLES }, (_, h) => h).filter((h) => !busy.has(h))
      if (!free.length) return
      const word = nextWhackWord(current, sinceTarget.current, up.map((m) => m.word.word))
      sinceTarget.current = word.word === current.target.word ? 0 : sinceTarget.current + 1
      const mole: Mole = {
        id: ++nextId.current, hole: free[Math.floor(Math.random() * free.length)], word,
        kind: Math.random() < 0.5 ? 'hamster' : 'mole', state: 'up',
      }
      molesRef.current = [...live, mole]
      setMoles(molesRef.current)
      playSfx('peek')
      later(() => hide(mole.id), pace.upMs)
    }
    const first = setTimeout(spawn, 350)
    const t = setInterval(spawn, pace.gapMs)
    return () => { clearTimeout(first); clearInterval(t) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round])

  // Per-question countdown.
  useEffect(() => {
    if (phase !== 'play') return
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [phase, round])

  useEffect(() => {
    if (phase === 'play' && secondsLeft <= 0) {
      playWrongSound()
      markMissed()
      setReveal(true)
      endQuestion(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft])

  useEffect(() => {
    if ((phase !== 'win' && phase !== 'done') || recorded.current) return
    recorded.current = true
    recordActivity(level)
    addScore(level, correct) // 🟢 recognition tier — 1x XP (see FAQ "XP theo độ khó")
    recordGameResult(level, topic.id, 'whack', scorePct, 100)
    flush()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  function markMissed() {
    const w = current.target.word
    if (missed.current.has(w)) return
    missed.current.add(w)
    recordAnswer(level, topic.id, current.target, false)
    setWrongWords((ww) => [...ww, w])
  }

  function startQuestion(q: WhackQuestion[]) {
    setQueue(q)
    setMoles([])
    molesRef.current = []
    sinceTarget.current = 0
    setSecondsLeft(WHACK_SECONDS)
    setReveal(false)
    setRound((r) => r + 1)
    setPhase('play')
  }

  // Wrong whack or time-out costs a heart. Out of hearts → game over; a timed-out question goes to
  // the back of the queue so the game still needs 5 right answers.
  function endQuestion(solved: boolean) {
    setPhase('between')
    if (solved) {
      const c = correct + 1
      setCorrect(c)
      if (c >= WHACK_QUESTIONS) later(win, 1200)
      else later(() => startQuestion(queue.slice(1)), 1200)
      return
    }
    const left = hearts - 1
    setHearts(left)
    if (left <= 0) later(() => setPhase('done'), 1500)
    else later(() => startQuestion([...queue.slice(1), queue[0]]), 1700)
  }

  function win() {
    setMoles([])
    setPhase('win')
    playSfx('trophy')
    setShowConfetti(true)
  }

  function swing(e: React.PointerEvent) {
    const box = fieldRef.current?.getBoundingClientRect()
    if (!box) return
    setHammer({ id: Date.now(), x: e.clientX - box.left, y: e.clientY - box.top })
  }

  function whack(mole: Mole, e: React.PointerEvent) {
    if (phase !== 'play' || mole.state !== 'up') return
    swing(e)
    buzz()
    if (mole.word.word === current.target.word) {
      playSfx('whack')
      later(playCorrectSound, 180)
      speakWord(current.target.word, { rate: 0.85 })
      setMoles((ms) => ms.map((m) => (m.id === mole.id ? { ...m, state: 'hit' } : m.state === 'up' ? { ...m, state: 'down' } : m)))
      if (!missed.current.has(current.target.word)) recordAnswer(level, topic.id, current.target, true)
      endQuestion(true)
    } else {
      playSfx('boing')
      markMissed()
      setMoles((ms) => ms.map((m) => (m.id === mole.id ? { ...m, state: 'tease' } : m)))
      later(() => hide(mole.id), 1100)
      const left = hearts - 1
      setHearts(left)
      if (left <= 0) { setPhase('between'); later(() => setPhase('done'), 1300) }
    }
  }

  const restart = () => {
    timers.current.forEach(clearTimeout)
    timers.current.clear()
    missed.current = new Set()
    recorded.current = false
    setCorrect(0)
    setHearts(WHACK_HEARTS)
    setWrongWords([])
    setShowConfetti(false)
    setQueue(buildWhackQuestions(topic.words))
    setMoles([])
    setPhase('ready')
  }

  const heartsLost = WHACK_HEARTS - hearts
  const scorePct = whackScorePct(correct, heartsLost)
  const exit = () => router.push(backUrl)

  if (phase === 'done') {
    return (
      <div className="flex flex-col min-h-screen">
        {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
        <GameHeader colorCls={HEADER} title="🔨 Đập Chuột Chũi" subtitle={topic.name} onBack={exit} />
        <div className="flex-1 bg-gradient-to-b from-lime-50 to-green-50 flex flex-col items-center justify-center px-4 py-8">
          <GameResultScreen
            score={scorePct} total={100} xpEarned={correct} stars={starsFor(scorePct)} wrongWords={wrongWords}
            scoreLine={correct >= WHACK_QUESTIONS ? `Đập trúng cả ${WHACK_QUESTIONS} câu!` : `Đập trúng ${correct}/${WHACK_QUESTIONS} câu`}
            extra={<>{'❤️'.repeat(hearts)}{'🤍'.repeat(heartsLost)} · đập nhầm/hết giờ {heartsLost} lần<br />Giữ đủ tim để được 3 sao!</>}
            onRestart={restart} onExit={exit}
          />
        </div>
      </div>
    )
  }

  const byHole = new Map(moles.map((m) => [m.hole, m]))

  return (
    <div className="flex flex-col min-h-screen">
      <style>{`
        @keyframes wmUp { 0% { transform: translateY(105%) } 70% { transform: translateY(-6%) } 100% { transform: translateY(0) } }
        @keyframes wmSwing { 0% { transform: translate(-30%,-80%) rotate(-50deg); opacity: 1 } 60% { transform: translate(-30%,-60%) rotate(25deg); opacity: 1 } 100% { transform: translate(-30%,-60%) rotate(25deg); opacity: 0 } }
        @keyframes wmStars { 0% { transform: translateY(4px) scale(.6); opacity: 0 } 30% { opacity: 1 } 100% { transform: translateY(-14px) scale(1.15); opacity: 0 } }
        @keyframes wmDance { 0%,100% { transform: translateY(0) rotate(-6deg) } 50% { transform: translateY(-12px) rotate(6deg) } }
        @keyframes wmGlow { 0%,100% { transform: scale(1) rotate(-8deg); filter: drop-shadow(0 0 6px #facc15) } 50% { transform: scale(1.12) rotate(8deg); filter: drop-shadow(0 0 18px #facc15) } }
        .wm-up { animation: wmUp .26s ease-out }
        .wm-swing { animation: wmSwing .35s ease-out forwards }
        .wm-stars { animation: wmStars .8s ease-out forwards }
        .wm-dance { animation: wmDance .6s ease-in-out infinite }
        .wm-glow { animation: wmGlow 1.2s ease-in-out infinite }
      `}</style>
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
      <GameHeader
        colorCls={HEADER} title="🔨 Đập Chuột Chũi" subtitle={topic.name} onBack={exit}
        right={<>{correct}/{WHACK_QUESTIONS}</>}
        timer={phase === 'play' || phase === 'between'
          ? { pct: (Math.max(0, secondsLeft) / WHACK_SECONDS) * 100, secondsLeft: Math.max(0, secondsLeft), urgent: secondsLeft <= 4 }
          : undefined}
      />

      <div className="flex-1 bg-gradient-to-b from-sky-200 via-sky-100 to-lime-200 px-4 py-4">
        <div className="mx-auto max-w-xl space-y-3">
          {phase === 'ready' && (
            <div className="rounded-3xl border-b-[5px] border-amber-800 bg-amber-100 p-5 text-center">
              <div className="flex justify-center gap-2">
                <Critter kind="hamster" mood="up" className="h-20 w-20" />
                <Critter kind="mole" mood="up" className="h-20 w-20" />
              </div>
              <h2 className="mt-2 text-xl font-bold text-amber-900">Đập chuột chũi!</h2>
              <p className="mt-1 text-sm font-semibold text-amber-800">
                Bảng gỗ hiện nghĩa tiếng Việt. Hamster và chuột chũi trồi lên cầm từ tiếng Anh. Đập trúng con cầm từ đúng nhé!
              </p>
              <p className="mt-2 text-sm font-bold text-amber-900">
                {WHACK_QUESTIONS} câu · {WHACK_SECONDS} giây mỗi câu · {'❤️'.repeat(WHACK_HEARTS)}
              </p>
              <PrimaryButton className="mt-4" onClick={() => { playSfx('ready'); startQuestion(queue) }}>Bắt đầu 🔨</PrimaryButton>
            </div>
          )}

          {phase === 'win' && (
            <div className="rounded-3xl border-b-[5px] border-amber-800 bg-amber-100 p-5 text-center">
              <div className="wm-glow mx-auto w-fit text-6xl" aria-hidden>🥕</div>
              <h2 className="mt-2 text-xl font-bold text-amber-900">Cà rốt vàng là của bé!</h2>
              <p className="mt-1 text-sm font-semibold text-amber-800">Cả xóm chuột chũi ra nhảy múa ăn mừng 🎉</p>
              <div className="mt-3 grid grid-cols-3 gap-1">
                {Array.from({ length: WHACK_HOLES }, (_, i) => (
                  <div key={i} className="wm-dance" style={{ animationDelay: `${i * 0.1}s` }}>
                    <Critter kind={i % 2 ? 'mole' : 'hamster'} mood="dance" className="mx-auto h-16 w-16" />
                  </div>
                ))}
              </div>
              <PrimaryButton tone="green" className="mt-4" onClick={() => setPhase('done')}>Xem kết quả ⭐</PrimaryButton>
            </div>
          )}

          {(phase === 'play' || phase === 'between') && current && (
            <>
              {/* Hearts + wooden sign with the Vietnamese meaning */}
              <div className="flex items-center justify-between px-1 text-xl" aria-label={`Còn ${hearts} tim`}>
                <span>{'❤️'.repeat(hearts)}{'🤍'.repeat(heartsLost)}</span>
                <span className="text-sm font-bold text-sky-900">Câu {correct + 1}/{WHACK_QUESTIONS}</span>
              </div>
              <div className="rounded-2xl border-b-[5px] border-amber-900 bg-amber-700 p-1.5">
                <div className="flex items-center gap-3 rounded-xl bg-amber-50 px-4 py-3">
                  <span className="text-4xl" aria-hidden>{current.target.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xl font-bold text-amber-950">{current.target.meaning}</p>
                    <p className="text-xs font-bold text-amber-700">
                      {reveal ? <>Hết giờ! Đáp án: <span className="text-emerald-700">{current.target.word}</span></> : 'Đập con cầm từ tiếng Anh đúng!'}
                    </p>
                  </div>
                </div>
              </div>
              <div role="alert" aria-live="assertive" className="sr-only">{reveal ? `Hết giờ. Đáp án là ${current.target.word}.` : ''}</div>

              {/* The field: 6 holes in the grass */}
              <div ref={fieldRef} onPointerDown={swing} style={{ cursor: HAMMER_CURSOR }}
                className="relative grid select-none grid-cols-2 gap-x-3 rounded-3xl border-b-[5px] border-green-700 bg-gradient-to-b from-lime-400 to-green-500 px-3 pb-2 pt-1 sm:grid-cols-3 touch-manipulation">
                {Array.from({ length: WHACK_HOLES }, (_, h) => {
                  const m = byHole.get(h)
                  return (
                    <div key={h} className="relative h-[128px]">
                      <div className="absolute inset-x-3 bottom-2 h-9 rounded-[50%] border-4 border-amber-700 bg-amber-950" />
                      <div className="absolute inset-x-0 bottom-[22px] top-0 overflow-hidden">
                        {m && (
                          <button key={m.id} type="button" onPointerDown={(e) => { e.stopPropagation(); whack(m, e) }}
                            aria-label={m.word.word} disabled={m.state !== 'up'}
                            style={{ transform: m.state === 'down' ? 'translateY(105%)' : undefined, cursor: HAMMER_CURSOR }}
                            className="wm-up absolute inset-x-0 bottom-0 flex flex-col items-center transition-transform duration-200">
                            <span className={`mb-0.5 max-w-full truncate rounded-lg border-b-[3px] px-2 py-0.5 text-sm font-bold shadow-sm ${
                              m.state === 'hit' ? 'border-emerald-700 bg-emerald-500 text-white'
                              : m.state === 'tease' ? 'border-red-600 bg-red-400 text-white'
                              : 'border-slate-300 bg-white text-slate-800'}`}>
                              {m.word.word}
                            </span>
                            {m.state === 'tease' && (
                              <span className="absolute left-1/2 top-7 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-white/95 px-1.5 text-[11px] font-bold text-red-600 shadow">
                                = {m.word.meaning}
                              </span>
                            )}
                            {m.state === 'hit' && <span className="wm-stars absolute top-6 text-2xl" aria-hidden>💫⭐</span>}
                            <Critter kind={m.kind} mood={m.state === 'hit' ? 'dizzy' : m.state === 'tease' ? 'tease' : 'up'} className="h-[74px] w-[74px]" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
                {hammer && (
                  <span key={hammer.id} className="wm-swing pointer-events-none absolute z-20 text-5xl"
                    style={{ left: hammer.x, top: hammer.y, transformOrigin: '80% 80%' }}
                    onAnimationEnd={() => setHammer(null)} aria-hidden>🔨</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
