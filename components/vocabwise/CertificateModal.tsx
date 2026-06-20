'use client'
import { useState, useRef } from 'react'

type Props = {
  book: string
  bookTitle: string
  cefr: string
  emoji: string
  color: string
  mastered: number
  total: number
  onClose: () => void
}

const BOOK_ACCENT: Record<string, { ring: string; text: string; bar: string }> = {
  book1: { ring: 'ring-emerald-300', text: 'text-emerald-700', bar: 'bg-emerald-500' },
  book2: { ring: 'ring-blue-300',    text: 'text-blue-700',    bar: 'bg-blue-500'    },
  book3: { ring: 'ring-purple-300',  text: 'text-purple-700',  bar: 'bg-purple-600'  },
}

function pad2(n: number) { return String(n).padStart(2, '0') }

export default function CertificateModal({ book, bookTitle, cefr, emoji, color, mastered, total, onClose }: Props) {
  const [name, setName] = useState('')
  const certRef = useRef<HTMLDivElement>(null)

  const today = new Date()
  const dateStr = `${pad2(today.getDate())}/${pad2(today.getMonth() + 1)}/${today.getFullYear()}`
  const pct = total > 0 ? Math.round((mastered / total) * 100) : 0
  const accent = BOOK_ACCENT[book] ?? BOOK_ACCENT.book1

  function handleShare() {
    const text = `Tôi vừa đạt ${mastered}/${total} chủ đề thành thạo trong ${bookTitle} (${cefr}) trên VocabWise! 🎓`
    if (navigator.share) {
      navigator.share({ title: 'VocabWise — Chứng nhận học tập', text, url: 'https://vocabwise.id.vn' }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(text + '\nhttps://vocabwise.id.vn').catch(() => {})
      alert('Đã sao chép nội dung! Dán vào Zalo/Facebook để chia sẻ.')
    }
  }

  function handlePrint() {
    window.print()
  }

  return (
    <>
      {/* Print styles — hide everything except the certificate */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #vw-certificate-print { display: block !important; position: static !important; }
          #vw-certificate-print .no-print { display: none !important; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 no-print"
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <div id="vw-certificate-print" className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* Action bar */}
          <div className="no-print flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-black text-lg">✕</button>
            <p className="text-xs text-gray-400 font-semibold">Chụp màn hình để lưu &amp; chia sẻ</p>
            <div className="flex gap-2">
              <button
                onClick={handleShare}
                className="text-xs font-black bg-indigo-500 text-white px-3 py-1.5 rounded-full active:scale-95 transition-transform"
              >
                📤 Chia sẻ
              </button>
              <button
                onClick={handlePrint}
                className="text-xs font-black bg-gray-200 text-gray-700 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
              >
                🖨
              </button>
            </div>
          </div>

          {/* ── Certificate ────────────────────────────────────── */}
          <div ref={certRef} className="bg-white">

            {/* Header gradient */}
            <div className={`bg-gradient-to-r ${color} px-6 py-5 text-white text-center`}>
              <div className="text-5xl mb-2">{emoji}</div>
              <p className="font-black text-lg leading-tight">{bookTitle}</p>
              <p className="text-white/80 text-xs font-semibold mt-0.5">{cefr} · VocabWise Academic</p>
            </div>

            {/* Body */}
            <div className="px-6 py-5 text-center space-y-4">

              {/* Title */}
              <div>
                <p className="text-gray-400 text-[10px] font-black tracking-widest uppercase">Giấy chứng nhận học tập</p>
                <div className="mt-1.5 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
              </div>

              {/* Intro text */}
              <p className="text-gray-500 text-xs">Chứng nhận rằng học viên</p>

              {/* Name — editable inline */}
              <div className={`mx-auto w-fit min-w-[180px] border-b-2 ${mastered > 0 ? accent.ring.replace('ring-', 'border-') : 'border-gray-200'} pb-1`}>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Nhập tên của bạn"
                  className={`text-center text-xl font-black ${accent.text} bg-transparent outline-none w-full placeholder:text-gray-300 placeholder:font-normal placeholder:text-base`}
                />
              </div>

              {/* Achievement */}
              <div className="space-y-0.5">
                <p className="text-gray-500 text-xs">đã hoàn thành</p>
                <p className={`text-3xl font-black ${accent.text}`}>{mastered}<span className="text-gray-300 font-normal text-xl"> / {total}</span></p>
                <p className="text-gray-600 text-xs font-semibold">chủ đề thành thạo trong {bookTitle}</p>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${accent.bar} rounded-full transition-all duration-700`}
                    style={{ width: `${Math.max(pct, mastered > 0 ? 3 : 0)}%` }}
                  />
                </div>
                <p className="text-gray-400 text-xs">{pct}% hoàn thành · {cefr}</p>
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

              {/* Date & branding */}
              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <span>Ngày cấp: <strong className="text-gray-500">{dateStr}</strong></span>
                <span className="font-black text-gray-500">VocabWise 🏆</span>
              </div>

              <p className="text-[9px] text-gray-300 font-semibold tracking-wide">vocabwise.id.vn</p>

            </div>
          </div>
          {/* ── End Certificate ────────────────────────────────── */}

        </div>
      </div>
    </>
  )
}
