'use client'

import { useState, FormEvent } from 'react'
import Image from 'next/image'
import { AVATARS } from '@/lib/avatars'
import { CHILD_THEMES, DEFAULT_CHILD_THEME, type ChildThemeId } from '@/lib/childThemes'
import type { Child } from '../_types'
import { invalidateCachedFetch } from '@/lib/cachedFetch'

const THEME_RING_CLS: Record<ChildThemeId, string> = {
  pink:   'bg-pink-100 ring-2 ring-pink-400 scale-110',
  blue:   'bg-blue-100 ring-2 ring-blue-400 scale-110',
  green:  'bg-green-100 ring-2 ring-green-400 scale-110',
  orange: 'bg-orange-100 ring-2 ring-orange-400 scale-110',
}
const THEME_PICKER_CLS: Record<ChildThemeId, string> = {
  pink:   'border-pink-400 bg-pink-50',
  blue:   'border-blue-400 bg-blue-50',
  green:  'border-green-400 bg-green-50',
  orange: 'border-orange-400 bg-orange-50',
}

// ── Add child modal ────────────────────────────────────────────────────────────
export function AddChildModal({ maxKids, childCount, onClose, onAdded }: {
  maxKids: number; childCount: number; onClose: () => void; onAdded: (c: Child) => void
}) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('panda')
  const [theme, setTheme] = useState<ChildThemeId>(DEFAULT_CHILD_THEME)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const blocked = childCount >= maxKids

  async function save(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/children', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, emoji, level: 'seeker', theme }),
    })
    setSaving(false)
    if (res.ok) { invalidateCachedFetch('/api/children'); onAdded(await res.json()) }
    else { const d = await res.json(); setMsg(d.error) }
  }

  const ringCls = THEME_RING_CLS[theme]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl my-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-black text-lg text-gray-800">➕ Thêm hồ sơ bé</h2>
          <button onClick={onClose} aria-label="Đóng" className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        {blocked ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">🔒</div>
            <p className="text-gray-700 font-bold mb-2">Đã đạt giới hạn {maxKids} hồ sơ</p>
            <p className="text-gray-500 text-sm">Liên hệ để nâng cấp và thêm bé.</p>
          </div>
        ) : (
          <form onSubmit={save} className="space-y-4">
            <input value={name} onChange={e => setName(e.target.value)} required placeholder="Tên bé"
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-semibold focus:outline-none focus:border-purple-400" />

            {/* Theme picker */}
            <div>
              <p className="text-xs font-bold text-gray-500 mb-2">Theme màu</p>
              <div className="grid grid-cols-2 gap-2">
                {CHILD_THEMES.map(t => (
                  <button key={t.id} type="button" onClick={() => setTheme(t.id)}
                    className={`border-2 rounded-2xl px-4 py-2.5 flex items-center justify-center gap-2 transition-all ${theme === t.id ? THEME_PICKER_CLS[t.id] : 'border-gray-200 hover:border-gray-300'}`}>
                    <span className="text-3xl leading-none">{t.emoji}</span>
                    <span className="font-black text-sm text-gray-700">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Avatar */}
            <div>
              <p className="text-xs font-bold text-gray-500 mb-2">Avatar</p>
              <div className="grid grid-cols-6 gap-1.5">
                {AVATARS.map(a => (
                  <button key={a.id} type="button" onClick={() => setEmoji(a.id)}
                    className={`p-0.5 rounded-xl transition-all ${emoji === a.id ? ringCls : 'hover:bg-gray-100'}`}>
                    <Image src={a.src} width={56} height={56} className="rounded-lg object-cover w-full aspect-square" alt={a.id} unoptimized />
                  </button>
                ))}
              </div>
            </div>

            {msg && <p className="text-sm text-red-500 font-semibold">{msg}</p>}
            <button type="submit" disabled={saving || !name.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black py-3 rounded-2xl disabled:opacity-50 active:scale-95 transition-transform">
              {saving ? 'Đang tạo...' : 'Tạo hồ sơ'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Edit child modal ──────────────────────────────────────────────────────────
export function EditChildModal({ child, onClose, onSaved, onDeleted }: {
  child: Child; onClose: () => void; onSaved: (c: Child) => void; onDeleted: (id: string) => void
}) {
  const [name, setName] = useState(child.name)
  const [emoji, setEmoji] = useState(child.emoji)
  const [theme, setTheme] = useState<ChildThemeId>((child.theme as ChildThemeId) ?? DEFAULT_CHILD_THEME)
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [msg, setMsg] = useState('')

  async function save(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/children/${child.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, emoji, theme }),
    })
    setSaving(false)
    if (res.ok) { invalidateCachedFetch('/api/children'); onSaved(await res.json()) }
    else { const d = await res.json(); setMsg(`❌ ${d.error}`) }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    const res = await fetch(`/api/children/${child.id}`, { method: 'DELETE' })
    if (res.ok) { invalidateCachedFetch('/api/children'); onDeleted(child.id) }
    else { const d = await res.json(); setMsg(`❌ ${d.error}`) }
  }

  const ringCls = THEME_RING_CLS[theme]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl my-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-black text-lg text-gray-800">✏️ Sửa hồ sơ</h2>
          <button onClick={onClose} aria-label="Đóng" className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <form onSubmit={save} className="space-y-4">
          <input value={name} onChange={e => setName(e.target.value)} required
            className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-semibold focus:outline-none focus:border-purple-400" />

          {/* Theme */}
          <div>
            <p className="text-xs font-bold text-gray-500 mb-2">Theme màu</p>
            <div className="grid grid-cols-2 gap-2">
              {CHILD_THEMES.map(t => (
                <button key={t.id} type="button" onClick={() => setTheme(t.id)}
                  className={`border-2 rounded-2xl px-4 py-2.5 flex items-center justify-center gap-2 transition-all ${theme === t.id ? THEME_PICKER_CLS[t.id] : 'border-gray-200 hover:border-gray-300'}`}>
                  <span className="text-3xl leading-none">{t.emoji}</span>
                  <span className="font-black text-sm text-gray-700">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Avatar */}
          <div className="grid grid-cols-6 gap-1.5">
            {AVATARS.map(a => (
              <button key={a.id} type="button" onClick={() => setEmoji(a.id)}
                className={`p-0.5 rounded-xl transition-all ${emoji === a.id ? ringCls : 'hover:bg-gray-100'}`}>
                <Image src={a.src} width={56} height={56} className="rounded-lg object-cover w-full aspect-square" alt={a.id} unoptimized />
              </button>
            ))}
          </div>

          {msg && <p className="text-sm">{msg}</p>}
          <button type="submit" disabled={saving}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-black py-3 rounded-2xl disabled:opacity-50">
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>
        <button onClick={handleDelete}
          className={`w-full mt-3 rounded-2xl py-2.5 text-sm font-bold transition-colors ${confirmDelete ? 'bg-red-500 text-white' : 'text-red-400 hover:bg-red-50'}`}>
          {confirmDelete ? '⚠️ Xác nhận xóa?' : 'Xóa hồ sơ'}
        </button>
      </div>
    </div>
  )
}
