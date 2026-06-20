'use client'

import { useEffect, useState, useRef } from 'react'

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

export default function TrophyModal({ topicName, topicEmoji, childName, levelName, onDone }: Props) {
  const [visible, setVisible] = useState(false)
  const autoCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 50)
    autoCloseRef.current = setTimeout(() => onDone(), 4000)
    return () => { clearTimeout(t1); if (autoCloseRef.current) clearTimeout(autoCloseRef.current) }
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
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onDone}
    >
      {/* Trophy burst */}
      <div
        className="flex flex-col items-center transition-all duration-700 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.3)',
        }}
      >
        {/* Glow ring */}
        <div className="relative flex items-center justify-center mb-4">
          <div
            className="absolute rounded-full"
            style={{
              width: 140,
              height: 140,
              background: 'radial-gradient(circle, rgba(255,215,0,0.5) 0%, rgba(255,215,0,0) 70%)',
              animation: visible ? 'pulse 1.2s ease-in-out infinite' : 'none',
            }}
          />
          <span style={{ fontSize: 96, lineHeight: 1, filter: 'drop-shadow(0 4px 16px rgba(255,180,0,0.7))' }}>
            🏆
          </span>
        </div>

        {/* Stars */}
        <div className="flex gap-2 mb-4" style={{ animation: visible ? 'fadeInUp 0.5s 0.4s both' : 'none' }}>
          {['⭐', '⭐', '⭐'].map((s, i) => (
            <span
              key={i}
              style={{
                fontSize: 28,
                animation: visible ? `starPop 0.4s ${0.5 + i * 0.12}s both` : 'none',
                display: 'inline-block',
              }}
            >
              {s}
            </span>
          ))}
        </div>

        {/* Text */}
        <div
          className="text-center px-6"
          style={{ animation: visible ? 'fadeInUp 0.5s 0.6s both' : 'none' }}
        >
          <p className="text-white font-black text-2xl mb-1">Chinh phục hoàn toàn!</p>
          <p className="text-yellow-200 font-bold text-lg">
            {topicEmoji} {topicName}
          </p>
        </div>

        <div
          className="flex gap-3 mt-6"
          style={{ animation: visible ? 'fadeInUp 0.5s 0.9s both' : 'none' }}
        >
          <button
            onClick={handleShare}
            className="bg-yellow-400 hover:bg-yellow-300 text-yellow-900 font-black text-sm px-5 py-2.5 rounded-2xl active:scale-95 transition-transform"
          >
            📤 Chia sẻ
          </button>
          <button
            onClick={onDone}
            className="bg-white/20 hover:bg-white/30 text-white font-black text-sm px-5 py-2.5 rounded-2xl active:scale-95 transition-transform"
          >
            Tiếp tục →
          </button>
        </div>
      </div>

      <style>{`
        @keyframes starPop {
          0%   { opacity: 0; transform: scale(0) rotate(-30deg); }
          70%  { transform: scale(1.3) rotate(10deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50%       { transform: scale(1.3); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
