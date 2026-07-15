'use client'
import { useState } from 'react'
import Image from 'next/image'

const SCREENSHOTS = [
  { src: '/screenshots/select%20profile.jpg',              caption: 'Mỗi bé một hồ sơ riêng' },
  { src: '/screenshots/select%20level.jpg',                caption: '6 cấp độ từ Pre-A1 đến C1-C2' },
  { src: '/screenshots/select%20vocab%20topic.jpg',        caption: '30 chủ đề · 4.500+ từ vựng' },
  { src: '/screenshots/select%20game.jpg',                 caption: '10 trò chơi đa dạng mỗi chủ đề' },
  { src: '/screenshots/demo%20flashcard.jpg',              caption: 'Flashcard — học từ trong ngữ cảnh' },
  { src: '/screenshots/demo%20game%20ghep%20chu.jpg',      caption: 'Ghép chữ — luyện chính tả vui' },
  { src: '/screenshots/demo%20game%20phat%20am%20cung%20AI.jpg', caption: '🎤 AI chấm phát âm ngay lập tức' },
  { src: '/screenshots/demo%20game%20sap%20xep%20cau.jpg', caption: 'Sắp xếp câu — hiểu ngữ pháp tự nhiên' },
  { src: '/screenshots/luyen%20phat%20am.jpg',             caption: 'Phát âm IPA — nguyên âm & phụ âm' },
  { src: '/screenshots/parent%20dashboard%201.jpg',        caption: 'Ba/Mẹ theo dõi tiến độ mỗi ngày' },
  { src: '/screenshots/parent%20dashboard%202.jpg',        caption: 'Streak · Badges · Từ yếu cần ôn' },
]

type Screenshot = { src: string; caption: string }

export default function LandingScreenshotGallery() {
  const [activeScreenshot, setActiveScreenshot] = useState<Screenshot | null>(null)

  return (
    <>
      {activeScreenshot && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center px-4"
          onClick={() => setActiveScreenshot(null)}>
          <div className="relative w-full max-w-md flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between w-full mb-3 px-1">
              <p className="text-white font-black text-sm">{activeScreenshot.caption}</p>
              <button onClick={() => setActiveScreenshot(null)} className="text-white/70 hover:text-white font-black text-sm ml-4 flex-shrink-0">✕ Đóng</button>
            </div>
            <div className="relative w-full rounded-2xl shadow-2xl overflow-hidden" style={{ height: '90dvh' }}>
              <Image src={activeScreenshot.src} alt={activeScreenshot.caption} fill sizes="448px" className="object-contain" />
            </div>
            <div className="flex gap-3 mt-4">
              {(() => {
                const idx = SCREENSHOTS.findIndex(s => s.src === activeScreenshot.src)
                return (
                  <>
                    <button
                      onClick={() => setActiveScreenshot(SCREENSHOTS[(idx - 1 + SCREENSHOTS.length) % SCREENSHOTS.length])}
                      className="bg-white/10 hover:bg-white/20 text-white font-black px-4 py-2 rounded-xl text-sm transition-colors">
                      ← Trước
                    </button>
                    <span className="text-white/40 text-xs self-center">{idx + 1} / {SCREENSHOTS.length}</span>
                    <button
                      onClick={() => setActiveScreenshot(SCREENSHOTS[(idx + 1) % SCREENSHOTS.length])}
                      className="bg-white/10 hover:bg-white/20 text-white font-black px-4 py-2 rounded-xl text-sm transition-colors">
                      Sau →
                    </button>
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto pb-4">
        <h2 className="text-xl font-black text-gray-800 text-center mb-1 px-4">Khám phá từng tính năng</h2>
        <p className="text-gray-400 text-sm text-center mb-5 px-4">Screenshots thực tế từ app · Không chỉnh sửa</p>
        <div className="flex gap-4 overflow-x-auto pb-4 px-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
          {SCREENSHOTS.map((s, i) => (
            <button key={i} onClick={() => setActiveScreenshot(s)}
              className="flex-none snap-center active:scale-95 hover:scale-105 transition-transform"
              style={{ width: 148 }}>
              <div className="rounded-[22px] border-[3px] border-gray-800 bg-gray-800 shadow-xl overflow-hidden">
                <div className="h-3.5 bg-gray-800 flex items-center justify-center"><div className="w-10 h-1.5 bg-gray-600 rounded-full" /></div>
                <div className="relative overflow-hidden bg-white" style={{ height: 264 }}>
                  <Image src={s.src} alt={s.caption} fill className="object-cover object-top" />
                </div>
                <div className="h-3 bg-gray-800" />
              </div>
              <p className="text-xs font-black text-gray-600 mt-2 text-center leading-tight px-0.5">{s.caption}</p>
            </button>
          ))}
        </div>
        <p className="text-center text-xs text-gray-300 px-4">← Vuốt để xem tất cả {SCREENSHOTS.length} màn hình →</p>
      </div>
    </>
  )
}
