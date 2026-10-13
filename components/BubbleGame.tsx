'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useGameSync } from '@/lib/GameSyncContext'
import { playSfx, playCorrectSound, playWrongSound } from '@/lib/gameSound'
import Confetti from '@/components/Confetti'
import { speak as speakWord } from '@/lib/speak'
import WordIcon from '@/components/WordIcon'
import GameResultScreen from '@/components/GameResultScreen'
import { buzz } from '@/components/ChunkyUI'
import { ArcadeStage, StageHud, StageModal, StageButton, enterFullscreen } from '@/components/games/ArcadeStage'

// 🫧 Bắn bong bóng, full screen: hear a word, pop the bubble with its picture. Four bubbles keep rising
// from the bottom (each in its own column, wobbling, at its own speed) until one is popped. Same rules
// and score as before — every topic word once, one try per word — so existing stars stay comparable.

type Word = { word: string; meaning: string; emoji: string; examples: { en: string; vi: string }[] }
type Topic = { id: string; name: string; emoji: string; color: string; words: Word[] }
type Props = { topic: Topic; level: string; backUrl: string }
type Question = { target: Word; choices: Word[] }
type Phase = 'ready' | 'play' | 'done'

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function buildQuestions(words: Word[]): Question[] {
  return shuffle(words).map((word) => ({
    target: word,
    choices: shuffle([word, ...shuffle(words.filter((w) => w.word !== word.word && w.meaning !== word.meaning)).slice(0, 3)]),
  }))
}

const BUBBLE_TINTS = ['#F9A8D4', '#C4B5FD', '#7DD3FC', '#FCD34D']
const COLUMNS = ['left-[9%]', 'left-[31%]', 'left-[53%]', 'left-[75%]']
/** Seconds for a bubble to rise across the screen (slower = easier). */
const RISE_SECONDS: Record<string, number> = { seeker: 10, starter: 9, ranger: 8, explorer: 7.5, scholar: 7, master: 6.5 }

export default function BubbleGame({ topic, level, backUrl }: Props) {
  const router = useRouter()
  const { recordAnswer, recordActivity, addScore, recordGameResult, flush } = useGameSync()
  const [questions, setQuestions] = useState<Question[]>(() => buildQuestions(topic.words))
  const [phase, setPhase] = useState<Phase>('ready')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [wrongWords, setWrongWords] = useState<string[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  // Every bubble takes the same time to rise, a quarter-cycle apart (shuffled per column), so all four
  // are always on screen at different heights — none hiding below the edge or behind the sign.
  const [rise] = useState(() => {
    const dur = RISE_SECONDS[level] ?? 8
    const phases = shuffle([0, 0.25, 0.5, 0.75])
    return COLUMNS.map((_, i) => ({ dur, delay: -(phases[i] + 0.06) * dur }))
  })
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())

  const current = questions[currentIdx]
  const total = questions.length
  const speak = (text: string) => speakWord(text, { rate: 0.8, pitch: 1.2 })
  const later = (fn: () => void, ms: number) => {
    const t = setTimeout(() => { timers.current.delete(t); fn() }, ms)
    timers.current.add(t)
  }
  useEffect(() => () => { timers.current.forEach(clearTimeout) }, [])

  useEffect(() => {
    if (phase !== 'done') return
    addScore(level, score) // 🟢 recognition tier — 1x XP (see FAQ "XP theo độ khó")
    recordGameResult(level, topic.id, 'bubble', score, total)
    if (score === total) setShowConfetti(true)
    flush()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Say the word shortly after each new set of bubbles appears.
  useEffect(() => {
    if (phase !== 'play') return
    const t = setTimeout(() => speak(current.target.word), 500)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, currentIdx])

  const goNext = () => {
    if (currentIdx + 1 >= total) { recordActivity(level); setPhase('done') }
    else { setCurrentIdx((i) => i + 1); setSelected(null) }
  }

  const pop = (choice: Word) => {
    if (phase !== 'play' || selected !== null) return
    buzz()
    setSelected(choice.word)
    const correct = choice.word === current.target.word
    recordAnswer(level, topic.id, current.target, correct)
    playSfx('pop')
    if (correct) {
      setScore((s) => s + 1)
      later(playCorrectSound, 120)
      speak(current.target.word)
      later(goNext, 1300)
    } else {
      setWrongWords((w) => [...w, current.target.word])
      later(playWrongSound, 120)
      later(() => speak(current.target.word), 500) // say the right one while it glows
      later(goNext, 2300)
    }
  }

  const restart = () => {
    timers.current.forEach(clearTimeout)
    timers.current.clear()
    setQuestions(buildQuestions(topic.words))
    setCurrentIdx(0)
    setSelected(null)
    setScore(0)
    setWrongWords([])
    setShowConfetti(false)
    setPhase('ready')
  }
  const exit = () => router.push(backUrl)

  return (
    <ArcadeStage>
      <style>{`
        /* rise from just above the bottom edge to just under the sign (lower on an upright phone),
           fading in and out at the ends */
        @keyframes bbRise { 0% { top: 80%; opacity: 0 } 7% { opacity: 1 } 93% { opacity: 1 } 100% { top: 22%; opacity: 0 } }
        @keyframes bbRiseTall { 0% { top: 82%; opacity: 0 } 7% { opacity: 1 } 93% { opacity: 1 } 100% { top: 30%; opacity: 0 } }
        .bb-rise { animation-name: bbRise; animation-timing-function: linear; animation-iteration-count: infinite }
        @keyframes bbRiseShort { 0% { top: 80%; opacity: 0 } 7% { opacity: 1 } 93% { opacity: 1 } 100% { top: 36%; opacity: 0 } }
        @media (orientation: portrait) { .bb-rise { animation-name: bbRiseTall } }
        @media (max-height: 500px) { .bb-rise { animation-name: bbRiseShort } }
        @keyframes bbWobble { 0%,100% { transform: translateX(-6%) } 50% { transform: translateX(6%) } }
        @keyframes bbPop { 0% { transform: scale(1); opacity: 1 } 60% { transform: scale(1.35); opacity: .7 } 100% { transform: scale(1.6); opacity: 0 } }
        @keyframes bbSpark { from { transform: rotate(var(--a)) translateY(0); opacity: 1 } to { transform: rotate(var(--a)) translateY(-70px); opacity: 0 } }
        @keyframes bbFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }
        .bb-wobble { animation: bbWobble 2.4s ease-in-out infinite }
        .bb-pop { animation: bbPop .45s ease-out forwards }
        .bb-spark { animation: bbSpark .6s ease-out forwards }
      `}</style>
      {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}

      {/* pastel sky with soft sparkles */}
      <div className="absolute inset-0 bg-gradient-to-b from-violet-300 via-pink-200 to-amber-100" aria-hidden>
        {[[10, 20], [30, 60], [55, 15], [75, 45], [90, 75], [20, 85], [65, 80]].map(([x, y], i) => (
          <span key={i} className="st-twinkle absolute text-[3vmin] text-white" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.3}s` }}>✦</span>
        ))}
      </div>

      <StageHud
        tone="space" onExit={exit}
        cards={[{ label: 'Điểm', value: score }, { label: 'Câu', value: `${Math.min(currentIdx + 1, total)}/${total}` }]}
      />

      {/* The word to find */}
      {phase === 'play' && (
        <div className="absolute inset-x-0 top-[4%] z-20 flex flex-col items-center px-4 portrait:top-[13%]">
          <button type="button" onClick={() => { buzz(); speak(current.target.word) }}
            className="flex items-center gap-3 rounded-full border-[5px] border-white bg-[#7C3AED] px-7 py-2.5 text-white shadow-xl active:scale-95 sm:px-9 sm:py-3">
            <span className="text-[7vmin] leading-none">🔊</span>
            <span className="text-[clamp(22px,5vmin,48px)] font-black">{selected !== null ? current.target.word : 'Nghe lại'}</span>
          </button>
          <p className="mt-2 rounded-full bg-white/85 px-3 py-0.5 text-center text-[clamp(13px,2.8vmin,26px)] font-bold text-violet-900">
            {selected === null ? 'Nghe rồi chạm vỡ bong bóng có hình đúng!' : selected === current.target.word ? 'Chính xác! 🎉' : `Sai rồi, đáp án là “${current.target.word}”`}
          </p>
        </div>
      )}
      <div role="alert" aria-live="assertive" className="sr-only">
        {selected !== null && (selected === current.target.word ? 'Chính xác!' : `Sai rồi. Đáp án đúng là ${current.target.word}.`)}
      </div>

      {/* Rising bubbles, one per column */}
      {phase === 'play' && current.choices.map((choice, i) => {
        const isTarget = choice.word === current.target.word
        const picked = selected === choice.word
        const popped = picked
        const glow = selected !== null && !picked && isTarget
        return (
          <div key={`${currentIdx}-${choice.word}`} className={`bb-rise absolute ${COLUMNS[i]} w-[20%] max-w-[min(190px,17vh)]`}
            style={{ animationDuration: `${rise[i].dur}s`, animationDelay: `${rise[i].delay}s`, animationPlayState: selected !== null ? 'paused' : 'running' }}>
            <div className="bb-wobble" style={{ animationDelay: `${i * 0.4}s` }}>
              <button type="button" onClick={() => pop(choice)} disabled={selected !== null} aria-label={`Bong bóng ${i + 1}`}
                className={`relative flex aspect-square w-full items-center justify-center rounded-full border-[3px] border-white/80 shadow-xl ${popped ? 'bb-pop' : ''} ${glow ? 'ring-[6px] ring-amber-300' : ''}`}
                style={{ background: `radial-gradient(circle at 32% 28%, #fff 0 12%, ${BUBBLE_TINTS[i]}cc 45%, ${BUBBLE_TINTS[i]} 100%)` }}>
                <WordIcon word={choice.word} emoji={choice.emoji} emojiClass="text-[9vmin] leading-none" iconSize={64} />
                {selected !== null && (isTarget || picked) && (
                  <span className={`absolute -bottom-[14%] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg px-2 text-[clamp(13px,2.8vmin,24px)] font-black text-white shadow ${isTarget ? 'bg-emerald-500' : 'bg-red-400'}`}>
                    {choice.word}
                  </span>
                )}
              </button>
              {picked && isTarget && [0, 60, 120, 180, 240, 300].map((a) => (
                <span key={a} className="bb-spark pointer-events-none absolute left-1/2 top-1/2 text-[4vmin]" style={{ ['--a' as string]: `${a}deg` }}>✨</span>
              ))}
            </div>
          </div>
        )
      })}

      {phase === 'ready' && (
        <StageModal tone="space">
          <div className="text-6xl [@media(max-height:500px)]:hidden" aria-hidden>🫧</div>
          <h2 className="mt-1 text-3xl font-black sm:text-4xl [@media(max-height:500px)]:text-2xl">Bắn Bong Bóng</h2>
          <p className="mt-2 text-base font-semibold sm:text-lg [@media(max-height:500px)]:mt-1 [@media(max-height:500px)]:text-sm">
            Bong bóng bay lên, mỗi quả chứa một hình. Nghe từ tiếng Anh rồi chạm vỡ quả có hình đúng!
          </p>
          <p className="mx-auto mt-3 w-fit rounded-2xl border-2 border-violet-300 bg-violet-100 px-4 py-2 text-sm font-bold sm:text-base [@media(max-height:500px)]:mt-2">
            {total} từ · mỗi từ chọn 1 lần
          </p>
          <StageButton tone="gold" onClick={() => { playSfx('ready'); enterFullscreen(); setPhase('play') }}>▶ Bắt đầu</StageButton>
        </StageModal>
      )}

      {phase === 'done' && (
        <StageModal tone="space">
          {/* GameResultScreen is a fragment; its callers centre it */}
          <div className="flex flex-col items-center">
            <GameResultScreen score={score} total={total} xpEarned={score} wrongWords={wrongWords} onRestart={restart} onExit={exit} />
          </div>
        </StageModal>
      )}
    </ArcadeStage>
  )
}
