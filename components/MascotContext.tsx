'use client'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
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

type ChildLite = { id: string; name: string; mascot: MascotCharacter | null; introSeen: boolean }

// "Để sau" hides the first-pick dialog for this child until the tab is closed.
const SNOOZE_KEY = 'mascot_pick_later'
function snoozedIds(): string[] {
  try { return JSON.parse(sessionStorage.getItem(SNOOZE_KEY) ?? '[]') } catch { return [] }
}

// For the child profile's "Bạn đồng hành" card. mascot: undefined = still loading.
type Buddy = { mascot: MascotCharacter | null | undefined; replayIntro: () => void; openPicker: () => void }
const BuddyCtx = createContext<Buddy | null>(null)
export function useMascotBuddy(): Buddy | null {
  return useContext(BuddyCtx)
}

export function ChildMascotProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const inScope = isChildScopedPath(pathname)
  // undefined = not resolved yet; null = resolved, no child (or not found) → default mascot
  const [child, setChild] = useState<ChildLite | null | undefined>(undefined)
  const [snoozed, setSnoozed] = useState<string[]>([])
  const [replay, setReplay] = useState(false)

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
        type Row = { id: string; name: string; mascot?: unknown; mascot_intro_seen_at?: string | null }
        const c = Array.isArray(list) ? (list as Row[]).find(k => k.id === id) : undefined
        setChild(c ? { id: c.id, name: c.name, mascot: isMascotCharacter(c.mascot) ? c.mascot : null, introSeen: !!c.mascot_intro_seen_at } : null)
      })
      .catch(() => { if (alive) setChild(null) })
    return () => { alive = false }
  }, [pathname, inScope])

  const character: MascotCharacter | null =
    !inScope ? DEFAULT_MASCOT : child === undefined ? null : child?.mascot ?? DEFAULT_MASCOT

  function patchChild(body: object) {
    if (!child) return Promise.resolve(null)
    return fetch(`/api/children/${child.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    }).catch(() => null)
  }

  async function choose(mascot: MascotCharacter): Promise<boolean> {
    if (!child) return false
    const res = await patchChild({ mascot })
    if (!res?.ok) return false
    invalidateCachedFetch('/api/children')
    setChild({ ...child, mascot, introSeen: child.mascot === mascot && child.introSeen })
    return true
  }

  // Finished or skipped the hello slides. Optimistic: if the save fails they simply show again next visit.
  function introDone() {
    setReplay(false)
    if (!child || child.introSeen) return
    setChild({ ...child, introSeen: true })
    patchChild({ mascotIntroSeen: true }).then(res => { if (res?.ok) invalidateCachedFetch('/api/children') })
  }

  function later() {
    if (!child) return
    const ids = [...snoozedIds(), child.id]
    try { sessionStorage.setItem(SNOOZE_KEY, JSON.stringify(ids)) } catch { /* private mode: snooze for this render only */ }
    setSnoozed(ids)
  }

  function openPicker() {
    if (!child) return
    const ids = snoozedIds().filter(x => x !== child.id)
    try { sessionStorage.setItem(SNOOZE_KEY, JSON.stringify(ids)) } catch { /* ignore */ }
    setSnoozed(ids)
  }

  const askPick = inScope && !!child && child.mascot === null && !snoozed.includes(child.id)
  // Every child meets its companion once — whether the child or a parent picked it — plus on-demand replays.
  const showIntro = inScope && !!child?.mascot && (!child.introSeen || replay)

  const buddy: Buddy = {
    mascot: inScope ? (child === undefined ? undefined : child?.mascot ?? null) : undefined,
    replayIntro: () => setReplay(true),
    openPicker,
  }

  return (
    <MascotCtx.Provider value={character}>
      <BuddyCtx.Provider value={buddy}>
        {children}
      </BuddyCtx.Provider>
      {askPick && child && <MascotPickDialog childName={child.name} onChoose={choose} onLater={later} />}
      {showIntro && child?.mascot && <MascotIntro key={child.id} character={child.mascot} childName={child.name} onDone={introDone} />}
    </MascotCtx.Provider>
  )
}
