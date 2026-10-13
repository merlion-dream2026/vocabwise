'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useGameSync } from '@/lib/GameSyncContext'
import { playSfx, playCorrectSound } from '@/lib/gameSound'
import { speak as speakWord } from '@/lib/speak'
import { starsFor } from '@/lib/topicMastery'
import {
  buildPlaneQuestions, planeScorePct, planeFlySeconds,
  PLANE_QUESTIONS, PLANE_HEARTS, PLANE_LANES, type ArcadeWord, type PlaneQuestion,
} from '@/lib/arcadeGames'
import Confetti from '@/components/Confetti'
import GameResultScreen from '@/components/GameResultScreen'
import { buzz } from '@/components/ChunkyUI'
import { ArcadeStage, StageHud, TimerDial, StageModal, StageButton, enterFullscreen } from '@/components/games/ArcadeStage'
import { FlyingSky, Plane, WordCloud } from '@/components/games/PlaneScene'

type Topic = { id: string; name: string; emoji: string; color: string; words: ArcadeWord[] }
type Props = { topic: Topic; level: string; backUrl: string }
type Phase = 'ready' | 'play' | 'between' | 'win' | 'done'

// Lane centres as a fraction of the stage height (wide screen / upright phone).
const LANE_Y = { wide: [0.33, 0.56, 0.79], tall: [0.4, 0.6, 0.8], short: [0.43, 0.64, 0.85] } // short = landscape phone
const LANDMARKS = [
  { emoji: '🗼', place: 'Paris' }, { emoji: '🗽', place: 'New York' }, { emoji: '🏯', place: 'Tokyo' },
  { emoji: '🎡', place: 'London' }, { emoji: '🏝️', place: 'Phú Quốc' }, { emoji: '🌉', place: 'San Francisco' },
]
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

export default function PlaneGame({ topic, level, backUrl }: Props) {
  const router = useRouter()
  const { recordAnswer, recordActivity, addScore, recordGameResult, flush } = useGameSync()
  const fly = planeFlySeconds(level)

  const [queue, setQueue] = useState<PlaneQuestion[]>(() => buildPlaneQuestions(topic.words))
  const [phase, setPhase] = useState<Phase>('ready')
  const [round, setRound] = useState(0)
  const [lane, setLane] = useState(1)
  const [correct, setCorrect] = useState(0)
  const [hearts, setHearts] = useState(PLANE_HEARTS)
  const [result, setResult] = useState<{ lane: number; ok: boolean } | null>(null)
  const [tease, setTease] = useState<string | null>(null)
  const [wrongWords, setWrongWords] = useState<string[]>([])
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [toArrive, setToArrive] = useState(0) // seconds until the clouds reach the plane
  const [showConfetti, setShowConfetti] = useState(false)
  const [landmark] = useState(() => LANDMARKS[Math.floor(Math.random() * LANDMARKS.length)])

  const stageRef = useRef<HTMLDivElement>(null)
  const laneRef = useRef(1)
  const pressed = useRef(false)
  const arriveAt = useRef(0)
  // Questions chain through timers, so the resolver reads score and hearts from refs (a closure
  // from an earlier render would see stale state).
  const correctRef = useRef(0)
  const heartsRef = useRef(PLANE_HEARTS)
  const missed = useRef(new Set<string>())
  const recorded = useRef(false)
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())

  const current = queue[0]
  const playing = phase === 'play' || phase === 'between'
  const later = (fn: () => void, ms: number) => {
    const t = setTimeout(() => { timers.current.delete(t); fn() }, ms)
    timers.current.add(t)
  }
  useEffect(() => () => { timers.current.forEach(clearTimeout) }, [])

  useEffect(() => {
    const measure = () => { const r = stageRef.current?.getBoundingClientRect(); if (r) setSize({ w: r.width, h: r.height }) }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
  const { w, h } = size
  const tall = h > w
  const vmin = Math.min(w, h) / 100
  const planeW = clamp(22 * vmin, 110, 220)
  const planeH = planeW * 90 / 160
  const planeLeft = (tall ? 0.02 : 0.04) * w
  const cloudW = clamp(26 * vmin, 130, 250)
  const cloudH = cloudW * 0.62
  const laneY = (i: number) => h * (tall ? LANE_Y.tall : h <= 500 ? LANE_Y.short : LANE_Y.wide)[i]

  // Steering: the lane nearest to the pointer / finger; ↑ ↓ (or W S) on a keyboard.
  const steer = (y: number) => {
    let best = 0
    for (let i = 1; i < PLANE_LANES; i++) if (Math.abs(laneY(i) - y) < Math.abs(laneY(best) - y)) best = i
    if (best !== laneRef.current) { laneRef.current = best; setLane(best) }
  }
  const pointerY = (e: React.PointerEvent) => e.clientY - (stageRef.current?.getBoundingClientRect().top ?? 0)
  useEffect(() => {
    if (!playing) return
    const onKey = (e: KeyboardEvent) => {
      const d = e.key === 'ArrowUp' || e.key === 'w' ? -1 : e.key === 'ArrowDown' || e.key === 's' ? 1 : 0
      if (!d) return
      e.preventDefault()
      const next = clamp(laneRef.current + d, 0, PLANE_LANES - 1)
      laneRef.current = next
      setLane(next)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playing])

  // Countdown on the dial: seconds until the clouds arrive.
  useEffect(() => {
    if (phase !== 'play') return
    const t = setInterval(() => setToArrive(Math.max(0, (arriveAt.current - Date.now()) / 1000)), 200)
    return () => clearInterval(t)
  }, [phase, round])

  const scorePct = planeScorePct(correct, PLANE_HEARTS - hearts)
  useEffect(() => {
    if ((phase !== 'win' && phase !== 'done') || recorded.current) return
    recorded.current = true
    recordActivity(level)
    addScore(level, correct) // 🟢 recognition tier — 1x XP (see FAQ "XP theo độ khó")
    recordGameResult(level, topic.id, 'plane', scorePct, 100)
    flush()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // The clouds fly from the right edge (left: 100%) to off the left (left: -30%) in `fly` seconds;
  // they meet the plane when a cloud's centre reaches the plane's nose.
  function startQuestion(q: PlaneQuestion[]) {
    setQueue(q)
    setResult(null)
    setTease(null)
    setRound((r) => r + 1)
    setPhase('play')
    const nose = planeLeft + planeW * 0.8
    const hitMs = Math.max(800, ((w + cloudW / 2 - nose) / (1.3 * w)) * fly * 1000)
    arriveAt.current = Date.now() + hitMs
    setToArrive(hitMs / 1000)
    later(() => resolve(q), hitMs)
  }

  function resolve(q: PlaneQuestion[]) {
    const pick = laneRef.current
    const target = q[0].target
    const ok = q[0].lanes[pick].word === target.word
    setResult({ lane: pick, ok })
    setPhase('between')
    if (ok) {
      playSfx('swoosh')
      later(playCorrectSound, 120)
      speakWord(target.word, { rate: 0.85 })
      if (!missed.current.has(target.word)) recordAnswer(level, topic.id, target, true)
      correctRef.current += 1
      setCorrect(correctRef.current)
      later(() => (q.length <= 1 ? win() : startQuestion(q.slice(1))), 1300)
      return
    }
    // Wrong cloud: bump, show the right one, −1 heart, and the question comes back later.
    playSfx('bump')
    buzz()
    const hit = q[0].lanes[pick]
    setTease(`${hit.word} = ${hit.meaning}`)
    later(() => speakWord(target.word, { rate: 0.85 }), 400)
    if (!missed.current.has(target.word)) {
      missed.current.add(target.word)
      recordAnswer(level, topic.id, target, false)
      setWrongWords((ww) => [...ww, target.word])
    }
    heartsRef.current -= 1
    const left = heartsRef.current
    setHearts(left)
    if (left <= 0) later(() => setPhase('done'), 1500)
    else later(() => startQuestion([...q.slice(1), { ...q[0] }]), 1900)
  }

  function win() {
    setPhase('win')
    playSfx('trophy')
    setShowConfetti(true)
  }

  const restart = () => {
    timers.current.forEach(clearTimeout)
    timers.current.clear()
    missed.current = new Set()
    recorded.current = false
    correctRef.current = 0
    heartsRef.current = PLANE_HEARTS
    setCorrect(0)
    setHearts(PLANE_HEARTS)
    setWrongWords([])
    setShowConfetti(false)
    setQueue(buildPlaneQuestions(topic.words))
    setResult(null)
    setPhase('ready')
  }
  const exit = () => router.push(backUrl)
  const heartRow = <>{'❤️'.repeat(hearts)}{'🤍'.repeat(PLANE_HEARTS - hearts)}</>
  const cloudState = (i: number): 'idle' | 'right' | 'wrong' | 'hint' => {
    if (!result) return 'idle'
    if (i === result.lane) return result.ok ? 'right' : 'wrong'
    return !result.ok && current.lanes[i].word === current.target.word ? 'hint' : 'idle'
  }

  return (
    <ArcadeStage>
      <style>{`
        @keyframes psFly { from { left: 100% } to { left: -30% } }
        @keyframes psBob { 0%,100% { transform: translateY(-50%) rotate(-2deg) } 50% { transform: translateY(calc(-50% - 6px)) rotate(2deg) } }
        @keyframes psBump { 0%,100% { transform: translateY(-50%) rotate(0) } 25% { transform: translateY(-50%) rotate(-12deg) } 75% { transform: translateY(-50%) rotate(8deg) } }
        @keyframes psLand { from { transform: translate(-60vw, -30vh) rotate(8deg) } to { transform: translate(0, 0) rotate(0) } }
        @keyframes psProp { 0%,100% { transform: scaleY(1) } 50% { transform: scaleY(.2) } }
        .ps-prop { animation: psProp .12s linear infinite; transform-origin: 158px 46px }
      `}</style>
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}

      <div ref={stageRef} className="absolute inset-0 touch-none"
        onPointerDown={(e) => { if (!playing) return; pressed.current = true; steer(pointerY(e)) }}
        onPointerMove={(e) => { if (playing && (e.pointerType === 'mouse' || pressed.current)) steer(pointerY(e)) }}
        onPointerUp={() => { pressed.current = false }} onPointerCancel={() => { pressed.current = false }}>
        <FlyingSky />

        <StageHud
          tone="sky" onExit={exit}
          dial={playing ? <TimerDial tone="sky" icon="☁️" pct={(toArrive / fly) * 100} seconds={Math.ceil(toArrive)} urgent={phase === 'play' && toArrive <= 1.5} /> : undefined}
          cards={[
            { label: 'Tim', value: <span className="text-[clamp(16px,4vmin,40px)]">{heartRow}</span> },
            { label: 'Mây', value: `${correct}/${PLANE_QUESTIONS}` },
          ]}
        />

        {/* The question */}
        {playing && current && (
          <div className="pointer-events-none absolute inset-x-0 top-[4%] z-10 flex flex-col items-center px-4 portrait:top-[13%]">
            <div className="flex max-w-[60vw] items-center gap-3 rounded-full border-[5px] border-white bg-[#1D4ED8] px-6 py-2 text-white shadow-xl portrait:max-w-[92vw] sm:px-8 sm:py-3">
              <span className="text-[6.5vmin] leading-none" aria-hidden>{current.target.emoji}</span>
              <span className="truncate text-[clamp(20px,4.8vmin,46px)] font-black">{current.target.meaning}</span>
            </div>
            <p className="mt-2 rounded-full bg-white/85 px-3 py-0.5 text-center text-[clamp(13px,2.8vmin,26px)] font-bold text-blue-900">
              {tease ? <span className="text-red-600">Ối! {tease}</span>
                : result?.ok ? <span className="text-emerald-700">Giỏi quá! ✨</span>
                : 'Lái máy bay vào đám mây có từ đúng!'}
            </p>
          </div>
        )}

        {/* Lane guides */}
        {playing && w > 0 && [0, 1, 2].map((i) => (
          <div key={i} className={`pointer-events-none absolute left-0 right-0 border-t-[3px] border-dashed ${i === lane ? 'border-white/80' : 'border-white/35'}`} style={{ top: laneY(i) }} />
        ))}

        {/* The three word clouds flying in */}
        {playing && current && w > 0 && (
          <div key={round} className="pointer-events-none absolute inset-y-0" style={{ width: cloudW, animation: `psFly ${fly}s linear forwards` }}>
            {current.lanes.map((c, i) => (
              <div key={c.word} className="absolute left-0 -translate-y-1/2" style={{ top: laneY(i), width: cloudW, height: cloudH }}>
                <WordCloud word={c.word} state={cloudState(i)} />
              </div>
            ))}
          </div>
        )}

        {/* The plane */}
        {playing && w > 0 && (
          <div className="pointer-events-none absolute z-[5] transition-[top] duration-200 ease-out"
            style={{ left: planeLeft, top: laneY(lane), width: planeW, height: planeH, animation: result && !result.ok ? 'psBump .45s ease-in-out' : 'psBob 1.4s ease-in-out infinite' }}>
            <Plane className="h-full w-full" />
          </div>
        )}

        {/* Win: landing at a landmark */}
        {phase === 'win' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 px-4 text-center">
            <p className="st-pop text-[clamp(24px,6vmin,58px)] font-black text-blue-900 drop-shadow-[0_2px_0_#fff]">✈️ Đã hạ cánh ở {landmark.place}!</p>
            <div className="relative flex items-end gap-4">
              <span className="text-[24vmin] leading-none drop-shadow-xl" aria-hidden>{landmark.emoji}</span>
              <div style={{ width: planeW, height: planeH, animation: 'psLand 1.6s cubic-bezier(.2,.8,.3,1) both' }}><Plane className="h-full w-full" /></div>
            </div>
            <StageButton tone="gold" onClick={() => setPhase('done')}>Xem kết quả ⭐</StageButton>
          </div>
        )}
      </div>

      {phase === 'ready' && (
        <StageModal tone="sky">
          <div className="mx-auto h-16 w-28 [@media(max-height:500px)]:hidden"><Plane className="h-full w-full" /></div>
          <h2 className="mt-1 text-3xl font-black sm:text-4xl [@media(max-height:500px)]:text-2xl">✈️ Máy Bay Qua Mây</h2>
          <p className="mt-2 text-base font-semibold sm:text-lg [@media(max-height:500px)]:mt-1 [@media(max-height:500px)]:text-sm">
            Ba đám mây bay tới, mỗi đám mang một từ tiếng Anh. Chạm hoặc kéo lên/xuống (máy tính: di chuột hoặc phím ↑ ↓) để lái máy bay vào đám mây đúng!
          </p>
          <p className="mx-auto mt-3 w-fit rounded-2xl border-2 border-blue-300 bg-blue-100 px-4 py-2 text-sm font-bold sm:text-base [@media(max-height:500px)]:mt-2">
            {PLANE_QUESTIONS} đám mây · <span className="whitespace-nowrap">{PLANE_HEARTS} tim {'❤️'.repeat(PLANE_HEARTS)}</span>
          </p>
          <StageButton tone="gold" onClick={() => { playSfx('ready'); enterFullscreen(); startQuestion(queue) }}>▶ Cất cánh</StageButton>
        </StageModal>
      )}

      {phase === 'done' && (
        <StageModal tone="sky">
          {/* GameResultScreen is a fragment; its callers centre it */}
          <div className="flex flex-col items-center">
            <GameResultScreen
              score={scorePct} total={100} xpEarned={correct} stars={starsFor(scorePct)} wrongWords={wrongWords}
              scoreLine={correct >= PLANE_QUESTIONS ? `Bay qua cả ${PLANE_QUESTIONS} đám mây!` : `Bay qua ${correct}/${PLANE_QUESTIONS} đám mây`}
              extra={<>{heartRow} · lái nhầm {PLANE_HEARTS - hearts} lần<br />Giữ đủ tim để được 3 sao!</>}
              onRestart={restart} onExit={exit}
            />
          </div>
        </StageModal>
      )}
    </ArcadeStage>
  )
}
