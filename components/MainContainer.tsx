'use client'
import { usePathname } from 'next/navigation'

const FULL_WIDTH = new Set(['/', '/login'])

export default function MainContainer({ children }: { children: React.ReactNode }) {
  // Landing + login lay themselves out full-width (login has a two-column desktop layout);
  // every other screen is a phone-width column.
  const fullWidth = FULL_WIDTH.has(usePathname())
  return (
    <main className={fullWidth ? 'min-h-screen' : 'max-w-md mx-auto min-h-screen pb-nav'}>
      {children}
    </main>
  )
}
