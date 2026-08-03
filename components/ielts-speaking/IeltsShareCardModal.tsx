'use client'
import { useEffect } from 'react'
import type { IeltsSpeakingPart } from '@/lib/ieltsSpeakingTypes'

type Props = {
  part: IeltsSpeakingPart
  topic: string
  band: number
  onClose: () => void
}

const MEDAL = (band: number) => band >= 8 ? '🏆' : band >= 7 ? '⭐' : band >= 6 ? '👏' : '💪'

const MESSAGE = (band: number) =>
  band >= 8 ? 'Band ước lượng xuất sắc!' :
  band >= 7 ? 'Tôi đang tiến gần mục tiêu Band 7+!' :
  band >= 6 ? 'Tôi đang tiến bộ rõ rệt!' :
              'Tôi đang luyện IELTS Speaking mỗi ngày!'

export default function IeltsShareCardModal({ part, topic, band, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  function handleShare() {
    const text = `${MEDAL(band)} ${MESSAGE(band)}\n\n🎙️ IELTS Speaking Part ${part}\n📋 Chủ đề: "${topic}"\n🎯 Band ước lượng: ${band.toFixed(1)}\n(Ước lượng hỗ trợ luyện tập, không phải kết quả IELTS chính thức)\n\n🎓 VocabWise AI Speak\nvocabwise.id.vn`
    if (navigator.share) {
      navigator.share({ title: 'VocabWise — AI Speak', text, url: 'https://vocabwise.id.vn' }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(text).catch(() => {})
      alert('Đã sao chép! Dán vào Zalo/Facebook để chia sẻ.')
    }
  }

  const barW = Math.max((band / 9) * 100, 4)

  return (
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          #vw-ielts-share-print { display: flex !important; position: static !important; }
          #vw-ielts-share-print .no-print { display: none !important; }
        }
      `}</style>

      <div
        id="vw-ielts-share-print"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vw-ielts-share-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/70"
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <div className="w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl">

          {/* Action bar */}
          <div className="no-print flex items-center justify-between px-4 py-2.5 bg-gray-900/80 backdrop-blur-sm">
            <button onClick={onClose} aria-label="Đóng" className="text-white/50 hover:text-white text-lg font-black">✕</button>
            <p className="text-white/50 text-xs font-semibold">Chụp màn hình để chia sẻ</p>
            <button
              onClick={handleShare}
              className="text-xs font-black bg-white text-indigo-700 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
            >
              📤 Chia sẻ
            </button>
          </div>

          {/* ── Share card ───────────────────────────────────── */}
          <div className="bg-gradient-to-br from-indigo-600 via-purple-700 to-fuchsia-600 px-6 pt-8 pb-6 text-white text-center">

            {/* Medal */}
            <div className="text-6xl mb-3">{MEDAL(band)}</div>

            {/* Message */}
            <p id="vw-ielts-share-title" className="font-black text-lg leading-tight mb-1">{MESSAGE(band)}</p>
            <p className="text-white/70 text-xs mb-5">vocabwise.id.vn</p>

            {/* Band card */}
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-4 space-y-3 mb-5">
              <p className="text-white/80 text-xs font-semibold uppercase tracking-wide">IELTS Speaking Part {part}</p>
              <p className="font-black text-base leading-snug">&quot;{topic}&quot;</p>

              <div className="pt-1">
                <div className="flex items-end justify-between mb-1.5">
                  <p className="text-white/70 text-xs font-semibold">Band ước lượng</p>
                  <p className="font-black text-xl">
                    {band.toFixed(1)}
                    <span className="text-white/50 font-normal text-sm"> / 9</span>
                  </p>
                </div>
                <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-700"
                    style={{ width: `${barW}%` }}
                  />
                </div>
                <p className="text-white/60 text-xs mt-1 text-right">Ước lượng, không phải điểm IELTS chính thức</p>
              </div>
            </div>

            {/* Branding */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl">🎙️</span>
              <div className="text-left">
                <p className="font-black text-sm leading-tight">VocabWise AI Speak</p>
                <p className="text-white/60 text-xs">IELTS Speaking Coach</p>
              </div>
            </div>

          </div>
          {/* ── End share card ───────────────────────────────── */}

        </div>
      </div>
    </>
  )
}
