'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useGameSync } from '@/lib/GameSyncContext'
import { playSfx, playCorrectSound, playWrongSound } from '@/lib/gameSound'
import { speak as speakWord } from '@/lib/speak'
import { starsFor } from '@/lib/topicMastery'
import {
  buildFishQuestions, fishScorePct, fishSwimSeconds,
  FISH_QUESTIONS, FISH_HEARTS, FISH_SECONDS, type ArcadeWord, type FishQuestion,
} from '@/lib/arcadeGames'
import Confetti from '@/components/Confetti'
import GameResultScreen from '@/components/GameResultScreen'
import { buzz } from '@/components/ChunkyUI'
import { ArcadeStage, StageHud, TimerDial, StageModal, StageButton, enterFullscreen } from '@/components/games/ArcadeStage'
import { Sea, Fish, Boat, Hook, FISH_COLORS, SURFACE } from '@/components/games/FishScene'

type Topic = { id: string; name: string; emoji: string; color: string; words: ArcadeWord[] }
type Props = { topic: Topic; level: string; backUrl: string }
type Phase = 'ready' | 'play' | 'between' | 'win' | 'done'
type Swimmer = { word: ArcadeWord; color: number; lane: number; dir: 1 | -1; dur: number; delay: number }

// Four depths, top to bottom; the fish keep to their lane and swim edge to edge.
const LANES = [
  'top-[43%] portrait:top-[47%] [@media(max-height:500px)]:top-[50%]', 'top-[56%] portrait:top-[59%] [@media(max-height:500px)]:top-[62%]',
  'top-[69%] portrait:top-[71%] [@media(max-height:500px)]:top-[74%]', 'top-[82%] portrait:top-[83%] [@media(max-height:500px)]:top-[86%]',
]
const BOAT_MS = 300
const DROP_MS = 450
const UP_MS = 550
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))
const shuffle = <T,>(a: T[]) => [...a].sort(() => Math.random() - 0.5)

function makeSchool(q: FishQuestion, level: string): Swimmer[] {
  const swim = fishSwimSeconds(level)
  const lanes = shuffle([0, 1, 2, 3])
  const colors = shuffle(FISH_COLORS.map((_, i) => i))
  // Start every fish already on screen, spread across the width (a negative delay jumps into the
  // swim: 0.25 of the way ≈ 8% from the left edge … 0.77 ≈ 75%).
  const spots = shuffle([0.25, 0.42, 0.6, 0.77])
  return q.choices.map((word, i) => {
    const dur = swim * (0.85 + Math.random() * 0.3)
    return { word, color: colors[i], lane: lanes[i], dir: lanes[i] % 2 ? -1 : 1, dur, delay: -spots[i] * dur }
  })
}

export default function FishingGame({ topic, level, backUrl }: Props) {
  const router = useRouter()
  const { recordAnswer, recordActivity, addScore, recordGameResult, flush } = useGameSync()

  const [queue, setQueue] = useState<FishQuestion[]>(() => buildFishQuestions(topic.words))
  const [school, setSchool] = useState<Swimmer[]>([])
  const [phase, setPhase] = useState<Phase>('ready')
  const [round, setRound] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [hearts, setHearts] = useState(FISH_HEARTS)
  const [secondsLeft, setSecondsLeft] = useState(FISH_SECONDS)
  const [reveal, setReveal] = useState(false)
  const [tease, setTease] = useState<string | null>(null)   // "= meaning" of a wrong fish
  const [wrongWords, setWrongWords] = useState<string[]>([])
  const [caught, setCaught] = useState<{ word: string; color: number }[]>([])
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [boatX, setBoatX] = useState<number | null>(null)
  const [hookY, setHookY] = useState<number | null>(null)
  const [hooked, setHooked] = useState<number | null>(null)  // index in `school` on the hook
  const [showConfetti, setShowConfetti] = useState(false)

  const stageRef = useRef<HTMLDivElement>(null)
  const fishRefs = useRef<(HTMLDivElement | null)[]>([])
  const casting = useRef(false)
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

  // Stage geometry (boat, line and hook are placed in pixels).
  useEffect(() => {
    const measure = () => { const r = stageRef.current?.getBoundingClientRect(); if (r) setSize({ w: r.width, h: r.height }) }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])
  const { w, h } = size
  const surfaceY = h * (h > w ? SURFACE.tall : h <= 500 ? SURFACE.short : SURFACE.wide)
  const boatW = clamp(0.3 * Math.min(w, h), 130, 200)
  const boatH = boatW / 2
  const rodTipY = surfaceY - 0.93 * boatH
  const hookRestY = surfaceY + 0.2 * boatH
  const bx = boatX ?? w / 2
  const hy = hookY ?? hookRestY

  // Per-question countdown.
  useEffect(() => {
    if (phase !== 'play') return
    const t = setInterval(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [phase, round])

  useEffect(() => {
    if (phase === 'play' && secondsLeft <= 0 && !casting.current) {
      playWrongSound()
      markMissed()
      setReveal(true)
      setPhase('between') // stops the clock while the answer is shown
      later(() => speakWord(current.target.word, { rate: 0.85 }), 350)
      loseHeart(() => startQuestion([...queue.slice(1), queue[0]]), 1900)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft])

  // Listening questions: say the word shortly after the new fish appear.
  useEffect(() => {
    if (phase !== 'play' || !current || current.kind !== 'listen') return
    const t = setTimeout(() => speakWord(current.target.word, { rate: 0.85 }), 500)
    return () => clearTimeout(t)
  }, [phase, round, current])

  const scorePct = fishScorePct(correct, FISH_HEARTS - hearts)
  useEffect(() => {
    if ((phase !== 'win' && phase !== 'done') || recorded.current) return
    recorded.current = true
    recordActivity(level)
    addScore(level, correct) // 🟢 recognition tier — 1x XP (see FAQ "XP theo độ khó")
    recordGameResult(level, topic.id, 'fishing', scorePct, 100)
    flush()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  function markMissed() {
    const word = current.target.word
    if (missed.current.has(word)) return
    missed.current.add(word)
    recordAnswer(level, topic.id, current.target, false)
    setWrongWords((ww) => [...ww, word])
  }

  function startQuestion(q: FishQuestion[]) {
    setQueue(q)
    setSchool(makeSchool(q[0], level))
    fishRefs.current = []
    setSecondsLeft(FISH_SECONDS)
    setReveal(false)
    setTease(null)
    setHooked(null)
    setHookY(null)
    casting.current = false
    setRound((r) => r + 1)
    setPhase('play')
  }

  /** −1 heart; out of hearts ends the game, otherwise `then` runs after `ms`. */
  function loseHeart(then: () => void, ms: number) {
    const left = hearts - 1
    setHearts(left)
    if (left <= 0) { setPhase('between'); later(() => setPhase('done'), 1400) }
    else later(then, ms)
  }

  // Tap the sea: the boat slides over, the hook drops to that depth, and whatever fish is under the
  // hook when it lands gets caught (the fish keep swimming, so tap where the right one is going).
  function cast(e: React.PointerEvent) {
    if (phase !== 'play' || casting.current) return
    const r = stageRef.current?.getBoundingClientRect()
    if (!r) return
    const edge = boatW / 2 + Math.min(0.1 * w, 110) // keep the boat clear of the HUD buttons
    const x = clamp(e.clientX - r.left, edge, w - edge)
    const y = e.clientY - r.top
    if (y < surfaceY + 10) return
    const depth = clamp(y, surfaceY + 30, h - 24)
    casting.current = true
    buzz()
    setBoatX(x)
    later(() => { playSfx('splash'); setHookY(depth) }, BOAT_MS)
    later(() => land(x, depth), BOAT_MS + DROP_MS)
  }

  function land(x: number, y: number) {
    const r = stageRef.current?.getBoundingClientRect()
    let best = -1
    let bestD = Infinity
    if (r) fishRefs.current.forEach((el, i) => {
      if (!el) return
      const b = el.getBoundingClientRect()
      const pad = 16
      const L = b.left - r.left - pad, R = b.right - r.left + pad, T = b.top - r.top - pad, B = b.bottom - r.top + pad
      if (x < L || x > R || y < T || y > B) return
      const d = Math.hypot((L + R) / 2 - x, (T + B) / 2 - y)
      if (d < bestD) { bestD = d; best = i }
    })
    if (best < 0) {
      // Empty cast: reel back in, no penalty.
      setHookY(null)
      later(() => { casting.current = false }, UP_MS)
      return
    }
    const fish = school[best]
    setHooked(best)
    playSfx('reel')
    setHookY(null)
    if (fish.word.word === current.target.word) {
      speakWord(fish.word.word, { rate: 0.85 })
      later(playCorrectSound, UP_MS)
      if (!missed.current.has(fish.word.word)) recordAnswer(level, topic.id, current.target, true)
      const c = correct + 1
      setCorrect(c)
      setCaught((cs) => [...cs, { word: fish.word.word, color: fish.color }])
      setPhase('between')
      later(() => (c >= FISH_QUESTIONS ? win() : startQuestion(queue.slice(1))), UP_MS + 900)
    } else {
      // Wrong fish: it wriggles off halfway up and swims on; −1 heart.
      later(() => { playSfx('boing'); setHooked(null); setTease(`${fish.word.word} = ${fish.word.meaning}`) }, UP_MS * 0.55)
      markMissed()
      loseHeart(() => { casting.current = false; setTease(null) }, 1300)
    }
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
    casting.current = false
    setCorrect(0)
    setHearts(FISH_HEARTS)
    setWrongWords([])
    setCaught([])
    setShowConfetti(false)
    setQueue(buildFishQuestions(topic.words))
    setSchool([])
    setHooked(null)
    setHookY(null)
    setBoatX(null)
    setPhase('ready')
  }
  const exit = () => router.push(backUrl)
  const heartRow = <>{'❤️'.repeat(hearts)}{'🤍'.repeat(FISH_HEARTS - hearts)}</>
  const hookedFish = hooked !== null ? school[hooked] : null

  return (
    <ArcadeStage>
      <style>{`
        @keyframes fsSwimR { from { left: -24% } to { left: 104% } }
        @keyframes fsSwimL { from { left: 104% } to { left: -24% } }
        @keyframes fsWiggle { 0%,100% { transform: rotate(-90deg) translateY(0) } 50% { transform: rotate(-80deg) translateY(-3px) } }
        @keyframes fsTank { 0%,100% { transform: translateX(0) } 50% { transform: translateX(var(--fs-swim)) } }
        .fs-wiggle { animation: fsWiggle .3s ease-in-out infinite }
      `}</style>
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}

      <div ref={stageRef} className="absolute inset-0" onPointerDown={playing ? cast : undefined}>
        <Sea />

        <StageHud
          tone="sea" onExit={exit}
          dial={playing ? <TimerDial tone="sea" pct={(Math.max(0, secondsLeft) / FISH_SECONDS) * 100} seconds={Math.max(0, secondsLeft)} urgent={secondsLeft <= 5} /> : undefined}
          cards={[
            { label: 'Tim', value: <span className="text-[clamp(16px,4vmin,40px)]">{heartRow}</span> },
            { label: 'Cá', value: `${correct}/${FISH_QUESTIONS}` },
          ]}
        />

        {/* The question on a buoy-coloured sign */}
        {playing && current && (
          <div className="pointer-events-none absolute inset-x-0 top-[4%] z-10 flex flex-col items-center px-4 portrait:top-[13%]">
            <div className="pointer-events-auto flex max-w-[60vw] items-center gap-3 rounded-full border-[5px] border-white bg-[#0369A1] px-6 py-2 text-white shadow-xl portrait:max-w-[92vw] sm:px-8 sm:py-3">
              {current.kind === 'vi'
                ? <><span className="text-[6.5vmin] leading-none" aria-hidden>{current.target.emoji}</span><span className="truncate text-[clamp(20px,4.8vmin,46px)] font-black">{current.target.meaning}</span></>
                : (
                  <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={() => { buzz(); speakWord(current.target.word, { rate: 0.85 }) }}
                    className="flex items-center gap-2 text-[clamp(20px,4.8vmin,46px)] font-black">
                    <span className="text-[6.5vmin] leading-none">🔊</span>{reveal || phase === 'between' ? current.target.word : 'Nghe lại'}
                  </button>
                )}
            </div>
            <p className="mt-2 rounded-full bg-white/85 px-3 py-0.5 text-center text-[clamp(13px,2.8vmin,26px)] font-bold text-sky-900">
              {tease ? <span className="text-red-600">{tease}</span>
                : reveal ? <>Hết giờ! Đáp án: <b className="text-emerald-700">{current.target.word}</b></>
                : current.kind === 'vi' ? 'Chạm vào chỗ con cá đúng để thả câu!' : 'Nghe rồi câu con cá mang từ đúng!'}
            </p>
          </div>
        )}

        {/* The fish of this question */}
        {playing && school.map((f, i) => (
          <div key={`${round}-${i}`} ref={(el) => { fishRefs.current[i] = el }}
            className={`pointer-events-none absolute w-[clamp(110px,20vmin,200px)] -translate-y-1/2 ${LANES[f.lane]}`}
            style={{
              animation: `${f.dir > 0 ? 'fsSwimR' : 'fsSwimL'} ${f.dur}s linear ${f.delay}s infinite`,
              visibility: hooked === i ? 'hidden' : undefined,
            }}>
            <Fish color={FISH_COLORS[f.color]} flip={f.dir < 0} className="w-full" />
            <span className={`absolute inset-x-[4%] top-1/2 -translate-y-1/2 truncate rounded-lg border-2 border-b-4 border-sky-900/30 bg-white/95 px-1 text-center font-black text-slate-800 ${
              f.word.word.length > 9 ? 'text-[clamp(12px,2.3vmin,22px)]' : 'text-[clamp(14px,3vmin,28px)]'}`}>
              {f.word.word}
            </span>
          </div>
        ))}

        {/* Boat, line and hook (with the caught fish hanging from it) */}
        {w > 0 && phase !== 'win' && (
          <>
            <div className="pointer-events-none absolute z-[5] transition-[left] ease-out"
              style={{ left: bx - boatW / 2, top: surfaceY - 0.7 * boatH, width: boatW, height: boatH, transitionDuration: `${BOAT_MS}ms` }}>
              <Boat className="h-full w-full" />
            </div>
            <div className="pointer-events-none absolute z-[4] w-[2px] bg-slate-700/70 transition-[left,height] ease-in-out"
              style={{ left: bx, top: rodTipY, height: hy - rodTipY, transitionDuration: `${BOAT_MS}ms, ${hookY === null ? UP_MS : DROP_MS}ms` }} />
            <div className="pointer-events-none absolute z-[6] -translate-x-1/2 transition-[left,top] ease-in-out"
              style={{ left: bx, top: hy, transitionDuration: `${BOAT_MS}ms, ${hookY === null ? UP_MS : DROP_MS}ms` }}>
              <Hook className="h-[clamp(18px,4vmin,34px)] w-auto" />
              {hookedFish && (
                // Square box centred under the hook; the fish inside hangs head-up and wriggles.
                <div className="absolute left-1/2 top-[55%] aspect-square w-[clamp(80px,15vmin,150px)] -translate-x-1/2">
                  <div className="fs-wiggle flex h-full w-full items-center justify-center">
                    <Fish color={FISH_COLORS[hookedFish.color]} className="w-full" />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Win: the aquarium */}
        {phase === 'win' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-sky-950/40 px-4">
            <p className="st-pop text-center text-[clamp(24px,6vmin,56px)] font-black text-white drop-shadow">🐠 Bể cá của bé đã đầy!</p>
            <div className="relative h-[min(46vh,320px)] w-[min(92vw,640px)] overflow-hidden rounded-[28px] border-[6px] border-sky-100 bg-gradient-to-b from-cyan-200 to-sky-500 shadow-2xl">
              <div className="absolute inset-x-0 bottom-0 h-[16%] bg-amber-200" />
              {caught.map((c, i) => (
                <div key={i} className="absolute w-[clamp(60px,12vmin,110px)]"
                  style={{ left: `${6 + (i % 4) * 22}%`, top: `${10 + Math.floor(i / 4) * 36}%`, animation: `fsTank ${3 + (i % 3)}s ease-in-out ${i * 0.3}s infinite`, ['--fs-swim' as string]: `${i % 2 ? -18 : 18}px` }}>
                  <Fish color={FISH_COLORS[c.color]} flip={i % 2 === 1} className="w-full" />
                  <span className="block text-center text-[clamp(11px,2.2vmin,18px)] font-black text-sky-950">{c.word}</span>
                </div>
              ))}
            </div>
            <StageButton tone="gold" onClick={() => setPhase('done')}>Xem kết quả ⭐</StageButton>
          </div>
        )}
      </div>

      {phase === 'ready' && (
        <StageModal tone="sea">
          <div className="flex justify-center [@media(max-height:500px)]:hidden"><Fish color={FISH_COLORS[0]} className="w-24" /><Fish color={FISH_COLORS[3]} flip className="w-24" /></div>
          <h2 className="mt-1 text-3xl font-black sm:text-4xl [@media(max-height:500px)]:text-2xl">🎣 Câu Cá</h2>
          <p className="mt-2 text-base font-semibold sm:text-lg [@media(max-height:500px)]:mt-1 [@media(max-height:500px)]:text-sm">
            Mỗi chú cá mang một từ tiếng Anh. Chạm vào chỗ con cá đúng — thuyền chạy tới và thả câu. Cá bơi liên tục, nhớ canh đúng lúc nhé!
          </p>
          <p className="mx-auto mt-3 w-fit rounded-2xl border-2 border-sky-300 bg-sky-100 px-4 py-2 text-sm font-bold sm:text-base [@media(max-height:500px)]:mt-2">
            {FISH_QUESTIONS} con cá · {FISH_SECONDS} giây mỗi con · <span className="whitespace-nowrap">{FISH_HEARTS} tim {'❤️'.repeat(FISH_HEARTS)}</span>
          </p>
          <StageButton tone="gold" onClick={() => { playSfx('ready'); enterFullscreen(); startQuestion(queue) }}>▶ Bắt đầu</StageButton>
        </StageModal>
      )}

      {phase === 'done' && (
        <StageModal tone="sea">
          {/* GameResultScreen is a fragment; its callers centre it */}
          <div className="flex flex-col items-center">
            <GameResultScreen
              score={scorePct} total={100} xpEarned={correct} stars={starsFor(scorePct)} wrongWords={wrongWords}
              scoreLine={correct >= FISH_QUESTIONS ? `Câu được cả ${FISH_QUESTIONS} con cá!` : `Câu được ${correct}/${FISH_QUESTIONS} con cá`}
              extra={<>{heartRow} · câu nhầm/hết giờ {FISH_HEARTS - hearts} lần<br />Giữ đủ tim để được 3 sao!</>}
              onRestart={restart} onExit={exit}
            />
          </div>
        </StageModal>
      )}
    </ArcadeStage>
  )
}
