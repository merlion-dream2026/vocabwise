import { NextRequest, NextResponse } from 'next/server'
import { getSession } from './lib/session'

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/verify-email',
  '/forgot-password',
  '/reset-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify-otp',
  '/api/auth/resend-otp',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/superadmin',
  '/api/superadmin',
]

// Rate limit config: [max requests, window in ms]
const RATE_LIMITS: Record<string, [number, number]> = {
  '/api/auth/login':           [10, 60_000],   // 10 per minute
  '/api/auth/register':        [5,  300_000],  // 5 per 5 min
  '/api/auth/forgot-password': [5,  300_000],  // 5 per 5 min
  '/api/auth/verify-otp':      [10, 60_000],   // 10 per minute
  '/api/auth/resend-otp':      [3,  300_000],  // 3 per 5 min
}

// Content endpoint rate limits by user (family_id): [max, window ms]
const CONTENT_RATE_LIMITS: Record<string, [number, number]> = {
  '/api/vocabwise/topics': [120, 60_000],  // 120/min per user (~2/sec, normal usage)
  '/api/words':            [60,  60_000],  // 60/min per user
  '/api/stories':          [60,  60_000],  // 60/min per user
}

// In-memory store: key → timestamps[]
const rateLimitStore = new Map<string, number[]>()

function isRateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const timestamps = (rateLimitStore.get(key) ?? []).filter(t => now - t < windowMs)
  if (timestamps.length >= max) return true
  timestamps.push(now)
  rateLimitStore.set(key, timestamps)
  return false
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Rate limiting for auth endpoints (by IP)
  if (req.method === 'POST') {
    const limit = RATE_LIMITS[pathname]
    if (limit) {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
      const key = `${pathname}:${ip}`
      if (isRateLimited(key, limit[0], limit[1])) {
        return NextResponse.json(
          { error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' },
          { status: 429 }
        )
      }
    }
  }

  // Rate limiting for content endpoints (by user session)
  if (req.method === 'GET') {
    const contentPrefix = Object.keys(CONTENT_RATE_LIMITS).find(p => pathname.startsWith(p))
    if (contentPrefix) {
      const session = await getSession(req)
      const userId = session?.familyId ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anon'
      const key = `${contentPrefix}:${userId}`
      const [max, window] = CONTENT_RATE_LIMITS[contentPrefix]
      if (isRateLimited(key, max, window)) {
        return NextResponse.json(
          { error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau.' },
          { status: 429 }
        )
      }
    }
  }

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const session = await getSession(req)

  if (!session) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/kids/:path*', '/dashboard/:path*', '/superadmin/:path*', '/api/children/:path*', '/api/sync/:path*', '/api/family/:path*', '/api/superadmin/families/:path*', '/api/superadmin/notify', '/api/vocabwise/:path*', '/api/words/:path*', '/api/stories/:path*'],
}
