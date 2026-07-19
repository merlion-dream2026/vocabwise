'use client'

import { useEffect, useRef, useState } from 'react'

const PULL_THRESHOLD = 70 // px dragged before release triggers a reload
const MAX_PULL = 90       // visual cap on how far the indicator travels
const DAMPING = 0.45      // finger moves further than the indicator, like iOS

// Bail out of the gesture if the touch starts inside a fixed-position overlay
// (modals, the bottom nav) or a nested scrollable element (e.g. the history
// panel's own `overflow-y-auto` list) — those should keep their native behavior.
function shouldIgnoreTarget(target: EventTarget | null): boolean {
  let el = target as HTMLElement | null
  while (el && el !== document.body) {
    const style = window.getComputedStyle(el)
    if (style.position === 'fixed') return true
    if ((style.overflowY === 'auto' || style.overflowY === 'scroll') && el.scrollHeight > el.clientHeight) return true
    el = el.parentElement
  }
  return false
}

export default function PullToRefresh() {
  const [pullY, setPullY] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const startY = useRef<number | null>(null)
  const active = useRef(false)

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      if (refreshing) return
      if (window.scrollY > 0) return
      if (shouldIgnoreTarget(e.target)) return
      startY.current = e.touches[0].clientY
      active.current = true
    }

    function onTouchMove(e: TouchEvent) {
      if (!active.current || startY.current === null || refreshing) return
      const dy = e.touches[0].clientY - startY.current
      if (dy <= 0 || window.scrollY > 0) {
        active.current = false
        setPullY(0)
        return
      }
      // Only hijack the gesture once it's clearly a downward pull — keeps taps/scrolls untouched.
      e.preventDefault()
      setPullY(Math.min(dy * DAMPING, MAX_PULL))
    }

    function onTouchEnd() {
      if (!active.current) return
      active.current = false
      startY.current = null
      setPullY(py => {
        if (py >= PULL_THRESHOLD) {
          setRefreshing(true)
          window.location.reload()
          return MAX_PULL
        }
        return 0
      })
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
    }
  }, [refreshing])

  const progress = Math.min(pullY / PULL_THRESHOLD, 1)
  const visible = pullY > 0 || refreshing
  // Position/rotation track the finger 1:1 while dragging (0s) — any easing there would feel
  // laggy/disconnected from the touch. Opacity always eases a little so the icon fades in/out
  // instead of popping; on release, position also eases (snap-back or settle into the spinner).
  const transition = `transform ${active.current ? '0s' : '0.25s cubic-bezier(0.22, 1, 0.36, 1)'}, opacity 0.15s ease-out`

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[70] flex justify-center pointer-events-none"
      style={{ transform: `translateY(${pullY - 48}px)`, opacity: visible ? 1 : 0, transition }}
    >
      <div className="mt-2 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center text-base">
        {refreshing ? (
          <span className="animate-spin">⏳</span>
        ) : (
          <span style={{ display: 'inline-block', transform: `rotate(${progress * 180}deg)`, opacity: 0.4 + progress * 0.6, transition }}>
            ⬇️
          </span>
        )}
      </div>
    </div>
  )
}
