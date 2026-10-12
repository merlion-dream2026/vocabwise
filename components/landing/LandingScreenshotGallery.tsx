'use client'
import { useState } from 'react'
import Image from 'next/image'
import Reveal from './Reveal'
import { FOCUS_RING, H2, LEAD, SECTION_Y } from './ui'
import { GALLERY } from '@/lib/landingContent'


const SCREENSHOTS = GALLERY

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
              <button onClick={() => setActiveScreenshot(null)} className={`text-white/70 hover:text-white font-black text-sm ml-4 flex-shrink-0 rounded ${FOCUS_RING} focus-visible:ring-offset-black`}>✕ Đóng</button>
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
                      className={`bg-white/10 hover:bg-white/20 text-white font-black px-4 py-2 rounded-xl text-sm transition-colors ${FOCUS_RING} focus-visible:ring-offset-black`}>
                      ← Trước
                    </button>
                    <span className="text-white/40 text-xs self-center">{idx + 1} / {SCREENSHOTS.length}</span>
                    <button
                      onClick={() => setActiveScreenshot(SCREENSHOTS[(idx + 1) % SCREENSHOTS.length])}
                      className={`bg-white/10 hover:bg-white/20 text-white font-black px-4 py-2 rounded-xl text-sm transition-colors ${FOCUS_RING} focus-visible:ring-offset-black`}>
                      Sau →
                    </button>
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      <section className={`bg-slate-50 ${SECTION_Y}`}>
      <Reveal className="max-w-7xl mx-auto">
        <h2 className={`${H2} px-4`}>Khám phá từng tính năng</h2>
        <p className={`${LEAD} px-4`}>Ảnh chụp trực tiếp từ app · Cập nhật tháng 10/2026</p>
        <div className="flex gap-4 overflow-x-auto pt-3 pb-4 px-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
          {SCREENSHOTS.map((s, i) => (
            <button key={i} onClick={() => setActiveScreenshot(s)}
              className={`flex-none self-start snap-center active:scale-95 hover:scale-105 transition-transform rounded-[22px] ${FOCUS_RING}`}
              style={{ width: 148 }}>
              <div className="rounded-[22px] border-[3px] border-gray-800 bg-gray-800 shadow-xl overflow-hidden">
                <div className="h-3.5 bg-gray-800 flex items-center justify-center"><div className="w-10 h-1.5 bg-gray-600 rounded-full" /></div>
                <div className="relative overflow-hidden bg-white" style={{ height: 264 }}>
                  <Image src={s.src} alt={s.caption} fill sizes="148px" className="object-cover object-top" />
                </div>
                <div className="h-3 bg-gray-800" />
              </div>
              <p className="text-xs font-black text-gray-600 mt-2 text-center leading-tight px-0.5">{s.caption}</p>
            </button>
          ))}
        </div>
        <p className="text-center text-xs text-gray-500 px-4">← Vuốt để xem tất cả {SCREENSHOTS.length} màn hình →</p>
      </Reveal>
      </section>
    </>
  )
}
