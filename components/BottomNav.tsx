'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

const LEVEL_SLUGS = new Set(['seeker','starter','ranger','explorer','scholar','master'])

const GAME_SLUGS = new Set([
  'flashcard','listen','truefalse','match','memory','bubble','fillletter',
  'speak','spell','sentenceorder','quiz','gapfill','definitionmatch',
  'typing','speedround','sortwords','minimalpairs',
])

const HIDE_ROOTS = new Set([
  'login','register','verify-email','forgot-password','reset-password',
  'privacy','terms','superadmin',
])

const HIDE_TAILS = new Set([...GAME_SLUGS, 'srs', 'review', 'stress'])

function shouldShowNav(pathname: string): boolean {
  if (pathname === '/') return false
  const segs = pathname.split('/').filter(Boolean)
  if (segs.length === 0 || HIDE_ROOTS.has(segs[0])) return false
  if (HIDE_TAILS.has(segs[segs.length - 1])) return false
  return true
}

function getChildIdFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/dashboard\/([^/]+)/)
  const id = m?.[1]
  return id && id !== '' ? id : null
}

function getActiveTab(pathname: string, childId: string | null): string {
  if (pathname === '/dashboard') return 'dashboard'
  if (pathname.startsWith('/vocabwise')) return 'academic'
  if (!childId) return ''
  const base  = `/dashboard/${childId}`
  const first = pathname.slice(base.length + 1).split('/')[0]
  if (first === 'phonics') return 'phonics'
  if (first === 'kids' || LEVEL_SLUGS.has(first)) return 'daily'
  return ''
}

const TABS = [
  { key: 'phonics',   label: 'Phát âm',  icon: '🔊', needsChild: true  },
  { key: 'daily',     label: 'Daily',    icon: '📖', needsChild: true  },
  { key: 'academic',  label: 'Academic', icon: '🎓', needsChild: false },
  { key: 'dashboard', label: 'Dashboard',icon: '📊', needsChild: false },
]

const DEST: Record<string, (id: string) => string> = {
  phonics:   id => `/dashboard/${id}/phonics`,
  daily:     id => `/dashboard/${id}/kids`,
  academic:  ()  => '/vocabwise',
  dashboard: ()  => '/dashboard',
}

type ChildInfo = { id: string; name: string; emoji: string }

export default function BottomNav() {
  const pathname = usePathname()
  const router   = useRouter()
  const [childId,   setChildId]   = useState<string | null>(null)
  const [childInfo, setChildInfo] = useState<ChildInfo | null>(null)

  useEffect(() => {
    // Sync childId from URL path or localStorage
    const fromPath = getChildIdFromPath(pathname)
    if (fromPath) {
      setChildId(fromPath)
      localStorage.setItem('nav_child_id', fromPath)
    } else {
      const stored = localStorage.getItem('nav_child_id') ?? localStorage.getItem('vw_active_child')
      if (stored) setChildId(stored)
    }
    // Load child display info
    try {
      const raw = localStorage.getItem('nav_child_info')
      if (raw) setChildInfo(JSON.parse(raw))
    } catch { /* ignore malformed JSON */ }
  }, [pathname])

  // Prefetch all tab destinations for instant navigation
  useEffect(() => {
    router.prefetch('/kids')
    router.prefetch('/dashboard')
    router.prefetch('/vocabwise')
    if (childId) {
      router.prefetch(`/dashboard/${childId}/phonics`)
      router.prefetch(`/dashboard/${childId}/kids`)
    }
  }, [childId, router])

  if (!shouldShowNav(pathname)) return null

  const active  = getActiveTab(pathname, childId)
  const onKids  = pathname === '/kids'

  function go(key: string) {
    const tab = TABS.find(t => t.key === key)!
    if (tab.needsChild) {
      const id = childId
        ?? localStorage.getItem('nav_child_id')
        ?? localStorage.getItem('vw_active_child')
      if (!id) { router.push('/kids'); return }
      if (!childId) setChildId(id)
      router.push(DEST[key](id))
      return
    }
    router.push(DEST[key](childId ?? ''))
  }

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)', touchAction: 'manipulation' }}
    >
      {/* Child chip — tap to switch profile */}
      <button
        onClick={() => router.push('/kids')}
        className={`w-full flex items-center justify-between px-4 py-2 border-b transition-colors duration-100 ${
          onKids
            ? 'border-purple-100 bg-purple-50/60'
            : 'border-gray-100 active:bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-2">
          {childInfo ? (
            <>
              <span className="text-sm leading-none">{childInfo.emoji}</span>
              <span className="text-xs font-black text-gray-700">{childInfo.name}</span>
            </>
          ) : (
            <span className="text-xs font-bold text-gray-400">Chọn hồ sơ học</span>
          )}
        </div>
        <span className="text-[10px] font-bold text-gray-400 tracking-wide">
          {onKids ? '▲ Đang chọn' : 'Đổi ›'}
        </span>
      </button>

      {/* 4 module tabs */}
      <div className="flex h-14">
        {TABS.map(({ key, label, icon, needsChild }) => {
          const isActive = active === key
          const isDim    = needsChild && !childId
          return (
            <button
              key={key}
              onClick={() => go(key)}
              className="relative flex flex-col items-center justify-center gap-1 flex-1 active:bg-gray-50/70 transition-colors duration-100"
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
              )}
              <span
                className="text-[22px] leading-none transition-all duration-150"
                style={isActive ? undefined : { filter: 'grayscale(1)', opacity: isDim ? 0.3 : 0.5 }}
              >
                {icon}
              </span>
              <span className={`text-[10px] font-bold leading-none tracking-tight transition-colors duration-100
                ${isActive ? 'text-purple-600' : isDim ? 'text-gray-300' : 'text-gray-400'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
