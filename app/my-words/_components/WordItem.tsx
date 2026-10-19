'use client'
import { speak } from '@/lib/speak'
import { PRESS } from '@/components/TopicHub'
import type { SavedWord } from './types'

// One saved word as a list row or a 2-column grid card; tapping opens the detail sheet.
export default function WordItem({ word: w, color, view, onOpen }: {
  word: SavedWord; color: string | null; view: 'list' | 'grid'; onOpen: () => void
}) {
  const a11y = { role: 'button', tabIndex: 0, onClick: onOpen, onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter') onOpen() } }
  const speakBtn = (cls: string) => (
    <button type="button" onClick={e => { e.stopPropagation(); speak(w.word) }} aria-label={`Nghe phát âm ${w.word}`}
      className={`flex flex-shrink-0 items-center justify-center rounded-full bg-indigo-50 active:scale-90 ${cls}`}>🔊</button>
  )

  if (view === 'grid') return (
    <div {...a11y} className={`relative flex min-h-[112px] cursor-pointer flex-col rounded-2xl border-2 border-b-[4px] border-slate-200 border-b-slate-300 bg-white p-3 ${PRESS}`}>
      {color && <span className="absolute left-3 top-3 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />}
      {speakBtn('absolute right-2 top-2 h-9 w-9 text-base')}
      <p className="mt-4 break-words pr-8 text-lg font-bold leading-tight text-slate-800">{w.word}</p>
      {w.ipa && <p className="text-xs font-semibold text-slate-400">{w.ipa}</p>}
      <p className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-blue-700">{w.meaning_vi}</p>
    </div>
  )

  return (
    <div {...a11y} className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-b-[3px] border-slate-200 border-b-slate-300 bg-white px-3 py-2.5 ${PRESS}`}>
      <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: color ?? '#e2e8f0' }} />
      <div className="min-w-0 flex-1">
        <p className="flex items-baseline gap-2">
          <span className="truncate text-lg font-bold leading-tight text-slate-800">{w.word}</span>
          {w.ipa && <span className="flex-shrink-0 text-xs font-semibold text-slate-400">{w.ipa}</span>}
        </p>
        <p className="line-clamp-2 text-sm font-bold text-blue-700">{w.meaning_vi}</p>
      </div>
      {speakBtn('h-10 w-10 text-lg')}
    </div>
  )
}
