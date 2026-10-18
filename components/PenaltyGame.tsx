'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useGameSync } from '@/lib/GameSyncContext'
import { playSfx, playWrongSound } from '@/lib/gameSound'
import { speak as speakWord } from '@/lib/speak'
import { starsFor } from '@/lib/topicMastery'
import {
  buildPenaltyQuestions, penaltyScorePct, penaltySeconds, keeperDive, pickCelebration, CORNERS,
  type ArcadeWord, type Corner, type PenaltyQuestion,
} from '@/lib/arcadeGames'
import { buzz } from '@/components/ChunkyUI'
import Confetti from '@/components/Confetti'
import GameResultScreen from '@/components/GameResultScreen'
import { PromptCard } from '@/components/games/ChoiceQuiz'
import { ArcadeStage, StageHud, TimerDial, StageModal, StageButton, enterFullscreen } from '@/components/games/ArcadeStage'
import { Stadium, Goal, Ball, CelebrationScene, celebrationMs } from '@/components/games/PenaltyScene'

type Topic = { id: string; name: string; emoji: string; color: string; words: ArcadeWord[] }
type Props = { topic: Topic; level: string; backUrl: string }
type Phase = 'ready' | 'play' | 'kick' | 'celebrate' | 'done'
type Kick = 'goal' | 'save'

// Ball positions inside the goal box (% of the goal+spot area): the spot, and each corner's answer.
const SPOT = { left: 50, top: 90 }
const AIM: Record<Corner, { left: number; top: number }> = {
  tl: { left: 22, top: 20 }, tr: { left: 78, top: 20 }, bl: { left: 22, top: 52 }, br: { left: 78, top: 52 },
}
// Grid cells for the corners: the middle column is the keeper's lane.
const CELL: Record<Corner, string> = { tl: 'col-start-1 row-start-1', tr: 'col-start-3 row-start-1', bl: 'col-start-1 row-start-2', br: 'col-start-3 row-start-2' }

const answerSize = (q: PenaltyQuestion, c: ArcadeWord) => {
  const n = q.kind === 'en' ? c.meaning.length : Math.max(...c.word.split(' ').map((p) => p.length))
  return q.kind === 'en'
    ? (n <= 14 ? 'text-[clamp(14px,3.2vmin,32px)]' : 'text-[clamp(12px,2.6vmin,26px)]')
    : (n <= 6 ? 'text-[clamp(18px,4.6vmin,46px)]' : n <= 9 ? 'text-[clamp(15px,3.6vmin,36px)]' : 'text-[clamp(13px,2.8vmin,28px)]')
}

export default function PenaltyGame({ topic, level, backUrl }: Props) {
  const router = useRouter()
  const { recordAnswer, recordActivity, addScore, recordGameResult, flush } = useGameSync()
  const kickSeconds = penaltySeconds(level)

  const [questions, setQuestions] = useState<PenaltyQuestion[]>(() => buildPenaltyQuestions(topic.words))
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('ready')
  const [results, setResults] = useState<Kick[]>([])
  const [picked, setPicked] = useState<string | null>(null)
  const [shot, setShot] = useState<Corner | null>(null)
  const [dive, setDive] = useState<Corner | null>(null)
  const [timeLeft, setTimeLeft] = useState(kickSeconds)
  const [wrongWords, setWrongWords] = useState<string[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [celebration, setCelebration] = useState(() => pickCelebration())
  const recorded = useRef(false)
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())

  const total = questions.length
  const current = questions[index]
  const goals = results.filter((r) => r === 'goal').length
  const scorePct = penaltyScorePct(goals, total)
  const speak = (w: string) => speakWord(w, { rate: 0.85 })

  const later = (fn: () => void, ms: number) => {
    const t = setTimeout(() => { timers.current.delete(t); fn() }, ms)
    timers.current.add(t)
  }
  useEffect(() => () => { timers.current.forEach(clearTimeout) }, [])

  // Kick clock — restarts on every kick.
  useEffect(() => {
    if (phase !== 'play') return
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [phase, index])

  // Say the word for listening / English → meaning kicks once the new card is up.
  useEffect(() => {
    if (phase !== 'play' || !current || current.kind === 'vi') return
    const t = setTimeout(() => speak(current.target.word), 500)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, index])

  useEffect(() => {
    if (!['celebrate', 'done'].includes(phase) || recorded.current) return
    recorded.current = true
    recordActivity(level)
    addScore(level, goals) // 🟢 recognition tier — 1x XP (see FAQ "XP theo độ khó")
    recordGameResult(level, topic.id, 'penalty', scorePct, 100)
    flush()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Say the right word in full, then the next kick (or the end of the shoot-out).
  function next(word: string, result: Kick) {
    const all = [...results, result]
    let done = false
    const go = () => {
      if (done) return
      done = true
      later(() => {
        setPicked(null); setShot(null); setDive(null)
        if (index + 1 < total) { setIndex(index + 1); setTimeLeft(kickSeconds); setPhase('play'); return }
        const pct = penaltyScorePct(all.filter((r) => r === 'goal').length, total)
        if (starsFor(pct) >= 3) {
          setPhase('celebrate'); playSfx('trophy'); setShowConfetti(true)
          later(() => setPhase('done'), celebrationMs(celebration) + 1800)
        } else setPhase('done')
      }, 500)
    }
    speakWord(word, { rate: 0.85, onEnd: go, onError: go, onNoVoice: go })
    later(go, 2600)
  }

  function kick(choice: ArcadeWord | null, corner: Corner | null) {
    if (phase !== 'play') return
    const w = current.target.word
    const isGoal = !!choice && choice.word === w
    setPhase('kick')
    setPicked(choice?.word ?? '')
    if (corner) { setShot(corner); playSfx('swoosh') }
    // The keeper commits as the ball is struck; on a save he's already in the shot's corner.
    setDive(keeperDive(corner ?? CORNERS[Math.floor(Math.random() * 4)], !isGoal))
    recordAnswer(level, topic.id, current.target, isGoal)
    if (!isGoal) setWrongWords((ww) => (ww.includes(w) ? ww : [...ww, w]))
    const result: Kick = isGoal ? 'goal' : 'save'
    setResults((r) => [...r, result])
    later(() => { if (isGoal) playSfx('correct'); else playWrongSound() }, 450)
    later(() => next(w, result), 1100)
  }

  useEffect(() => {
    if (phase === 'play' && timeLeft <= 0) kick(null, null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase])

  const restart = () => {
    timers.current.forEach(clearTimeout)
    timers.current.clear()
    recorded.current = false
    setQuestions(buildPenaltyQuestions(topic.words))
    setIndex(0); setResults([]); setPicked(null); setShot(null); setDive(null)
    setTimeLeft(kickSeconds); setWrongWords([]); setShowConfetti(false)
    setCelebration(pickCelebration())
    setPhase('ready')
  }
  const exit = () => router.push(backUrl)

  const last = results[results.length - 1]
  const ballAt = shot ? AIM[shot] : SPOT
  const answerCls = (c: ArcadeWord) => {
    const base = 'flex items-center justify-center rounded-xl border-b-[5px] px-1.5 font-black shadow-lg transition-[transform,background-color] active:translate-y-1 active:border-b-2'
    if (picked === null) return `${base} border-[#B9C0E8] bg-[#F1F4FF]/95 text-[#1E1B4B]`
    if (c.word === current.target.word) return `${base} border-emerald-700 bg-emerald-400 text-emerald-950`
    return c.word === picked ? `${base} ax-shake border-red-700 bg-red-400 text-white` : `${base} border-[#3B3E5C] bg-[#565A7E]/90 text-[#9EA3C8]`
  }

  return (
    <ArcadeStage>
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
      <Stadium flashes={phase === 'celebrate'} />

      <StageHud
        tone="sky" onExit={exit}
        dial={phase === 'play' || phase === 'kick'
          ? <TimerDial tone="sky" pct={(Math.max(0, timeLeft) / kickSeconds) * 100} seconds={Math.max(0, timeLeft)} urgent={timeLeft <= 5} /> : undefined}
        cards={[{ label: 'Bàn thắng', value: goals }, { label: 'Lượt sút', value: `${Math.min(index + 1, total)}/${total}` }]}
      />

      {(phase === 'play' || phase === 'kick') && current && (
        <>
          <PromptCard q={current} picked={picked} onSay={() => speak(current.target.word)}
            className="absolute bottom-[8%] left-[2%] top-[16%] w-[27%] portrait:inset-x-[4%] portrait:bottom-auto portrait:top-[17%] portrait:h-[25%] portrait:w-auto"
            cardClass="h-[min(100%,32vmin)] portrait:h-[min(100%,30vmin)]" />

          {/* Goal + penalty spot. The ball flies from the spot to the chosen corner. */}
          <div className="absolute bottom-[4%] left-[31%] right-[2%] top-[15%] portrait:inset-x-[3%] portrait:bottom-[7%] portrait:top-[44%]">
            <Goal dive={dive} className="absolute inset-x-0 top-0 h-[72%]">
              {current.choices.map((c, i) => (
                <button key={c.word} type="button" disabled={phase !== 'play'} onClick={() => { buzz(); kick(c, CORNERS[i]) }}
                  className={`${CELL[CORNERS[i]]} ${answerCls(c)}`}>
                  {current.kind === 'en'
                    ? <span className={`line-clamp-3 leading-tight ${answerSize(current, c)}`}>{c.emoji} {c.meaning}</span>
                    : <span className={`break-words leading-tight ${answerSize(current, c)}`}>{c.word}</span>}
                </button>
              ))}
            </Goal>
            <Ball className="pointer-events-none absolute z-20 h-[12%] w-auto"
              style={{
                left: `${ballAt.left}%`, top: `${ballAt.top}%`,
                transform: `translate(-50%, -50%) scale(${shot ? 0.65 : 1}) rotate(${shot ? 540 : 0}deg)`,
                transition: shot ? 'left .45s ease-out, top .45s ease-out, transform .45s ease-out' : 'none',
              }} />
            {/* Kick tally */}
            <div className="absolute bottom-0 left-1/2 flex -translate-x-1/2 gap-[1vmin]">
              {questions.map((_, i) => (
                <span key={i} className={`flex h-[3.6vmin] min-h-[16px] w-[3.6vmin] min-w-[16px] items-center justify-center rounded-full border-2 border-white/70 text-[2.4vmin] ${
                  results[i] === 'goal' ? 'bg-emerald-400' : results[i] === 'save' ? 'bg-red-500' : i === index ? 'bg-white/60' : 'bg-black/30'}`}>
                  {results[i] === 'goal' ? '⚽' : results[i] === 'save' ? '✕' : ''}
                </span>
              ))}
            </div>
          </div>

          {phase === 'kick' && last && (
            <p key={index} className="st-pop pointer-events-none absolute inset-x-0 top-[40%] z-20 text-center text-[clamp(34px,10vmin,110px)] font-black drop-shadow-[0_5px_0_rgba(0,0,0,.45)]"
              style={{ color: last === 'goal' ? '#FACC48' : '#FCA5A5', animationDelay: '.45s' }}>
              {last === 'goal' ? 'VÀOOO! ⚽' : picked ? 'Thủ môn bắt được! 🧤' : 'Hết giờ! ⏱'}
            </p>
          )}
        </>
      )}

      {phase === 'celebrate' && (
        <>
          <CelebrationScene kind={celebration} />
          <div className="absolute inset-x-0 bottom-[3%] z-10 flex justify-center">
            <StageButton tone="gold" onClick={() => setPhase('done')}>Xem kết quả ⭐</StageButton>
          </div>
        </>
      )}

      {phase === 'ready' && (
        <StageModal tone="sky">
          <h2 className="text-3xl font-black sm:text-5xl [@media(max-height:500px)]:text-2xl">⚽ Sút Penalty</h2>
          <p className="mt-3 text-base font-semibold sm:text-xl [@media(max-height:500px)]:mt-1 [@media(max-height:500px)]:text-sm">Mỗi góc khung thành là một đáp án — sút vào góc đúng để ghi bàn!</p>
          <p className="mx-auto mt-4 w-fit rounded-2xl border-[3px] border-[#FACC48] bg-[#FFF6D6] px-5 py-2.5 text-sm font-bold sm:text-lg [@media(max-height:500px)]:mt-2">
            <b>{total} lượt sút</b>, mỗi lượt <b>{kickSeconds} giây</b>. Ghi từ {Math.floor(total * 0.8) + 1} bàn để ăn mừng 3 sao! 🎉
          </p>
          <StageButton tone="gold" onClick={() => { playSfx('ready'); enterFullscreen(); setPhase('play') }}>▶ Bắt đầu</StageButton>
        </StageModal>
      )}

      {phase === 'done' && (
        <StageModal tone="sky">
          <div className="flex flex-col items-center">
            <GameResultScreen
              score={scorePct} total={100} xpEarned={goals} stars={starsFor(scorePct)} wrongWords={wrongWords}
              scoreLine={`Ghi ${goals}/${total} bàn ⚽`}
              extra={starsFor(scorePct) >= 3
                ? <>Siêu sao sân cỏ! 🏆</>
                : <>Ghi nhiều bàn hơn nữa để được 3 sao và xem màn ăn mừng nhé!</>}
              onRestart={restart} onExit={exit}
            />
          </div>
        </StageModal>
      )}
    </ArcadeStage>
  )
}
