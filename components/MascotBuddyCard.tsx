'use client'
import Mascot from '@/components/Mascot'
import { useMascotBuddy } from '@/components/MascotContext'
import { PRESS } from '@/components/TopicHub'
import { MASCOT_NAMES } from '@/lib/mascots'

// Child profile card: the child's companion + "Xem lại lời chào" (replays the hello slides).
// No companion yet → "Chọn ngay" reopens the pick dialog even if it was snoozed with "Để sau".
export default function MascotBuddyCard({ className = '' }: { className?: string }) {
  const buddy = useMascotBuddy()
  if (!buddy || buddy.mascot === undefined) return null
  const { mascot } = buddy
  return (
    <section className={`flex items-center gap-3 ${className}`}>
      {mascot
        ? <Mascot shot="pose-idle" size={88} blink className="mi-pop shadow-md ring-4 ring-white" />
        : <span className="flex h-[88px] w-[88px] flex-shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-3xl" aria-hidden>❔</span>}
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-500">Bạn đồng hành</p>
        <p className="text-base font-bold text-slate-800">{mascot ? MASCOT_NAMES[mascot] : 'Chưa chọn'}</p>
      </div>
      <button type="button" onClick={mascot ? buddy.replayIntro : buddy.openPicker}
        className={`flex-shrink-0 rounded-full border-b-[3px] border-sky-300 bg-sky-100 px-3 py-1.5 text-xs font-bold text-sky-700 ${PRESS}`}>
        {mascot ? '👋 Xem lại lời chào' : '✨ Chọn ngay'}
      </button>
    </section>
  )
}
