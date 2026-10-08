'use client'
import { useEffect, useState, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { cachedFetch, invalidateCachedFetch } from '@/lib/cachedFetch'
import { activeChildId } from '@/lib/academicSync'
import { DEFAULT_MASCOT, isMascotCharacter, type MascotCharacter } from '@/lib/mascots'
import { MascotCtx } from '@/components/Mascot'
import { MascotPickDialog } from '@/components/MascotPicker'
import MascotIntro from '@/components/MascotIntro'

// Which mascot the current child learns with (children.mascot). Child-scoped routes resolve the
// child from the URL (/dashboard/<id>/…) or the active-child pointer (Academic, My Words); every
// other route (landing, 404, onboarding…) gets DEFAULT_MASCOT. `null` = still resolving — <Mascot>
// then keeps an empty tile so a Bubi child never flashes Rocky first.

function isChildScopedPath(pathname: string): boolean {
  return /^\/dashboard\/[^/]+/.test(pathname) || /^\/(vocabwise|my-words)(\/|$)/.test(pathname)
}

function childIdFor(pathname: string): string | null {
  return pathname.match(/^\/dashboard\/([^/]+)/)?.[1] ?? activeChildId()
}

type ChildLite = { id: string; name: string; mascot: MascotCharacter | null }

// "Để sau" hides the first-pick dialog for this child until the tab is closed.
const SNOOZE_KEY = 'mascot_pick_later'
function snoozedIds(): string[] {
  try { return JSON.parse(sessionStorage.getItem(SNOOZE_KEY) ?? '[]') } catch { return [] }
}

export function ChildMascotProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const inScope = isChildScopedPath(pathname)
  // undefined = not resolved yet; null = resolved, no child (or not found) → default mascot
  const [child, setChild] = useState<ChildLite | null | undefined>(undefined)
  const [snoozed, setSnoozed] = useState<string[]>([])
  const [intro, setIntro] = useState<MascotCharacter | null>(null)   // just picked → hello slides

  useEffect(() => {
    if (!inScope) return
    const id = childIdFor(pathname)
    setSnoozed(snoozedIds())
    if (!id) { setChild(null); return }
    let alive = true
    cachedFetch('/api/children')
      .then(r => (r.ok ? r.json() : []))
      .then(list => {
        if (!alive) return
        const c = Array.isArray(list) ? (list as { id: string; name: string; mascot?: unknown }[]).find(k => k.id === id) : undefined
        setChild(c ? { id: c.id, name: c.name, mascot: isMascotCharacter(c.mascot) ? c.mascot : null } : null)
      })
      .catch(() => { if (alive) setChild(null) })
    return () => { alive = false }
  }, [pathname, inScope])

  const character: MascotCharacter | null =
    !inScope ? DEFAULT_MASCOT : child === undefined ? null : child?.mascot ?? DEFAULT_MASCOT

  async function choose(mascot: MascotCharacter): Promise<boolean> {
    if (!child) return false
    const res = await fetch(`/api/children/${child.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mascot }),
    }).catch(() => null)
    if (!res?.ok) return false
    invalidateCachedFetch('/api/children')
    setChild({ ...child, mascot })
    setIntro(mascot)
    return true
  }

  function later() {
    if (!child) return
    const ids = [...snoozedIds(), child.id]
    try { sessionStorage.setItem(SNOOZE_KEY, JSON.stringify(ids)) } catch { /* private mode: snooze for this render only */ }
    setSnoozed(ids)
  }

  const askPick = inScope && !!child && child.mascot === null && !snoozed.includes(child.id)

  return (
    <MascotCtx.Provider value={character}>
      {children}
      {askPick && child && <MascotPickDialog childName={child.name} onChoose={choose} onLater={later} />}
      {intro && child && <MascotIntro character={intro} childName={child.name} onDone={() => setIntro(null)} />}
    </MascotCtx.Provider>
  )
}
