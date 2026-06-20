'use client'
import { useEffect, useRef, useState } from 'react'

export type WordList = { id: number; name: string; color: string }

const LIST_COLORS = [
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6',
]

type Props = {
  word: string
  onConfirm: (listId: number | null) => void
  onCancel: () => void
}

export default function WordListPicker({ word, onConfirm, onCancel }: Props) {
  const [lists, setLists]         = useState<WordList[]>([])
  const [loading, setLoading]     = useState(true)
  const [creating, setCreating]   = useState(false)
  const [newName, setNewName]     = useState('')
  const [newColor, setNewColor]   = useState(LIST_COLORS[0])
  const [saving, setSaving]       = useState(false)
  const inputRef                  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/wordlists')
      .then(r => r.ok ? r.json() : { lists: [] })
      .then(d => setLists(d.lists ?? []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (creating) setTimeout(() => inputRef.current?.focus(), 50)
  }, [creating])

  async function createList() {
    if (!newName.trim() || saving) return
    setSaving(true)
    const res = await fetch('/api/wordlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), color: newColor }),
    })
    if (res.ok) {
      const { list } = await res.json()
      setLists(prev => [...prev, list])
      setCreating(false)
      setNewName('')
      onConfirm(list.id)
    }
    setSaving(false)
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px]"
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div className="w-full max-w-md bg-white rounded-t-3xl shadow-2xl pb-safe">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 pt-2 pb-5">
          <p className="text-xs text-gray-400 font-bold mb-1">Lưu từ</p>
          <h3 className="text-lg font-black text-gray-800 mb-4">
            ⭐ <span className="italic">{word}</span>
          </h3>

          {loading ? (
            <div className="py-8 text-center text-gray-400 text-sm">Đang tải...</div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {/* Default — no list */}
              <button
                onClick={() => onConfirm(null)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all active:scale-[0.98] text-left"
              >
                <span className="text-xl">📌</span>
                <div>
                  <p className="font-black text-gray-800 text-sm">Tất cả (Mặc định)</p>
                  <p className="text-xs text-gray-400">Không gắn vào danh sách nào</p>
                </div>
              </button>

              {/* Custom lists */}
              {lists.map(l => (
                <button
                  key={l.id}
                  onClick={() => onConfirm(l.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all active:scale-[0.98] text-left"
                >
                  <span
                    className="w-8 h-8 rounded-xl flex-shrink-0"
                    style={{ backgroundColor: l.color }}
                  />
                  <p className="font-black text-gray-800 text-sm">{l.name}</p>
                </button>
              ))}
            </div>
          )}

          {/* Create new list */}
          {!creating ? (
            <button
              onClick={() => setCreating(true)}
              className="mt-3 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 font-bold text-sm hover:border-indigo-300 hover:text-indigo-600 transition-all active:scale-[0.98]"
            >
              + Tạo danh sách mới
            </button>
          ) : (
            <div className="mt-3 bg-gray-50 rounded-2xl p-4 space-y-3">
              <input
                ref={inputRef}
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') createList() }}
                placeholder="Tên danh sách..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
                maxLength={40}
              />
              <div className="flex gap-2 flex-wrap">
                {LIST_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className={`w-7 h-7 rounded-lg transition-all ${newColor === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-400' : ''}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setCreating(false); setNewName('') }}
                  className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm"
                >
                  Hủy
                </button>
                <button
                  onClick={createList}
                  disabled={!newName.trim() || saving}
                  className="flex-1 py-2 rounded-xl bg-indigo-600 text-white font-black text-sm disabled:opacity-50 active:scale-95 transition-all"
                >
                  {saving ? '...' : 'Tạo & Lưu'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
