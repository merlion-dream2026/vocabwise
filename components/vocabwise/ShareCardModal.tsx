'use client'

type Props = {
  topicTitle: string
  score: number
  maxScore: number
  pct: number
  cefr?: string
  onClose: () => void
}

const MEDAL = (pct: number) => pct === 100 ? '🏆' : pct >= 80 ? '⭐' : pct >= 60 ? '👏' : '💪'

const MESSAGE = (pct: number) =>
  pct === 100 ? 'Hoàn hảo! Tôi đã làm chủ chủ đề này.' :
  pct >= 80   ? 'Tôi vừa thành thạo chủ đề này!' :
  pct >= 60   ? 'Tôi đang tiến bộ rõ rệt!' :
                'Tôi đang nỗ lực học từng ngày!'

export default function ShareCardModal({ topicTitle, score, maxScore, pct, cefr, onClose }: Props) {
  function handleShare() {
    const text = `${MEDAL(pct)} ${MESSAGE(pct)}\n\n📖 Chủ đề: "${topicTitle}"\n🎯 Điểm: ${score}/${maxScore} (${pct}%)\n\n🎓 VocabWise Academic${cefr ? ` · ${cefr}` : ''}\nvocabwise.id.vn`
    if (navigator.share) {
      navigator.share({ title: 'VocabWise — Kết quả học tập', text, url: 'https://vocabwise.id.vn' }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(text).catch(() => {})
      alert('Đã sao chép! Dán vào Zalo/Facebook để chia sẻ.')
    }
  }

  const barW = Math.max(pct, score > 0 ? 4 : 0)

  return (
    <>
      <style>{`
        @media print {
          body > * { display: none !important; }
          #vw-share-card-print { display: flex !important; position: static !important; }
          #vw-share-card-print .no-print { display: none !important; }
        }
      `}</style>

      <div
        id="vw-share-card-print"
        className="fixed inset-0 z-50 flex items-center justify-center p-5 bg-black/70"
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <div className="w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl">

          {/* Action bar */}
          <div className="no-print flex items-center justify-between px-4 py-2.5 bg-gray-900/80 backdrop-blur-sm">
            <button onClick={onClose} className="text-white/50 hover:text-white text-lg font-black">✕</button>
            <p className="text-white/50 text-xs font-semibold">Chụp màn hình để chia sẻ</p>
            <button
              onClick={handleShare}
              className="text-xs font-black bg-white text-purple-700 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
            >
              📤 Chia sẻ
            </button>
          </div>

          {/* ── Share card ───────────────────────────────────── */}
          <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 px-6 pt-8 pb-6 text-white text-center">

            {/* Medal */}
            <div className="text-6xl mb-3">{MEDAL(pct)}</div>

            {/* Message */}
            <p className="font-black text-lg leading-tight mb-1">{MESSAGE(pct)}</p>
            <p className="text-white/70 text-xs mb-5">vocabwise.id.vn</p>

            {/* Score card */}
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-4 py-4 space-y-3 mb-5">
              <p className="text-white/80 text-xs font-semibold uppercase tracking-wide">Chủ đề</p>
              <p className="font-black text-base leading-snug">"{topicTitle}"</p>

              <div className="pt-1">
                <div className="flex items-end justify-between mb-1.5">
                  <p className="text-white/70 text-xs font-semibold">Điểm số</p>
                  <p className="font-black text-xl">
                    {score}
                    <span className="text-white/50 font-normal text-sm"> / {maxScore}</span>
                  </p>
                </div>
                <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-700"
                    style={{ width: `${barW}%` }}
                  />
                </div>
                <p className="text-white/60 text-xs mt-1 text-right">{pct}%</p>
              </div>
            </div>

            {/* Branding */}
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl">🎓</span>
              <div className="text-left">
                <p className="font-black text-sm leading-tight">VocabWise Academic</p>
                {cefr && <p className="text-white/60 text-xs">{cefr} · Từ vựng học thuật</p>}
              </div>
            </div>

          </div>
          {/* ── End share card ───────────────────────────────── */}

        </div>
      </div>
    </>
  )
}
