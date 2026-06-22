'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { AVATARS, getAvatarSrc } from '@/lib/avatars'

type Entry = {
  rank: number
  childId: string
  name: string
  emoji: string
  totalXP: number
  streak: number
  isCurrentFamily: boolean
}

const MEDALS = ['🥇', '🥈', '🥉']

export default function LeaderboardCard() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch('/api/leaderboard')
      .then(r => r.ok ? r.json() : [])
      .then(setEntries)
      .finally(() => setLoading(false))
  }, [open])

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 mb-4 overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <span className="font-black text-gray-800 text-sm">🏆 Bảng xếp hạng XP toàn cầu</span>
        <span className={`text-gray-400 text-lg transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="px-5 pb-4 border-t border-gray-50">
          {loading ? (
            <p className="text-sm text-gray-400 py-4 text-center">Đang tải...</p>
          ) : entries.length === 0 ? (
            <p className="text-sm text-gray-400 py-4 text-center">Chưa có dữ liệu</p>
          ) : (
            <>
              <p className="text-xs text-gray-400 mt-3 mb-2">Top 20 bé học nhiều nhất · Cập nhật mỗi 5 phút</p>
              <div className="space-y-1.5">
                {entries.map((e) => (
                  <div
                    key={e.childId}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors ${
                      e.isCurrentFamily ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50'
                    }`}
                  >
                    <span className="text-sm w-6 text-center flex-shrink-0 font-black text-gray-500">
                      {MEDALS[e.rank - 1] ?? e.rank}
                    </span>
                    {AVATARS.some(a => a.id === e.emoji)
                      ? <Image src={getAvatarSrc(e.emoji)} width={24} height={24} className="rounded-full object-cover flex-shrink-0" alt="" unoptimized />
                      : <span className="text-base flex-shrink-0">{e.emoji}</span>
                    }
                    <span className={`text-sm font-black flex-1 truncate ${e.isCurrentFamily ? 'text-purple-700' : 'text-gray-700'}`}>
                      {e.name}
                      {e.isCurrentFamily && <span className="text-purple-400 font-normal text-xs ml-1">← bé nhà bạn</span>}
                    </span>
                    <span className="text-xs text-yellow-600 font-black whitespace-nowrap">⭐ {e.totalXP.toLocaleString()}</span>
                    {e.streak > 0 && (
                      <span className="text-xs text-orange-500 font-bold whitespace-nowrap">🔥{e.streak}</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
