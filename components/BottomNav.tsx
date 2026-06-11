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
  // exclude the bare /dashboard route (no childId segment)
  return id && id !== '' ? id : null
}

function getActiveTab(pathname: string, childId: string | null): string {
  if (pathname === '/kids') return 'profile'
  if (pathname === '/dashboard') return 'dashboard'
  if (pathname.startsWith('/vocabwise')) return 'academic'
  if (!childId) return ''
  const base = `/dashboard/${childId}`
  const first = pathname.slice(base.length + 1).split('/')[0]
  if (first === 'phonics') return 'phonics'
  if (first === 'kids' || LEVEL_SLUGS.has(first)) return 'daily'
  return ''
}

const TABS = [
  { key: 'profile',   label: 'Profile',  icon: '👤', needsChild: false },
  { key: 'phonics',   label: 'Phát âm',  icon: '🔊', needsChild: true  },
  { key: 'daily',     label: 'Daily',    icon: '📖', needsChild: true  },
  { key: 'academic',  label: 'Academic', icon: '🎓', needsChild: false },
  { key: 'dashboard', label: 'Dashboard',icon: '📊', needsChild: false },
]

const DEST: Record<string, (id: string) => string> = {
  profile:   ()  => '/kids',
  phonics:   id  => `/dashboard/${id}/phonics`,
  daily:     id  => `/dashboard/${id}/kids`,
  academic:  ()  => '/vocabwise',
  dashboard: ()  => '/dashboard',
}

export default function BottomNav() {
  const pathname = usePathname()
  const router   = useRouter()
  const [childId, setChildId] = useState<string | null>(null)

  useEffect(() => {
    const fromPath = getChildIdFromPath(pathname)
    if (fromPath) {
      setChildId(fromPath)
      sessionStorage.setItem('nav_child_id', fromPath)
    } else {
      const stored = sessionStorage.getItem('nav_child_id') ?? sessionStorage.getItem('vw_active_child')
      if (stored) setChildId(stored)
    }
  }, [pathname])

  // Prefetch all tab routes for instant navigation
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

  const active = getActiveTab(pathname, childId)

  function go(key: string) {
    const tab = TABS.find(t => t.key === key)!
    if (tab.needsChild && !childId) return
    router.push(DEST[key](childId ?? ''))
  }

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)', touchAction: 'manipulation' }}
    >
      <div className="flex h-14 px-2">
        {TABS.map(({ key, label, icon, needsChild }) => {
          const isActive   = active === key
          const isDisabled = needsChild && !childId
          return (
            <button
              key={key}
              onClick={() => go(key)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 transition-colors duration-100
                ${isDisabled ? 'pointer-events-none' : 'active:bg-gray-50'}`}
            >
              <span className={`flex items-center justify-center w-10 h-7 rounded-full transition-colors duration-100
                ${isActive ? 'bg-purple-100' : ''}`}>
                <span className={`text-[20px] leading-none ${isActive ? 'scale-110' : ''} transition-transform duration-100`}>
                  {icon}
                </span>
              </span>
              <span className={`text-[10px] font-bold leading-none tracking-tight
                ${isActive ? 'text-purple-600' : isDisabled ? 'text-gray-200' : 'text-gray-400'}`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
