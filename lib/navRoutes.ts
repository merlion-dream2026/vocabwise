// Which routes show the bottom nav. Pure so it can be unit-tested (lib/navRoutes.test.ts).

export const LEVEL_SLUGS = new Set(['seeker','starter','ranger','explorer','scholar','master'])

const HIDE_ROOTS = new Set([
  'login','register','verify-email','forgot-password','reset-password',
  'privacy','terms','superadmin',
])
// Focus screens (tests, SRS/review runs) — a stray tap on the nav would abandon them.
const HIDE_TAILS = new Set(['srs', 'review', 'stress', 'level-test', 'module-test', 'placement'])

// Game routes are matched by position, not by name, so a new game hides the nav without
// touching this file:  /dashboard/[child]/[level]/[topic]/[game]
//                      /dashboard/[child]/phonics/[levelId]/[lessonId]/[game]
function isGameRoute(segs: string[]): boolean {
  if (segs[0] !== 'dashboard') return false
  if (segs[2] === 'phonics') return segs.length === 6 && segs[3] !== 'chart'
  return segs.length === 5 && LEVEL_SLUGS.has(segs[2])
}

export function shouldShowNav(pathname: string): boolean {
  if (pathname === '/') return false
  const segs = pathname.split('/').filter(Boolean)
  if (segs.length === 0 || HIDE_ROOTS.has(segs[0])) return false
  if (HIDE_TAILS.has(segs[segs.length - 1])) return false
  if (segs.includes('revision')) return false
  return !isGameRoute(segs)
}
