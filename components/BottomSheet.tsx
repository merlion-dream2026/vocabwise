'use client'
import { useEffect, type ReactNode } from 'react'

// Shared bottom sheet for the topic hubs (video list, game picker): dimmed backdrop, rounded top,
// sticky title row with ✕. Locks page scroll and closes on Escape / backdrop tap while open.
export default function BottomSheet({ title, titleClass = '', onClose, children, footer }: {
  title: ReactNode; titleClass?: string; onClose: () => void; children: ReactNode; footer?: ReactNode
}) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div role="dialog" aria-label={typeof title === 'string' ? title : undefined} onClick={e => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 pb-2 pt-3">
          <h2 className={`text-base font-bold ${titleClass}`}>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Đóng"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-500">✕</button>
        </div>
        {children}
        {footer}
      </div>
    </div>
  )
}
