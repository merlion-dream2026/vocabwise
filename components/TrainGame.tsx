'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useGameSync } from '@/lib/GameSyncContext'
import { playSfx, playCorrectSound } from '@/lib/gameSound'
import { speak as speakWord } from '@/lib/speak'
import { starsFor } from '@/lib/topicMastery'
import {
  buildTrainQuestions, trainScorePct, trainWordPts, TRAIN_HINT_AFTER, type ArcadeWord, type TrainQuestion,
} from '@/lib/arcadeGames'
import Confetti from '@/components/Confetti'
import GameResultScreen from '@/components/GameResultScreen'
import { buzz } from '@/components/ChunkyUI'
import WordIcon from '@/components/WordIcon'
import { ArcadeStage, StageHud, StageModal, StageButton, enterFullscreen } from '@/components/games/ArcadeStage'
import { Countryside, Locomotive, Wagon, Crate, RAIL_Y } from '@/components/games/TrainScene'
import { fitText } from '@/components/games/fitText'

type Topic = { id: string; name: string; emoji: string; color: string; words: ArcadeWord[] }
type Props = { topic: Topic; level: string; backUrl: string }
type Phase = 'ready' | 'arrive' | 'play' | 'depart' | 'win' | 'done'

const ARRIVE_MS = 900
const DEPART_MS = 1000
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

export default function TrainGame({ topic, level, backUrl }: Props) {
  const router = useRouter()
  const { recordAnswer, recordActivity, addScore, recordGameResult, flush } = useGameSync()

  const [questions, setQuestions] = useState<TrainQuestion[]>(() => buildTrainQuestions(topic.words))
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('ready')
  const [loaded, setLoaded] = useState(0)            // letters in the wagons
  const [used, setUsed] = useState<string[]>([])     // crate ids already loaded
  const [wrongCrate, setWrongCrate] = useState<string | null>(null)
  const [slips, setSlips] = useState<number[]>([])   // per finished word
  const [slipsNow, setSlipsNow] = useState(0)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [showConfetti, setShowConfetti] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const recorded = useRef(false)
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())

  const total = questions.length
  const q = questions[index]
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
  const railY = tall ? RAIL_Y.tall : short ? RAIL_Y.short : RAIL_Y.wide
  // Engine + wagons share the width; wagons shrink for long words (never below ~24px).
  const locoW = clamp(20 * vmin, 64, 150)
  const trainLeft = w * (short ? 0.1 : 0.025) // clear of the HUD button column on a landscape phone
  const gap = 4
  const wagonW = q ? clamp((w * 0.975 - trainLeft - locoW - gap * (q.letters.length + 1)) / q.letters.length, 22, 15 * vmin) : 40
  const crateSize = clamp((tall ? 18 : 12) * vmin, 48, 96)

  const scorePct = trainScorePct(slips, total)
  useEffect(() => {
    if ((phase !== 'win' && phase !== 'done') || recorded.current) return
    recorded.current = true
    recordActivity(level)
    addScore(level, Math.round(2 * slips.reduce((s, n) => s + trainWordPts(n), 0))) // 🔴 production tier — 2x XP
    recordGameResult(level, topic.id, 'train', scorePct, 100)
    flush()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const say = (word: string) => speakWord(word, { rate: 0.8 })

  function pullIn(i: number, list = questions) {
    setIndex(i)
    setLoaded(0)
    setUsed([])
    setSlipsNow(0)
    setWrongCrate(null)
    setPhase('arrive')
    playSfx('swoosh')
    later(() => { setPhase('play'); say(list[i].target.word) }, ARRIVE_MS)
  }

  function tapCrate(id: string, letter: string) {
    if (phase !== 'play' || used.includes(id) || wrongCrate) return
    buzz()
    if (letter !== q.letters[loaded]) {
      playSfx('bump')
      setSlipsNow((n) => n + 1)
      setWrongCrate(id)
      later(() => setWrongCrate(null), 450)
      return
    }
    playSfx('clunk')
    const n = loaded + 1
    setUsed((u) => [...u, id])
    setLoaded(n)
    if (n < q.letters.length) return
    // Word complete: toot, say it, roll out, next train in.
    const done = [...slips, slipsNow]
    setSlips(done)
    recordAnswer(level, topic.id, q.target, slipsNow === 0)
    playCorrectSound()
    later(() => say(q.target.word), 250)
    later(() => { setPhase('depart'); playSfx('launch') }, 1300)
    later(() => {
      if (index + 1 < total) pullIn(index + 1)
      else { setPhase('win'); playSfx('trophy'); setShowConfetti(true) }
    }, 1300 + DEPART_MS)
  }

  const restart = () => {
    timers.current.forEach(clearTimeout)
    timers.current.clear()
    recorded.current = false
    setSlips([])
    setShowConfetti(false)
    const list = buildTrainQuestions(topic.words)
    setQuestions(list)
    setIndex(0)
    setLoaded(0)
    setUsed([])
    setPhase('ready')
  }
  const exit = () => router.push(backUrl)

  // The crate that would be right next — it glows after a couple of slips on this word.
  const hintId = q && slipsNow >= TRAIN_HINT_AFTER
    ? q.crates.find((c) => !used.includes(c.id) && c.letter === q.letters[loaded])?.id : undefined
  const onLine = phase === 'arrive' || phase === 'play' || phase === 'depart'
  const trainAnim = phase === 'arrive' ? `trIn ${ARRIVE_MS}ms cubic-bezier(.2,.8,.3,1) both`
    : phase === 'depart' ? `trOut ${DEPART_MS}ms ease-in forwards` : 'trChug .5s ease-in-out infinite'

  return (
    <ArcadeStage>
      <style>{`
        @keyframes trIn { from { transform: translateX(-110vw) } to { transform: translateX(0) } }
        @keyframes trOut { from { transform: translateX(0) } to { transform: translateX(115vw) } }
        @keyframes trChug { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-1.5px) } }
        @keyframes trPuff { 0% { transform: translate(0,0) scale(.4); opacity: .9 } 100% { transform: translate(-30%,-160%) scale(1.5); opacity: 0 } }
        @keyframes trNext { 0%,100% { opacity: .55 } 50% { opacity: 1 } }
        @keyframes trDrop { 0% { transform: translateY(-120%) scale(.6); opacity: 0 } 70% { transform: translateY(6%) scale(1.08); opacity: 1 } 100% { transform: translateY(0) scale(1) } }
        @keyframes trHint { 0%,100% { transform: scale(1) } 50% { transform: scale(1.1) } }
        .tr-puff { animation: trPuff 1.1s ease-out infinite }
        .tr-next { animation: trNext 1s ease-in-out infinite }
        .tr-drop { animation: trDrop .35s ease-out both; display: inline-block }
        .tr-hint { animation: trHint .8s ease-in-out infinite }
      `}</style>
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}

      <div ref={stageRef} className="absolute inset-0">
        <Countryside railY={railY} />

        <StageHud tone="sky" onExit={exit} cards={[{ label: 'Chuyến', value: `${Math.min(index + (phase === 'win' || phase === 'done' ? 1 : phase === 'depart' ? 1 : 0), total)}/${total}` }]} />

        {/* The word board: picture + meaning, tap to hear the word */}
        {onLine && q && (
          <div className="absolute inset-x-0 top-[4%] z-10 flex justify-center px-4 portrait:top-[14%] [@media(max-height:500px)]:top-[3%]">
            <button type="button" onClick={() => say(q.target.word)}
              className="flex max-w-[62vw] items-center gap-3 rounded-2xl border-[5px] border-[#78350F] bg-[#FEF3C7] px-4 py-2 shadow-xl active:scale-95 portrait:max-w-[92vw] [@media(max-height:500px)]:py-1">
              <WordIcon word={q.target.word} emoji={q.target.emoji} emojiClass="text-[clamp(30px,8vmin,72px)] leading-none" iconSize={64} />
              <span className={`text-left font-black leading-tight text-[#451A03] ${fitText(q.target.meaning, ['text-[clamp(18px,4.6vmin,44px)]', 'text-[clamp(16px,3.8vmin,36px)]', 'text-[clamp(14px,3vmin,28px)]'])}`}>{q.target.meaning}</span>
              <span className="text-[clamp(22px,5vmin,48px)]" aria-label="Nghe từ">🔊</span>
            </button>
          </div>
        )}

        {/* The train on the line */}
        {onLine && q && w > 0 && (
          <div key={index} className="absolute flex items-end" style={{ left: trainLeft, top: h * railY - 0.4 * vmin, transform: 'translateY(-100%)', gap }}>
            <div className="flex items-end" style={{ gap, animation: trainAnim }}>
              {/* Wagons read left → right; the engine leads on the right. */}
              {q.letters.map((l, i) => (
                <Wagon key={i} letter={l} width={wagonW} filled={i < loaded} next={phase === 'play' && i === loaded} />
              ))}
              <Locomotive width={locoW} steaming={phase !== 'play'} />
            </div>
          </div>
        )}

        {/* Letter crates on the platform */}
        {phase === 'play' && q && w > 0 && (
          <div className="absolute inset-x-[3%] bottom-[4%] flex flex-wrap content-center items-center justify-center gap-[2vmin]" style={{ top: h * railY + 13 * vmin }}>
            {q.crates.map((c) => used.includes(c.id) ? <span key={c.id} style={{ width: crateSize, height: crateSize }} /> : (
              <Crate key={c.id} letter={c.letter} size={crateSize} onClick={() => tapCrate(c.id, c.letter)}
                state={wrongCrate === c.id ? 'wrong' : hintId === c.id ? 'hint' : 'idle'} />
            ))}
          </div>
        )}
        {phase === 'play' && q && (
          <p className="pointer-events-none absolute inset-x-0 z-10 text-center text-[clamp(13px,2.8vmin,26px)] font-bold text-white drop-shadow" style={{ top: h * railY + 6 * vmin }}>
            {slipsNow >= TRAIN_HINT_AFTER ? 'Gợi ý: thùng đang sáng là chữ tiếp theo 💡' : 'Chất chữ lên toa theo đúng thứ tự!'}
          </p>
        )}

        {/* Win: the engine with a full load of words */}
        {phase === 'win' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 px-4 text-center">
            <p className="st-pop text-[clamp(24px,6vmin,58px)] font-black text-[#451A03] drop-shadow-[0_2px_0_#fff]">🚂 Chở đủ {total} từ rồi!</p>
            <div className="flex max-w-[92vw] flex-wrap justify-center gap-2">
              {questions.map((x) => (
                <span key={x.target.word} className="rounded-xl border-b-4 border-[#92400E] bg-[#F59E0B] px-3 py-1 text-[clamp(14px,3vmin,26px)] font-black text-[#451A03]">{x.target.word}</span>
              ))}
            </div>
            <StageButton tone="gold" onClick={() => setPhase('done')}>Xem kết quả ⭐</StageButton>
          </div>
        )}
      </div>

      {phase === 'ready' && (
        <StageModal tone="sky">
          <div className="mx-auto flex justify-center [@media(max-height:500px)]:hidden"><Locomotive width={110} steaming /></div>
          <h2 className="mt-1 text-3xl font-black sm:text-4xl [@media(max-height:500px)]:text-2xl">🚂 Tàu Chở Chữ</h2>
          <p className="mt-2 text-base font-semibold sm:text-lg [@media(max-height:500px)]:mt-1 [@media(max-height:500px)]:text-sm">
            Xem hình, nghe từ rồi chạm vào các thùng chữ cái theo đúng thứ tự để chất lên toa. Chất đủ là tàu chạy!
          </p>
          <p className="mx-auto mt-3 w-fit rounded-2xl border-2 border-blue-300 bg-blue-100 px-4 py-2 text-sm font-bold sm:text-base [@media(max-height:500px)]:mt-2">
            {total} chuyến tàu · không giới hạn thời gian
          </p>
          <StageButton tone="gold" onClick={() => { playSfx('ready'); enterFullscreen(); pullIn(0) }}>▶ Khởi hành</StageButton>
        </StageModal>
      )}

      {phase === 'done' && (
        <StageModal tone="sky">
          <div className="flex flex-col items-center">
            <GameResultScreen
              score={scorePct} total={100} xpEarned={Math.round(2 * slips.reduce((s, n) => s + trainWordPts(n), 0))} stars={starsFor(scorePct)}
              wrongWords={questions.filter((_, i) => (slips[i] ?? 0) > 0).map((x) => x.target.word)}
              scoreLine={`Chở xong ${slips.length}/${total} từ`}
              extra={<>Chất nhầm {slips.reduce((s, n) => s + n, 0)} thùng<br />Đánh vần đúng ngay từ đầu để được 3 sao!</>}
              onRestart={restart} onExit={exit}
            />
          </div>
        </StageModal>
      )}
    </ArcadeStage>
  )
}
