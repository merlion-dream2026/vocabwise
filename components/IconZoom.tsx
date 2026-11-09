'use client'
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

// Popup phóng to icon minh hoạ (WordIcon zoomable). Chỉ có hình, không có chữ: trong game hình là
// câu hỏi nên không được lộ đáp án. Đóng bằng chạm nền / ✕ / Esc; khoá cuộn nền như BottomSheet.
// Portal ra <body> vì nhiều thẻ nằm trong wrapper có transform (iOS Safari tính fixed theo wrapper).
export default function IconZoom({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 px-6 motion-safe:animate-fade-in" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={label} onClick={e => e.stopPropagation()}
        className="relative w-full max-w-[20rem] rounded-[28px] bg-white px-5 pb-4 pt-5 text-center shadow-2xl motion-safe:animate-zoom-pop">
        <button type="button" onClick={onClose} aria-label="Đóng" autoFocus
          className="absolute right-2.5 top-2.5 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-500">✕</button>
        <div className="mx-auto flex aspect-square w-full max-w-[16.25rem] items-center justify-center">{children}</div>
        <p className="mt-1.5 text-xs text-slate-400">Chạm ra ngoài để đóng</p>
      </div>
    </div>,
    document.body,
  )
}
