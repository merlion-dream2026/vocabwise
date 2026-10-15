'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useGameSync } from '@/lib/GameSyncContext'
import { playSfx, playWrongSound } from '@/lib/gameSound'
import { speak as speakWord } from '@/lib/speak'
import { starsFor } from '@/lib/topicMastery'
import {
  buildRocketQuestions, rocketScorePct, rocketSeconds, ROCKET_PARTS, type ArcadeWord, type RocketQuestion,
} from '@/lib/arcadeGames'
import Confetti from '@/components/Confetti'
import GameResultScreen from '@/components/GameResultScreen'
import { PromptCard, AnswerGrid } from '@/components/games/ChoiceQuiz'
import { RocketArt, PlanetScene, type RocketStage } from '@/components/games/RocketArt'
import { ArcadeStage, StageHud, TimerDial, StageModal, StageButton, enterFullscreen } from '@/components/games/ArcadeStage'
import { LaunchSite, SpaceBackdrop, StarField } from '@/components/games/RocketScene'

type Topic = { id: string; name: string; emoji: string; color: string; words: ArcadeWord[] }
type Props = { topic: Topic; level: string; backUrl: string }
type Phase = 'ready' | 'play' | 'countdown' | 'launch' | 'space' | 'planet' | 'fizzle' | 'done'

export default function RocketGame({ topic, level, backUrl }: Props) {
  const router = useRouter()
  const { recordAnswer, recordActivity, addScore, recordGameResult, flush } = useGameSync()
  const totalSeconds = rocketSeconds(level)

  const [queue, setQueue] = useState<RocketQuestion[]>(() => buildRocketQuestions(topic.words))
  const [phase, setPhase] = useState<Phase>('ready')
  const [built, setBuilt] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [timeLeft, setTimeLeft] = useState(totalSeconds)
  const [picked, setPicked] = useState<string | null>(null)
  const [count, setCount] = useState(3)
  const [wrongWords, setWrongWords] = useState<string[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const missed = useRef(new Set<string>())
  const recorded = useRef(false) // result saved for this flight (on landing / out of fuel, before the result screen)
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())

  const current = queue[0]
  const speak = (w: string) => speakWord(w, { rate: 0.85 })

  const later = (fn: () => void, ms: number) => {
    const t = setTimeout(() => { timers.current.delete(t); fn() }, ms)
    timers.current.add(t)
  }
  useEffect(() => () => { timers.current.forEach(clearTimeout) }, [])

  // Fuel clock — one for the whole flight.
  useEffect(() => {
    if (phase !== 'play') return
    const t = setInterval(() => setTimeLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [phase])

  useEffect(() => {
    if (phase === 'play' && timeLeft <= 0) { playWrongSound(); setPhase('fizzle') }
  }, [timeLeft, phase])

  // Say the word for listening (and English → meaning) questions shortly after each one comes up, so
  // the eye reaches the new card first. (speak() cancels whatever is still playing.)
  useEffect(() => {
    if (phase !== 'play' || !current || current.kind === 'vi') return
    const t = setTimeout(() => speak(current.target.word), 500)
    return () => clearTimeout(t)
  }, [phase, current])

  // 3-2-1 → lift-off → cruising past Earth → landing on the planet.
  useEffect(() => {
    if (phase !== 'countdown') return
    playSfx('beep')
    if (count <= 0) {
      setPhase('launch')
      playSfx('launch')
      later(() => { setPhase('space'); playSfx('swoosh') }, 2700)
      later(() => { setPhase('planet'); playSfx('trophy'); setShowConfetti(true) }, 5400)
      return
    }
    const t = setTimeout(() => setCount((c) => c - 1), 900)
    return () => clearTimeout(t)
  }, [phase, count])

  const scorePct = rocketScorePct(built, wrong, timeLeft, totalSeconds)

  useEffect(() => {
    if (!['space', 'planet', 'fizzle', 'done'].includes(phase) || recorded.current) return
    recorded.current = true
    recordActivity(level)
    addScore(level, built) // 🟢 recognition tier — 1x XP (see FAQ "XP theo độ khó")
    recordGameResult(level, topic.id, 'rocket', scorePct, 100)
    flush()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Say `word`, then run `next` once it has been heard in full (a short pause after it ends, and at
  // least `minMs` from now); if the browser never reports the end, go after `maxMs` anyway. Without
  // this the next question's word cut the previous one off (speak() cancels whatever is playing).
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

  // Right → the next part bolts on. Wrong → show the answer, then the question goes to the back of
  // the queue: the rocket only flies once all 10 words have been answered correctly.
  function answer(choice: ArcadeWord) {
    if (phase !== 'play' || picked !== null) return
    setPicked(choice.word)
    const w = current.target.word
    if (choice.word === w) {
      playSfx('clunk')
      if (!missed.current.has(w)) recordAnswer(level, topic.id, current.target, true)
      const b = built + 1
      setBuilt(b)
      afterWord(w, 900, 2200, () => {
        setPicked(null)
        if (b >= ROCKET_PARTS) { setCount(3); setPhase('countdown') }
        else setQueue((q) => q.slice(1))
      })
    } else {
      playWrongSound()
      setWrong((n) => n + 1)
      if (!missed.current.has(w)) {
        missed.current.add(w)
        recordAnswer(level, topic.id, current.target, false)
        setWrongWords((ww) => [...ww, w])
      }
      // Say the right answer once the buzz is over, then requeue. A fresh object so the "say the word"
      // effect fires again even when it's the last question left.
      later(() => afterWord(w, 1100, 2600, () => { setPicked(null); setQueue((q) => [...q.slice(1), { ...q[0] }]) }), 400)
    }
  }

  const restart = () => {
    timers.current.forEach(clearTimeout)
    timers.current.clear()
    missed.current = new Set()
    recorded.current = false
    setQueue(buildRocketQuestions(topic.words))
    setBuilt(0)
    setWrong(0)
    setTimeLeft(totalSeconds)
    setPicked(null)
    setWrongWords([])
    setShowConfetti(false)
    setPhase('ready')
  }
  const exit = () => router.push(backUrl)

  const onPad = phase === 'play' || phase === 'countdown' || phase === 'launch' || phase === 'fizzle' || phase === 'ready'
  const stage: RocketStage = phase === 'countdown' ? 'countdown' : phase === 'launch' ? 'launch' : phase === 'fizzle' ? 'fizzle' : 'build'
  const fuelPct = (Math.max(0, timeLeft) / totalSeconds) * 100
  return (
    <ArcadeStage>
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
      {onPad ? <LaunchSite /> : phase === 'space' ? <SpaceBackdrop /> : (
        <div className="absolute inset-0 bg-gradient-to-b from-[#07071A] via-[#1B1745] to-[#3B2F7A]" aria-hidden><StarField /></div>
      )}

      <StageHud
        tone="space" onExit={exit}
        dial={phase === 'play' || phase === 'countdown' || phase === 'fizzle'
          ? <TimerDial tone="space" icon="⛽" pct={fuelPct} seconds={Math.max(0, timeLeft)} urgent={fuelPct <= 20} /> : undefined}
        cards={[{ label: 'Điểm', value: built }, { label: 'Câu', value: `${Math.min(built + (phase === 'play' ? 1 : 0), ROCKET_PARTS)}/${ROCKET_PARTS}` }]}
      />

      {/* Rocket on the pad (left), with the parts counter under it */}
      {onPad && (
        <>
          <RocketArt built={built} stage={stage}
            className="absolute bottom-[5%] left-[3%] h-[66%] w-[26%] portrait:bottom-[33%] portrait:left-0 portrait:h-[40%] portrait:w-[40%]" />
          <p className="absolute bottom-[1.5%] left-[3%] w-[26%] text-center portrait:bottom-[29%] portrait:left-0 portrait:w-[40%]">
            <span className="rounded-full bg-black/45 px-3 py-0.5 text-[clamp(15px,3.2vmin,32px)] font-black text-white">{built}/{ROCKET_PARTS} bộ phận</span>
          </p>
        </>
      )}

      {phase === 'play' && current && (
        <>
          <PromptCard q={current} picked={picked} onSay={() => speak(current.target.word)}
            className="absolute bottom-[24%] left-[31%] right-[3%] top-[15%] portrait:bottom-[33%] portrait:left-[40%] portrait:top-[18%]"
            cardClass="h-[min(100%,34vmin)] portrait:h-[min(100%,48vmin)]" />
          {/* Four answers: one row on a wide screen, 2×2 on a phone held upright */}
          <AnswerGrid q={current} picked={picked} onPick={answer}
            className="absolute bottom-[5%] left-[31%] right-[3%] h-[15%] grid-cols-4 portrait:inset-x-[3%] portrait:bottom-[4%] portrait:h-[23%] portrait:grid-cols-2" />
        </>
      )}

      {phase === 'countdown' && count > 0 && (
        <span key={count} className="st-pop absolute inset-0 flex items-center justify-center text-[30vmin] font-black text-[#FACC48] drop-shadow-[0_6px_0_rgba(0,0,0,.35)]">{count}</span>
      )}
      {phase === 'launch' && (
        <p className="st-pop absolute inset-x-0 top-[22%] text-center text-[clamp(32px,9vmin,90px)] font-black text-[#FACC48] drop-shadow-[0_5px_0_rgba(0,0,0,.35)]">Phóng! 🚀</p>
      )}

      {phase === 'space' && (
        <>
          <p className="st-pop absolute inset-x-0 top-[16%] text-center text-[clamp(26px,6vmin,60px)] font-black text-white drop-shadow">🌍 Bé đã bay vào vũ trụ!</p>
          <RocketArt built={ROCKET_PARTS} stage="cruise" className="absolute bottom-[10%] left-1/2 h-[58%] -translate-x-1/2" />
        </>
      )}

      {phase === 'planet' && (
        <>
          <div className="absolute inset-x-0 bottom-[2%] top-[36%] portrait:top-[40%]"><PlanetScene topicEmoji={topic.emoji} /></div>
          <div className="absolute inset-x-0 top-[12%] z-10 flex flex-col items-center px-4 text-center portrait:top-[19%]">
            <p className="st-pop text-[clamp(22px,5.4vmin,52px)] font-black text-white drop-shadow">Đã đáp xuống hành tinh {topic.emoji}!</p>
            <p className="mt-1 text-[clamp(15px,3.2vmin,30px)] font-bold text-indigo-100">Rocky cắm cờ chủ đề “{topic.name}” lên hành tinh mới 🎉</p>
            <StageButton tone="gold" onClick={() => setPhase('done')}>Xem kết quả ⭐</StageButton>
          </div>
        </>
      )}

      {phase === 'ready' && (
        <StageModal tone="space">
          <h2 className="text-3xl font-black sm:text-5xl [@media(max-height:500px)]:text-2xl">🚀 Phóng Tên Lửa</h2>
          <p className="mt-3 text-base font-semibold sm:text-xl [@media(max-height:500px)]:mt-1 [@media(max-height:500px)]:text-sm">Trả lời đúng để lắp từng bộ phận — lắp xong tên lửa là bay vào vũ trụ!</p>
          <p className="mx-auto mt-4 w-fit rounded-2xl border-[3px] border-[#FACC48] [@media(max-height:500px)]:mt-2 bg-[#FFF6D6] px-5 py-2.5 text-sm font-bold sm:text-lg">
            Lắp đủ <b>{ROCKET_PARTS} bộ phận</b> trước khi hết ⛽ <b>{totalSeconds} giây</b> nhiên liệu!
          </p>
          <StageButton tone="gold" onClick={() => { playSfx('ready'); enterFullscreen(); setPhase('play') }}>▶ Bắt đầu</StageButton>
        </StageModal>
      )}

      {phase === 'fizzle' && (
        <StageModal tone="space" dim={false}>
          <h2 className="text-3xl font-black">Ối, hết nhiên liệu rồi! 💨</h2>
          <p className="mt-2 text-lg font-semibold">Tên lửa mới lắp được {built}/{ROCKET_PARTS} bộ phận.</p>
          <StageButton tone="gold" onClick={() => setPhase('done')}>Xem kết quả</StageButton>
        </StageModal>
      )}

      {phase === 'done' && (
        <StageModal tone="space">
          {/* GameResultScreen is a fragment; its callers centre it */}
          <div className="flex flex-col items-center">
            <GameResultScreen
              score={scorePct} total={100} xpEarned={built} stars={starsFor(scorePct)} wrongWords={wrongWords}
              scoreLine={built >= ROCKET_PARTS ? 'Tên lửa đã bay vào vũ trụ! 🚀' : `Lắp được ${built}/${ROCKET_PARTS} bộ phận`}
              extra={built >= ROCKET_PARTS
                ? <>Trả lời sai {wrong} lần · ⛽ còn {Math.max(0, timeLeft)} giây<br />Ít lần sai và còn nhiều nhiên liệu để được 3 sao!</>
                : <>Hết nhiên liệu trước khi lắp xong.<br />Thử lại nhanh hơn một chút nhé!</>}
              onRestart={restart} onExit={exit}
            />
          </div>
        </StageModal>
      )}
    </ArcadeStage>
  )
}
