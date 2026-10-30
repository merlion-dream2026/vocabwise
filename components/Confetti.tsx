'use client'
import { useEffect, useState } from 'react'

const COLORS = ['#FF6B9D', '#4A90D9', '#FFD700', '#50C878', '#FF6B35', '#A855F7']
const COUNT = 70

type Piece = { left: number; w: number; h: number; color: string; dur: number; delay: number; dx: number; rot: number; flip: number }

// Pure CSS (transform/opacity keyframes in globals.css): the compositor runs it off the main thread,
// so it stays smooth while the page saves scores / re-renders underneath. The old canvas +
// requestAnimationFrame version stuttered exactly then — the moment a celebration fires.
export default function Confetti({ onDone }: { onDone?: () => void }) {
  const [pieces, setPieces] = useState<Piece[]>([])

  useEffect(() => {
    // Random layout generated client-side after mount (no SSR/hydration mismatch)
    const ps = Array.from({ length: COUNT }, () => ({
      left: Math.random() * 100,
      w: Math.random() * 6 + 6,
      h: Math.random() * 4 + 4,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      dur: 2.2 + Math.random() * 1.4,
      delay: Math.random() * 0.5,
      dx: (Math.random() - 0.5) * 160,
      rot: (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 540),
      flip: 0.6 + Math.random() * 0.8,
    }))
    setPieces(ps)
    const longest = Math.max(...ps.map((p) => p.dur + p.delay))
    const t = setTimeout(() => onDone?.(), longest * 1000)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p, i) => (
        // Outer span falls/spins, inner one flutters — two animations on one element would fight over `transform`
        <span key={i} className="confetti-piece"
          style={{ left: `${p.left}%`, animationDuration: `${p.dur}s`, animationDelay: `${p.delay}s`, ['--dx' as string]: `${p.dx}px`, ['--rot' as string]: `${p.rot}deg` }}>
          <span className="confetti-paper" style={{ width: p.w, height: p.h, background: p.color, animationDuration: `${p.flip}s` }} />
        </span>
      ))}
    </div>
  )
}
