'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PinGate from '@/components/PinGate'
import UpgradeBanner from '@/components/UpgradeBanner'
import { useExpiryGuard, daysUntilExpiry } from '@/lib/useExpiryGuard'
import { getAvatarSrc } from '@/lib/avatars'
import {
  DAILY_LEVEL_ORDER, XP_BADGES,
  getPhonicsProgress, getXPAndBadge, getAllDailyProgress, getAllAcademicProgress,
  type SyncAllLevels,
} from '@/lib/childProgress'
import { ALL_BADGES } from '@/lib/badges'
import BangThanhTich from '@/components/BangThanhTich'

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

// ── Local helpers ────────────────────────────────────────────
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
    ? { label: 'HẾT HẠN', cls: 'bg-red-100 text-red-500' }
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

  const [syncMap, setSyncMap] = useState<Record<string, SyncAllLevels>>({})

  useExpiryGuard(session)

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
          const map: Record<string, SyncAllLevels> = {}
          for (const { id, data } of results) map[id] = data
          setSyncMap(map)
        })
      }
    })
  }, [router])

  // Auto-trigger child selection when redirected from nav sheet with ?select=childId
  // Uses window.location.search to avoid Next.js Suspense requirement for useSearchParams
  useEffect(() => {
    if (loading || children.length === 0) return
    const selectId = new URLSearchParams(window.location.search).get('select')
    if (!selectId) return
    const target = children.find(c => c.id === selectId)
    if (!target) return
    window.history.replaceState(null, '', '/kids') // clean URL before PIN gate appears
    handleChildTap(target)
  }, [loading]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleChildTap(child: Child) {
    // Persist child identity so BottomNav chip can show name/emoji across sessions
    localStorage.setItem('nav_child_id',   child.id)
    localStorage.setItem('nav_child_info', JSON.stringify({ id: child.id, name: child.name, emoji: child.emoji }))
    if (child.pin) {
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 px-4 pt-8 pb-nav flex flex-col items-center">
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 px-4 pt-8 pb-nav flex flex-col items-center">
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
                  : { icon: '💤', label: 'Đã nghỉ', cls: 'bg-gray-100 text-gray-400' }

            const sync = (syncMap[child.id] ?? {}) as SyncAllLevels
            const { totalXP, badge } = getXPAndBadge(sync)
            const phonics  = getPhonicsProgress(sync['phonics'])
            const allDaily = getAllDailyProgress(sync)
            const allAcad  = getAllAcademicProgress(sync['academic'])
            const pf = (a: number, b: number) => b > 0 ? (a >= b ? 100 : Math.floor(a / b * 100)) : 0

            // XP progress to next badge tier
            const badgeIdx = badge ? XP_BADGES.findIndex(b => b.minXP === badge.minXP) : XP_BADGES.length
            const nextXPBadge = badgeIdx > 0 ? XP_BADGES[badgeIdx - 1] ?? null : null
            const xpPct = nextXPBadge
              ? Math.min(100, Math.round((totalXP - (badge?.minXP ?? 0)) / (nextXPBadge.minXP - (badge?.minXP ?? 0)) * 100))
              : 0

            // Top earned achievement badges (from data available at profile level)
            const earnedBadgeIds = new Set([
              allDaily.seenWords >= 1   && 'first_word',
              allDaily.seenWords >= 50  && 'words_50',
              allDaily.seenWords >= 100 && 'words_100',
              allDaily.seenWords >= 300 && 'words_300',
              allDaily.topicsCompleted >= 1  && 'master_1',
              allDaily.topicsCompleted >= 5  && 'master_5',
              allDaily.topicsCompleted >= 10 && 'master_10',
              totalXP >= 100  && 'xp_100',
              totalXP >= 500  && 'xp_500',
              totalXP >= 1000 && 'xp_1000',
            ].filter(Boolean) as string[])
            const profileBadges = ALL_BADGES.filter(b => earnedBadgeIds.has(b.id)).slice(-3)

            return (
              <button
                key={child.id}
                onClick={() => handleChildTap(child)}
                className={`w-full text-left ${cfg.bg} ${cfg.border} border-2 rounded-3xl p-5 shadow-lg active:scale-95 transition-transform duration-150 cursor-pointer select-none`}
              >
                {/* Avatar + Name + XP/Badge/Streak */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-[86px] h-[86px] rounded-2xl bg-gradient-to-br ${cfg.gradient} flex-shrink-0 shadow-md overflow-hidden`}>
                    <img src={getAvatarSrc(child.emoji)} className="w-full h-full object-cover rounded-2xl" alt="" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className={`text-2xl font-black ${cfg.text} flex items-center gap-1.5`}>
                      {child.name}
                      {child.pin && <span className="text-base">🔒</span>}
                    </h2>
                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      {totalXP > 0 && (
                        <span className="text-xs font-black text-yellow-600">⭐ {totalXP.toLocaleString()} XP</span>
                      )}
                      {badge && (
                        <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-full ${badge.cls}`}>
                          {badge.icon} {badge.label}
                        </span>
                      )}
                      {streakBadge && (
                        <span className={`inline-flex items-center gap-0.5 text-[11px] font-black px-1.5 py-0.5 rounded-full ${streakBadge.cls}`}>
                          {streakBadge.icon} {streakBadge.label}
                        </span>
                      )}
                      {profileBadges.length > 0 && (
                        <>
                          <span className="text-gray-300 text-xs select-none">·</span>
                          {profileBadges.map(b => (
                            <span key={b.id} title={`${b.name}: ${b.desc}`} className="text-sm leading-none">{b.emoji}</span>
                          ))}
                        </>
                      )}
                    </div>
                    {nextXPBadge && totalXP > 0 && (
                      <div className="mt-1.5">
                        <div className="h-1 bg-white/50 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400 rounded-full transition-all duration-500" style={{ width: `${xpPct}%` }} />
                        </div>
                        <p className="text-[10px] text-gray-400 font-semibold mt-0.5">
                          {totalXP.toLocaleString()} / {nextXPBadge.minXP.toLocaleString()} XP → {nextXPBadge.icon} {nextXPBadge.label}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Module progress rows */}
                {syncMap[child.id] === undefined ? (
                  <div className="space-y-2 mb-4 animate-pulse">
                    {[1, 0.7, 0.5].map((w, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="h-2.5 bg-gray-200 rounded-full w-14" />
                        <div className="h-2.5 bg-gray-100 rounded-full" style={{ width: `${w * 40}%` }} />
                      </div>
                    ))}
                  </div>
                ) : totalXP === 0 && phonics.seen === 0 ? (
                  <div className="bg-white/50 rounded-2xl px-4 py-3 mb-4 space-y-1.5">
                    <p className={`font-black text-sm ${cfg.text}`}>👋 Bắt đầu hành trình học tiếng Anh!</p>
                    <p className="text-xs text-gray-500 leading-relaxed">Chọn module để học: Phonics · Từ vựng theo chủ đề · Bài tập học thuật</p>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      <span className="text-[11px] font-bold text-gray-400">🔤 Phonics</span>
                      <span className="text-gray-200">·</span>
                      <span className="text-[11px] font-bold text-gray-400">📚 Daily</span>
                      <span className="text-gray-200">·</span>
                      <span className="text-[11px] font-bold text-gray-400">🎓 Academic</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5 mb-4">
                    {/* Phonics */}
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-bold ${cfg.text}`}>🔤 Phonics</span>
                      <span className="text-gray-500">
                        {phonics.seen}/{phonics.total} bài ({pf(phonics.seen, phonics.total)}%)
                      </span>
                    </div>

                    {/* Daily */}
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-bold ${cfg.text} flex-shrink-0`}>📚 Daily</span>
                      <span className="text-gray-500 text-right">
                        {allDaily.topicsCompleted}/{allDaily.totalTopics} chủ đề ({pf(allDaily.topicsCompleted, allDaily.totalTopics)}%) · {allDaily.seenWords}/{allDaily.totalWords} từ ({pf(allDaily.seenWords, allDaily.totalWords)}%)
                      </span>
                    </div>

                    {/* Academic */}
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-bold ${cfg.text} flex-shrink-0`}>🎓 Academic</span>
                      <span className="text-gray-500 text-right">
                        {allAcad.completed}/{allAcad.total} chủ đề ({pf(allAcad.completed, allAcad.total)}%) · {allAcad.seenWords}/{allAcad.totalWords} từ ({pf(allAcad.seenWords, allAcad.totalWords)}%)
                      </span>
                    </div>
                  </div>
                )}

                {/* CTA — streak-risk aware */}
                {child.pin ? (
                  <div className={`${cfg.btn} text-white font-black text-lg py-3 rounded-2xl text-center transition-colors duration-150`}>
                    🔒 Nhập PIN để vào học
                  </div>
                ) : lastActive === yesterStr && streakCur > 0 ? (
                  <div className="bg-gradient-to-r from-orange-400 to-amber-400 text-white font-black text-base py-3 rounded-2xl text-center transition-colors duration-150">
                    ⚡ Học ngay để giữ streak 🔥 {streakCur} ngày!
                  </div>
                ) : (
                  <div className={`${cfg.btn} text-white font-black text-lg py-3 rounded-2xl text-center transition-colors duration-150`}>
                    {syncMap[child.id] !== undefined && totalXP === 0 && phonics.seen === 0 ? '🌟 Bắt đầu học ngay! →' : 'Tiếp tục học! →'}
                  </div>
                )}
              </button>
            )
          })
        )}
      </div>

      <div className="w-full max-w-sm mt-6">
        <BangThanhTich
          entries={children.map(c => ({ child: c, syncAll: (syncMap[c.id] ?? {}) as Record<string, { history?: Record<string, { words: number; games: number; xp: number }> }> }))}
          variant="kids"
        />
      </div>

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
          onClose={() => setPinChild(null)}
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
