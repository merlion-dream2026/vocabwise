'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useGameSync } from '@/lib/GameSyncContext'
import { playSfx, playCorrectSound } from '@/lib/gameSound'
import { speak as speakWord } from '@/lib/speak'
import { starsFor } from '@/lib/topicMastery'
import {
  buildBasketQuestions, basketScorePct, basketFallSeconds, freeLane,
  BASKET_QUESTIONS, BASKET_HEARTS, BASKET_SECONDS, type ArcadeWord, type FishQuestion,
} from '@/lib/arcadeGames'
import Confetti from '@/components/Confetti'
import GameResultScreen from '@/components/GameResultScreen'
import { buzz } from '@/components/ChunkyUI'
import { ArcadeStage, StageHud, TimerDial, StageModal, StageButton, enterFullscreen } from '@/components/games/ArcadeStage'
import { Orchard, WordApple, Basket, APPLE_COLORS } from '@/components/games/BasketScene'

type Topic = { id: string; name: string; emoji: string; color: string; words: ArcadeWord[] }
type Props = { topic: Topic; level: string; backUrl: string }
type Phase = 'ready' | 'play' | 'between' | 'win' | 'done'
type Apple = { choice: number; lane: number; y: number }

const LANES = 4
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

export default function BasketGame({ topic, level, backUrl }: Props) {
  const router = useRouter()
  const { recordAnswer, recordActivity, addScore, recordGameResult, flush } = useGameSync()
  const fall = basketFallSeconds(level)

  const [queue, setQueue] = useState<FishQuestion[]>(() => buildBasketQuestions(topic.words))
  const [phase, setPhase] = useState<Phase>('ready')
  const [round, setRound] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [hearts, setHearts] = useState(BASKET_HEARTS)
  const [caught, setCaught] = useState<{ choice: number; ok: boolean } | null>(null)
  const [tease, setTease] = useState<string | null>(null)
  const [wrongWords, setWrongWords] = useState<string[]>([])
  const [timeLeft, setTimeLeft] = useState(BASKET_SECONDS)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [basketX, setBasketX] = useState<number | null>(null)
  const [, setFrame] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)

  const stageRef = useRef<HTMLDivElement>(null)
  const apples = useRef<Apple[]>([])
  const basketRef = useRef(0)
  const pressed = useRef(false)
  const correctRef = useRef(0)
  const heartsRef = useRef(BASKET_HEARTS)
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
  const vmin = Math.min(w, h) / 100
  const appleW = clamp(22 * vmin, 84, 160)
  const basketW = clamp(28 * vmin, 112, 230)
  const basketH = basketW * 0.5
  const groundY = h * 0.92
  const basketTop = groundY - basketH
  const laneX = (i: number) => w * (0.14 + (i * 0.72) / (LANES - 1))
  const bx = basketX ?? w / 2
  basketRef.current = bx

  const scorePct = basketScorePct(correct, BASKET_HEARTS - hearts)
  useEffect(() => {
    if ((phase !== 'win' && phase !== 'done') || recorded.current) return
    recorded.current = true
    recordActivity(level)
    addScore(level, correct) // 🟢 recognition tier — 1x XP (see FAQ "XP theo độ khó")
    recordGameResult(level, topic.id, 'basket', scorePct, 100)
    flush()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const say = (word: string) => speakWord(word, { rate: 0.85 })

  function startQuestion(q: FishQuestion[]) {
    setQueue(q)
    setCaught(null)
    setTease(null)
    setTimeLeft(BASKET_SECONDS)
    setRound((r) => r + 1)
    // Apples drop one after another, each in its own lane; the first is already on its way so all
    // four are on screen within a couple of seconds.
    const order = [0, 1, 2, 3].sort(() => Math.random() - 0.5)
    const gapY = (groundY + appleW) / LANES
    apples.current = q[0].choices.map((_, i) => ({ choice: i, lane: order[i], y: h * 0.12 - i * gapY * 0.6 }))
    setPhase('play')
    if (q[0].kind === 'listen') later(() => say(q[0].target.word), 300)
  }

  // The falling loop: move apples, re-drop the ones that hit the grass, catch the one over the basket.
  useEffect(() => {
    if (phase !== 'play' || !w) return
    const speed = (groundY + appleW) / fall
    let last = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      for (const a of apples.current) {
        a.y += speed * dt
        const bottom = a.y + appleW * 0.92
        if (bottom >= basketTop + basketH * 0.1 && bottom <= basketTop + basketH * 0.75 && Math.abs(laneX(a.lane) - basketRef.current) < basketW * 0.5) {
          setFrame((f) => f + 1)
          catchApple(a.choice)
          return
        }
        if (a.y > groundY) {
          a.y = -appleW
          a.lane = freeLane(LANES, apples.current.filter((o) => o !== a && o.y < h * 0.35).map((o) => o.lane))
        }
      }
      setFrame((f) => f + 1)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, round, w, h])

  // Per-question clock.
  useEffect(() => {
    if (phase !== 'play') return
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [phase, round])
  useEffect(() => {
    if (phase === 'play' && timeLeft <= 0) miss(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase])

  function catchApple(choice: number) {
    const q = queue
    if (q[0].choices[choice].word === q[0].target.word) {
      setCaught({ choice, ok: true })
      setPhase('between')
      playCorrectSound()
      say(q[0].target.word)
      if (!missed.current.has(q[0].target.word)) recordAnswer(level, topic.id, q[0].target, true)
      correctRef.current += 1
      setCorrect(correctRef.current)
      later(() => (q.length <= 1 ? win() : startQuestion(q.slice(1))), 1300)
    } else miss(choice)
  }

  // A wrong apple (choice) or the clock running out (null): −1 heart, the word comes back later.
  function miss(choice: number | null) {
    const q = queue
    const target = q[0].target
    setCaught(choice === null ? null : { choice, ok: false })
    setPhase('between')
    playSfx('bump')
    buzz()
    setTease(choice === null ? `Hết giờ! Đáp án: ${target.word}` : `${q[0].choices[choice].word} = ${q[0].choices[choice].meaning}`)
    later(() => say(target.word), 400)
    if (!missed.current.has(target.word)) {
      missed.current.add(target.word)
      recordAnswer(level, topic.id, target, false)
      setWrongWords((ww) => [...ww, target.word])
    }
    heartsRef.current -= 1
    setHearts(heartsRef.current)
    if (heartsRef.current <= 0) later(() => setPhase('done'), 1600)
    else later(() => startQuestion([...q.slice(1), { ...q[0] }]), 2000)
  }

  function win() {
    setPhase('win')
    playSfx('trophy')
    setShowConfetti(true)
  }

  // Steering: the basket follows the finger / mouse; ← → (or A D) on a keyboard.
  const steer = (clientX: number) => {
    const left = stageRef.current?.getBoundingClientRect().left ?? 0
    setBasketX(clamp(clientX - left, basketW * 0.85, w - basketW / 2)) // room for Rocky on the left
  }
  useEffect(() => {
    if (!playing) return
    const onKey = (e: KeyboardEvent) => {
      const d = e.key === 'ArrowLeft' || e.key === 'a' ? -1 : e.key === 'ArrowRight' || e.key === 'd' ? 1 : 0
      if (!d) return
      e.preventDefault()
      setBasketX(clamp(basketRef.current + d * w * 0.08, basketW * 0.85, w - basketW / 2))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playing, w, basketW])

  const restart = () => {
    timers.current.forEach(clearTimeout)
    timers.current.clear()
    missed.current = new Set()
    recorded.current = false
    correctRef.current = 0
    heartsRef.current = BASKET_HEARTS
    setCorrect(0)
    setHearts(BASKET_HEARTS)
    setWrongWords([])
    setShowConfetti(false)
    setBasketX(null)
    setQueue(buildBasketQuestions(topic.words))
    setPhase('ready')
  }
  const exit = () => router.push(backUrl)
  const heartRow = <>{'❤️'.repeat(hearts)}{'🤍'.repeat(BASKET_HEARTS - hearts)}</>

  return (
    <ArcadeStage>
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
      <div ref={stageRef} className="absolute inset-0 touch-none"
        onPointerDown={(e) => { if (!playing) return; pressed.current = true; steer(e.clientX) }}
        onPointerMove={(e) => { if (playing && (e.pointerType === 'mouse' || pressed.current)) steer(e.clientX) }}
        onPointerUp={() => { pressed.current = false }} onPointerCancel={() => { pressed.current = false }}>
        <Orchard />

        {/* Falling word apples (behind the sign and HUD) */}
        {playing && current && w > 0 && apples.current.map((a) => {
          const c = current.choices[a.choice]
          const state = caught?.choice === a.choice ? (caught.ok ? 'right' : 'wrong') : 'idle'
          return (
            <div key={a.choice} data-word={c.word} className="pointer-events-none absolute"
              style={{ left: laneX(a.lane) - appleW / 2, top: a.y, width: appleW, height: appleW }}>
              <WordApple word={c.word} color={APPLE_COLORS[(a.choice + round) % APPLE_COLORS.length]} state={state} />
            </div>
          )
        })}

        <StageHud
          tone="sky" onExit={exit}
          dial={playing ? <TimerDial tone="sky" icon="🍎" pct={(Math.max(0, timeLeft) / BASKET_SECONDS) * 100} seconds={Math.max(0, timeLeft)} urgent={phase === 'play' && timeLeft <= 5} /> : undefined}
          cards={[
            { label: 'Tim', value: <span className="text-[clamp(16px,4vmin,40px)]">{heartRow}</span> },
            { label: 'Táo', value: `${correct}/${BASKET_QUESTIONS}` },
          ]}
        />

        {/* The sign: meaning + picture, or a speaker for listening questions */}
        {playing && current && (
          <div className="pointer-events-none absolute inset-x-0 top-[4%] z-10 flex flex-col items-center px-4 portrait:top-[13%]">
            {current.kind === 'vi' ? (
              <div className="flex max-w-[60vw] items-center gap-3 rounded-full border-[5px] border-white bg-[#B45309] px-6 py-2 text-white shadow-xl portrait:max-w-[92vw]">
                <span className="text-[6.5vmin] leading-none" aria-hidden>{current.target.emoji}</span>
                <span className="truncate text-[clamp(20px,4.8vmin,46px)] font-black">{current.target.meaning}</span>
              </div>
            ) : (
              <button type="button" onClick={() => say(current.target.word)} onPointerDown={(e) => e.stopPropagation()}
                className="pointer-events-auto flex items-center gap-3 rounded-full border-[5px] border-white bg-[#B45309] px-6 py-2 text-white shadow-xl active:scale-95">
                <span className="text-[6.5vmin] leading-none" aria-hidden>🔊</span>
                <span className="text-[clamp(20px,4.8vmin,46px)] font-black">Nghe lại</span>
              </button>
            )}
            <p className="mt-2 rounded-full bg-white/90 px-3 py-0.5 text-center text-[clamp(13px,2.8vmin,26px)] font-bold text-amber-900">
              {tease ? <span className="text-red-600">Ối! {tease}</span>
                : caught?.ok ? <span className="text-emerald-700">Giỏi quá! ✨ {current.target.word}</span>
                : 'Kéo giỏ hứng quả táo có từ đúng!'}
            </p>
          </div>
        )}

        {/* The basket */}
        {playing && w > 0 && (
          <div className="pointer-events-none absolute z-[5]" style={{ left: bx - basketW / 2, top: basketTop, width: basketW, height: basketH }}>
            <Basket className="h-full w-full" />
          </div>
        )}

        {phase === 'win' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 px-4 text-center">
            <p className="st-pop text-[clamp(24px,6vmin,58px)] font-black text-white drop-shadow-[0_3px_0_#92400E]">🧺 Đầy giỏ táo rồi!</p>
            <div className="flex flex-wrap justify-center gap-1 text-[8vmin]" aria-hidden>{'🍎'.repeat(BASKET_QUESTIONS)}</div>
            <StageButton tone="gold" onClick={() => setPhase('done')}>Xem kết quả ⭐</StageButton>
          </div>
        )}
      </div>

      {phase === 'ready' && (
        <StageModal tone="wood">
          <div className="mx-auto h-16 w-28 [@media(max-height:500px)]:hidden"><Basket className="h-full w-full" /></div>
          <h2 className="mt-1 text-3xl font-black sm:text-4xl [@media(max-height:500px)]:text-2xl">🧺 Hứng Táo Chữ</h2>
          <p className="mt-2 text-base font-semibold sm:text-lg [@media(max-height:500px)]:mt-1 [@media(max-height:500px)]:text-sm">
            Táo mang từ tiếng Anh rơi từ trên cây. Kéo giỏ qua lại (máy tính: di chuột hoặc phím ← →) để hứng quả có từ đúng, né quả sai!
          </p>
          <p className="mx-auto mt-3 w-fit rounded-2xl border-2 border-amber-300 bg-amber-100 px-4 py-2 text-sm font-bold sm:text-base [@media(max-height:500px)]:mt-2">
            {BASKET_QUESTIONS} quả táo · <span className="whitespace-nowrap">{BASKET_HEARTS} tim {'❤️'.repeat(BASKET_HEARTS)}</span>
          </p>
          <StageButton tone="gold" onClick={() => { playSfx('ready'); enterFullscreen(); startQuestion(queue) }}>▶ Bắt đầu hứng</StageButton>
        </StageModal>
      )}

      {phase === 'done' && (
        <StageModal tone="wood">
          <div className="flex flex-col items-center">
            <GameResultScreen
              score={scorePct} total={100} xpEarned={correct} stars={starsFor(scorePct)} wrongWords={wrongWords}
              scoreLine={correct >= BASKET_QUESTIONS ? `Hứng đủ ${BASKET_QUESTIONS} quả táo!` : `Hứng được ${correct}/${BASKET_QUESTIONS} quả táo`}
              extra={<>{heartRow} · hứng nhầm {BASKET_HEARTS - hearts} lần<br />Giữ đủ tim để được 3 sao!</>}
              onRestart={restart} onExit={exit}
            />
          </div>
        </StageModal>
      )}
    </ArcadeStage>
  )
}
