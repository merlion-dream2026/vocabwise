'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useGameSync } from '@/lib/GameSyncContext'
import { playSfx, playCorrectSound, playWrongSound } from '@/lib/gameSound'
import { speak as speakWord } from '@/lib/speak'
import { starsFor } from '@/lib/topicMastery'
import { mascotCutSrc } from '@/lib/mascots'
import {
  buildTreasureQuestions, treasureScorePct, TREASURE_HEARTS, type ArcadeWord, type TreasureQuestion,
} from '@/lib/arcadeGames'
import Confetti from '@/components/Confetti'
import GameResultScreen from '@/components/GameResultScreen'
import { buzz } from '@/components/ChunkyUI'
import WordIcon from '@/components/WordIcon'
import { ArcadeStage, StageHud, StageModal, StageButton, enterFullscreen } from '@/components/games/ArcadeStage'
import { SeaBackdrop, TreasureMap, LetterStone, TRAIL } from '@/components/games/TreasureScene'

type Topic = { id: string; name: string; emoji: string; color: string; words: ArcadeWord[] }
type Props = { topic: Topic; level: string; backUrl: string }
type Phase = 'ready' | 'play' | 'between' | 'win' | 'done'

export default function TreasureGame({ topic, level, backUrl }: Props) {
  const router = useRouter()
  const { recordAnswer, recordActivity, addScore, recordGameResult, flush } = useGameSync()

  const [queue, setQueue] = useState<TreasureQuestion[]>(() => buildTreasureQuestions(topic.words))
  const [total, setTotal] = useState(() => queue.length)
  const [phase, setPhase] = useState<Phase>('ready')
  const [correct, setCorrect] = useState(0)
  const [hearts, setHearts] = useState(TREASURE_HEARTS)
  const [picked, setPicked] = useState<string | null>(null)
  const [wrongWords, setWrongWords] = useState<string[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const missed = useRef(new Set<string>())
  const recorded = useRef(false)
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())

  const q = queue[0]
  const later = (fn: () => void, ms: number) => {
    const t = setTimeout(() => { timers.current.delete(t); fn() }, ms)
    timers.current.add(t)
  }
  useEffect(() => () => { timers.current.forEach(clearTimeout) }, [])

  const scorePct = treasureScorePct(correct, TREASURE_HEARTS - hearts, total)
  useEffect(() => {
    if ((phase !== 'win' && phase !== 'done') || recorded.current) return
    recorded.current = true
    recordActivity(level)
    addScore(level, correct * 2) // 🔴 production tier — 2x XP (like Điền chữ thiếu)
    recordGameResult(level, topic.id, 'treasure', scorePct, 100)
    flush()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const say = (word: string) => speakWord(word, { rate: 0.85 })
  // Read each new word out — hearing it is what tells the vowel apart.
  useEffect(() => {
    if (phase !== 'play' || !q) return
    const t = setTimeout(() => say(q.target.word), 400)
    return () => clearTimeout(t)
  }, [phase, q])

  function pick(letter: string) {
    if (phase !== 'play' || !q) return
    buzz()
    setPicked(letter)
    setPhase('between')
    if (letter === q.answer) {
      playCorrectSound()
      later(() => say(q.target.word), 200)
      if (!missed.current.has(q.target.word)) recordAnswer(level, topic.id, q.target, true)
      const c = correct + 1
      later(() => { setCorrect(c); playSfx('swoosh') }, 500) // Rocky walks to the next X
      later(() => {
        setPicked(null)
        if (c >= total) { setPhase('win'); playSfx('trophy'); setShowConfetti(true) }
        else { setQueue((list) => list.slice(1)); setPhase('play') }
      }, 1700)
      return
    }
    playWrongSound()
    if (!missed.current.has(q.target.word)) {
      missed.current.add(q.target.word)
      recordAnswer(level, topic.id, q.target, false)
      setWrongWords((ww) => [...ww, q.target.word])
    }
    const left = hearts - 1
    setHearts(left)
    later(() => say(q.target.word), 600)
    if (left <= 0) later(() => setPhase('done'), 2000)
    else later(() => { setPicked(null); setQueue((list) => [...list.slice(1), { ...list[0] }]); setPhase('play') }, 2200)
  }

  const restart = () => {
    timers.current.forEach(clearTimeout)
    timers.current.clear()
    missed.current = new Set()
    recorded.current = false
    const list = buildTreasureQuestions(topic.words)
    setQueue(list)
    setTotal(list.length)
    setCorrect(0)
    setHearts(TREASURE_HEARTS)
    setPicked(null)
    setWrongWords([])
    setShowConfetti(false)
    setPhase('ready')
  }
  const exit = () => router.push(backUrl)
  const heartRow = <>{'❤️'.repeat(hearts)}{'🤍'.repeat(TREASURE_HEARTS - hearts)}</>
  // Rocky's spot on the trail: one stop per right answer; a topic with fewer words still ends at the chest.
  const stop = correct >= total ? TRAIL.length - 1 : Math.round((correct * (TRAIL.length - 1)) / Math.max(1, total))
  const [rx, ry] = TRAIL[stop]
  const showRight = picked !== null && (picked === q?.answer || phase === 'between')

  return (
    <ArcadeStage>
      <style>{`
        @keyframes tbWalk { 0%,100% { transform: translate(-50%,-88%) rotate(-4deg) } 50% { transform: translate(-50%,-96%) rotate(4deg) } }
        @keyframes tbOpen { 0% { transform: translate(-50%,-50%) scale(.6) } 60% { transform: translate(-50%,-50%) scale(1.3) } 100% { transform: translate(-50%,-50%) scale(1) } }
        .tb-open { animation: tbOpen .7s ease-out both }
      `}</style>
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
      <SeaBackdrop />

      <StageHud tone="wood" onExit={exit} cards={[
        { label: 'Tim', value: <span className="text-[clamp(16px,4vmin,40px)]">{heartRow}</span> },
        { label: 'Chặng', value: `${correct}/${total}` },
      ]} />

      {/* The map with Rocky on the trail */}
      {phase !== 'ready' && phase !== 'done' && (
        <div className="absolute bottom-[5%] left-[12%] top-[6%] w-[44%] portrait:inset-x-[4%] portrait:bottom-auto portrait:top-[19%] portrait:h-[35%] portrait:w-auto [@media(max-height:500px)]:left-[11%] [@media(max-height:500px)]:w-[42%]">
          <TreasureMap reached={stop} open={phase === 'win'} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mascotCutSrc('rocky', 'pose-cheer')} alt=""
            className="absolute z-[2] h-[22%] w-auto transition-[left,top] duration-700 ease-in-out"
            style={{ left: `${rx}%`, top: `${ry}%`, animation: 'tbWalk .5s ease-in-out infinite' }} />
        </div>
      )}

      {/* The word with a letter dug out, and the letter stones */}
      {(phase === 'play' || phase === 'between') && q && (
        <div className="absolute bottom-[4%] right-[3%] top-[17%] flex w-[39%] flex-col items-center justify-between gap-[2vmin] portrait:inset-x-[4%] portrait:top-[56%] portrait:w-auto [@media(max-height:500px)]:top-[21%]">
          <button type="button" onClick={() => say(q.target.word)} className="flex items-center gap-2 rounded-2xl bg-white/90 px-3 py-1 shadow-lg active:scale-95">
            <WordIcon word={q.target.word} emoji={q.target.emoji} emojiClass="text-[clamp(26px,6vmin,56px)] leading-none" iconSize={52} />
            <span className="line-clamp-2 text-[clamp(16px,3.8vmin,36px)] font-black leading-tight text-[#451A03]">{q.target.meaning}</span>
            <span className="text-[clamp(18px,4vmin,38px)]" aria-label="Nghe từ">🔊</span>
          </button>
          <div className="flex flex-wrap items-end justify-center gap-x-[0.8vmin] gap-y-1 rounded-2xl border-4 border-[#92400E] bg-[#FEF3C7] px-3 py-2 shadow-xl">
            {[...q.target.word].map((ch, i) => i === q.gap ? (
              <span key={i} className={`flex min-w-[1.1em] items-center justify-center rounded-lg border-[3px] px-1 text-[clamp(28px,7vmin,64px)] font-black leading-tight ${
                picked === null ? 'border-dashed border-[#B45309] text-[#B45309]'
                : picked === q.answer ? 'border-emerald-600 bg-emerald-300 text-emerald-950'
                : 'ax-shake border-red-600 bg-red-300 text-red-900'}`}>{picked ?? '?'}</span>
            ) : (
              <span key={i} className={`text-[clamp(28px,7vmin,64px)] font-black leading-tight text-[#451A03] ${ch === ' ' ? 'w-[0.5em]' : ''}`}>{ch}</span>
            ))}
          </div>
          <p className="text-center text-[clamp(13px,2.8vmin,26px)] font-bold text-white drop-shadow">
            {picked === null ? 'Chọn chữ cái còn thiếu để Rocky đi tiếp!'
              : picked === q.answer ? `Đúng rồi! ${q.target.word} ✨` : `Ối! Chữ đúng là “${q.answer}”: ${q.target.word}`}
          </p>
          <div className="grid w-full grid-cols-4 place-items-center gap-[2.5vmin]">
            {q.choices.map((c) => (
              <LetterStone key={c} letter={c} disabled={phase !== 'play'} onClick={() => pick(c)}
                state={picked === null ? 'idle' : c === q.answer && showRight ? 'right' : c === picked ? 'wrong' : 'dim'} />
            ))}
          </div>
        </div>
      )}

      {phase === 'win' && (
        <div className="absolute bottom-[6%] right-[3%] top-[20%] z-10 flex w-[39%] flex-col items-center justify-center gap-3 text-center portrait:inset-x-0 portrait:top-[55%] portrait:w-auto">
          <p className="st-pop text-[clamp(24px,6vmin,58px)] font-black text-white drop-shadow-[0_3px_0_#92400E]">💰 Tìm thấy kho báu!</p>
          <StageButton tone="gold" onClick={() => setPhase('done')}>Xem kết quả ⭐</StageButton>
        </div>
      )}

      {phase === 'ready' && (
        <StageModal tone="wood">
          <p className="text-6xl [@media(max-height:500px)]:hidden" aria-hidden>🗺️</p>
          <h2 className="mt-1 text-3xl font-black sm:text-4xl [@media(max-height:500px)]:text-2xl">Đào Kho Báu</h2>
          <p className="mt-2 text-base font-semibold sm:text-lg [@media(max-height:500px)]:mt-1 [@media(max-height:500px)]:text-sm">
            Mỗi chặng có một từ bị mất một chữ cái. Chọn đúng chữ còn thiếu để Rocky đi theo bản đồ tới rương báu!
          </p>
          <p className="mx-auto mt-3 w-fit rounded-2xl border-2 border-amber-300 bg-amber-100 px-4 py-2 text-sm font-bold sm:text-base [@media(max-height:500px)]:mt-2">
            {total} chặng · <span className="whitespace-nowrap">{TREASURE_HEARTS} tim {'❤️'.repeat(TREASURE_HEARTS)}</span>
          </p>
          <StageButton tone="gold" onClick={() => { playSfx('ready'); enterFullscreen(); setPhase('play') }}>▶ Lên đường</StageButton>
        </StageModal>
      )}

      {phase === 'done' && (
        <StageModal tone="wood">
          <div className="flex flex-col items-center">
            <GameResultScreen
              score={scorePct} total={100} xpEarned={correct * 2} stars={starsFor(scorePct)} wrongWords={wrongWords}
              scoreLine={correct >= total ? 'Tìm thấy kho báu! 💰' : `Đi được ${correct}/${total} chặng`}
              extra={<>{heartRow} · chọn nhầm {TREASURE_HEARTS - hearts} lần<br />Giữ đủ tim để được 3 sao!</>}
              onRestart={restart} onExit={exit}
            />
          </div>
        </StageModal>
      )}
    </ArcadeStage>
  )
}
