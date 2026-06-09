import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * GET /r/[code]
 * Validate referral code → set cookie → redirect to /register
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code?.toUpperCase().trim()
  const registerUrl = new URL('/register', req.url)

  // Basic format check (6–8 alphanumeric)
  if (!code || !/^[A-Z0-9]{6,8}$/.test(code)) {
    return NextResponse.redirect(registerUrl)
  }

  // Verify code exists in DB
  const { data } = await supabase
    .from('families')
    .select('id')
    .eq('referral_code', code)
    .maybeSingle()

  const res = NextResponse.redirect(registerUrl)

  if (data) {
    // Valid code → set httpOnly cookie (7 ngày)
    res.cookies.set('ref_code', code, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })
  }
  // Invalid code → redirect without cookie (silent fail, no error page)

  return res
}
