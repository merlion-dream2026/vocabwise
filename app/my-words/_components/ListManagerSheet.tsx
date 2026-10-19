'use client'
import { useState } from 'react'
import type { WordList } from '@/components/WordListPicker'
import BottomSheet from '@/components/BottomSheet'

export const LIST_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6']

function ListForm({ initial, submitLabel, onSubmit, onCancel }: {
  initial?: { name: string; color: string }; submitLabel: string
  onSubmit: (name: string, color: string) => Promise<boolean>; onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [color, setColor] = useState(initial?.color ?? LIST_COLORS[0])
  const [busy, setBusy] = useState(false)
  async function submit() {
    if (!name.trim() || busy) return
    setBusy(true)
    const ok = await onSubmit(name.trim(), color)
    setBusy(false)
    if (ok) onCancel()
  }
  return (
    <div className="space-y-3 rounded-3xl border-2 border-b-[4px] border-slate-200 border-b-slate-300 bg-white p-4">
      <input autoFocus value={name} onChange={e => setName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submit() }}
        placeholder="Tên danh sách... (vd: IELTS Writing)" maxLength={40}
        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-300" />
      <div className="flex flex-wrap gap-2">
        {LIST_COLORS.map(c => (
          <button key={c} type="button" onClick={() => setColor(c)} style={{ backgroundColor: c }} aria-label={`Màu ${c}`}
            className={`h-8 w-8 rounded-lg transition-all ${color === c ? 'scale-110 ring-2 ring-gray-400 ring-offset-2' : ''}`} />
        ))}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-bold text-gray-500">Hủy</button>
        <button type="button" onClick={submit} disabled={!name.trim() || busy}
          className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-50">
          {busy ? '...' : submitLabel}
        </button>
      </div>
    </div>
  )
}

// "⋯ Quản lý" — create / rename / recolor / delete lists in one sheet. Replaces the old ✎ / ✕
// corner badges on each chip, which were hover-only and so unreachable on touchscreens.
export default function ListManagerSheet({ lists, counts, onCreate, onUpdate, onDelete, onClose }: {
  lists: WordList[]; counts: Record<number, number>
  onCreate: (name: string, color: string) => Promise<boolean>
  onUpdate: (id: number, name: string, color: string) => Promise<boolean>
  onDelete: (id: number) => Promise<boolean>
  onClose: () => void
}) {
  const [editing, setEditing] = useState<number | 'new' | null>(lists.length ? null : 'new')
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)

  return (
    <BottomSheet title="Danh sách của tôi" onClose={onClose}>
      <div className="space-y-2 px-4 pb-2">
        {lists.map(l => {
          if (editing === l.id) {
            return <ListForm key={l.id} initial={l} submitLabel="Lưu" onSubmit={(n, c) => onUpdate(l.id, n, c)} onCancel={() => setEditing(null)} />
          }
          if (confirmDelete === l.id) {
            return (
              <div key={l.id} className="rounded-2xl border border-red-200 bg-red-50 p-3">
                <p className="text-sm font-bold text-red-700">Xóa danh sách &quot;{l.name}&quot;?</p>
                <p className="mt-0.5 text-xs text-red-600">Từ trong danh sách vẫn được lưu, chỉ chuyển về &quot;Chưa phân loại&quot;.</p>
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => setConfirmDelete(null)} className="flex-1 rounded-xl border border-gray-200 bg-white py-2 text-sm font-bold text-gray-500">Hủy</button>
                  <button type="button" disabled={deleting}
                    onClick={async () => { setDeleting(true); if (await onDelete(l.id)) setConfirmDelete(null); setDeleting(false) }}
                    className="flex-1 rounded-xl bg-red-500 py-2 text-sm font-bold text-white disabled:opacity-50">{deleting ? '...' : 'Xóa'}</button>
                </div>
              </div>
            )
          }
          return (
            <div key={l.id} className="flex items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-3 py-2">
              <span className="h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: l.color }} />
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-700">{l.name}</span>
              <span className="text-xs font-semibold text-slate-400">{counts[l.id] ?? 0} từ</span>
              <button type="button" onClick={() => setEditing(l.id)} aria-label={`Sửa ${l.name}`}
                className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 active:bg-slate-100">✎</button>
              <button type="button" onClick={() => setConfirmDelete(l.id)} aria-label={`Xóa ${l.name}`}
                className="flex h-10 w-10 items-center justify-center rounded-full text-red-500 active:bg-red-50">🗑</button>
            </div>
          )
        })}
        {editing === 'new'
          ? <ListForm submitLabel="Tạo" onSubmit={onCreate} onCancel={() => setEditing(null)} />
          : (
            <button type="button" onClick={() => setEditing('new')}
              className="w-full rounded-2xl border-2 border-dashed border-indigo-200 py-3 text-sm font-bold text-indigo-600 active:scale-95">
              + Tạo danh sách mới
            </button>
          )}
      </div>
    </BottomSheet>
  )
}
