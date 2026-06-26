'use client'
import { useState } from 'react'
import type { MCQItem, SentenceItem, GapFillItem } from './types'
import E3MCQContext from './E3MCQContext'
import E7SentenceBuilding from './E7SentenceBuilding'
import E4GapFill from './E4GapFill'

export type GrammarSpotlightData = {
  grammar_point: string
  vi_grammar_point: string
  level: string
  source_ref: string
  form: { positive: string; negative?: string; question?: string; variant?: string }
  rule_vi: string
  rule_en: string
  common_error: string
  in_context: string[]
  ex1_mcq: { instruction: string; items: MCQItem[] }
  ex2_scramble: { instruction: string; items: SentenceItem[] }
  ex3_gap_fill: { instruction: string; word_bank: string[]; items: GapFillItem[] }
}

type Phase = 'theory' | 'ex1' | 'ex2' | 'ex3' | 'done'

function renderBold(text: string) {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong class="text-green-700 font-black">$1</strong>')
}

export default function GrammarSpotlight({ data }: { data: GrammarSpotlightData }) {
  const [phase, setPhase]   = useState<Phase>('theory')
  const [scores, setScores] = useState<number[]>([])

  const maxScore = data.ex1_mcq.items.length + data.ex2_scramble.items.length + data.ex3_gap_fill.items.length
  const total    = scores.reduce((a, b) => a + b, 0)

  const handleScore = (score: number, next: Phase) => {
    setScores(s => [...s, score])
    setPhase(next)
  }

  const reset = () => { setPhase('theory'); setScores([]) }

  return (
    <div className="space-y-4">
      {/* Badge header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">📖</span>
          <div>
            <p className="font-black text-gray-800 text-base">{data.grammar_point}</p>
            <p className="text-gray-500 text-xs">{data.vi_grammar_point} · {data.level}</p>
          </div>
        </div>
        {phase === 'done' && (
          <span className="text-xs font-black bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
            {total}/{maxScore} ✓
          </span>
        )}
      </div>

      {/* THEORY */}
      {phase === 'theory' && (
        <>
          {/* Form box */}
          <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 space-y-1.5">
            <p className="text-xs font-black text-green-600 uppercase tracking-wide mb-2">Cấu trúc</p>
            <p className="font-mono text-sm text-gray-700">✚ {data.form.positive}</p>
            {data.form.negative && <p className="font-mono text-sm text-gray-500">✖ {data.form.negative}</p>}
            {data.form.question && <p className="font-mono text-sm text-blue-600">? {data.form.question}</p>}
            {data.form.variant  && <p className="font-mono text-sm text-purple-600">↳ {data.form.variant}</p>}
          </div>

          {/* Rules */}
          <div className="space-y-1.5 px-1">
            <p className="text-sm text-gray-700 leading-relaxed">
              <span className="font-black text-green-700">VI: </span>{data.rule_vi}
            </p>
            <p className="text-sm text-gray-500 leading-relaxed italic">
              <span className="font-black not-italic text-gray-600">EN: </span>{data.rule_en}
            </p>
          </div>

          {/* Common error */}
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-sm text-red-700">
            <span className="font-black">⚠️ Lỗi thường gặp: </span>{data.common_error}
          </div>

          {/* In context */}
          <div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-wide mb-2">Trong bài đọc</p>
            <div className="space-y-1.5">
              {data.in_context.map((s, i) => (
                <p key={i} className="text-sm text-gray-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderBold(s) }} />
              ))}
            </div>
          </div>

          <button
            onClick={() => setPhase('ex1')}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-400 text-white font-black py-3 rounded-2xl shadow active:scale-95 transition-all"
          >
            ▶ Bắt đầu luyện →
          </button>

          <p className="text-xs text-gray-400 text-center pb-1">Nguồn: {data.source_ref}</p>
        </>
      )}

      {/* EX 1 — MCQ */}
      {phase === 'ex1' && (
        <>
          <p className="text-xs font-black text-green-600 uppercase tracking-wide">Bài 1 / 3 — Trắc nghiệm</p>
          <E3MCQContext
            instruction={data.ex1_mcq.instruction}
            items={data.ex1_mcq.items}
            onDone={score => handleScore(score, 'ex2')}
          />
        </>
      )}

      {/* EX 2 — Scramble */}
      {phase === 'ex2' && (
        <>
          <p className="text-xs font-black text-green-600 uppercase tracking-wide">Bài 2 / 3 — Sắp xếp câu</p>
          <E7SentenceBuilding
            instruction={data.ex2_scramble.instruction}
            items={data.ex2_scramble.items}
            onDone={score => handleScore(score, 'ex3')}
          />
        </>
      )}

      {/* EX 3 — Gap Fill */}
      {phase === 'ex3' && (
        <>
          <p className="text-xs font-black text-green-600 uppercase tracking-wide">Bài 3 / 3 — Điền từ</p>
          <E4GapFill
            instruction={data.ex3_gap_fill.instruction}
            wordBank={data.ex3_gap_fill.word_bank}
            items={data.ex3_gap_fill.items}
            onDone={score => handleScore(score, 'done')}
          />
        </>
      )}

      {/* DONE */}
      {phase === 'done' && (
        <div className="text-center space-y-3 py-4">
          <div className="text-4xl">{total >= Math.ceil(maxScore * 0.8) ? '🎉' : '💪'}</div>
          <p className="font-black text-green-700 text-lg">{total}/{maxScore} điểm</p>
          <p className="text-gray-500 text-sm leading-relaxed">
            {total >= Math.ceil(maxScore * 0.8)
              ? 'Xuất sắc! Bạn đã nắm vững điểm ngữ pháp này.'
              : 'Cố gắng thêm nhé! Xem lại lý thuyết và thử lại.'}
          </p>
          <button onClick={reset} className="text-sm font-black text-green-600 hover:text-green-700 underline">
            Xem lại lý thuyết
          </button>
        </div>
      )}
    </div>
  )
}
