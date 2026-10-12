'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TRIAL_DAYS } from '@/lib/plans'

// Phone-only "Dùng thử" bar pinned to the bottom once the hero CTA has scrolled away.
export default function StickyCta() {
  const [show, setShow] = useState(false)
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 640)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div aria-hidden={!show}
      className={`md:hidden fixed inset-x-0 bottom-0 z-40 border-t border-purple-100 bg-white/95 backdrop-blur px-4 py-3 transition-transform duration-300 ${show ? 'translate-y-0' : 'translate-y-full'}`}
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
      <Link href="/register" tabIndex={show ? 0 : -1}
        className="flex w-full items-center justify-center rounded-2xl border-b-[4px] border-purple-700/40 bg-gradient-to-r from-purple-500 to-pink-500 py-3 text-base font-black text-white active:translate-y-0.5">
        🚀 Dùng thử miễn phí {TRIAL_DAYS} ngày
      </Link>
    </div>
  )
}
