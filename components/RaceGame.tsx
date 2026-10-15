'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useGameSync } from '@/lib/GameSyncContext'
import { playSfx, playWrongSound } from '@/lib/gameSound'
import { speak as speakWord } from '@/lib/speak'
import { starsFor } from '@/lib/topicMastery'
import {
  buildRaceQuestions, raceScorePct, raceSeconds, RACE_QUESTIONS, type ArcadeWord, type RocketQuestion,
} from '@/lib/arcadeGames'
import Confetti from '@/components/Confetti'
import GameResultScreen from '@/components/GameResultScreen'
import { PromptCard, AnswerGrid } from '@/components/games/ChoiceQuiz'
import { ArcadeStage, StageHud, TimerDial, StageModal, StageButton, enterFullscreen } from '@/components/games/ArcadeStage'
import { RaceBackdrop, RaceTrack, RaceCar } from '@/components/games/RaceScene'
import { mascotCutSrc } from '@/lib/mascots'

type Topic = { id: string; name: string; emoji: string; color: string; words: ArcadeWord[] }
type Props = { topic: Topic; level: string; backUrl: string }
type Phase = 'ready' | 'play' | 'finish' | 'lost' | 'done'

// Car noses run from the start line to the finish line (% of the track width).
const START = 19
const FINISH = 92

export default function RaceGame({ topic, level, backUrl }: Props) {
  const router = useRouter()
  const { recordAnswer, recordActivity, addScore, recordGameResult, flush } = useGameSync()
  const totalSeconds = raceSeconds(level)

  const [queue, setQueue] = useState<RocketQuestion[]>(() => buildRaceQuestions(topic.words))
  const [phase, setPhase] = useState<Phase>('ready')
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [timeLeft, setTimeLeft] = useState(totalSeconds)
  const [picked, setPicked] = useState<string | null>(null)
  const [spin, setSpin] = useState(0) // bumps on each wrong answer to replay the spin-out
  const [wrongWords, setWrongWords] = useState<string[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [run, setRun] = useState(0) // remounts Bubi's car so his drive restarts on "play again"
  const missed = useRef(new Set<string>())
  const recorded = useRef(false)
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())

  const current = queue[0]
  const speak = (w: string) => speakWord(w, { rate: 0.85 })
  const later = (fn: () => void, ms: number) => {
    const t = setTimeout(() => { timers.current.delete(t); fn() }, ms)
    timers.current.add(t)
  }
  useEffect(() => () => { timers.current.forEach(clearTimeout) }, [])

  // Bubi's clock: when it runs out he has crossed the line.
  useEffect(() => {
    if (phase !== 'play') return
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [phase])
  useEffect(() => {
    if (phase === 'play' && timeLeft <= 0) { timers.current.forEach(clearTimeout); playWrongSound(); setPicked(null); setPhase('lost') }
  }, [timeLeft, phase])

  useEffect(() => {
    if (phase !== 'play' || !current || current.kind === 'vi') return
    const t = setTimeout(() => speak(current.target.word), 500)
    return () => clearTimeout(t)
  }, [phase, current])

  const scorePct = raceScorePct(correct, wrong, timeLeft, totalSeconds)
  useEffect(() => {
    if (!['finish', 'lost'].includes(phase) || recorded.current) return
    recorded.current = true
    recordActivity(level)
    addScore(level, correct) // 🟢 recognition tier — 1x XP (see FAQ "XP theo độ khó")
    recordGameResult(level, topic.id, 'race', scorePct, 100)
    flush()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Say `word`, then `next` once it has been heard (see RocketGame.afterWord).
  function afterWord(word: string, minMs: number, maxMs: number, next: () => void) {
    const startedAt = Date.now()
    let done = false
    const go = () => {
      if (done) return
      done = true
      later(next, Math.max(350, minMs - (Date.now() - startedAt)))
    }
    speakWord(word, { rate: 0.85, onEnd: go, onError: go, onNoVoice: go })
    later(go, maxMs)
  }

  function answer(choice: ArcadeWord) {
    if (phase !== 'play' || picked !== null) return
    setPicked(choice.word)
    const w = current.target.word
    if (choice.word === w) {
      playSfx('swoosh')
      if (!missed.current.has(w)) recordAnswer(level, topic.id, current.target, true)
      const c = correct + 1
      setCorrect(c)
      if (c >= RACE_QUESTIONS) {
        // Freeze Bubi where he is; Rocky's car glides over the line.
        setPhase('finish')
        later(() => { playSfx('trophy'); setShowConfetti(true) }, 700)
        return
      }
      afterWord(w, 800, 2000, () => { setPicked(null); setQueue((q) => q.slice(1)) })
    } else {
      playWrongSound()
      playSfx('bump')
      setSpin((s) => s + 1)
      setWrong((n) => n + 1)
      if (!missed.current.has(w)) {
        missed.current.add(w)
        recordAnswer(level, topic.id, current.target, false)
        setWrongWords((ww) => [...ww, w])
      }
      later(() => afterWord(w, 1100, 2600, () => { setPicked(null); setQueue((q) => [...q.slice(1), { ...q[0] }]) }), 400)
    }
  }

  const restart = () => {
    timers.current.forEach(clearTimeout)
    timers.current.clear()
    missed.current = new Set()
    recorded.current = false
    setQueue(buildRaceQuestions(topic.words))
    setCorrect(0)
    setWrong(0)
    setTimeLeft(totalSeconds)
    setPicked(null)
    setWrongWords([])
    setShowConfetti(false)
    setRun((r) => r + 1)
    setPhase('ready')
  }
  const exit = () => router.push(backUrl)

  const rocky = START + (FINISH - START) * Math.min(1, correct / RACE_QUESTIONS)
  const boosting = picked !== null && picked === current?.target.word
  const onTrack = phase !== 'done'
  const bubiRunning = phase === 'play'

  return (
    <ArcadeStage>
      <style>{`
        @keyframes rcBubi { from { left: ${START}% } to { left: ${FINISH}% } }
        @keyframes rcWheel { to { transform: rotate(360deg) } }
        @keyframes rcSpin { 0% { transform: rotate(0) } 100% { transform: rotate(-720deg) } }
        @keyframes rcFlame { 0%,100% { transform: scaleX(1) } 50% { transform: scaleX(1.5) } }
        @keyframes rcBounce { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-3px) } }
        .rc-wheel { animation: rcWheel .35s linear infinite }
        .rc-bounce { animation: rcBounce .3s ease-in-out infinite }
      `}</style>
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
      <RaceBackdrop />

      <StageHud
        tone="sky" onExit={exit}
        dial={phase === 'play' || phase === 'lost'
          ? <TimerDial tone="sky" icon="🏁" pct={(Math.max(0, timeLeft) / totalSeconds) * 100} seconds={Math.max(0, timeLeft)} urgent={timeLeft <= 15} /> : undefined}
        cards={[{ label: 'Đúng', value: `${correct}/${RACE_QUESTIONS}` }]}
      />

      {/* The track with both cars (car = 20% of the track wide; its nose sits on the car's position) */}
      {onTrack && (
        <div className={`absolute inset-x-[2%] top-[17%] h-[30%] portrait:top-[16%] portrait:h-[23%] [@media(max-height:500px)]:left-[11%] [@media(max-height:500px)]:top-[19%] [@media(max-height:500px)]:h-[27%] ${
          phase === 'finish' ? '[@media(max-height:500px)]:hidden' : ''}`}>
          <RaceTrack>
            <div key={run} className="absolute top-[29%] h-[32%] w-[19%] -translate-x-full"
              style={{ left: `${START}%`, animation: `rcBubi ${totalSeconds}s linear forwards`, animationPlayState: bubiRunning ? 'running' : 'paused' }}>
              <div className="rc-bounce h-full w-full"><RaceCar color="#3B82F6" driver="bubi" number={2} className="h-full w-full" /></div>
            </div>
            <div className="absolute top-[64%] h-[32%] w-[19%] -translate-x-full transition-[left] duration-700 ease-out" style={{ left: `${rocky}%` }}>
              {boosting && (
                <svg viewBox="0 0 40 20" className="absolute -left-[38%] top-[38%] h-[42%] w-[45%]" style={{ animation: 'rcFlame .15s linear infinite', transformOrigin: 'right center' }} aria-hidden>
                  <path d="M40 4 Q10 0 0 10 Q10 20 40 16 Z" fill="#F97316" /><path d="M40 7 Q20 5 12 10 Q20 15 40 13 Z" fill="#FDE047" />
                </svg>
              )}
              <div key={spin} className="h-full w-full" style={spin ? { animation: 'rcSpin .7s ease-out' } : undefined}>
                <div className="rc-bounce h-full w-full"><RaceCar color="#EF4444" driver="rocky" number={1} className="h-full w-full" /></div>
              </div>
            </div>
          </RaceTrack>
        </div>
      )}

      {phase === 'play' && current && (
        <>
          <PromptCard q={current} picked={picked} onSay={() => speak(current.target.word)}
            className="absolute bottom-[4%] left-[3%] top-[50%] w-[36%] gap-[1.5vmin] portrait:inset-x-[3%] portrait:bottom-[30%] portrait:top-[41%] portrait:w-auto"
            cardClass="h-[min(100%,34vmin)] portrait:h-[min(100%,40vmin)]" />
          <AnswerGrid q={current} picked={picked} onPick={answer}
            className="absolute bottom-[4%] left-[41%] right-[3%] top-[56%] grid-cols-2 portrait:inset-x-[3%] portrait:bottom-[4%] portrait:top-auto portrait:h-[23%]" />
        </>
      )}

      {/* Win: Rocky first on the podium, Bubi second */}
      {phase === 'finish' && (
        <div className="absolute inset-x-0 bottom-[4%] top-[50%] z-10 flex flex-col items-center justify-end gap-2 px-4 text-center portrait:top-[40%]">
          <p className="st-pop text-[clamp(24px,6vmin,58px)] font-black text-white drop-shadow-[0_3px_0_#14532D]">🏆 Rocky về nhất!</p>
          <div className="flex items-end gap-1">
            {[{ who: 'bubi' as const, place: 2, h: 'h-[9vmin]', c: 'bg-slate-300' }, { who: 'rocky' as const, place: 1, h: 'h-[14vmin]', c: 'bg-amber-300' }].map((p) => (
              <div key={p.who} className={`flex flex-col items-center ${p.place === 1 ? 'order-2' : 'order-1'}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mascotCutSrc(p.who, 'pose-cheer')} alt="" className={`${p.place === 1 ? 'h-[18vmin]' : 'h-[13vmin]'} w-auto`} />
                <div className={`flex w-[20vmin] items-start justify-center rounded-t-xl border-4 border-b-0 border-white/80 pt-1 text-[5vmin] font-black text-slate-800 ${p.h} ${p.c}`}>{p.place}</div>
              </div>
            ))}
          </div>
          <StageButton tone="gold" onClick={() => setPhase('done')}>Xem kết quả ⭐</StageButton>
        </div>
      )}

      {phase === 'ready' && (
        <StageModal tone="sky">
          <div className="mx-auto h-16 w-32 [@media(max-height:500px)]:hidden"><RaceCar color="#EF4444" driver="rocky" number={1} className="h-full w-full" /></div>
          <h2 className="mt-1 text-3xl font-black sm:text-4xl [@media(max-height:500px)]:text-2xl">🏎️ Đua Xe Cùng Bubi</h2>
          <p className="mt-2 text-base font-semibold sm:text-lg [@media(max-height:500px)]:mt-1 [@media(max-height:500px)]:text-sm">
            Mỗi câu trả lời đúng giúp xe của Rocky tăng tốc. Trả lời sai là xe xoay vòng! Về đích trước Bubi nhé!
          </p>
          <p className="mx-auto mt-3 w-fit rounded-2xl border-2 border-blue-300 bg-blue-100 px-4 py-2 text-sm font-bold sm:text-base [@media(max-height:500px)]:mt-2">
            Đúng <b>{RACE_QUESTIONS} câu</b> trước khi Bubi về đích sau 🏁 <b>{totalSeconds} giây</b>
          </p>
          <StageButton tone="gold" onClick={() => { playSfx('ready'); enterFullscreen(); setPhase('play') }}>▶ Xuất phát</StageButton>
        </StageModal>
      )}

      {phase === 'lost' && (
        <StageModal tone="sky" dim={false}>
          <h2 className="text-3xl font-black">Bubi về đích trước rồi! 🐬</h2>
          <p className="mt-2 text-lg font-semibold">Rocky mới chạy được {correct}/{RACE_QUESTIONS} chặng.</p>
          <StageButton tone="gold" onClick={() => setPhase('done')}>Xem kết quả</StageButton>
        </StageModal>
      )}

      {phase === 'done' && (
        <StageModal tone="sky">
          <div className="flex flex-col items-center">
            <GameResultScreen
              score={scorePct} total={100} xpEarned={correct} stars={starsFor(scorePct)} wrongWords={wrongWords}
              scoreLine={correct >= RACE_QUESTIONS ? 'Rocky về nhất! 🏆' : `Chạy được ${correct}/${RACE_QUESTIONS} chặng`}
              extra={correct >= RACE_QUESTIONS
                ? <>Trả lời sai {wrong} lần · về trước Bubi {Math.max(0, timeLeft)} giây<br />Ít lần sai và bỏ xa Bubi để được 3 sao!</>
                : <>Bubi về đích trước.<br />Thử lại nhanh hơn một chút nhé!</>}
              onRestart={restart} onExit={exit}
            />
          </div>
        </StageModal>
      )}
    </ArcadeStage>
  )
}
