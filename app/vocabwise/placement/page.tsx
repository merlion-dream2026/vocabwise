'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Question = {
  word: string
  sentence: string
  options: string[]
  correct: number
  book: 1 | 2 | 3
}

const QUESTIONS: Question[] = [
  // ── Book 1 · A1–A2 ───────────────────────────────────────────────────────────
  {
    book: 1, word: 'tidy',
    sentence: 'She always keeps her desk very ___.',
    options: ['gọn gàng', 'ồn ào', 'buồn bã', 'bận rộn'],
    correct: 0,
  },
  {
    book: 1, word: 'polite',
    sentence: 'It is ___ to say "thank you" after receiving a gift.',
    options: ['nguy hiểm', 'lịch sự', 'thú vị', 'bình thường'],
    correct: 1,
  },
  {
    book: 1, word: 'schedule',
    sentence: 'I have a busy ___ this week — three meetings and two classes.',
    options: ['bài kiểm tra', 'kết quả', 'lịch trình', 'chủ đề'],
    correct: 2,
  },
  // ── Book 2 · B1–B2 ───────────────────────────────────────────────────────────
  {
    book: 2, word: 'sustainable',
    sentence: 'The company shifted to ___ energy sources to reduce its carbon footprint.',
    options: ['hiện đại', 'tiết kiệm', 'phổ biến', 'bền vững'],
    correct: 3,
  },
  {
    book: 2, word: 'anxious',
    sentence: 'She felt ___ before the important job interview.',
    options: ['lo lắng', 'hào hứng', 'tự tin', 'thất vọng'],
    correct: 0,
  },
  {
    book: 2, word: 'negotiate',
    sentence: 'The two sides met to ___ the terms of the new agreement.',
    options: ['từ chối', 'đàm phán', 'chấp nhận', 'công bố'],
    correct: 1,
  },
  {
    book: 2, word: 'phenomenon',
    sentence: 'Climate change is a global ___ that affects every country.',
    options: ['vấn đề', 'giải pháp', 'hiện tượng', 'hậu quả'],
    correct: 2,
  },
  // ── Book 3 · C1–C2 ───────────────────────────────────────────────────────────
  {
    book: 3, word: 'eloquent',
    sentence: 'The leader gave an ___ speech that moved the entire audience.',
    options: ['dài dòng', 'bí ẩn', 'nghiêm túc', 'hùng hồn'],
    correct: 3,
  },
  {
    book: 3, word: 'complacent',
    sentence: 'After years of success, the team grew ___ and stopped pushing boundaries.',
    options: ['tự mãn', 'bối rối', 'kiên nhẫn', 'tham vọng'],
    correct: 0,
  },
  {
    book: 3, word: 'scrutinize',
    sentence: 'Auditors will ___ every transaction before the report is finalised.',
    options: ['phê duyệt', 'kiểm tra kỹ', 'lưu trữ', 'công bố'],
    correct: 1,
  },
]

const BOOK_INFO = {
  1: {
    slug: 'book1', emoji: '🌱',
    title: 'VocabWise Foundation',
    cefr: 'A1–A2',
    color: 'from-green-400 to-emerald-500',
    bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
    border: 'border-emerald-200',
    btn: 'bg-emerald-500 hover:bg-emerald-600',
    desc: 'Từ vựng nền tảng cho người mới bắt đầu. Các chủ đề quen thuộc trong cuộc sống hàng ngày, trường học và giao tiếp cơ bản.',
  },
  2: {
    slug: 'book2', emoji: '🚀',
    title: 'VocabWise Progress',
    cefr: 'B1–B2',
    color: 'from-blue-500 to-cyan-500',
    bg: 'bg-gradient-to-br from-blue-50 to-cyan-50',
    border: 'border-blue-200',
    btn: 'bg-blue-500 hover:bg-blue-600',
    desc: 'Từ vựng trung cấp về xã hội, môi trường, kinh doanh và văn hoá. Phù hợp để luyện IELTS 5.5–6.5.',
  },
  3: {
    slug: 'book3', emoji: '🎓',
    title: 'VocabWise Mastery',
    cefr: 'C1–C2',
    color: 'from-purple-600 to-violet-600',
    bg: 'bg-gradient-to-br from-purple-50 to-violet-50',
    border: 'border-purple-200',
    btn: 'bg-purple-600 hover:bg-purple-700',
    desc: 'Từ vựng học thuật nâng cao, collocation và idiom phức tạp. Hướng tới IELTS 7.0+ và SAT.',
  },
}

const OPTION_LABELS = ['A', 'B', 'C', 'D']

function getRecommendation(answers: (boolean | null)[]): 1 | 2 | 3 {
  const b1 = answers.slice(0, 3).filter(Boolean).length   // max 3
  const b2 = answers.slice(3, 7).filter(Boolean).length   // max 4
  const b3 = answers.slice(7, 10).filter(Boolean).length  // max 3
  if (b3 >= 2) return 3
  if (b2 >= 3 || (b2 >= 2 && b1 === 3)) return 2
  return 1
}

export default function PlacementPage() {
  const router = useRouter()
  const [current, setCurrent]     = useState(0)
  const [answers, setAnswers]     = useState<(boolean | null)[]>(Array(10).fill(null))
  const [selected, setSelected]   = useState<number | null>(null)
  const [phase, setPhase]         = useState<'quiz' | 'result'>('quiz')

  const q = QUESTIONS[current]
  const totalCorrect = answers.filter(Boolean).length

  function handleSelect(idx: number) {
    if (selected !== null) return
    const correct = idx === q.correct
    const next = [...answers]
    next[current] = correct
    setAnswers(next)
    setSelected(idx)

    setTimeout(() => {
      if (current < QUESTIONS.length - 1) {
        setCurrent(c => c + 1)
        setSelected(null)
      } else {
        setPhase('result')
      }
    }, 900)
  }

  const book = getRecommendation(answers)
  const info = BOOK_INFO[book]

  if (phase === 'result') {
    return (
      <div className={`min-h-screen ${info.bg} flex flex-col`}>
        {/* Header */}
        <div className={`bg-gradient-to-r ${info.color} text-white px-4 py-5`}>
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <button onClick={() => router.push('/vocabwise')} aria-label="Quay lại" className="text-white/70 hover:text-white text-xl">←</button>
            <div>
              <h1 className="font-black text-lg">Kết quả cấp độ</h1>
              <p className="text-white/70 text-xs">Đúng {totalCorrect}/10 câu</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="max-w-sm w-full space-y-5">

            {/* Score ring */}
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br ${info.color} text-white shadow-lg mb-3`}>
                <span className="text-4xl">{info.emoji}</span>
              </div>
              <p className="text-gray-500 text-sm font-semibold">Chúng tôi đề xuất</p>
              <h2 className="text-2xl font-black text-gray-800 mt-0.5">{info.title}</h2>
              <span className={`inline-block mt-1 text-xs font-black px-3 py-1 rounded-full bg-gradient-to-r ${info.color} text-white`}>{info.cefr}</span>
            </div>

            {/* Description card */}
            <div className={`${info.bg} border-2 ${info.border} rounded-2xl p-4`}>
              <p className="text-gray-700 text-sm leading-relaxed">{info.desc}</p>
            </div>

            {/* Score breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 space-y-2">
              {([1, 2, 3] as const).map(b => {
                const slice = b === 1 ? answers.slice(0, 3) : b === 2 ? answers.slice(3, 7) : answers.slice(7, 10)
                const max   = slice.length
                const score = slice.filter(Boolean).length
                const bi    = BOOK_INFO[b]
                return (
                  <div key={b} className="flex items-center gap-3">
                    <span className="text-lg w-6 text-center">{bi.emoji}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs font-semibold text-gray-500 mb-1">
                        <span>{bi.cefr}</span>
                        <span>{score}/{max}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${bi.color} rounded-full transition-all duration-700`}
                          style={{ width: `${max > 0 ? (score / max) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* CTAs */}
            <div className="space-y-2">
              <Link
                href={`/vocabwise/${info.slug}`}
                className={`w-full flex items-center justify-center gap-2 ${info.btn} text-white font-black text-base py-4 rounded-2xl shadow-md active:scale-95 transition-all`}
              >
                Bắt đầu {info.title} →
              </Link>
              <button
                onClick={() => router.push('/vocabwise')}
                className="w-full text-gray-400 text-sm font-semibold py-2"
              >
                Xem tất cả cấp độ
              </button>
            </div>

          </div>
        </div>
      </div>
    )
  }

  // ── Quiz screen ──────────────────────────────────────────────────────────────
  const progress = ((current) / QUESTIONS.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => router.push('/vocabwise')} className="text-white/70 hover:text-white text-xl flex-shrink-0">←</button>
          <div className="flex-1">
            <div className="flex justify-between text-xs text-white/80 font-semibold mb-1.5">
              <span>Bài kiểm tra cấp độ</span>
              <span>{current + 1} / {QUESTIONS.length}</span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6">
        <div className="max-w-sm w-full space-y-5">

          {/* Word card */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 px-6 py-6 text-center">
            <div className="inline-block bg-indigo-50 text-indigo-600 text-xs font-black px-3 py-1 rounded-full mb-3">
              {q.book === 1 ? 'A1–A2' : q.book === 2 ? 'B1–B2' : 'C1–C2'}
            </div>
            <p className="text-4xl font-black text-gray-800 mb-3">{q.word}</p>
            <p className="text-gray-500 text-sm leading-relaxed italic">&quot;{q.sentence}&quot;</p>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {q.options.map((opt, idx) => {
              let cls = 'bg-white border-2 border-gray-100 text-gray-700'
              if (selected !== null) {
                if (idx === q.correct) cls = 'bg-green-50 border-2 border-green-400 text-green-700'
                else if (idx === selected) cls = 'bg-red-50 border-2 border-red-400 text-red-600'
                else cls = 'bg-white border-2 border-gray-100 text-gray-300'
              }
              return (
                <button
                  key={idx}
                  onClick={() => handleSelect(idx)}
                  disabled={selected !== null}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-semibold text-sm text-left transition-all active:scale-[0.98] shadow-sm ${cls}`}
                >
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0
                    ${selected === null ? 'bg-indigo-100 text-indigo-600' :
                      idx === q.correct ? 'bg-green-400 text-white' :
                      idx === selected ? 'bg-red-400 text-white' : 'bg-gray-100 text-gray-300'}`}>
                    {OPTION_LABELS[idx]}
                  </span>
                  {opt}
                </button>
              )
            })}
          </div>

        </div>
      </div>
    </div>
  )
}
