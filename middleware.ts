import { NextRequest, NextResponse } from 'next/server'
import { getSession } from './lib/session'
import { rateLimit } from './lib/rateLimit'

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
  '/onboarding',
]

// Auth endpoint rate limits: [max, window seconds]
const RATE_LIMITS: Record<string, [number, number]> = {
  '/api/auth/login':           [10, 60],   // 10/min
  '/api/auth/register':        [5,  300],  // 5/5min
  '/api/auth/forgot-password': [5,  300],  // 5/5min
  '/api/auth/verify-otp':      [10, 60],   // 10/min
  '/api/auth/resend-otp':      [3,  300],  // 3/5min
}

// Content endpoint rate limits by user: [max, window seconds]
const CONTENT_RATE_LIMITS: Record<string, [number, number]> = {
  '/api/vocabwise/topics': [60, 60],
  '/api/words':            [60, 60],
  '/api/stories':          [60, 60],
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Rate limiting for auth endpoints (by IP) — uses distributed Upstash limiter
  if (req.method === 'POST') {
    const limit = RATE_LIMITS[pathname]
    if (limit) {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
      const { allowed } = await rateLimit(`mw:${pathname}:${ip}`, limit[0], limit[1])
      if (!allowed) {
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
      const [max, windowSec] = CONTENT_RATE_LIMITS[contentPrefix]
      const { allowed } = await rateLimit(`mw:${contentPrefix}:${userId}`, max, windowSec)
      if (!allowed) {
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
  matcher: ['/', '/kids/:path*', '/dashboard/:path*', '/vocabwise', '/vocabwise/:path*', '/superadmin/:path*', '/api/children/:path*', '/api/sync/:path*', '/api/family/:path*', '/api/superadmin/families/:path*', '/api/superadmin/notify', '/api/vocabwise/:path*', '/api/words/:path*', '/api/stories/:path*'],
}
