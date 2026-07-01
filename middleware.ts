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
  '/expired',
]

// Auth endpoint rate limits: [max, window seconds]
const RATE_LIMITS: Record<string, [number, number]> = {
  '/api/auth/login':           [20, 60],   // 20/min — shared mobile IPs
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
  '/api/offline/topic':    [30, 3600], // 30 downloads/hour/family
  '/api/offline/daily':    [30, 3600], // 30 downloads/hour/family (POST also limited in-route)
}

function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    // 'strict-dynamic' lets scripts loaded by nonced scripts (e.g. Turnstile injected by React) run
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://va.vercel-scripts.com https://challenges.cloudflare.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://img.vietqr.io",
    "font-src 'self'",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://va.vercel-scripts.com https://*.sentry.io https://challenges.cloudflare.com",
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    "frame-src 'none' https://challenges.cloudflare.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Generate a per-request nonce for CSP (base64 of a random UUID)
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const cspHeader = buildCsp(nonce)

  // Inject nonce into request headers so Server Components can read it via headers()
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set('x-nonce', nonce)

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

  // Build the next response with nonce forwarded to Server Components
  const makeNext = () => {
    const res = NextResponse.next({ request: { headers: requestHeaders } })
    res.headers.set('content-security-policy', cspHeader)
    return res
  }

  if (PUBLIC_PATHS.some((p) => p === '/' ? pathname === '/' : pathname === p || pathname.startsWith(p + '/'))) {
    return makeNext()
  }

  const session = await getSession(req)

  if (!session) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return makeNext()
}

export const config = {
  // Match all routes except Next.js internals, static files, and PWA assets
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|sw\\.js|manifest\\.webmanifest|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf|eot|mp3|mp4|pdf)).*)'],
}
