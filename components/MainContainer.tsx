'use client'
import { usePathname } from 'next/navigation'

export default function MainContainer({ children }: { children: React.ReactNode }) {
  const isLanding = usePathname() === '/'
  return (
    <main className={isLanding ? 'min-h-screen' : 'max-w-md mx-auto min-h-screen pb-nav'}>
      {children}
    </main>
  )
}
