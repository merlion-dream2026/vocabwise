'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useGameSync } from '@/lib/GameSyncContext'
import { playSfx, playCorrectSound, playWrongSound } from '@/lib/gameSound'
import { speak as speakWord } from '@/lib/speak'
import { starsFor } from '@/lib/topicMastery'
import {
  buildWhackQuestions, nextWhackWord, whackPace, whackScorePct, questionCount,
  WHACK_QUESTIONS, WHACK_HEARTS, WHACK_SECONDS, WHACK_HOLES, type ArcadeWord, type WhackQuestion,
} from '@/lib/arcadeGames'
import Confetti from '@/components/Confetti'
import GameResultScreen from '@/components/GameResultScreen'
import { buzz } from '@/components/ChunkyUI'
import { Critter, type CritterKind } from '@/components/games/Critters'
import { ArcadeStage, StageHud, TimerDial, StageModal, StageButton, enterFullscreen } from '@/components/games/ArcadeStage'
import { Meadow, MoleHole } from '@/components/games/WhackScene'

type Topic = { id: string; name: string; emoji: string; color: string; words: ArcadeWord[] }
type Props = { topic: Topic; level: string; backUrl: string }

type MoleState = 'up' | 'hit' | 'tease' | 'down'
type Mole = { id: number; hole: number; word: ArcadeWord; kind: CritterKind; state: MoleState }
type Phase = 'ready' | 'play' | 'between' | 'win' | 'done'

// The hammer is drawn by the game, not a CSS cursor (browsers cap cursor images at a small size):
// with a mouse a big hammer follows the pointer (system cursor hidden) and swings on each click;
// on a touch screen it appears at the tap point, swings, and fades.
type Hammer = { x: number; y: number; mode: 'mouse' | 'touch'; hit: number }

export default function WhackGame({ topic, level, backUrl }: Props) {
  const router = useRouter()
  const { recordAnswer, recordActivity, addScore, recordGameResult, flush } = useGameSync()
  const pace = whackPace(level)

  const [queue, setQueue] = useState<WhackQuestion[]>(() => buildWhackQuestions(topic.words))
  const [phase, setPhase] = useState<Phase>('ready')
  const total = questionCount(topic.words, WHACK_QUESTIONS)
  const [round, setRound] = useState(0)              // bumps on every new question — restarts timers/spawner
  const [moles, setMoles] = useState<Mole[]>([])
  const [correct, setCorrect] = useState(0)
  const [hearts, setHearts] = useState(WHACK_HEARTS)
  const [secondsLeft, setSecondsLeft] = useState(WHACK_SECONDS)
  const [reveal, setReveal] = useState(false)          // time ran out: show the answer on the board
  const [wrongWords, setWrongWords] = useState<string[]>([])
  const [hammer, setHammer] = useState<Hammer | null>(null)
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
      later(() => speakWord(current.target.word, { rate: 0.85 }), 350) // say the answer shown on the sign
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
  // the back of the queue so the game still needs every question right.
  function endQuestion(solved: boolean) {
    setPhase('between')
    if (solved) {
      const c = correct + 1
      setCorrect(c)
      if (c >= total) later(win, 1200)
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

  const pointAt = (e: React.PointerEvent) => {
    const box = fieldRef.current?.getBoundingClientRect()
    return box ? { x: e.clientX - box.left, y: e.clientY - box.top } : null
  }
  function moveHammer(e: React.PointerEvent) {
    const p = e.pointerType === 'mouse' ? pointAt(e) : null
    if (p) setHammer((h) => ({ ...p, mode: 'mouse', hit: h?.hit ?? 0 }))
  }
  function swing(e: React.PointerEvent) {
    const p = pointAt(e)
    if (p) setHammer((h) => ({ ...p, mode: e.pointerType === 'mouse' ? 'mouse' : 'touch', hit: (h?.hit ?? 0) + 1 }))
  }

  function whack(mole: Mole) {
    if (phase !== 'play' || mole.state !== 'up') return
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
  const scorePct = whackScorePct(correct, heartsLost, total)
  const exit = () => router.push(backUrl)
  const playing = phase === 'play' || phase === 'between'
  const byHole = new Map(moles.map((m) => [m.hole, m]))
  const heartRow = <>{'❤️'.repeat(hearts)}{'🤍'.repeat(heartsLost)}</>

  return (
    <ArcadeStage>
      <style>{`
        @keyframes wmUp { 0% { transform: translateY(105%) } 70% { transform: translateY(-5%) } 100% { transform: translateY(0) } }
        /* The 🔨 glyph pivots on its handle end (85% 85%), which sits right of the pointer: raised = head up,
           hit = head swung down level with the pivot, i.e. right on the pointer. */
        @keyframes wmHit { 0% { transform: translate(0,-85%) rotate(10deg) } 40% { transform: translate(0,-85%) rotate(-45deg) } 100% { transform: translate(0,-85%) rotate(10deg) } }
        @keyframes wmTap { 0% { transform: translate(0,-85%) rotate(10deg); opacity: 1 } 45% { transform: translate(0,-85%) rotate(-45deg); opacity: 1 } 100% { transform: translate(0,-85%) rotate(-45deg); opacity: 0 } }
        @keyframes wmStars { 0% { transform: translateY(4px) scale(.6); opacity: 0 } 30% { opacity: 1 } 100% { transform: translateY(-18px) scale(1.2); opacity: 0 } }
        @keyframes wmDance { 0%,100% { transform: translateY(0) rotate(-6deg) } 50% { transform: translateY(-10%) rotate(6deg) } }
        @keyframes wmGlow { 0%,100% { transform: scale(1) rotate(-8deg); filter: drop-shadow(0 0 6px #facc15) } 50% { transform: scale(1.12) rotate(8deg); filter: drop-shadow(0 0 18px #facc15) } }
        .wm-up { animation: wmUp .26s ease-out }
        .wm-hit { animation: wmHit .28s ease-out }
        .wm-tap { animation: wmTap .4s ease-out forwards }
        .wm-stars { animation: wmStars .8s ease-out forwards }
        .wm-dance { animation: wmDance .6s ease-in-out infinite }
        .wm-glow { animation: wmGlow 1.2s ease-in-out infinite }
      `}</style>
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}

      <div ref={fieldRef} className="absolute inset-0" style={{ cursor: playing ? 'none' : undefined }}
        onPointerDown={playing ? swing : undefined} onPointerMove={playing ? moveHammer : undefined}
        onPointerLeave={(e) => { if (e.pointerType === 'mouse') setHammer(null) }}>
        <Meadow />

        <StageHud
          tone="wood" onExit={exit}
          dial={playing ? <TimerDial tone="wood" pct={(Math.max(0, secondsLeft) / WHACK_SECONDS) * 100} seconds={Math.max(0, secondsLeft)} urgent={secondsLeft <= 4} /> : undefined}
          cards={[{ label: 'Tim', value: <span className="text-[clamp(16px,4vmin,40px)]">{heartRow}</span> }, { label: 'Câu', value: `${Math.min(correct + (playing ? 1 : 0), total)}/${total}` }]}
        />

        {/* Wooden sign: the Vietnamese meaning to find (or the win banner) */}
        {(playing || phase === 'win') && current && (
          <div className="absolute inset-x-0 top-[5%] z-10 flex flex-col items-center px-4 portrait:top-[23%]">
            <div className="flex max-w-[92vw] items-center gap-3 rounded-full border-[5px] border-amber-300 bg-[#5B3A1E] px-6 py-2.5 text-[#FFF8E7] shadow-xl sm:px-9 sm:py-3.5">
              {phase === 'win'
                ? <><span className="wm-glow text-[7vmin] leading-none" aria-hidden>🥕</span><span className="text-[clamp(20px,4.6vmin,44px)] font-black">Cà rốt vàng là của bé!</span></>
                : <><span className="text-[7vmin] leading-none" aria-hidden>{current.target.emoji}</span><span className="truncate text-[clamp(22px,5vmin,48px)] font-black">{current.target.meaning}</span></>}
            </div>
            <p className="mt-2 rounded-full bg-white/80 px-3 py-0.5 text-[clamp(14px,3vmin,28px)] font-bold text-[#4A2C14]">
              {phase === 'win' ? 'Cả xóm chuột chũi ra nhảy múa ăn mừng 🎉'
                : reveal ? <>Hết giờ! Đáp án: <b className="text-emerald-700">{current.target.word}</b></>
                : 'Đập con cầm từ tiếng Anh đúng!'}
            </p>
            {phase === 'win' && <StageButton tone="wood" onClick={() => setPhase('done')}>Xem kết quả ⭐</StageButton>}
          </div>
        )}
        <div role="alert" aria-live="assertive" className="sr-only">{reveal && current ? `Hết giờ. Đáp án là ${current.target.word}.` : ''}</div>

        {/* 6 holes: 3×2 on a wide screen, 2×3 on a phone held upright */}
        <div className="absolute inset-x-[4%] bottom-[2%] top-[33%] grid grid-cols-3 grid-rows-2 gap-x-[4%] portrait:top-[39%] portrait:grid-cols-2 portrait:grid-rows-3 sm:inset-x-[10%]">
          {Array.from({ length: WHACK_HOLES }, (_, h) => {
            const m = byHole.get(h)
            return (
              <MoleHole key={h}>
                {phase === 'win' ? (
                  <div className="wm-dance aspect-square h-[88%]" style={{ animationDelay: `${h * 0.1}s` }}>
                    <Critter kind={h % 2 ? 'mole' : 'hamster'} mood="dance" className="h-full w-auto" />
                  </div>
                ) : m && (
                  <button key={m.id} type="button" onPointerDown={(e) => { e.stopPropagation(); if (playing) swing(e); whack(m) }}
                    // aria-disabled, not disabled: a disabled button swallows the tap, so the hammer wouldn't swing
                    aria-label={m.word.word} aria-disabled={m.state !== 'up'}
                    style={{ transform: m.state === 'down' ? 'translateY(105%)' : undefined, cursor: 'none' }}
                    className="wm-up relative aspect-square h-[88%] max-w-full transition-transform duration-200">
                    <Critter kind={m.kind} mood={m.state === 'hit' ? 'dizzy' : m.state === 'tease' ? 'tease' : 'up'} className="h-full w-auto" />
                    {/* the word sign held in front of the belly */}
                    <span className={`absolute inset-x-[-6%] bottom-[6%] truncate rounded-xl border-[3px] border-b-[5px] px-1 py-0.5 text-center text-[clamp(17px,3.8vmin,36px)] font-black shadow-md ${
                      m.state === 'hit' ? 'border-emerald-800 bg-emerald-500 text-white'
                      : m.state === 'tease' ? 'border-red-700 bg-red-400 text-white'
                      : 'border-[#5B3A1E] bg-[#FFF8E7] text-[#3A2410]'}`}>
                      {m.word.word}
                    </span>
                    {m.state === 'tease' && (
                      <span className="absolute left-1/2 top-[2%] z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-white/95 px-2 text-[clamp(13px,2.8vmin,26px)] font-bold text-red-600 shadow">
                        = {m.word.meaning}
                      </span>
                    )}
                    {m.state === 'hit' && <span className="wm-stars absolute inset-x-0 top-0 text-center text-[5vmin]" aria-hidden>💫⭐</span>}
                  </button>
                )}
              </MoleHole>
            )
          })}
        </div>

        {playing && hammer && (
          <span className="pointer-events-none absolute z-20" style={{ left: hammer.x, top: hammer.y }} aria-hidden>
            <span key={hammer.hit} style={{ transformOrigin: '85% 85%', transform: 'translate(0,-85%) rotate(10deg)' }}
              className={`block text-[clamp(72px,17vmin,180px)] leading-none drop-shadow-[0_6px_6px_rgba(0,0,0,.25)] ${
                hammer.mode === 'touch' ? 'wm-tap' : hammer.hit ? 'wm-hit' : ''}`}
              onAnimationEnd={hammer.mode === 'touch' ? () => setHammer(null) : undefined}>🔨</span>
          </span>
        )}
      </div>

      {phase === 'ready' && (
        <StageModal tone="wood">
          <div className="flex justify-center gap-1 [@media(max-height:500px)]:hidden">
            <Critter kind="hamster" mood="up" className="h-20 w-20" />
            <Critter kind="mole" mood="up" className="h-20 w-20" />
          </div>
          <h2 className="mt-2 text-3xl font-black sm:text-4xl [@media(max-height:500px)]:mt-0 [@media(max-height:500px)]:text-2xl">🔨 Đập Chuột Chũi</h2>
          <p className="mt-2 text-base font-semibold sm:text-lg [@media(max-height:500px)]:mt-1 [@media(max-height:500px)]:text-sm">
            Bảng gỗ hiện nghĩa tiếng Việt. Hamster và chuột chũi trồi lên cầm từ tiếng Anh. Đập trúng con cầm từ đúng nhé!
          </p>
          <p className="mx-auto mt-3 w-fit rounded-2xl border-2 border-amber-300 [@media(max-height:500px)]:mt-2 bg-amber-100 px-4 py-2 text-sm font-bold sm:text-base">
            {total} câu · {WHACK_SECONDS} giây mỗi câu · <span className="whitespace-nowrap">{WHACK_HEARTS} tim {'❤️'.repeat(WHACK_HEARTS)}</span>
          </p>
          <StageButton tone="wood" onClick={() => { playSfx('ready'); enterFullscreen(); startQuestion(queue) }}>▶ Bắt đầu</StageButton>
        </StageModal>
      )}

      {phase === 'done' && (
        <StageModal tone="wood">
          {/* GameResultScreen is a fragment; its callers centre it */}
          <div className="flex flex-col items-center">
            <GameResultScreen
              score={scorePct} total={100} xpEarned={correct} stars={starsFor(scorePct)} wrongWords={wrongWords}
              scoreLine={correct >= total ? `Đập trúng cả ${total} câu!` : `Đập trúng ${correct}/${total} câu`}
              extra={<>{heartRow} · đập nhầm/hết giờ {heartsLost} lần<br />Giữ đủ tim để được 3 sao!</>}
              onRestart={restart} onExit={exit}
            />
          </div>
        </StageModal>
      )}
    </ArcadeStage>
  )
}
