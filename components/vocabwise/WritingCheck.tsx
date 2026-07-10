'use client'
import { useState } from 'react'

type Feedback = {
  score: number
  used_correctly: boolean
  grammar_ok: boolean
  feedback_vi: string
  improved: string
}

type Props = {
  words: string[]
  cefr: string
}

export default function WritingCheck({ words, cefr }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [sentence, setSentence] = useState('')
  const [loading, setLoading]   = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [error, setError]       = useState<string | null>(null)

  const reset = () => {
    setSentence('')
    setFeedback(null)
    setError(null)
  }

  const handleWordSelect = (word: string) => {
    setSelected(word)
    reset()
  }

  const handleSubmit = async () => {
    if (!selected || !sentence.trim() || loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/vocabwise/writing-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetWord: selected, sentence: sentence.trim(), cefr }),
      })
      if (!res.ok) throw new Error('error')
      const d: Feedback = await res.json()
      setFeedback(d)
    } catch {
      setError('Không thể chấm bài. Thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  const scoreColor = (s: number) =>
    s >= 8 ? 'text-green-600 bg-green-50 border-green-200'
    : s >= 5 ? 'text-yellow-600 bg-yellow-50 border-yellow-200'
    : 'text-red-600 bg-red-50 border-red-200'

  return (
    <div className="bg-white border-2 border-indigo-100 rounded-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3">
        <p className="text-white font-black text-sm">✍️ Thực hành viết câu</p>
        <p className="text-indigo-200 text-xs mt-0.5">Chọn từ → viết câu → AI chấm và góp ý</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Word chips */}
        <div>
          <p className="text-xs font-black text-gray-500 uppercase tracking-wide mb-2">Chọn từ</p>
          <div className="flex flex-wrap gap-2">
            {words.map(w => (
              <button key={w} onClick={() => handleWordSelect(w)}
                className={`px-3 py-1.5 rounded-xl text-sm font-bold border-2 transition-all active:scale-95 ${
                  selected === w
                    ? 'bg-indigo-500 text-white border-indigo-500'
                    : 'bg-white text-indigo-600 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50'
                }`}>
                {w}
              </button>
            ))}
          </div>
        </div>

        {selected && !feedback && (
          <>
            <div>
              <p className="text-xs font-black text-gray-500 uppercase tracking-wide mb-2">
                Viết câu dùng từ <em className="text-indigo-600 not-italic font-black">{selected}</em>
              </p>
              <textarea
                value={sentence}
                onChange={e => setSentence(e.target.value)}
                placeholder={`Ví dụ: The manager ${selected} the team effectively.`}
                className="w-full border-2 border-indigo-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-indigo-400 resize-none leading-relaxed"
                rows={3}
                autoCapitalize="off"
                autoCorrect="off"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={!sentence.trim() || loading}
              className={`w-full font-black py-3 rounded-2xl transition-all active:scale-95 text-sm ${
                sentence.trim() && !loading
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}>
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Đang chấm bài...
                  </span>
                : '📤 Nộp bài'}
            </button>
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
          </>
        )}

        {feedback && (
          <div className="space-y-3">
            {/* Score */}
            <div className={`flex items-center justify-between border-2 rounded-xl px-4 py-3 ${scoreColor(feedback.score)}`}>
              <div>
                <p className="font-black text-lg">{feedback.score}/10</p>
                <p className="text-xs font-bold mt-0.5">
                  {feedback.used_correctly ? '✅ Dùng từ đúng' : '⚠️ Dùng từ chưa đúng'}
                  {' · '}
                  {feedback.grammar_ok ? '✅ Ngữ pháp tốt' : '⚠️ Ngữ pháp cần sửa'}
                </p>
              </div>
              <div className="text-3xl">
                {feedback.score >= 8 ? '🌟' : feedback.score >= 5 ? '👏' : '💪'}
              </div>
            </div>

            {/* Feedback */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5">
              <p className="text-xs font-black text-blue-600 mb-1">Nhận xét</p>
              <p className="text-xs text-blue-800 leading-relaxed">{feedback.feedback_vi}</p>
            </div>

            {/* Improved version */}
            {feedback.improved && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                <p className="text-xs font-black text-green-600 mb-1">✨ Câu cải thiện</p>
                <p className="text-xs text-green-800 font-bold italic leading-relaxed">&quot;{feedback.improved}&quot;</p>
              </div>
            )}

            {/* Try another */}
            <button onClick={reset}
              className="w-full border-2 border-indigo-200 text-indigo-600 font-black py-2.5 rounded-2xl text-sm active:scale-95 transition-all hover:bg-indigo-50">
              Viết câu khác →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
