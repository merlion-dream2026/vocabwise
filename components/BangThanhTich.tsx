'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAvatarSrc } from '@/lib/avatars'

// ─── Types ────────────────────────────────────────────────────
type HistoryEntry = { words?: number; games?: number; xp?: number }
type LevelSync = { history?: Record<string, HistoryEntry> }
export type BangThanhTichSyncAll = Record<string, LevelSync>

export type BangThanhTichEntry = {
  child: { id: string; name: string; emoji: string; theme?: string | null }
  syncAll: BangThanhTichSyncAll
}

// ─── Constants ────────────────────────────────────────────────
const PERIODS = [
  { key: 'today', label: 'Hôm nay', days: 1  },
  { key: '3d',    label: '3 ngày',  days: 3  },
  { key: '7d',    label: '7 ngày',  days: 7  },
  { key: '14d',   label: '14 ngày', days: 14 },
  { key: '30d',   label: '30 ngày', days: 30 },
] as const
type Period = typeof PERIODS[number]['key']

const GRADIENTS: Record<string, string> = {
  pink: 'from-pink-400 to-rose-400',
  blue: 'from-blue-500 to-cyan-400',
}
const DEFAULT_GRADIENT = 'from-purple-400 to-indigo-400'

// ─── Helpers ─────────────────────────────────────────────────
function computeResults(entries: BangThanhTichEntry[], days: number) {
  const keys = Array.from({ length: days }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i)
    return d.toISOString().split('T')[0]
  })
  return entries.map(({ child, syncAll }) => {
    let words = 0, games = 0, xp = 0
    for (const lv of Object.values(syncAll)) {
      for (const key of keys) {
        const h = lv?.history?.[key]
        if (h) { words += h.words ?? 0; games += h.games ?? 0; xp += h.xp ?? 0 }
      }
    }
    return { child, words, games, xp }
  }).sort((a, b) => b.xp - a.xp)
}

// ─── Component ────────────────────────────────────────────────
type Props = {
  entries: BangThanhTichEntry[]
  variant?: 'kids' | 'dashboard'
}

export default function BangThanhTich({ entries, variant = 'dashboard' }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [period, setPeriod] = useState<Period>('7d')

  if (entries.length < 2) return null

  const syncReady = entries.some(e => Object.keys(e.syncAll).length > 0)
  const days = PERIODS.find(p => p.key === period)!.days
  const data = syncReady ? computeResults(entries, days) : []

  const maxXp  = Math.max(...data.map(d => d.xp), 1)
  const medals = ['🥇', '🥈', '🥉']
  const allZero = data.length > 0 && data.every(d => d.xp === 0)
  const topXp  = data[0]?.xp ?? 0
  const isTie  = data.filter(d => d.xp === topXp).length > 1 && topXp > 0

  const btnRadius  = variant === 'kids' ? 'rounded-3xl shadow-lg' : 'rounded-2xl shadow-sm'
  const emojiSize  = variant === 'kids' ? 'text-4xl' : 'text-3xl'
  const titleSize  = variant === 'kids' ? 'text-lg' : 'text-base'

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className={`w-full bg-gradient-to-r from-purple-500 to-pink-500 ${btnRadius} p-4 flex items-center gap-4 active:scale-95 transition-transform`}
      >
        <span className={emojiSize}>🏆</span>
        <div className="flex-1 text-left">
          <p className={`text-white font-black ${titleSize} leading-tight`}>Bảng Thành Tích</p>
          <p className="text-white/80 text-sm font-semibold">Mỗi bé học được bao nhiêu?</p>
        </div>
        <span className="text-white/80 font-black text-lg">→</span>
      </button>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center px-4 pb-4 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-5 text-center">
              <p className="text-4xl mb-1">🏆</p>
              <h2 className="text-white font-black text-xl">Bảng Thành Tích</h2>
              <p className="text-white/80 text-sm font-semibold mt-0.5">
                {period === 'today' ? 'Học hôm nay' : `${days} ngày gần nhất`}
              </p>
              {/* Period pills */}
              <div className="flex gap-1.5 justify-center mt-3 flex-wrap">
                {PERIODS.map(p => (
                  <button
                    key={p.key}
                    onClick={() => setPeriod(p.key)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                      period === p.key
                        ? 'bg-white text-purple-600'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5 space-y-3">
              {/* Loading state */}
              {!syncReady && (
                <div className="text-center py-6 text-3xl animate-pulse">⏳</div>
              )}

              {syncReady && (
                <>
                  {isTie && (
                    <div className="text-center bg-yellow-50 rounded-2xl py-2 px-4 text-sm font-bold text-yellow-700">
                      🤝 Hai bé đang hòa nhau!
                    </div>
                  )}
                  {allZero && (
                    <div className="text-center bg-purple-50 rounded-2xl py-2 px-4 text-sm font-bold text-purple-600">
                      🌱 {period === 'today'
                        ? 'Chưa ai học hôm nay'
                        : `Chưa ai học trong ${days} ngày qua`
                      } — bắt đầu thôi!
                    </div>
                  )}
                  {data.map((d, i) => {
                    const barPct    = maxXp > 0 ? Math.round((d.xp / maxXp) * 100) : 0
                    const isWinner  = !isTie && i === 0 && d.xp > 0
                    const gradient  = GRADIENTS[d.child.theme ?? ''] ?? DEFAULT_GRADIENT
                    return (
                      <div
                        key={d.child.id}
                        className={`rounded-2xl p-4 border-2 ${isWinner ? 'border-yellow-300 bg-yellow-50' : 'border-gray-100 bg-gray-50'}`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{medals[i] ?? '🎖️'}</span>
                          <img src={getAvatarSrc(d.child.emoji)} className="w-10 h-10 rounded-full object-cover flex-shrink-0" alt="" />
                          <div className="flex-1">
                            <p className={`font-black text-base ${isWinner ? 'text-yellow-700' : 'text-gray-800'}`}>
                              {d.child.name} {isWinner && '👑'}
                            </p>
                            <p className="text-xs text-gray-400 font-semibold">
                              📝 {d.words} từ · 🎮 {d.games} games · ⭐ {d.xp} XP
                            </p>
                          </div>
                        </div>
                        {/* XP bar */}
                        <div className="h-2.5 bg-white rounded-full overflow-hidden border border-gray-200 mb-2">
                          <div
                            className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-700`}
                            style={{ width: `${Math.max(barPct, d.xp > 0 ? 4 : 0)}%` }}
                          />
                        </div>
                        <button
                          onClick={() => { setOpen(false); router.push(`/dashboard/${d.child.id}`) }}
                          className="text-xs font-bold text-purple-500 hover:text-purple-700 transition-colors"
                        >
                          Xem lịch sử học →
                        </button>
                      </div>
                    )
                  })}
                </>
              )}

              <button
                onClick={() => setOpen(false)}
                className="w-full mt-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black rounded-2xl py-3 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
