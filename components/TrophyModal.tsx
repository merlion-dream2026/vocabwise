'use client'

import { useEffect, useState } from 'react'

type Props = {
  topicName: string
  topicEmoji: string
  onDone: () => void
}

export default function TrophyModal({ topicName, topicEmoji, onDone }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Trigger entrance animation after mount
    const t1 = setTimeout(() => setVisible(true), 50)
    const t2 = setTimeout(() => onDone(), 3500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

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

        <p
          className="text-white/50 text-xs mt-6 font-semibold"
          style={{ animation: visible ? 'fadeInUp 0.5s 1s both' : 'none' }}
        >
          Chạm để đóng
        </p>
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
