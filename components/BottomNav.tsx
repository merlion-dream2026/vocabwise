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
  if (pathname.startsWith('/ielts-speaking')) return 'ai-speak'
  if (!childId) return ''
  const base  = `/dashboard/${childId}`
  const first = pathname.slice(base.length + 1).split('/')[0]
  if (first === 'phonics') return 'phonics'
  if (first === 'profile' || first === 'stickers') return 'profile'
  if (first === 'kids' || LEVEL_SLUGS.has(first)) return 'daily'
  return ''
}

type ChildInfo = { id: string; name: string; emoji: string }

const MODULE_TABS = [
  { key: 'phonics',   label: 'Phonics',      icon: '🔊', needsChild: true  },
  { key: 'daily',     label: 'Daily',        icon: '📖', needsChild: true  },
  { key: 'academic',  label: 'Academic',     icon: '🎓', needsChild: false },
  { key: 'ai-speak',  label: 'AI Speak',    icon: '🎙️', needsChild: false },
  { key: 'mywords',   label: 'My Words',    icon: '⭐', needsChild: false },
  { key: 'dashboard', label: 'Dashboard',    icon: '📊', needsChild: false },
]

// Call on logout — the per-tab "resume where I left off" paths and active-child
// pointer are tied to whichever account was signed in, and must not leak into
// the next account that logs in on this device.
export function clearNavState() {
  localStorage.removeItem('nav_child_id')
  localStorage.removeItem('nav_child_info')
  localStorage.removeItem('vw_active_child')
  for (const { key } of MODULE_TABS) localStorage.removeItem(`nav_last_${key}`)
}

const DEST: Record<string, (id: string) => string> = {
  phonics:   id => `/dashboard/${id}/phonics`,
  daily:     id => `/dashboard/${id}/kids`,
  academic:  ()  => '/vocabwise',
  'ai-speak': () => '/ielts-speaking',
  mywords:   ()  => '/my-words',
  dashboard: ()  => '/dashboard',
}

export default function BottomNav() {
  const pathname = usePathname()
  const router   = useRouter()

  const [childId,   setChildId]   = useState<string | null>(null)
  const [childInfo, setChildInfo] = useState<ChildInfo | null>(null)
  const [navVisible, setNavVisible] = useState(true)
  const [keyboardOpen, setKeyboardOpen] = useState(false)
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

    // Remember the last sub-path visited within each tab (e.g. which Academic book/
    // topic or Daily level was open), so switching tabs and coming back resumes there
    // instead of resetting to that tab's landing page. Only recorded on pages where the
    // nav itself is shown, which naturally excludes mid-game/quiz sub-routes.
    if (shouldShowNav(pathname)) {
      const tab = getActiveTab(pathname, fromPath)
      if (tab && tab !== 'profile') {
        localStorage.setItem(`nav_last_${tab}`, pathname)
      }
    }
  }, [pathname])

  // Prefetch tab routes for instant navigation
  useEffect(() => {
    router.prefetch('/kids')
    router.prefetch('/dashboard')
    router.prefetch('/vocabwise')
    router.prefetch('/ielts-speaking')
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

  // iOS Safari: when the on-screen keyboard opens it shrinks the visual viewport but not the layout
  // viewport, so a fixed bottom bar gets left floating mid-screen. Hide it while an input is focused
  // or the visual viewport is much shorter than the window.
  useEffect(() => {
    const vv = window.visualViewport
    const isEditable = (el: Element | null) =>
      !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || (el as HTMLElement).isContentEditable)
    const update = () => {
      const shrunk = !!vv && vv.height < window.innerHeight - 120
      setKeyboardOpen(shrunk || isEditable(document.activeElement))
    }
    update()
    window.addEventListener('focusin', update)
    const onOut = () => setTimeout(update, 50)
    window.addEventListener('focusout', onOut)
    vv?.addEventListener('resize', update)
    return () => {
      window.removeEventListener('focusin', update)
      window.removeEventListener('focusout', onOut)
      vv?.removeEventListener('resize', update)
    }
  }, [pathname])

  if (!shouldShowNav(pathname)) return null

  const active = getActiveTab(pathname, childId)

  function go(key: string) {
    if (active === key) return
    const tab = MODULE_TABS.find(t => t.key === key)!
    const lastPath = localStorage.getItem(`nav_last_${key}`)

    if (tab.needsChild) {
      const id = childId
        ?? localStorage.getItem('nav_child_id')
        ?? localStorage.getItem('vw_active_child')
      if (!id) { router.replace('/kids'); return }
      if (!childId) setChildId(id)
      // Only resume the remembered path if it belongs to this same child profile —
      // otherwise fall back to the tab's landing page.
      const dest = lastPath && getChildIdFromPath(lastPath) === id ? lastPath : DEST[key](id)
      router.replace(dest)
      return
    }
    router.replace(lastPath ?? DEST[key](childId ?? ''))
  }

  const profileActive = active === 'profile'

  const tabBase = 'relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 transition-all duration-150 active:scale-95'

  return (
    <>
      {/* Bottom nav — floating capsule, labels kept */}
      <nav
        className={`pointer-events-none fixed bottom-0 inset-x-0 mx-auto w-full max-w-md z-40 px-3 transition-transform duration-300 ease-in-out ${
          navVisible && !keyboardOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)', touchAction: 'manipulation', willChange: 'transform' }}
      >
        <div
          className="pointer-events-auto flex items-stretch gap-0.5 rounded-[28px] border-2 border-b-[4px] border-slate-200 bg-white p-1.5 shadow-[0_6px_20px_rgba(0,0,0,0.12)]"
        >
          {/* Profile tab — circular avatar */}
          <button
            onClick={() => router.push(childId ? `/dashboard/${childId}/profile` : '/kids')}
            className={`${tabBase} max-w-[3.75rem] ${profileActive ? 'bg-purple-100' : ''}`}
          >
            <span className={`relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 ${
              profileActive ? 'border-purple-400 bg-purple-50' : childInfo ? 'border-gray-200 bg-gray-50' : 'border-dashed border-gray-300 bg-white'
            }`}>
              {childInfo
                ? <Image src={getAvatarSrc(childInfo.emoji)} fill className="object-cover" alt="" unoptimized />
                : <span className="text-base">👤</span>}
            </span>
            <span className={`max-w-full truncate text-[10px] font-bold leading-none ${profileActive ? 'text-purple-700' : 'text-gray-400'}`}>
              {childInfo?.name ?? 'Hồ sơ'}
            </span>
          </button>

          {MODULE_TABS.map(({ key, label, icon, needsChild }) => {
            const isActive = active === key
            const isDim    = needsChild && !childId
            return (
              <button key={key} onClick={() => go(key)} className={`${tabBase} ${isActive ? 'bg-purple-100' : ''}`}>
                <span
                  className="text-[20px] leading-none"
                  style={isActive ? undefined : { filter: 'grayscale(1)', opacity: isDim ? 0.3 : 0.5 }}
                >
                  {icon}
                </span>
                <span className={`max-w-full truncate text-[10px] font-bold leading-none ${
                  isActive ? 'text-purple-700' : isDim ? 'text-gray-300' : 'text-gray-400'
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
