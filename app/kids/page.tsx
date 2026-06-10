'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PinGate from '@/components/PinGate'
import UpgradeBanner from '@/components/UpgradeBanner'
import { useExpiryGuard, daysUntilExpiry } from '@/lib/useExpiryGuard'

type Child = {
  id: string; name: string; emoji: string; level: string
  theme?: string | null; pin?: string | null
  streak?: { current: number; lastActive: string }
}
type Session = { familyId: string; username: string; plan: string; free_trial_expires_at?: string | null; plan_end_date?: string | null }

const LEVEL_LABEL: Record<string, { label: string; desc: string }> = {
  seeker:   { label: 'Seeker',   desc: 'Pre-A1 · Từ vựng nền tảng'   },
  starter:  { label: 'Starter',  desc: 'A1 · Từ vựng cơ bản'          },
  ranger:   { label: 'Ranger',   desc: 'A2 · Từ vựng mở rộng'         },
  explorer: { label: 'Explorer', desc: 'B1 · Từ vựng nâng cao'        },
  scholar:  { label: 'Scholar',  desc: 'B2 · Từ vựng học thuật'       },
  master:   { label: 'Master',   desc: 'C1-C2 · Từ vựng chuyên sâu'  },
}

const THEME_CONFIG: Record<string, {
  gradient: string; bg: string; border: string; text: string; btn: string; badge: string;
}> = {
  pink: { gradient: 'from-pink-400 to-rose-400',  bg: 'bg-gradient-to-br from-pink-50 to-rose-50',  border: 'border-pink-200',  text: 'text-pink-600',  btn: 'bg-pink-500 hover:bg-pink-600',  badge: 'bg-pink-100 text-pink-700'  },
  blue: { gradient: 'from-blue-400 to-cyan-400',  bg: 'bg-gradient-to-br from-blue-50 to-cyan-50',  border: 'border-blue-200',  text: 'text-blue-600',  btn: 'bg-blue-500 hover:bg-blue-600',  badge: 'bg-blue-100 text-blue-700'  },
}

// ── Stats helpers ────────────────────────────────────────────
const LEVEL_ORDER = ['seeker', 'starter', 'ranger', 'explorer', 'scholar', 'master']

const XP_BADGES = [
  { minXP: 3000, icon: '👑', label: 'Master',   cls: 'bg-yellow-100 text-yellow-700' },
  { minXP: 1000, icon: '🏆', label: 'Champion', cls: 'bg-orange-100 text-orange-700' },
  { minXP:  300, icon: '🌟', label: 'Rising',   cls: 'bg-sky-100 text-sky-700'       },
  { minXP:   50, icon: '🌱', label: 'Beginner', cls: 'bg-green-100 text-green-700'   },
]

const BOOK_META: Record<string, { label: string; cefr: string; total: number }> = {
  'b1': { label: 'Book 1', cefr: 'A1–A2', total: 60 },
  'b2': { label: 'Book 2', cefr: 'B1–B2', total: 60 },
  'b3': { label: 'Book 3', cefr: 'C1–C2', total: 30 },
}

type SyncLevel = {
  seen?: string[]
  mastery?: Record<string, unknown>
  history?: Record<string, { words: number; games: number; xp: number }>
}

type ChildStats = {
  totalXP: number
  badge: typeof XP_BADGES[number] | null
  highestLevel: string | null
  dailyTopics: number
  dailyWords: number
  phonicsMastered: number
  academicBook: string | null
  academicCefr: string | null
  academicCompleted: number
  academicTotal: number
}

function computeStats(sync: Record<string, SyncLevel>): ChildStats {
  let totalXP = 0
  for (const lv of LEVEL_ORDER) {
    for (const h of Object.values(sync[lv]?.history ?? {})) totalXP += h.xp ?? 0
  }

  const badge = XP_BADGES.find(b => totalXP >= b.minXP) ?? null

  let highestLevel: string | null = null
  for (const lv of [...LEVEL_ORDER].reverse()) {
    if ((sync[lv]?.seen?.length ?? 0) > 0) { highestLevel = lv; break }
  }

  const dailySeen = highestLevel ? (sync[highestLevel]?.seen ?? []) : []
  const dailyTopics = new Set(dailySeen.map(s => s.split('__')[0]).filter(Boolean)).size
  const dailyWords = dailySeen.length

  const phonicsMastery = (sync['phonics']?.mastery ?? {}) as Record<string, { flashcard: boolean }>
  const phonicsMastered = Object.values(phonicsMastery).filter(m => m.flashcard).length

  const acMastery = (sync['academic']?.mastery ?? {}) as Record<string, { completed?: boolean }>
  let academicBook = null, academicCefr = null, academicCompleted = 0, academicTotal = 0
  for (const [prefix, info] of Object.entries(BOOK_META).reverse()) {
    const entries = Object.entries(acMastery).filter(([k]) => k.startsWith(prefix + '-'))
    if (entries.length > 0) {
      academicBook = info.label; academicCefr = info.cefr
      academicCompleted = entries.filter(([, v]) => (v as { completed?: boolean }).completed).length
      academicTotal = info.total
      break
    }
  }

  return { totalXP, badge, highestLevel, dailyTopics, dailyWords, phonicsMastered, academicBook, academicCefr, academicCompleted, academicTotal }
}

function MiniBar({ value, max, gradient }: { value: number; max: number; gradient: string }) {
  const pct = max > 0 ? Math.min(100, Math.round(value / max * 100)) : 0
  return (
    <div className="flex-1 h-1.5 bg-black/10 rounded-full overflow-hidden min-w-0">
      <div className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  )
}
// ─────────────────────────────────────────────────────────────

const PLAN_BADGE: Record<string, { label: string; cls: string }> = {
  free:     { label: 'FREE',     cls: 'bg-gray-100 text-gray-500' },
  '2weeks': { label: '🎁 GIFT2W', cls: 'bg-pink-100 text-pink-700' },
  '1month': { label: 'PRO1',     cls: 'bg-purple-100 text-purple-700' },
  '3months':{ label: 'PRO3',     cls: 'bg-purple-200 text-purple-800' },
  '6months':{ label: 'PRO6',     cls: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' },
}

function PlanBadge({ plan, planEndDate }: { plan: string; planEndDate?: string | null }) {
  const isPremiumExpired = plan !== 'free' && planEndDate && new Date(planEndDate) < new Date()
  const cfg = isPremiumExpired
    ? { label: 'EXPIRED', cls: 'bg-red-100 text-red-500' }
    : (PLAN_BADGE[plan] ?? PLAN_BADGE.free)
  return (
    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${cfg.cls}`}>
      {cfg.label}
    </span>
  )
}

export default function HomePage() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)
  const [pinChild, setPinChild] = useState<Child | null>(null)

  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotUsername, setForgotUsername] = useState('')
  const [forgotState, setForgotState] = useState<'idle' | 'loading' | 'sent'>('idle')

  const [battleOpen, setBattleOpen] = useState(false)
  const [battleData, setBattleData] = useState<Array<{ child: Child; words: number; games: number; xp: number }>>([])
  const [battleLoading, setBattleLoading] = useState(false)
  const [syncMap, setSyncMap] = useState<Record<string, Record<string, SyncLevel>>>({})

  useExpiryGuard(session)

  function getLast7DayKeys() {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i)
      return d.toISOString().split('T')[0]
    })
  }

  async function openBattle() {
    setBattleOpen(true)
    setBattleLoading(true)
    const keys = getLast7DayKeys()
    const results = await Promise.all(children.map(async (child) => {
      const sync = await fetch(`/api/sync/${child.id}`).then(r => r.json()).catch(() => ({}))
      let words = 0, games = 0, xp = 0
      for (const lvl of Object.values(sync as Record<string, { history?: Record<string, { words: number; games: number; xp: number }> }>)) {
        for (const key of keys) {
          const h = lvl?.history?.[key]
          if (h) { words += h.words ?? 0; games += h.games ?? 0; xp += h.xp ?? 0 }
        }
      }
      return { child, words, games, xp }
    }))
    setBattleData(results.sort((a, b) => b.xp - a.xp))
    setBattleLoading(false)
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
      fetch('/api/children').then(r => r.ok ? r.json() : []),
    ]).then(([me, kids]) => {
      if (!me) { router.replace('/login'); return }
      setSession(me)
      const childList: Child[] = Array.isArray(kids) ? kids : []
      setChildren(childList)
      setLoading(false)
      // Fetch sync data for all children in parallel
      if (childList.length > 0) {
        Promise.all(
          childList.map(kid =>
            fetch(`/api/sync/${kid.id}`)
              .then(r => r.ok ? r.json() : {})
              .catch(() => ({}))
              .then(data => ({ id: kid.id, data }))
          )
        ).then(results => {
          const map: Record<string, Record<string, SyncLevel>> = {}
          for (const { id, data } of results) map[id] = data
          setSyncMap(map)
        })
      }
    })
  }, [router])

  function handleChildTap(child: Child) {
    if (child.pin) {
      // Check if already verified in this session
      if (sessionStorage.getItem(`pinVerified_${child.id}`)) {
        router.push(`/dashboard/${child.id}`)
      } else {
        setPinChild(child)
      }
    } else {
      router.push(`/dashboard/${child.id}`)
    }
  }

  async function handleForgot() {
    if (!forgotUsername.trim()) return
    setForgotState('loading')
    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: forgotUsername }),
    })
    setForgotState('sent')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 px-4 py-8 flex flex-col items-center">
        <div className="w-full max-w-sm space-y-4 animate-pulse">
          <div className="h-5 bg-gray-200 rounded-full w-2/3 mx-auto mb-6" />
          {[0, 1].map(i => (
            <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border-2 border-gray-100">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 rounded-2xl bg-gray-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-200 rounded-full w-3/4" />
                  <div className="h-3 bg-gray-100 rounded-full w-1/2" />
                </div>
              </div>
              <div className="flex gap-4 mb-4">
                <div className="h-3 bg-gray-100 rounded-full w-24" />
                <div className="h-3 bg-gray-100 rounded-full w-20" />
              </div>
              <div className="h-12 bg-gray-200 rounded-2xl" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 px-4 py-8 flex flex-col items-center">
      <UpgradeBanner
        plan={session?.plan ?? 'free'}
        freeTrialExpiresAt={session?.free_trial_expires_at}
        planEndDate={session?.plan_end_date}
      />
      {session && (() => {
        const d = daysUntilExpiry(session)
        if (d === null || d > 3) return null
        return (
          <div className="fixed top-16 left-1/2 -translate-x-1/2 z-20 w-[calc(100%-2rem)] max-w-sm bg-orange-50 border-2 border-orange-200 rounded-2xl px-4 py-2.5 flex items-center gap-2.5 shadow-md">
            <span className="text-xl flex-shrink-0">⏰</span>
            <p className="text-orange-700 text-xs font-bold leading-snug">
              {d <= 0 ? 'Tài khoản đã hết hạn!' : `Tài khoản hết hạn sau ${d} ngày!`}
              {' '}Vào <strong>Phụ huynh</strong> để gia hạn.
            </p>
          </div>
        )
      })()}

      {/* Parent shortcut + plan badge — top right */}
      <div className="fixed top-4 right-4 z-10 flex flex-col items-end gap-1.5">
        <button
          onClick={() => router.push('/dashboard')}
          className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md flex items-center justify-center text-xl hover:bg-white transition-colors"
          title="Phụ huynh"
        >
          👨‍👩
        </button>
        {session && <PlanBadge plan={session.plan} planEndDate={session.plan_end_date} />}
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-3">🌟</div>
        <h1 className="text-4xl font-black text-gray-800 tracking-tight">VocabWise</h1>
        <p className="text-gray-500 mt-2 text-lg font-semibold">
          Từ vựng tiếng Anh — vui học mỗi ngày
        </p>
      </div>

      {/* Child cards */}
      <div className="w-full max-w-sm space-y-5">
        {children.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-4xl mb-3">👶</p>
            <p className="font-semibold">Chưa có hồ sơ bé</p>
            <p className="text-sm mt-1">Vào <span className="font-bold">Phụ huynh</span> để thêm bé</p>
          </div>
        ) : (
          children.map((child) => {
            const cfg = THEME_CONFIG[child.theme ?? 'pink'] ?? THEME_CONFIG.pink

            // Streak badge
            const streakCur = child.streak?.current ?? 0
            const lastActive = child.streak?.lastActive ?? ''
            const todayStr = new Date().toISOString().split('T')[0]
            const yesterStr = new Date(Date.now() - 86400000).toISOString().split('T')[0]
            const streakBadge = streakCur === 0 ? null
              : lastActive === todayStr
                ? { icon: '🔥', label: `${streakCur} ngày`, cls: 'bg-orange-100 text-orange-600' }
                : lastActive === yesterStr
                  ? { icon: '⚡', label: `${streakCur} ngày`, cls: 'bg-yellow-100 text-yellow-700' }
                  : { icon: '💤', label: `${streakCur} ngày`, cls: 'bg-gray-100 text-gray-400' }

            const stats = computeStats(syncMap[child.id] ?? {})
            const activeLevelLbl = LEVEL_LABEL[stats.highestLevel ?? child.level]

            return (
              <button
                key={child.id}
                onClick={() => handleChildTap(child)}
                className={`w-full text-left ${cfg.bg} ${cfg.border} border-2 rounded-3xl p-5 shadow-lg active:scale-95 transition-transform duration-150 cursor-pointer select-none`}
              >
                {/* Avatar + Name + XP/Badge/Streak */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-18 h-18 w-[72px] h-[72px] rounded-2xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center text-4xl shadow-md flex-shrink-0`}>
                    {child.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className={`text-2xl font-black ${cfg.text} flex items-center gap-1.5`}>
                      {child.name}
                      {child.pin && <span className="text-base">🔒</span>}
                    </h2>
                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      {stats.totalXP > 0 && (
                        <span className="text-xs font-black text-yellow-600">⭐ {stats.totalXP.toLocaleString()} XP</span>
                      )}
                      {stats.badge && (
                        <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-full ${stats.badge.cls}`}>
                          {stats.badge.icon} {stats.badge.label}
                        </span>
                      )}
                      {streakBadge && (
                        <span className={`inline-flex items-center gap-0.5 text-[11px] font-black px-1.5 py-0.5 rounded-full ${streakBadge.cls}`}>
                          {streakBadge.icon} {streakBadge.label}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Module progress rows */}
                <div className="space-y-2 mb-4">
                  {/* Phonics */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-24 font-bold text-gray-500 flex-shrink-0">🔤 Phát âm</span>
                    <MiniBar value={stats.phonicsMastered} max={31} gradient={cfg.gradient} />
                    <span className="font-black text-gray-600 flex-shrink-0 w-10 text-right">{stats.phonicsMastered}/31</span>
                  </div>

                  {/* Daily */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="w-24 font-bold text-gray-500 flex-shrink-0 truncate">
                      📚 {activeLevelLbl ? `${activeLevelLbl.label} · ${activeLevelLbl.desc.split(' · ')[0]}` : 'Daily'}
                    </span>
                    <MiniBar value={stats.dailyWords} max={400} gradient={cfg.gradient} />
                    <span className="font-black text-gray-600 flex-shrink-0 w-10 text-right">
                      {stats.dailyTopics > 0 ? `${stats.dailyTopics}/30` : '0/30'}
                    </span>
                  </div>

                  {/* Academic */}
                  {stats.academicBook ? (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-24 font-bold text-gray-500 flex-shrink-0 truncate">
                        🎓 {stats.academicBook} · {stats.academicCefr}
                      </span>
                      <MiniBar value={stats.academicCompleted} max={stats.academicTotal} gradient={cfg.gradient} />
                      <span className="font-black text-gray-600 flex-shrink-0 w-10 text-right">{stats.academicCompleted}/{stats.academicTotal}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-24 font-bold text-gray-500 flex-shrink-0">🎓 Academic</span>
                      <span className="text-gray-300 font-semibold text-[11px]">Chưa bắt đầu</span>
                    </div>
                  )}
                </div>

                {/* CTA */}
                <div className={`${cfg.btn} text-white font-black text-lg py-3 rounded-2xl text-center transition-colors duration-150`}>
                  {child.pin ? '🔒 Nhập PIN để vào học' : 'Bắt đầu học! →'}
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Sibling Battle (if 2+ children) */}
      {children.length >= 2 && (
        <button
          onClick={openBattle}
          className="w-full max-w-sm mt-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-4 flex items-center gap-4 shadow-lg active:scale-95 transition-transform"
        >
          <span className="text-4xl">⚔️</span>
          <div className="flex-1 text-left">
            <p className="text-white font-black text-lg leading-tight">Sibling Battle</p>
            <p className="text-white/80 text-sm font-semibold">Xem ai học nhiều hơn tuần này!</p>
          </div>
          <span className="text-white/80 font-black text-lg">→</span>
        </button>
      )}

      {/* Sibling Battle modal */}
      {battleOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center px-4 pb-4 sm:items-center" onClick={() => setBattleOpen(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-5 text-center">
              <p className="text-4xl mb-1">⚔️</p>
              <h2 className="text-white font-black text-xl">Sibling Battle</h2>
              <p className="text-white/80 text-sm font-semibold mt-0.5">7 ngày gần nhất</p>
            </div>

            <div className="p-5 space-y-3">
              {battleLoading ? (
                <div className="text-center py-8 text-3xl animate-pulse">⏳</div>
              ) : (
                <>
                  {(() => {
                    const maxXp = Math.max(...battleData.map(d => d.xp), 1)
                    const medals = ['🥇', '🥈', '🥉']
                    const allZero = battleData.every(d => d.xp === 0)
                    const topXp = battleData[0]?.xp ?? 0
                    const isTie = battleData.filter(d => d.xp === topXp).length > 1 && topXp > 0

                    return (
                      <>
                        {isTie && (
                          <div className="text-center bg-yellow-50 rounded-2xl py-2 px-4 text-sm font-bold text-yellow-700">
                            🤝 Hai bé đang hòa nhau!
                          </div>
                        )}
                        {allZero && (
                          <div className="text-center bg-purple-50 rounded-2xl py-2 px-4 text-sm font-bold text-purple-600">
                            🌱 Chưa ai học tuần này — bắt đầu thôi!
                          </div>
                        )}
                        {battleData.map((d, i) => {
                          const barPct = maxXp > 0 ? Math.round((d.xp / maxXp) * 100) : 0
                          const isWinner = !isTie && i === 0 && d.xp > 0
                          const cfg = THEME_CONFIG[d.child.theme ?? 'pink'] ?? THEME_CONFIG.pink
                          return (
                            <div key={d.child.id} className={`rounded-2xl p-4 border-2 ${isWinner ? 'border-yellow-300 bg-yellow-50' : 'border-gray-100 bg-gray-50'}`}>
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-2xl">{medals[i] ?? '🎖️'}</span>
                                <span className="text-3xl">{d.child.emoji}</span>
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
                              <div className="h-2.5 bg-white rounded-full overflow-hidden border border-gray-200">
                                <div
                                  className={`h-full bg-gradient-to-r ${cfg.gradient} rounded-full transition-all duration-700`}
                                  style={{ width: `${Math.max(barPct, d.xp > 0 ? 4 : 0)}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </>
                    )
                  })()}
                </>
              )}

              <button
                onClick={() => setBattleOpen(false)}
                className="w-full mt-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-black rounded-2xl py-3 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-10 flex flex-col items-center gap-2">
        <p className="text-gray-400 text-sm font-medium">
          With ❤️ from <span className="font-bold text-gray-500">{session?.username}</span>
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-gray-400 text-xs font-semibold hover:text-gray-600 transition-colors"
          >
            🔐 Phụ huynh
          </button>
          <span className="text-gray-200">·</span>
          <button
            onClick={() => { setForgotOpen(true); setForgotState('idle'); setForgotUsername('') }}
            className="text-gray-400 text-xs font-semibold hover:text-gray-600 transition-colors"
          >
            Quên mật khẩu?
          </button>
          <span className="text-gray-200">·</span>
          <button
            onClick={logout}
            className="text-gray-400 text-xs font-semibold hover:text-gray-600 transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </div>

      {/* PIN Gate modal */}
      {pinChild && (
        <PinGate
          childId={pinChild.id}
          name={pinChild.name}
          emoji={pinChild.emoji}
          color={(pinChild.theme === 'blue' ? 'blue' : 'pink') as 'pink' | 'blue'}
          onSuccess={() => {
            setPinChild(null)
            router.push(`/dashboard/${pinChild.id}`)
          }}
        />
      )}

      {/* Forgot password modal */}
      {forgotOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4" onClick={() => setForgotOpen(false)}>
          <div className="bg-white rounded-3xl shadow-2xl p-7 w-full max-w-xs text-center" onClick={e => e.stopPropagation()}>
            <div className="text-4xl mb-3">🔑</div>
            <h2 className="text-xl font-black text-gray-800 mb-1">Quên mật khẩu</h2>
            {forgotState === 'sent' ? (
              <>
                <p className="text-green-600 font-semibold text-sm mt-3 mb-5">
                  ✅ Link đặt lại mật khẩu đã được gửi vào email!
                </p>
                <button onClick={() => setForgotOpen(false)}
                  className="w-full bg-gray-100 text-gray-600 font-bold rounded-2xl py-3">
                  Đóng
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-400 text-sm mb-5">Nhập số điện thoại đăng ký — link đặt lại mật khẩu sẽ được gửi vào email của phụ huynh.</p>
                <input
                  type="tel"
                  value={forgotUsername}
                  onChange={e => setForgotUsername(e.target.value)}
                  placeholder="Số điện thoại (VD: 0901234567)"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center font-bold text-gray-800 mb-4 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
                <button
                  onClick={handleForgot}
                  disabled={forgotState === 'loading' || !forgotUsername.trim()}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black py-3 rounded-2xl mb-3 disabled:opacity-50"
                >
                  {forgotState === 'loading' ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
                </button>
                <button onClick={() => setForgotOpen(false)}
                  className="w-full bg-gray-100 text-gray-500 font-semibold py-2.5 rounded-2xl text-sm">
                  Hủy
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
