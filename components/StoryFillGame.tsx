'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGameSync } from '@/lib/GameSyncContext'
import Confetti from '@/components/Confetti'
import storiesData from '@/data/stories.json'

type Word = { word: string; meaning: string; emoji: string }
type Topic = { id: string; name: string; emoji: string; color: string; words: Word[] }
type Props = { topic: Topic; level: string; backUrl: string }
type StoryEntry = { emojis: string[]; en: string; vi: string }

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

type Blank = { word: string; options: string[] }

function parseStory(en: string, words: Word[]): { parts: string[]; blanks: Blank[] } | null {
  const wordMap = new Map(words.map(w => [w.word.toLowerCase(), w.word]))
  const boldMatches = Array.from(en.matchAll(/\*\*(.+?)\*\*/g))
  const vocabBolds = boldMatches.filter(m => wordMap.has(m[1].toLowerCase()))
  if (vocabBolds.length === 0) return null

  const blanks: Blank[] = vocabBolds.map(m => {
    const correct = wordMap.get(m[1].toLowerCase()) ?? m[1]
    const distractors = shuffle(words.filter(w => w.word.toLowerCase() !== m[1].toLowerCase())).slice(0, 3).map(w => w.word)
    return { word: correct, options: shuffle([correct, ...distractors]) }
  })

  const parts: string[] = []
  let remaining = en
  for (const m of vocabBolds) {
    const splitIdx = remaining.indexOf(`**${m[1]}**`)
    parts.push(remaining.slice(0, splitIdx).replace(/\*\*/g, ''))
    remaining = remaining.slice(splitIdx + m[0].length)
  }
  parts.push(remaining.replace(/\*\*/g, ''))

  return { parts, blanks }
}

export default function StoryFillGame({ topic, level, backUrl }: Props) {
  const router = useRouter()
  const { recordAnswer, recordActivity, addScore, recordPerfectGame, flush } = useGameSync()

  const storyKey = `${level}.${topic.id}` as keyof typeof storiesData
  const story = (storiesData as Record<string, StoryEntry>)[storyKey] ?? null
  const parsed = story ? parseStory(story.en, topic.words as Word[]) : null

  const [answers, setAnswers] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  if (!story || !parsed) {
    router.push(backUrl)
    return null
  }

  const { parts, blanks } = parsed
  const total = blanks.length
  const allAnswered = blanks.every((_, i) => answers[i] !== undefined)
  const score = submitted ? blanks.filter((b, i) => answers[i]?.toLowerCase() === b.word.toLowerCase()).length : 0

  const handleSelect = (blankIdx: number, word: string) => {
    if (submitted) return
    setAnswers(a => ({ ...a, [blankIdx]: word }))
  }

  const handleSubmit = () => {
    const correctCount = blanks.filter((b, i) => answers[i]?.toLowerCase() === b.word.toLowerCase()).length
    setSubmitted(true)
    addScore(level, Math.round(correctCount * 1.5))
    if (correctCount === total) { recordPerfectGame(level, topic.id, 'storyfill'); setShowConfetti(true) }
    blanks.forEach((b, i) => recordAnswer(level, topic.id, topic.words.find(w => w.word === b.word) ?? { word: b.word, meaning: '', emoji: '' } as Word, answers[i]?.toLowerCase() === b.word.toLowerCase()))
    recordActivity(level)
    flush()
  }

  const restart = () => { setAnswers({}); setSubmitted(false); setShowConfetti(false) }

  return (
    <div className="flex flex-col min-h-screen">
      {showConfetti && <Confetti />}
      <div className="bg-gradient-to-br from-teal-500 to-cyan-500 px-4 pt-12 pb-4 text-white">
        <button onClick={() => router.push(backUrl)} className="text-teal-100 font-bold text-sm flex items-center gap-1 mb-3">← {topic.name}</button>
        <h1 className="text-2xl font-black">📖 Điền vào chuyện</h1>
        <p className="text-teal-100 text-sm mt-0.5">{story.emojis.join(' ')} · Chọn từ đúng cho mỗi ô trống</p>
      </div>

      {submitted && (
        <div className={`px-4 py-3 text-center font-black text-lg ${score === total ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
          {score === total ? '🏆 Hoàn hảo!' : `${score}/${total} đúng`}
          <span className="ml-3 inline-flex items-center gap-1 bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs font-black px-2.5 py-0.5 rounded-full">
            ⭐ +{Math.round(score * 1.5)} XP
          </span>
        </div>
      )}

      <div className="flex-1 bg-gradient-to-b from-teal-50 to-cyan-50 px-4 py-5 overflow-y-auto">
        {/* Story with blanks */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-5 text-base text-gray-700 leading-loose">
          {parts.map((part, i) => (
            <span key={i}>
              {part}
              {i < blanks.length && (() => {
                const ans = answers[i]
                const correct = submitted && ans?.toLowerCase() === blanks[i].word.toLowerCase()
                const wrong = submitted && ans && ans.toLowerCase() !== blanks[i].word.toLowerCase()
                return (
                  <span className={`inline-block min-w-[72px] mx-1 px-2 py-0.5 rounded-lg border-2 text-center font-bold text-sm align-middle
                    ${!ans ? 'border-dashed border-teal-300 bg-teal-50 text-teal-400'
                      : correct ? 'border-green-400 bg-green-50 text-green-700'
                      : wrong ? 'border-red-400 bg-red-50 text-red-600'
                      : 'border-teal-400 bg-teal-50 text-teal-700'}`}>
                    {ans ?? '_ _ _'}
                    {wrong && <span className="block text-xs text-green-600 font-bold">→ {blanks[i].word}</span>}
                  </span>
                )
              })()}
            </span>
          ))}
        </div>

        {/* Option pickers — hidden after submit */}
        {!submitted && blanks.map((blank, i) => (
          <div key={i} className="mb-4">
            <p className="text-xs font-bold text-gray-500 mb-2">Ô trống {i + 1}:</p>
            <div className="grid grid-cols-2 gap-2">
              {blank.options.map(opt => (
                <button key={opt} onClick={() => handleSelect(i, opt)}
                  className={`py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-95 border-2
                    ${answers[i] === opt
                      ? 'bg-teal-500 text-white border-teal-500'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-teal-300'}`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}

        {!submitted ? (
          <button onClick={handleSubmit} disabled={!allAnswered}
            className="w-full bg-teal-500 disabled:bg-teal-200 text-white font-black text-xl py-4 rounded-2xl shadow-md mt-2 mb-6">
            Kiểm tra ✓
          </button>
        ) : (
          <div className="space-y-3 mt-2 mb-6">
            <button onClick={restart} className="w-full bg-teal-500 text-white font-black text-xl py-4 rounded-2xl shadow-lg">🔄 Thử lại</button>
            <button onClick={() => router.push(backUrl)} className="w-full bg-white border-2 border-gray-200 text-gray-600 font-bold text-xl py-4 rounded-2xl">← Chọn chế độ khác</button>
          </div>
        )}
      </div>
    </div>
  )
}
