'use client'

import { useEffect, useState } from 'react'
import type { PracticeMode } from '@/components/ielts-speaking/batchQuestion'
import type { IeltsSpeakingPart } from '@/lib/ieltsSpeakingTypes'

type Props = {
  part: IeltsSpeakingPart
  onSelectPart: (part: IeltsSpeakingPart) => void
  mode: PracticeMode
  onSelectMode: (mode: PracticeMode) => void
  onStart: () => void
}

const PARTS: Array<{ part: IeltsSpeakingPart; label: string; subtitle: string }> = [
  { part: 1, label: 'Part 1', subtitle: 'Personal interview' },
  { part: 2, label: 'Part 2', subtitle: 'Long turn' },
  { part: 3, label: 'Part 3', subtitle: 'Discussion' },
]

const MODES: Array<{ mode: PracticeMode; icon: string; label: string; desc: string }> = [
  { mode: 'random', icon: '🎲', label: 'Đề ngẫu nhiên', desc: '1 câu bất kỳ, luyện nhanh' },
  { mode: 'choose', icon: '📋', label: 'Tự chọn đề', desc: 'Xem danh sách, chọn câu muốn luyện' },
]

const WELCOME_KEY = 'vw_ielts_speaking_welcome_v1'

export default function SetupScreen({ part, onSelectPart, mode, onSelectMode, onStart }: Props) {
  const [welcomeDismissed, setWelcomeDismissed] = useState(true)

  useEffect(() => {
    setWelcomeDismissed(!!localStorage.getItem(WELCOME_KEY))
  }, [])

  const dismissWelcome = () => {
    localStorage.setItem(WELCOME_KEY, '1')
    setWelcomeDismissed(true)
  }

  return (
    <div>
      <header className="mb-5 rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 px-5 py-5 text-white shadow-lg shadow-indigo-100">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-200">VocabWise Speaking</p>
        <h1 className="mt-1 text-2xl font-black sm:text-3xl">IELTS Speaking Coach</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-indigo-100">
          Luyện đủ ba phần với 80 Part 1 topics và 60 linked Part 2–3 sets, sau đó phát triển chính câu trả lời của bạn từ Band 6 đến Band 9.
        </p>
      </header>

      {!welcomeDismissed && (
        <div className="mb-5 rounded-3xl border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50 p-5">
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-black text-gray-800">👋 Chào mừng đến AI Speak!</h3>
              <p className="mt-0.5 text-xs font-semibold text-gray-400">IELTS Speaking Coach · Part 1, 2 & 3</p>
            </div>
            <button
              type="button"
              onClick={dismissWelcome}
              aria-label="Đóng thông báo chào mừng"
              className="flex-shrink-0 text-lg leading-none text-gray-300 hover:text-gray-500"
            >
              ✕
            </button>
          </div>
          <div className="mb-4 space-y-2.5">
            {[
              { n: '1', icon: '🎯', title: 'Chọn phần thi & cách luyện', desc: 'Đề ngẫu nhiên hoặc tự chọn từ danh sách' },
              { n: '2', icon: '🎤', title: 'Ghi âm hoặc gõ câu trả lời', desc: 'Có thể nghe lại và sửa transcript trước khi chấm' },
              { n: '3', icon: '✨', title: 'Nhận band + model answers', desc: 'Feedback theo tiêu chí, Band 6/7.5/9 giữ ý của bạn' },
            ].map(step => (
              <div key={step.n} className="flex items-center gap-3">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500 text-xs font-black text-white">
                  {step.n}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700">{step.icon} {step.title}</p>
                  <p className="text-xs text-gray-400">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={dismissWelcome}
            className="w-full rounded-2xl bg-indigo-500 py-3 text-sm font-black text-white transition-all active:scale-95 hover:bg-indigo-600"
          >
            Đã hiểu
          </button>
        </div>
      )}

      <section className="rounded-3xl border-2 border-indigo-100 bg-white p-4 shadow-sm sm:p-5">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-gray-500">1 · Chọn phần thi</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {PARTS.map(item => (
              <button
                key={item.part}
                type="button"
                onClick={() => onSelectPart(item.part)}
                className={`rounded-2xl border-2 px-2 py-3 text-center transition-colors ${
                  part === item.part
                    ? 'border-indigo-500 bg-indigo-600 text-white'
                    : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-indigo-200'
                }`}
              >
                <span className="block text-sm font-black">{item.label}</span>
                <span className={`mt-0.5 block text-[10px] font-bold ${part === item.part ? 'text-indigo-100' : 'text-gray-400'}`}>
                  {item.subtitle}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs font-black uppercase tracking-wide text-gray-500">2 · Chọn cách luyện tập</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {MODES.map(item => (
              <button
                key={item.mode}
                type="button"
                onClick={() => onSelectMode(item.mode)}
                className={`rounded-2xl border-2 px-3 py-4 text-left transition-colors ${
                  mode === item.mode
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-100 bg-gray-50 hover:border-indigo-200'
                }`}
              >
                <span className="block text-2xl">{item.icon}</span>
                <span className="mt-1.5 block text-sm font-black text-gray-800">{item.label}</span>
                <span className="mt-0.5 block text-xs text-gray-500">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={onStart}
          className="mt-4 w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3.5 text-sm font-black text-white shadow-md shadow-indigo-100 transition-all active:scale-[0.98]"
        >
          Bắt đầu luyện tập →
        </button>
      </section>
    </div>
  )
}
