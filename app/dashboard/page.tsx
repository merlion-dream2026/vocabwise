'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import UpgradeBanner from '@/components/UpgradeBanner'
import { useExpiryGuard, daysUntilExpiry } from '@/lib/useExpiryGuard'
import { clearAllDownloads } from '@/lib/useOfflineDownload'
import ReferralTab from './ReferralTab'
import type { Child, Session, ChildStats } from './_types'
import { getPlanBadge } from './_utils'
import { AddChildModal, EditChildModal } from './_components/ChildModals'
import { DashboardTab } from './_components/DashboardTab'
import { SettingsTab } from './_components/SettingsTab'
import { FaqCard } from './_components/FaqCard'
import { cachedFetch, invalidateCachedFetch } from '@/lib/cachedFetch'

const TAB_LABELS: Record<'dashboard' | 'referral' | 'faq' | 'settings', string> = {
  dashboard: '📊 Dashboard', referral: '🎁 Giới thiệu', faq: '❓ FAQ', settings: '⚙️ Cài đặt',
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [children, setChildren] = useState<Child[]>([])
  const [stats, setStats] = useState<ChildStats[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'dashboard' | 'referral' | 'faq' | 'settings'>('dashboard')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Child | null>(null)

  useExpiryGuard(session)

  async function loadData() {
    setLoading(true)
    try {
      const [refreshRes, kids] = await Promise.all([
        fetch('/api/auth/refresh', { method: 'POST' }),
        cachedFetch('/api/children').then(r => r.json()).catch(() => []),
      ])
      if (refreshRes.status === 403) {
        await fetch('/api/auth/logout', { method: 'POST' })
        invalidateCachedFetch('/api/auth/me')
        router.push('/login')
        return
      }
      const sess = await refreshRes.json().catch(() => null)
      if (!sess) { router.push('/login'); return }
      const childList: Child[] = Array.isArray(kids) ? kids : []
      setSession(sess)
      setChildren(childList)
      // Ensure bottom nav can reach child-specific tabs from /dashboard
      if (childList.length > 0) {
        const existing = localStorage.getItem('nav_child_id')
        const activeChild = childList.find(c => c.id === existing) ?? childList[0]
        if (!existing || !childList.find(c => c.id === existing)) {
          localStorage.setItem('nav_child_id', activeChild.id)
        }
        // Always sync child info so chip shows current name/emoji
        localStorage.setItem('nav_child_info', JSON.stringify({ id: activeChild.id, name: activeChild.name, emoji: activeChild.emoji }))
      }

      // Fetch all-levels sync for each child, plus the family's shared Academic sync
      // (Academic progress lives in vw_academic_sync, keyed by family — not per-child
      // vocab_sync — so it's fetched once and merged into every child's 'academic' key).
      const [syncResults, academicSync] = await Promise.all([
        Promise.all(childList.map(c => fetch(`/api/sync/${c.id}`).then(r => r.json()).catch(() => ({})))),
        fetch('/api/vocabwise/sync').then(r => r.ok ? r.json() : null).catch(() => null),
      ])
      setStats(childList.map((child, i) => ({
        child,
        syncAll: { ...(syncResults[i] ?? {}), ...(academicSync ? { academic: academicSync } : {}) },
      })))
    } catch {
      // Network error — keep existing state, user can retry
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  // Supabase Realtime auto-refresh
  useEffect(() => {
    let channel: { unsubscribe: () => void } | null = null
    async function setupRealtime() {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      channel = supabase.channel('vocab_sync_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'vocab_sync' }, () => loadData())
        .subscribe()
    }
    setupRealtime()
    return () => { channel?.unsubscribe() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-refresh on tab focus
  useEffect(() => {
    const handler = () => { if (!document.hidden) loadData() }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function logout() {
    await clearAllDownloads()
    await fetch('/api/auth/logout', { method: 'POST' })
    invalidateCachedFetch('/api/auth/me')
    router.push('/login')
  }

  if (!session) return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
      <p className="text-gray-400 font-bold">{loading ? 'Đang tải...' : 'Không thể tải. Vui lòng thử lại.'}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {showAdd && (
        <AddChildModal maxKids={session!.max_kids ?? (session!.plan === 'free' ? 1 : 3)} childCount={children.length} onClose={() => setShowAdd(false)}
          onAdded={c => { setChildren(p => [...p, c]); setShowAdd(false); loadData() }} />
      )}
      {editing && (
        <EditChildModal child={editing} onClose={() => setEditing(null)}
          onSaved={c => { setChildren(p => p.map(x => x.id === c.id ? c : x)); setEditing(null); loadData() }}
          onDeleted={id => { setChildren(p => p.filter(x => x.id !== id)); setEditing(null); loadData() }} />
      )}

      <UpgradeBanner
        plan={session!.plan}
        freeTrialExpiresAt={session!.free_trial_expires_at}
        planEndDate={session!.plan_end_date}
        username={session!.username}
      />
      {(() => {
        const d = daysUntilExpiry(session!)
        if (d === null || d > 3) return null
        return (
          <div className="mx-auto max-w-xl px-4 pt-3">
            <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl px-4 py-2.5 flex items-center gap-2.5">
              <span className="text-xl flex-shrink-0">⏰</span>
              <p className="text-orange-700 text-xs font-bold leading-snug">
                {d <= 0 ? 'Tài khoản đã hết hạn!' : `Tài khoản hết hạn sau ${d} ngày!`}
                {' '}Vui lòng <button onClick={() => setTab('settings')} className="underline">gia hạn ngay</button>.
              </p>
            </div>
          </div>
        )
      })()}

      {/* Gradient header */}
      <div className="bg-gradient-to-br from-purple-500 to-pink-500">
        <div className="max-w-xl mx-auto px-4 pt-6 pb-0">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-white font-black text-2xl">📚 VocabWise</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-white/70 text-sm font-semibold">{session!.username}</p>
                {(() => {
                  const isBonusActive = !!session!.bonus_pro_expires_at && new Date(session!.bonus_pro_expires_at) > new Date()
                  const b = isBonusActive && session!.plan === 'free'
                    ? { label: '🎁 PRO', cls: 'bg-gradient-to-r from-purple-400 to-pink-400 text-white' }
                    : getPlanBadge(session!.plan, session!.plan_end_date)
                  return <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${b.cls}`}>{b.label}</span>
                })()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => router.push('/kids')}
                className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-2 rounded-2xl transition-colors whitespace-nowrap">
                🎮 Chế độ học
              </button>
              <button onClick={logout}
                className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-2 rounded-2xl transition-colors whitespace-nowrap">
                🚪 Đăng xuất
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {(['dashboard', 'referral', 'faq', 'settings'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-2.5 rounded-t-2xl font-black text-sm whitespace-nowrap flex-shrink-0 transition-colors ${
                  tab === t ? 'bg-white text-gray-800' : 'text-white/70 hover:text-white'}`}>
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-xl mx-auto px-4 py-5">
        {tab === 'dashboard' ? (
          <DashboardTab
            stats={stats} loading={loading}
            onRefresh={loadData}
            onChildClick={child => router.push(`/dashboard/${child.id}`)}
            onEditChild={setEditing}
            session={session!}
            onAddChild={() => setShowAdd(true)}
          />
        ) : tab === 'referral' ? (
          <ReferralTab />
        ) : tab === 'faq' ? (
          <FaqCard />
        ) : (
          <SettingsTab kids={children} session={session!} onChildrenRefresh={loadData} />
        )}
      </div>
    </div>
  )
}
