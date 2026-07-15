'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const NAV_LINKS = [
  { href: '#modules', label: 'Module học' },
  { href: '#pricing', label: 'Bảng giá' },
  { href: '#faq', label: 'FAQ' },
]

const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2'

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b transition-shadow duration-300 ${scrolled ? 'border-gray-200 shadow-sm' : 'border-gray-100'}`}>
      <div className="max-w-7xl mx-auto px-4 lg:px-12 py-4 flex items-center justify-between">
        <span className="font-black text-xl lg:text-2xl text-gray-800">📚 VocabWise</span>

        <div className="hidden lg:flex items-center gap-8 text-sm lg:text-base font-bold text-gray-500">
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href} className={`hover:text-purple-600 transition-colors rounded-lg ${FOCUS_RING}`}>{l.label}</a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Link href="/login"
            className={`bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black text-sm lg:text-base px-5 py-3 rounded-2xl shadow hover:shadow-md transition-all ${FOCUS_RING}`}>
            🔐 Đăng nhập
          </Link>
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Đóng menu' : 'Mở menu'}
            aria-expanded={menuOpen}
            className={`lg:hidden w-11 h-11 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors ${FOCUS_RING}`}>
            <span className="text-xl">{menuOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="lg:hidden border-t border-gray-100 bg-white px-4 py-2 flex flex-col gap-1">
          {NAV_LINKS.map(l => (
            <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)}
              className={`py-3 px-2 rounded-lg text-gray-600 font-bold hover:bg-gray-50 hover:text-purple-600 transition-colors ${FOCUS_RING}`}>
              {l.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  )
}
