'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

// iOS 26 paints the status-bar zone from the page's background color (theme-color is ignored) —
// with our light body that showed as a hazy band over every colored header. On each route,
// sample the color of whatever header sits at the top of the screen and reuse it for
// --statusbar (html/body background-color on phones, globals.css) and theme-color.
// Ported from axanh-global-english.
export default function StatusBarTint() {
  const path = usePathname()
  useEffect(() => {
    const run = () => {
      const root = document.documentElement
      const top = parseFloat(getComputedStyle(root).getPropertyValue('--sat')) || 0
      let el = document.elementFromPoint(window.innerWidth / 2, top + 4) as HTMLElement | null
      let color = ''
      while (el && el !== root && !color) {
        const cs = getComputedStyle(el)
        color = solid(cs.backgroundImage.match(/rgba?\([^)]+\)/)?.[0]) || solid(cs.backgroundColor)
        el = el.parentElement
      }
      if (!color) return
      root.style.setProperty('--statusbar', color)
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', color)
    }
    // After paint, and again once client-only screens (games shuffle on mount) have rendered
    let raf = requestAnimationFrame(() => { raf = requestAnimationFrame(run) })
    const t = setTimeout(run, 400)
    return () => { cancelAnimationFrame(raf); clearTimeout(t) }
  }, [path])
  return null
}

// rgb()/rgba() with alpha ≥ .5, else '' (skips transparent wrappers and translucent chips)
function solid(c: string | undefined) {
  const m = c?.match(/rgba?\(([^)]+)\)/)
  if (!m) return ''
  const a = m[1].split(/[ ,/]+/).filter(Boolean)[3]
  return a !== undefined && parseFloat(a) < 0.5 ? '' : c!
}
