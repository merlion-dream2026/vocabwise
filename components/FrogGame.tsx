'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useGameSync } from '@/lib/GameSyncContext'
import { playSfx, playCorrectSound } from '@/lib/gameSound'
import { speak as speakWord } from '@/lib/speak'
import { starsFor } from '@/lib/topicMastery'
import {
  buildFrogQuestions, frogScorePct, FROG_QUESTIONS, FROG_HEARTS, type ArcadeWord, type FrogQuestion,
} from '@/lib/arcadeGames'
import Confetti from '@/components/Confetti'
import GameResultScreen from '@/components/GameResultScreen'
import { buzz } from '@/components/ChunkyUI'
import { ArcadeStage, StageHud, StageModal, StageButton, enterFullscreen } from '@/components/games/ArcadeStage'
import { Pond, LilyPad, Frog, FarBank } from '@/components/games/FrogScene'

type Topic = { id: string; name: string; emoji: string; color: string; words: ArcadeWord[] }
type Props = { topic: Topic; level: string; backUrl: string }
type Phase = 'ready' | 'play' | 'between' | 'win' | 'done'
type Pt = { x: number; y: number }

const HOP_MS = 420
const GLIDE_MS = 520
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

export default function FrogGame({ topic, level, backUrl }: Props) {
  const router = useRouter()
  const { recordAnswer, recordActivity, addScore, recordGameResult, flush } = useGameSync()

  const [queue, setQueue] = useState<FrogQuestion[]>(() => buildFrogQuestions(topic.words))
  const [phase, setPhase] = useState<Phase>('ready')
  const [round, setRound] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [hearts, setHearts] = useState(FROG_HEARTS)
  const [result, setResult] = useState<{ pad: number; ok: boolean } | null>(null)
  const [tease, setTease] = useState<string | null>(null)
  const [wrongWords, setWrongWords] = useState<string[]>([])
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [showConfetti, setShowConfetti] = useState(false)
  // Where the frog is (null = on its home pad), how it moves there, and where its own pad sits.
  const [frogAt, setFrogAt] = useState<Pt | null>(null)
  const [frogMove, setFrogMove] = useState<'hop' | 'glide' | 'snap' | 'sink'>('snap')
  const [baseAt, setBaseAt] = useState<Pt | null>(null)
  const [rowVisible, setRowVisible] = useState(true)

  const stageRef = useRef<HTMLDivElement>(null)
  const correctRef = useRef(0)
  const heartsRef = useRef(FROG_HEARTS)
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
  const short = !tall && h <= 500
  const vmin = Math.min(w, h) / 100
  const padW = clamp(28 * vmin, 112, 230)
  const padH = padW * 2 / 3
  const frogW = padW * 0.62
  const frogH = frogW * 0.8
  const rowY = h * (tall ? 0.52 : short ? 0.58 : 0.54)
  const padX = (i: number) => w * (tall ? [0.18, 0.5, 0.82] : [0.3, 0.5, 0.7])[i]
  const home: Pt = { x: w / 2, y: h * (tall ? 0.78 : 0.85) }
  const frog = frogAt ?? home
  const base = baseAt ?? home

  const scorePct = frogScorePct(correct, FROG_HEARTS - hearts)
  useEffect(() => {
    if ((phase !== 'win' && phase !== 'done') || recorded.current) return
    recorded.current = true
    recordActivity(level)
    addScore(level, correct) // 🟢 recognition tier — 1x XP (see FAQ "XP theo độ khó")
    recordGameResult(level, topic.id, 'frog', scorePct, 100)
    flush()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const say = (word: string) => speakWord(word, { rate: 0.8 })

  function startQuestion(q: FrogQuestion[]) {
    setQueue(q)
    setResult(null)
    setTease(null)
    setRound((r) => r + 1)
    setRowVisible(true)
    setPhase('play')
    later(() => say(q[0].target.word), 350)
  }

  function hop(i: number) {
    if (phase !== 'play' || !current) return
    buzz()
    const ok = current.pads[i].word === current.target.word
    const to = { x: padX(i), y: rowY }
    setPhase('between')
    setResult({ pad: i, ok: false })
    setFrogMove('hop')
    setFrogAt(to)
    playSfx('boing')
    later(() => (ok ? landed(i, to) : sank(i)), HOP_MS)
  }

  // Right pad: the frog lands, then the pond scrolls — its pad glides down to the home spot while the
  // next three pads float in from the top.
  function landed(i: number, at: Pt) {
    setResult({ pad: i, ok: true })
    playCorrectSound()
    say(current.target.word)
    if (!missed.current.has(current.target.word)) recordAnswer(level, topic.id, current.target, true)
    correctRef.current += 1
    setCorrect(correctRef.current)
    const rest = queue.slice(1)
    later(() => {
      setRowVisible(false)
      setFrogMove('snap')
      setBaseAt(at)
      later(() => {
        setFrogMove('glide')
        setFrogAt(null)
        setBaseAt(null)
        if (rest.length) later(() => startQuestion(rest), 120)
        else later(win, GLIDE_MS)
      }, 40)
    }, 650)
  }

  // Wrong pad: it sinks, the frog splashes in and pops back up on its home pad; −1 heart, and the
  // word comes back at the end of the queue.
  function sank(i: number) {
    const target = current.target
    const hit = current.pads[i]
    setResult({ pad: i, ok: false })
    setFrogMove('sink')
    playSfx('splash')
    setTease(hit.word === target.word ? null : `${hit.word} = ${hit.meaning}`)
    later(() => say(target.word), 500)
    if (!missed.current.has(target.word)) {
      missed.current.add(target.word)
      recordAnswer(level, topic.id, target, false)
      setWrongWords((ww) => [...ww, target.word])
    }
    heartsRef.current -= 1
    const left = heartsRef.current
    setHearts(left)
    later(() => { setFrogMove('snap'); setFrogAt(null) }, 800)
    if (left <= 0) later(() => setPhase('done'), 1600)
    else later(() => startQuestion([...queue.slice(1), { ...current }]), 2000)
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
    heartsRef.current = FROG_HEARTS
    setCorrect(0)
    setHearts(FROG_HEARTS)
    setWrongWords([])
    setShowConfetti(false)
    setFrogAt(null)
    setBaseAt(null)
    setFrogMove('snap')
    setQueue(buildFrogQuestions(topic.words))
    setResult(null)
    setPhase('ready')
  }
  const exit = () => router.push(backUrl)
  const heartRow = <>{'❤️'.repeat(hearts)}{'🤍'.repeat(FROG_HEARTS - hearts)}</>
  const padTint = (i: number): 'right' | 'wrong' | 'hint' | undefined => {
    if (!result || phase !== 'between') return undefined
    if (i === result.pad) return result.ok ? 'right' : frogMove === 'hop' ? undefined : 'wrong'
    return !result.ok && frogMove !== 'hop' && current.pads[i].word === current.target.word ? 'hint' : undefined
  }
  const frogAnim = frogMove === 'hop' ? `fgHop ${HOP_MS}ms ease-out` : frogMove === 'sink' ? 'fgSink .8s ease-in forwards'
    : frogAt === null && frogMove === 'snap' && phase !== 'ready' ? 'fgPop .35s ease-out' : 'fgIdle 2.4s ease-in-out infinite'
  const moveMs = frogMove === 'hop' ? HOP_MS : frogMove === 'glide' ? GLIDE_MS : 0

  return (
    <ArcadeStage>
      <style>{`
        @keyframes fgHop { 0% { transform: translateY(0) scale(1) } 45% { transform: translateY(-34%) scale(1.18) } 100% { transform: translateY(0) scale(1) } }
        @keyframes fgSink { 0% { transform: translateY(0) scale(1); opacity: 1 } 100% { transform: translateY(30%) scale(.3); opacity: 0 } }
        @keyframes fgPop { 0% { transform: scale(.4); opacity: 0 } 100% { transform: scale(1); opacity: 1 } }
        @keyframes fgIdle { 0%,100% { transform: scaleY(1) } 50% { transform: scaleY(.94) } }
        @keyframes fgRowIn { 0% { transform: translateY(-40vh); opacity: 0 } 100% { transform: translateY(0); opacity: 1 } }
        @keyframes fgPadSink { 0% { transform: translate(-50%,-50%) scale(1) } 100% { transform: translate(-50%,-50%) scale(.55); opacity: .35 } }
        @keyframes fgArrive { 0% { transform: translate(-40vw, 30vh) scale(.6) } 60% { transform: translate(0, -6vmin) scale(1.1) } 100% { transform: translate(0,0) scale(1) } }
        @keyframes fgCheer { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
        .fg-arrive { animation: fgArrive 1.2s cubic-bezier(.3,1.2,.5,1) both }
        .fg-cheer { animation: fgCheer 1.3s ease-in-out infinite }
      `}</style>
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}

      <div ref={stageRef} className="absolute inset-0">
        <Pond />

        <StageHud
          tone="pond" onExit={exit}
          cards={[
            { label: 'Tim', value: <span className="text-[clamp(16px,4vmin,40px)]">{heartRow}</span> },
            { label: 'Lá sen', value: `${correct}/${FROG_QUESTIONS}` },
          ]}
        />

        {/* The question: tap to hear the word again */}
        {playing && current && (
          <div className="pointer-events-none absolute inset-x-0 top-[4%] z-10 flex flex-col items-center px-4 portrait:top-[13%]">
            <button type="button" onClick={() => say(current.target.word)} aria-label="Nghe lại"
              className="pointer-events-auto flex items-center gap-3 rounded-full border-[5px] border-white bg-[#15803D] px-6 py-2 text-white shadow-xl active:scale-95 sm:px-8 sm:py-3">
              <span className="text-[clamp(26px,6.5vmin,60px)] leading-none" aria-hidden>🔊</span>
              <span className="text-[clamp(20px,4.8vmin,46px)] font-black">Nghe lại</span>
            </button>
            <p className="mt-2 rounded-full bg-white/90 px-3 py-0.5 text-center text-[clamp(13px,2.8vmin,26px)] font-bold text-green-900">
              {tease ? <span className="text-red-600">Ối! {tease}</span>
                : result?.ok ? <span className="text-emerald-700">Giỏi quá! ✨ {current.target.word}</span>
                : current.kind === 'word' ? 'Nghe rồi nhảy tới lá có từ đúng!' : 'Nghe rồi nhảy tới lá có nghĩa đúng!'}
            </p>
          </div>
        )}

        {/* Three word pads ahead */}
        {playing && current && w > 0 && rowVisible && (
          <div key={round} className="absolute inset-0" style={{ animation: 'fgRowIn .5s ease-out both' }}>
            {current.pads.map((p, i) => {
              const tint = padTint(i)
              return (
                <button key={p.word} type="button" onClick={() => hop(i)} aria-label={current.kind === 'word' ? p.word : p.meaning}
                  className="absolute flex items-center justify-center"
                  style={{ left: padX(i), top: rowY, width: padW, height: padH, transform: 'translate(-50%,-50%)',
                    animation: tint === 'wrong' ? 'fgPadSink .8s ease-in forwards' : undefined }}>
                  <LilyPad tint={tint} className="absolute inset-0 h-full w-full drop-shadow-lg" />
                  <span className={`relative max-w-[88%] rounded-xl border-2 border-b-4 border-green-900/25 bg-white/95 px-1.5 py-0.5 text-center font-black leading-tight text-slate-800 ${
                    current.kind === 'word'
                      ? p.word.length > 9 ? 'text-[clamp(13px,2.6vmin,24px)]' : 'text-[clamp(15px,3.4vmin,30px)]'
                      : 'line-clamp-2 text-[clamp(12px,2.6vmin,24px)]'}`}>
                    {current.kind === 'word' ? p.word : <>{p.emoji} {p.meaning}</>}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* The frog's own pad and the frog */}
        {playing && w > 0 && (
          <>
            <div className="pointer-events-none absolute ease-in-out"
              style={{ left: base.x, top: base.y, width: padW, height: padH, transform: 'translate(-50%,-50%)',
                transition: frogMove === 'glide' ? `left ${GLIDE_MS}ms, top ${GLIDE_MS}ms` : 'none' }}>
              <LilyPad className="h-full w-full drop-shadow-lg" />
            </div>
            <div className="pointer-events-none absolute z-[5] ease-out"
              style={{ left: frog.x - frogW / 2, top: frog.y - frogH * 0.75, width: frogW, height: frogH,
                transition: moveMs ? `left ${moveMs}ms, top ${moveMs}ms` : 'none' }}>
              <div key={`${frogMove}-${frogAt ? 'out' : 'home'}`} className="h-full w-full origin-bottom" style={{ animation: frogAnim }}>
                <Frog className="h-full w-full drop-shadow-md" />
              </div>
            </div>
          </>
        )}

        {/* Win: the far bank, Rocky waiting */}
        {phase === 'win' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 px-4 text-center">
            <p className="st-pop text-[clamp(24px,6vmin,58px)] font-black text-white drop-shadow-[0_3px_0_#14532D]">🐸 Về tới bờ rồi!</p>
            <FarBank frogW={frogW} />
            <StageButton tone="gold" onClick={() => setPhase('done')}>Xem kết quả ⭐</StageButton>
          </div>
        )}
      </div>

      {phase === 'ready' && (
        <StageModal tone="pond">
          <div className="mx-auto w-24 [@media(max-height:500px)]:hidden"><Frog className="w-full" /></div>
          <h2 className="mt-1 text-3xl font-black sm:text-4xl [@media(max-height:500px)]:text-2xl">🐸 Ếch Nhảy Lá Sen</h2>
          <p className="mt-2 text-base font-semibold sm:text-lg [@media(max-height:500px)]:mt-1 [@media(max-height:500px)]:text-sm">
            Nghe từ tiếng Anh rồi chạm vào lá sen đúng để ếch nhảy qua. Nhảy nhầm là rơi tõm xuống nước! Bấm 🔊 để nghe lại.
          </p>
          <p className="mx-auto mt-3 w-fit rounded-2xl border-2 border-green-300 bg-green-100 px-4 py-2 text-sm font-bold sm:text-base [@media(max-height:500px)]:mt-2">
            {FROG_QUESTIONS} lá sen · <span className="whitespace-nowrap">{FROG_HEARTS} tim {'❤️'.repeat(FROG_HEARTS)}</span>
          </p>
          <StageButton tone="gold" onClick={() => { playSfx('ready'); enterFullscreen(); startQuestion(queue) }}>▶ Nhảy thôi</StageButton>
        </StageModal>
      )}

      {phase === 'done' && (
        <StageModal tone="pond">
          <div className="flex flex-col items-center">
            <GameResultScreen
              score={scorePct} total={100} xpEarned={correct} stars={starsFor(scorePct)} wrongWords={wrongWords}
              scoreLine={correct >= FROG_QUESTIONS ? `Nhảy qua cả ${FROG_QUESTIONS} lá sen!` : `Nhảy qua ${correct}/${FROG_QUESTIONS} lá sen`}
              extra={<>{heartRow} · nhảy nhầm {FROG_HEARTS - hearts} lần<br />Giữ đủ tim để được 3 sao!</>}
              onRestart={restart} onExit={exit}
            />
          </div>
        </StageModal>
      )}
    </ArcadeStage>
  )
}
