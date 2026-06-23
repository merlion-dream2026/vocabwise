'use client'
import { useEffect, useState, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { getAvatarSrc } from '@/lib/avatars'

const LEVEL_SLUGS = new Set(['seeker','starter','ranger','explorer','scholar','master'])
const GAME_SLUGS  = new Set([
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
  const m  = pathname.match(/^\/dashboard\/([^/]+)/)
  const id = m?.[1]
  return id && id !== '' ? id : null
}

function getActiveTab(pathname: string, childId: string | null): string {
  if (pathname === '/kids')         return 'profile'
  if (pathname === '/dashboard')    return 'dashboard'
  if (pathname === '/my-words')     return 'mywords'
  if (pathname.startsWith('/vocabwise')) return 'academic'
  if (!childId) return ''
  const base  = `/dashboard/${childId}`
  const first = pathname.slice(base.length + 1).split('/')[0]
  if (first === 'phonics') return 'phonics'
  if (first === 'kids' || LEVEL_SLUGS.has(first)) return 'daily'
  return ''
}

type ChildInfo = { id: string; name: string; emoji: string }

const MODULE_TABS = [
  { key: 'phonics',   label: 'Phonics',      icon: '🔊', needsChild: true  },
  { key: 'daily',     label: 'Daily',        icon: '📖', needsChild: true  },
  { key: 'academic',  label: 'Academic',     icon: '🎓', needsChild: false },
  { key: 'mywords',   label: 'My Words',    icon: '⭐', needsChild: false },
  { key: 'dashboard', label: 'Dashboard',    icon: '📊', needsChild: false },
]

const DEST: Record<string, (id: string) => string> = {
  phonics:   id => `/dashboard/${id}/phonics`,
  daily:     id => `/dashboard/${id}/kids`,
  academic:  ()  => '/vocabwise',
  mywords:   ()  => '/my-words',
  dashboard: ()  => '/dashboard',
}

export default function BottomNav() {
  const pathname = usePathname()
  const router   = useRouter()

  const [childId,   setChildId]   = useState<string | null>(null)
  const [childInfo, setChildInfo] = useState<ChildInfo | null>(null)
  const [navVisible, setNavVisible] = useState(true)
  const lastScrollY  = useRef(0)
  const ticking      = useRef(false)

  // Sync childId + childInfo from path / localStorage on every navigation
  useEffect(() => {
    const fromPath = getChildIdFromPath(pathname)
    if (fromPath) {
      setChildId(fromPath)
      localStorage.setItem('nav_child_id', fromPath)
    } else {
      const stored = localStorage.getItem('nav_child_id') ?? localStorage.getItem('vw_active_child')
      if (stored) setChildId(stored)
    }
    try {
      const raw = localStorage.getItem('nav_child_info')
      if (raw) setChildInfo(JSON.parse(raw))
    } catch { /* ignore */ }
  }, [pathname])

  // Prefetch tab routes for instant navigation
  useEffect(() => {
    router.prefetch('/kids')
    router.prefetch('/dashboard')
    router.prefetch('/vocabwise')
    router.prefetch('/my-words')
    if (childId) {
      router.prefetch(`/dashboard/${childId}/phonics`)
      router.prefetch(`/dashboard/${childId}/kids`)
    }
  }, [childId, router])

  // Auto-hide on scroll down, show on scroll up (Facebook-style)
  // Works on both PWA and browser — pure scroll event, no native API needed
  useEffect(() => {
    setNavVisible(true) // always show on page change
    lastScrollY.current = window.scrollY

    function onScroll() {
      if (ticking.current) return
      ticking.current = true
      requestAnimationFrame(() => {
        const cur  = window.scrollY
        const diff = cur - lastScrollY.current
        // Don't hide if sheet is open or near page bottom
        const nearBottom = cur + window.innerHeight >= document.body.scrollHeight - 60
        if (!nearBottom) {
          if (diff > 8)  setNavVisible(false) // scrolling down
          if (diff < -5) setNavVisible(true)  // scrolling up
        } else {
          setNavVisible(true)
        }
        lastScrollY.current = cur
        ticking.current = false
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [pathname])

  if (!shouldShowNav(pathname)) return null

  const active = getActiveTab(pathname, childId)

  function go(key: string) {
    if (active === key) return
    const tab = MODULE_TABS.find(t => t.key === key)!
    if (tab.needsChild) {
      const id = childId
        ?? localStorage.getItem('nav_child_id')
        ?? localStorage.getItem('vw_active_child')
      if (!id) { router.replace('/kids'); return }
      if (!childId) setChildId(id)
      router.replace(DEST[key](id))
      return
    }
    router.replace(DEST[key](childId ?? ''))
  }

  const profileActive = active === 'profile'

  return (
    <>
      {/* Bottom nav */}
      <nav
        className={`fixed bottom-0 inset-x-0 mx-auto w-full max-w-md z-40 bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] transition-transform duration-300 ease-in-out ${
          navVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)', touchAction: 'manipulation' }}
      >
        <div
          className="flex h-14 items-stretch"
          style={{
            paddingLeft:  'max(16px, env(safe-area-inset-left))',
            paddingRight: 'max(16px, env(safe-area-inset-right))',
          }}
        >

          {/* Profile tab — circular avatar, visually distinct */}
          <button
            onClick={() => router.push('/kids')}
            className="relative flex flex-col items-center justify-center gap-1 w-16 flex-shrink-0 active:bg-gray-50/70 transition-colors duration-100"
          >
            {profileActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
            )}
            {/* Circular avatar — key visual differentiator */}
            <span className={`relative w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-150 overflow-hidden ${
              profileActive
                ? 'border-purple-400 bg-purple-50'
                : childInfo
                  ? 'border-gray-200 bg-gray-50'
                  : 'border-dashed border-gray-300 bg-white'
            }`}>
              {childInfo
                ? <Image src={getAvatarSrc(childInfo.emoji)} fill className="object-cover" alt="" unoptimized />
                : <span className="text-xl">👤</span>}
            </span>
            <span className={`text-[10px] font-bold leading-none tracking-tight transition-colors duration-100 truncate max-w-[56px] ${
              profileActive ? 'text-purple-600' : 'text-gray-400'
            }`}>
              {childInfo?.name ?? 'Hồ sơ'}
            </span>
          </button>

          {/* Thin separator after Profile tab */}
          <div className="w-px bg-gray-100 my-3" />

          {/* 4 module tabs */}
          {MODULE_TABS.map(({ key, label, icon, needsChild }) => {
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
                <span className={`text-[9px] font-bold leading-none tracking-tight transition-colors duration-100 ${
                  isActive ? 'text-purple-600' : isDim ? 'text-gray-300' : 'text-gray-400'
                }`}>
                  {label}
                </span>
              </button>
            )
          })}

        </div>
      </nav>
    </>
  )
}
