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

  if (pullY === 0 && !refreshing) return null

  const progress = Math.min(pullY / PULL_THRESHOLD, 1)

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[70] flex justify-center pointer-events-none"
      style={{ transform: `translateY(${pullY - 48}px)`, transition: active.current ? 'none' : 'transform 0.2s ease-out' }}
    >
      <div className="mt-2 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center text-base">
        {refreshing ? (
          <span className="animate-spin">⏳</span>
        ) : (
          <span style={{ display: 'inline-block', transform: `rotate(${progress * 180}deg)`, opacity: 0.4 + progress * 0.6 }}>
            ⬇️
          </span>
        )}
      </div>
    </div>
  )
}
