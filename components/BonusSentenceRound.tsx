'use client'
import { useState } from 'react'

export type BonusQuestion = { targetWord: string; exampleVi: string }
type BonusResult = { score: number; passed: boolean; used_correctly: boolean; grammar_ok: boolean; feedback_vi: string; improved: string }

// Optional "Bonus — Viết câu" round: Vietnamese cue → English sentence, graded by AI
// via the shared /api/grade-sentence endpoint. Does not count toward the parent
// test's main score/max — pass/fail only, shown as a separate badge by the caller.
export default function BonusSentenceRound({
  questions, accentCls, onDone, onSkip,
}: {
  questions: BonusQuestion[]
  accentCls: string
  onDone: (passed: number, total: number) => void
  onSkip: () => void
}) {
  const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ''))
  const [submitting, setSubmitting] = useState(false)
  const [results, setResults] = useState<BonusResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const filledCount = answers.filter(a => a.trim()).length

  async function submit() {
    setSubmitting(true); setError(null)
    try {
      const res = await fetch('/api/grade-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: questions.map((q, i) => ({ targetWord: q.targetWord, exampleVi: q.exampleVi, sentence: answers[i] })),
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? 'Có lỗi khi chấm bài, thử lại nhé.')
        setSubmitting(false)
        return
      }
      const data = await res.json()
      setResults(data.results)
    } catch {
      setError('Lỗi kết nối. Thử lại nhé.')
    }
    setSubmitting(false)
  }

  if (results) {
    const passedCount = results.filter(r => r.passed).length
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between text-xs text-gray-400 font-bold">
          <span>🌟 Kết quả Bonus — Viết câu</span>
          <span>{passedCount}/{results.length} đạt</span>
        </div>
        {questions.map((q, i) => {
          const r = results[i]
          const cls = r.passed ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
          return (
            <div key={i} className={`rounded-2xl border-2 p-4 ${cls}`}>
              <div className="flex justify-between items-start gap-2 mb-1">
                <p className="font-black text-gray-700 text-sm">Câu {i + 1} · &quot;{q.targetWord}&quot;</p>
                <span className={`text-xs font-black flex-shrink-0 ${r.passed ? 'text-green-600' : 'text-amber-600'}`}>{r.passed ? '✓ Đạt' : 'Chưa đạt'}</span>
              </div>
              <p className="text-xs text-gray-500 mb-1.5">🇻🇳 {q.exampleVi}</p>
              <p className="text-sm text-gray-800 font-semibold mb-1.5">
                {answers[i]?.trim() ? answers[i] : <em className="text-gray-300 font-normal">(bỏ trống)</em>}
              </p>
              {answers[i]?.trim() && (
                <p className="text-xs font-bold text-gray-500 mb-1">
                  {r.used_correctly ? '✅ Dùng từ đúng' : '⚠️ Dùng từ chưa đúng'}
                  {' · '}
                  {r.grammar_ok ? '✅ Ngữ pháp tốt' : '⚠️ Ngữ pháp cần sửa'}
                </p>
              )}
              <p className="text-xs text-blue-600">{r.feedback_vi}</p>
              {r.improved && <p className="text-xs text-green-600 mt-1">✓ Gợi ý: &ldquo;{r.improved}&rdquo;</p>}
            </div>
          )
        })}
        <button onClick={() => onDone(passedCount, results.length)}
          className={`w-full font-black py-4 rounded-2xl text-base active:scale-95 transition-all shadow-md text-white ${accentCls}`}>
          Xem kết quả →
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-400">🌟 Bonus — Viết câu (không bắt buộc)</span>
        <button onClick={onSkip} className="text-xs text-gray-400 underline font-semibold flex-shrink-0">Bỏ qua →</button>
      </div>
      <p className="text-xs text-gray-400 -mt-2">Dịch câu tiếng Việt sang tiếng Anh, dùng đúng từ mục tiêu. AI sẽ chấm và góp ý.</p>
      {questions.map((q, i) => (
        <div key={i} className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-4">
          <p className="text-xs font-bold text-gray-500 mb-1.5">Câu {i + 1} · từ mục tiêu: &quot;{q.targetWord}&quot;</p>
          <p className="text-sm text-gray-700 mb-2">🇻🇳 {q.exampleVi}</p>
          <textarea
            value={answers[i]}
            onChange={e => setAnswers(a => a.map((v, j) => j === i ? e.target.value : v))}
            placeholder="🇬🇧 Viết câu tiếng Anh..."
            rows={2}
            className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium outline-none focus:border-gray-400 transition-colors resize-none"
          />
        </div>
      ))}
      {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
      <div className="flex gap-3">
        <button onClick={onSkip} className="flex-1 bg-white border-2 border-gray-100 text-gray-500 font-bold py-3 rounded-2xl active:scale-95 transition-all">Bỏ qua</button>
        <button onClick={submit} disabled={submitting}
          className={`flex-1 font-black py-3 rounded-2xl shadow-md text-white active:scale-95 transition-all disabled:opacity-50 ${accentCls}`}>
          {submitting ? 'Đang chấm...' : `Nộp (${filledCount}/${questions.length})`}
        </button>
      </div>
    </div>
  )
}
