'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PRESS } from '@/components/TopicHub'
import { activeChildId } from '@/lib/academicSync'

const LABEL = { daily: 'Daily', academic: 'Academic', phonics: 'Phonics' } as const

// Small shortcut on a module's home screen → the child's profile, opened on that module's sticker tab.
// Shows how many stickers the child has in this module. Renders nothing until a child is known.
export default function StickerEntryCard({ collection, childId }: { collection: keyof typeof LABEL; childId?: string }) {
  const [id, setId] = useState<string | null>(childId ?? null)
  const [count, setCount] = useState<number | null>(null)
  useEffect(() => { if (!childId) setId(activeChildId()) }, [childId])
  useEffect(() => {
    if (!id) return
    fetch(`/api/stickers/${id}`).then(r => r.ok ? r.json() : []).then(rows => {
      setCount(Array.isArray(rows) ? rows.filter((r: { collection?: string }) => (r.collection ?? 'daily') === collection).length : 0)
    }).catch(() => setCount(0))
  }, [id, collection])
  if (!id) return null
  return (
    <Link href={`/dashboard/${id}/profile?tab=${collection}`}
      className={`flex items-center gap-3 rounded-3xl border-2 border-b-[4px] border-purple-200 border-b-purple-300 bg-purple-50 px-4 py-3 ${PRESS}`}>
      <span className="flex h-11 w-11 flex-shrink-0 -rotate-6 items-center justify-center rounded-2xl bg-white text-2xl shadow">🎁</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-tight text-gray-800">Sticker {LABEL[collection]}</p>
        <p className="text-xs font-semibold text-purple-700">{count === null ? ' ' : count > 0 ? `${count} sticker đã sưu tầm` : 'Chưa có sticker nào, hoàn thành topic để nhận!'}</p>
      </div>
      <span className="flex-shrink-0 text-xl font-bold text-purple-400">›</span>
    </Link>
  )
}
