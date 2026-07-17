'use client'
import { useState } from 'react'
import Image from 'next/image'
import Reveal from './Reveal'

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2'

const VIDEOS = [
  {
    src: '/videos/demo%20game%20nghe%20va%20chon%20hinh%20(Mia).mp4',
    poster: '/screenshots/select%20game.jpg',
    title: 'Bé Mia chơi Nghe & Chọn hình',
    tag: '🖼️ Nhận diện từ qua hình ảnh',
  },
  {
    src: '/videos/demo%20game%20phat%20am%20cung%20AI%20(Tim).mp4',
    poster: '/screenshots/demo%20game%20phat%20am%20cung%20AI.jpg',
    title: 'Bé Tim luyện Phát âm cùng AI ✨',
    tag: '🎤 AI chấm phát âm ngay',
  },
  {
    src: '/videos/demo%20mastery%20screen%20(Tim).mp4',
    poster: '/screenshots/select%20level.jpg',
    title: 'Bé Tim hoàn thành chủ đề',
    tag: '🏆 Chiến thắng sau 3 game',
  },
  {
    src: '/videos/demo%20game%20sap%20xep%20cau%20(Tim).mp4',
    poster: '/screenshots/demo%20game%20sap%20xep%20cau.jpg',
    title: 'Bé Tim chơi Sắp xếp câu',
    tag: '📝 Xây câu hoàn chỉnh',
  },
  {
    src: '/videos/Mia%20hoc%20tu%20vung%20moi.mp4',
    poster: '/screenshots/poster%20mia%20hoc%20tu%20vung%20moi.jpg',
    title: 'Bé Mia học từ vựng mới',
    tag: '📚 Học mỗi ngày cùng ba mẹ',
  },
  {
    src: '/videos/Tim%20on%20tap%20tu%20vung.mp4',
    poster: '/screenshots/poster%20tim%20on%20tap%20tu%20vung.jpg',
    title: 'Bé Tim ôn tập từ vựng',
    tag: '💻 Học mọi lúc, mọi thiết bị',
  },
  {
    src: '/videos/Mia%20lam%20bai%20on%20tap.mp4',
    poster: '/screenshots/poster%20mia%20lam%20bai%20on%20tap.jpg',
    title: 'Bé Mia làm bài ôn tập',
    tag: '✍️ Vừa học vừa ghi chú',
  },
  {
    src: '/videos/Tim%20lam%20bai%20sap%20xep%20cau.mp4',
    poster: '/screenshots/poster%20tim%20lam%20bai%20sap%20xep%20cau.jpg',
    title: 'Bé Tim làm bài Sắp xếp câu',
    tag: '📝 Luyện ngữ pháp thực tế',
  },
]

export default function LandingVideoGallery() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null)

  const prev = () => setActiveIdx(i => i === null ? null : (i - 1 + VIDEOS.length) % VIDEOS.length)
  const next = () => setActiveIdx(i => i === null ? null : (i + 1) % VIDEOS.length)

  return (
    <>
      <Reveal className="max-w-7xl mx-auto pb-4">
        <h2 className="text-xl lg:text-3xl font-black text-gray-800 text-center mb-1 px-4">Xem app hoạt động thực tế</h2>
        <p className="text-gray-500 text-sm lg:text-base text-center mb-5 lg:mb-8 px-4">Video thật · Các bé đang học</p>
        <div className="flex gap-4 overflow-x-auto pb-3 px-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
          {VIDEOS.map((v, i) => (
            <button key={i} onClick={() => setActiveIdx(i)}
              className={`flex-none self-start snap-center text-left group active:scale-95 hover:scale-105 transition-transform rounded-[20px] ${FOCUS_RING}`}
              style={{ width: 148 }}>
              <div className="relative rounded-[20px] border-[3px] border-gray-800 bg-gray-900 overflow-hidden shadow-xl" style={{ height: 264 }}>
                <Image src={v.poster} alt={v.title} fill sizes="148px" className="object-cover object-top" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 group-active:scale-90 transition-transform">
                    <span className="text-xl ml-1">▶</span>
                  </div>
                </div>
              </div>
              <p className="text-xs font-black text-gray-700 mt-2 leading-snug px-0.5">{v.title}</p>
            </button>
          ))}
        </div>
        <p className="text-center text-xs text-gray-300 mt-1 px-4">← Vuốt để xem thêm</p>
      </Reveal>

      {activeIdx !== null && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center px-4"
          onClick={() => setActiveIdx(null)}>
          <div className="relative w-full max-w-md flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between w-full mb-3 px-1">
              <p className="text-white font-black text-sm">{VIDEOS[activeIdx].title}</p>
              <button onClick={() => setActiveIdx(null)} className={`text-white/70 hover:text-white font-black text-sm ml-4 flex-shrink-0 rounded ${FOCUS_RING} focus-visible:ring-offset-black`}>✕ Đóng</button>
            </div>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video key={activeIdx} src={VIDEOS[activeIdx].src} controls autoPlay playsInline
              className="w-full rounded-[24px] shadow-2xl border-[3px] border-gray-700"
              style={{ maxHeight: '90dvh' }} />
            <div className="flex gap-3 mt-4">
              <button onClick={prev} className={`bg-white/10 hover:bg-white/20 text-white font-black px-4 py-2 rounded-xl text-sm transition-colors ${FOCUS_RING} focus-visible:ring-offset-black`}>← Trước</button>
              <span className="text-white/40 text-xs self-center">{activeIdx + 1} / {VIDEOS.length}</span>
              <button onClick={next} className={`bg-white/10 hover:bg-white/20 text-white font-black px-4 py-2 rounded-xl text-sm transition-colors ${FOCUS_RING} focus-visible:ring-offset-black`}>Sau →</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
