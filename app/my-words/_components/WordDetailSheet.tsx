'use client'
import Link from 'next/link'
import { speak } from '@/lib/speak'
import type { WordList } from '@/components/WordListPicker'
import { cta } from '@/components/ChunkyUI'
import type { SavedWord } from './types'

const SOURCE_LABEL: Record<string, { label: string; color: string }> = {
  academic: { label: 'Academic', color: 'bg-indigo-100 text-indigo-700' },
  kids:     { label: 'Daily',    color: 'bg-amber-100  text-amber-700'  },
}

export default function WordDetailSheet({ word, lists, onAssign, onRemove, onManageLists, onClose }: {
  word: SavedWord; lists: WordList[]
  onAssign: (listId: number | null) => void; onRemove: () => void; onManageLists: () => void; onClose: () => void
}) {
  const link = word.source === 'academic' ? `/vocabwise/${word.book_id}/${word.topic_id}` : null
  const src = SOURCE_LABEL[word.source] ?? SOURCE_LABEL.academic
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div role="dialog" aria-label={word.word} className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white px-5 pb-8 pt-4" onClick={e => e.stopPropagation()}>
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-slate-200" />
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="break-words text-3xl font-bold leading-tight text-slate-800">{word.word}</p>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-400">
              {word.ipa && <span>{word.ipa}</span>}
              {word.pos && <span className="italic">{word.pos}</span>}
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${src.color}`}>{src.label}</span>
            </p>
          </div>
          <button type="button" onClick={() => speak(word.word)} aria-label={`Nghe phát âm ${word.word}`}
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-2xl active:scale-90">🔊</button>
        </div>
        <p className="mt-3 text-xl font-bold text-blue-700">{word.meaning_vi}</p>
        {word.example_en && <p className="mt-2 text-base italic text-slate-500">&ldquo;{word.example_en}&rdquo;</p>}
        {word.topic_title && (link
          ? <Link href={link} className="mt-3 inline-block text-sm font-bold text-indigo-600">📄 {word.topic_title} →</Link>
          : <p className="mt-3 text-sm font-semibold text-slate-400">📄 {word.topic_title}</p>)}

        <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wider text-slate-400">Danh sách</p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onAssign(null)}
            className={`rounded-full border px-3 py-2 text-sm font-bold ${!word.list_id ? 'border-slate-300 bg-slate-200 text-slate-700' : 'border-slate-200 bg-white text-slate-500'}`}>Không có</button>
          {lists.map(l => (
            <button key={l.id} type="button" onClick={() => onAssign(l.id)}
              className={`rounded-full border px-3 py-2 text-sm font-bold ${word.list_id === l.id ? 'border-transparent text-white' : 'border-slate-200 bg-white text-slate-600'}`}
              style={word.list_id === l.id ? { backgroundColor: l.color } : {}}>
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ backgroundColor: word.list_id === l.id ? '#fff' : l.color }} />{l.name}
            </button>
          ))}
          <button type="button" onClick={onManageLists}
            className="rounded-full border border-dashed border-indigo-200 px-3 py-2 text-sm font-bold text-indigo-600">+ Danh sách mới</button>
        </div>

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className={cta('slate', 'flex-1')}>Đóng</button>
          <button type="button" onClick={onRemove} className={cta('red', 'flex-1')}>🗑 Bỏ lưu</button>
        </div>
      </div>
    </div>
  )
}
