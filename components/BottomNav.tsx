'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
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
  if (pathname === '/kids')      return 'profile'
  if (pathname === '/dashboard') return 'dashboard'
  if (pathname.startsWith('/vocabwise')) return 'academic'
  if (!childId) return ''
  const base  = `/dashboard/${childId}`
  const first = pathname.slice(base.length + 1).split('/')[0]
  if (first === 'phonics') return 'phonics'
  if (first === 'kids' || LEVEL_SLUGS.has(first)) return 'daily'
  return ''
}

type ChildInfo = { id: string; name: string; emoji: string }
type Child     = { id: string; name: string; emoji: string; pin?: string }

const MODULE_TABS = [
  { key: 'phonics',   label: 'Phonics',   icon: '🔊', needsChild: true  },
  { key: 'daily',     label: 'Daily',     icon: '📖', needsChild: true  },
  { key: 'academic',  label: 'Academic',  icon: '🎓', needsChild: false },
  { key: 'dashboard', label: 'Dashboard', icon: '📊', needsChild: false },
]

const DEST: Record<string, (id: string) => string> = {
  phonics:   id => `/dashboard/${id}/phonics`,
  daily:     id => `/dashboard/${id}/kids`,
  academic:  ()  => '/vocabwise',
  dashboard: ()  => '/dashboard',
}

export default function BottomNav() {
  const pathname = usePathname()
  const router   = useRouter()

  const [childId,   setChildId]   = useState<string | null>(null)
  const [childInfo, setChildInfo] = useState<ChildInfo | null>(null)
  const [showSheet, setShowSheet] = useState(false)
  const [children,  setChildren]  = useState<Child[]>([])
  const [loadingChildren, setLoadingChildren] = useState(false)
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
        if (!showSheet && !nearBottom) {
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
  }, [pathname, showSheet])

  // Always fetch fresh children when sheet opens — keeps emoji/name in sync
  const openProfileSheet = useCallback(async () => {
    setShowSheet(true)
    setLoadingChildren(true)
    try {
      const data = await fetch('/api/children').then(r => r.ok ? r.json() : [])
      const list: Child[] = Array.isArray(data) ? data : []
      setChildren(list)
      // Refresh active child info in case emoji/name changed since last login
      const cur = list.find(c => c.id === (localStorage.getItem('nav_child_id') ?? childId))
      if (cur) {
        const info: ChildInfo = { id: cur.id, name: cur.name, emoji: cur.emoji }
        localStorage.setItem('nav_child_info', JSON.stringify(info))
        setChildInfo(info)
      }
    } catch { /* ignore */ }
    setLoadingChildren(false)
  }, [childId])

  function selectChild(child: Child) {
    // PIN-protected and not yet verified this session → route through /kids PIN gate
    if (child.pin && !sessionStorage.getItem(`pinVerified_${child.id}`)) {
      setShowSheet(false)
      router.push(`/kids?select=${child.id}`)
      return
    }

    const info: ChildInfo = { id: child.id, name: child.name, emoji: child.emoji }
    localStorage.setItem('nav_child_id',   child.id)
    localStorage.setItem('nav_child_info', JSON.stringify(info))
    setChildId(child.id)
    setChildInfo(info)
    setShowSheet(false)

    // Stay on same module for new child, or fall back to their dashboard
    const cur = getActiveTab(pathname, childId)
    if (cur === 'phonics') { router.push(DEST.phonics(child.id)); return }
    if (cur === 'daily')   { router.push(DEST.daily(child.id));   return }
    router.push(`/dashboard/${child.id}`)
  }

  if (!shouldShowNav(pathname)) return null

  const active = getActiveTab(pathname, childId)

  function go(key: string) {
    const tab = MODULE_TABS.find(t => t.key === key)!
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

  const profileActive = active === 'profile'

  return (
    <>
      {/* Profile switcher bottom sheet */}
      {showSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => setShowSheet(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-3xl px-5 pt-4 pb-8 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h2 className="font-black text-gray-700 text-base mb-4 text-center">Chọn hồ sơ học</h2>

            {loadingChildren ? (
              <div className="flex justify-center py-6">
                <span className="text-3xl animate-pulse">👤</span>
              </div>
            ) : children.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-6">Chưa có hồ sơ nào</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {children.map(child => {
                  const isActive = childId === child.id
                  return (
                    <button
                      key={child.id}
                      onClick={() => selectChild(child)}
                      className={`flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all active:scale-95 ${
                        isActive
                          ? 'border-purple-400 bg-purple-50'
                          : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                      }`}
                    >
                      <span className={`w-14 h-14 flex items-center justify-center rounded-full overflow-hidden ${
                        isActive ? 'bg-purple-100' : 'bg-white border border-gray-100'
                      }`}>
                        <img src={getAvatarSrc(child.emoji)} className="w-full h-full object-cover" alt="" />
                      </span>
                      <span className="font-black text-gray-700 text-sm leading-tight">{child.name}</span>
                      {isActive && (
                        <span className="text-[10px] font-bold text-purple-500 bg-purple-100 px-2 py-0.5 rounded-full">
                          ✓ Đang học
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            <button
              onClick={() => { setShowSheet(false); router.push('/dashboard') }}
              className="mt-5 w-full text-center text-sm text-gray-400 font-semibold py-2 active:text-gray-600 transition-colors"
            >
              Quản lý hồ sơ →
            </button>
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <nav
        className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 bg-white/95 backdrop-blur-sm border-t border-gray-100 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] transition-transform duration-300 ease-in-out ${
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
            onClick={openProfileSheet}
            className="relative flex flex-col items-center justify-center gap-1 w-16 flex-shrink-0 active:bg-gray-50/70 transition-colors duration-100"
          >
            {profileActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
            )}
            {/* Circular avatar — key visual differentiator */}
            <span className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-150 overflow-hidden ${
              profileActive
                ? 'border-purple-400 bg-purple-50'
                : childInfo
                  ? 'border-gray-200 bg-gray-50'
                  : 'border-dashed border-gray-300 bg-white'
            }`}>
              {childInfo
                ? <img src={getAvatarSrc(childInfo.emoji)} className="w-full h-full object-cover" alt="" />
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
                <span className={`text-[10px] font-bold leading-none tracking-tight transition-colors duration-100 ${
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
