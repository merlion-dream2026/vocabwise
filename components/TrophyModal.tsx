'use client'

import { useEffect, useState, useRef } from 'react'
import Confetti from '@/components/Confetti'

type Props = {
  topicName: string
  topicEmoji: string
  childName?: string
  levelName?: string
  onDone: () => void
}

const LEVEL_LABELS: Record<string, string> = {
  seeker: 'Pre-A1', starter: 'A1', ranger: 'A2',
  explorer: 'B1', scholar: 'B2', master: 'C1',
}

// "Topic conquered" celebration. Same props and behavior as before (auto-close after 4s, Esc or a
// tap on the backdrop closes, share cancels the auto-close) — restyled: a white card with a golden
// glow, a bigger trophy that pops in and shakes, three stars popping one by one, confetti behind,
// and a gradient headline. All animation is self-contained and off for reduced-motion users.
export default function TrophyModal({ topicName, topicEmoji, childName, levelName, onDone }: Props) {
  const [visible, setVisible] = useState(false)
  const autoCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 50)
    autoCloseRef.current = setTimeout(() => onDone(), 4500)
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onDone() }
    document.addEventListener('keydown', handler)
    return () => {
      clearTimeout(t1)
      if (autoCloseRef.current) clearTimeout(autoCloseRef.current)
      document.removeEventListener('keydown', handler)
    }
  }, [])

  function handleShare() {
    if (autoCloseRef.current) { clearTimeout(autoCloseRef.current); autoCloseRef.current = null }
    const level = levelName ? (LEVEL_LABELS[levelName] ?? levelName) : ''
    const text = [
      `🏆 ${childName ? childName + ' vừa' : 'Vừa'} chinh phục chủ đề ${topicEmoji} ${topicName}!`,
      `📚 VocabWise Daily${level ? ` · ${level}` : ''}`,
      'Học tiếng Anh vui và hiệu quả',
      'vocabwise.id.vn',
    ].join('\n')
    if (navigator.share) {
      navigator.share({ title: 'VocabWise Daily', text, url: 'https://vocabwise.id.vn' }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(text).catch(() => {})
      alert('Đã sao chép! Dán vào Zalo/Facebook để chia sẻ.')
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="trophy-modal-title"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{ background: 'rgba(15,10,40,0.6)', backdropFilter: 'blur(3px)' }}
      onClick={onDone}
    >
      {visible && <Confetti />}

      <div
        className="relative flex w-full max-w-sm flex-col items-center rounded-3xl bg-white px-6 pb-6 pt-8 text-center shadow-2xl"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1) translateY(0)' : 'scale(0.4) translateY(40px)',
          transition: 'opacity .35s ease-out, transform .6s cubic-bezier(.2,.9,.3,1.2)',
          zIndex: 60,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow + trophy */}
        <div className="relative mb-2 flex items-center justify-center" style={{ height: 150, width: 150 }}>
          <div
            className="tm-glow absolute rounded-full"
            style={{ width: 170, height: 170, background: 'radial-gradient(circle, rgba(255,200,0,0.55) 0%, rgba(255,200,0,0) 70%)' }}
          />
          <span className="tm-shine relative" style={{ fontSize: 112, lineHeight: 1, filter: 'drop-shadow(0 6px 14px rgba(255,170,0,0.55))' }}>
            🏆
          </span>
        </div>

        {/* Stars */}
        <div className="mb-3 flex gap-2">
          {['⭐', '⭐', '⭐'].map((s, i) => (
            <span key={i} className="tm-star inline-block text-3xl" style={{ animationDelay: `${0.5 + i * 0.14}s` }}>{s}</span>
          ))}
        </div>

        <h2
          id="trophy-modal-title"
          className="tm-up mb-1 bg-gradient-to-r from-amber-500 via-orange-500 to-pink-500 bg-clip-text text-3xl font-black text-transparent"
          style={{ animationDelay: '0.7s' }}
        >
          Chinh phục hoàn toàn!
        </h2>
        <p className="tm-up mb-1 rounded-full bg-amber-50 px-4 py-1.5 text-base font-bold text-amber-800" style={{ animationDelay: '0.8s' }}>
          {topicEmoji} {topicName}
        </p>
        {childName && (
          <p className="tm-up mt-1 text-sm font-semibold text-gray-500" style={{ animationDelay: '0.9s' }}>
            Giỏi lắm, {childName}! 🎉
          </p>
        )}

        <div className="tm-up mt-5 flex w-full gap-3" style={{ animationDelay: '1s' }}>
          <button
            onClick={handleShare}
            className="flex-1 rounded-2xl border-b-[5px] border-amber-600 bg-amber-400 py-3 text-sm font-black text-amber-950 transition-[transform,border-width] duration-100 active:translate-y-1 active:border-b-[1px]"
          >
            📤 Chia sẻ
          </button>
          <button
            onClick={onDone}
            className="flex-1 rounded-2xl border-b-[5px] border-gray-300 bg-gray-100 py-3 text-sm font-black text-gray-700 transition-[transform,border-width] duration-100 active:translate-y-1 active:border-b-[1px]"
          >
            Tiếp tục →
          </button>
        </div>
      </div>

      <style>{`
        @keyframes tmStar { 0% { opacity: 0; transform: scale(0) rotate(-40deg) } 70% { opacity: 1; transform: scale(1.35) rotate(10deg) } 100% { opacity: 1; transform: scale(1) rotate(0) } }
        @keyframes tmUp { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes tmGlow { 0%, 100% { transform: scale(1); opacity: .6 } 50% { transform: scale(1.2); opacity: 1 } }
        @keyframes tmShine { 0%, 100% { transform: rotate(0) scale(1) } 25% { transform: rotate(-8deg) scale(1.08) } 75% { transform: rotate(8deg) scale(1.08) } }
        .tm-star { opacity: 0; animation: tmStar .45s ease-out both }
        .tm-up { opacity: 0; animation: tmUp .5s ease-out both }
        .tm-glow { animation: tmGlow 1.4s ease-in-out infinite }
        .tm-shine { animation: tmShine 1.2s ease-in-out .6s 2 }
        @media (prefers-reduced-motion: reduce) { .tm-star, .tm-up, .tm-glow, .tm-shine { animation: none !important; opacity: 1 !important } }
      `}</style>
    </div>
  )
}
