import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('x-test-key')
  if (auth !== process.env.JWT_SECRET?.slice(0, 8)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD

  const config = {
    GMAIL_USER: user ? `set → ${user}` : 'MISSING',
    GMAIL_APP_PASSWORD: pass ? `set → ${pass.length} chars, no spaces: ${!pass.includes(' ')}` : 'MISSING',
  }

  try {
    await sendEmail({
      to: user ?? 'test@test.com',
      subject: '[VocabWise] Test email',
      html: '<p>Test email thành công ✅</p>',
    })
    return NextResponse.json({ ok: true, config })
  } catch (err: unknown) {
    const e = err as { code?: string; response?: string; message?: string; command?: string }
    return NextResponse.json({
      ok: false,
      config,
      error: { code: e.code, response: e.response, message: e.message, command: e.command },
    }, { status: 500 })
  }
}
