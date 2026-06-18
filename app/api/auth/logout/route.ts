import { NextResponse } from 'next/server'
import { clearSessionCookie, clearAdminSessionCookie } from '@/lib/auth'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(clearSessionCookie())
  res.cookies.set(clearAdminSessionCookie())
  return res
}
