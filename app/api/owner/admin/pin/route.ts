// POST { pin } — owner enters the 6-digit admin PIN → vk_admin_session (8h).
// 5 wrong PINs → locked 15 min (DB counter). Forgotten PIN → /api/owner/admin/otp/*.
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'
import { verifyPin } from '@/lib/auth'
import { rateLimit } from '@/lib/rateLimit'
import { serverError } from '@/lib/api'
import {
  getOwner, notOwner, clientIp, isSixDigits, minutesLeft, grantAdminSession, PIN_MAX_FAILS, LOCK_MINUTES,
} from '@/lib/ownerAdmin'

export async function POST(req: NextRequest) {
  try {
    const owner = await getOwner()
    if (!owner) return notOwner()

    const ip = clientIp(req)
    if (!(await rateLimit(`owner-pin:${ip}`, 10, 300)).allowed) {
      return NextResponse.json({ error: 'Quá nhiều yêu cầu. Vui lòng thử lại sau 5 phút.' }, { status: 429 })
    }

    if (!owner.admin_pin_hash) {
      return NextResponse.json({ error: 'Chưa đặt PIN quản trị.', needsSetup: true }, { status: 400 })
    }
    if (owner.admin_pin_locked_until && new Date(owner.admin_pin_locked_until) > new Date()) {
      return NextResponse.json({
        error: `⏳ Tạm khoá ${minutesLeft(owner.admin_pin_locked_until)} phút do nhập sai nhiều lần. Có thể dùng "Quên PIN" để nhận mã qua email.`,
        locked: true,
      }, { status: 423 })
    }

    const { pin } = await req.json().catch(() => ({}))
    if (!isSixDigits(pin)) return NextResponse.json({ error: 'PIN gồm 6 chữ số.' }, { status: 400 })

    if (!(await verifyPin(pin, owner.admin_pin_hash))) {
      const fails = (owner.admin_pin_failed ?? 0) + 1
      if (fails >= PIN_MAX_FAILS) {
        const until = new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString()
        await supabase.from('families').update({ admin_pin_failed: 0, admin_pin_locked_until: until }).eq('id', owner.id)
        return NextResponse.json({
          error: `⏳ Tạm khoá ${LOCK_MINUTES} phút do nhập sai nhiều lần. Có thể dùng "Quên PIN" để nhận mã qua email.`,
          locked: true,
        }, { status: 423 })
      }
      await supabase.from('families').update({ admin_pin_failed: fails }).eq('id', owner.id)
      return NextResponse.json({ error: `❌ PIN không đúng. Còn ${PIN_MAX_FAILS - fails} lần thử.` }, { status: 401 })
    }

    if (owner.admin_pin_failed || owner.admin_pin_locked_until) {
      await supabase.from('families').update({ admin_pin_failed: 0, admin_pin_locked_until: null }).eq('id', owner.id)
    }
    return grantAdminSession(ip, 'PIN')
  } catch (err) {
    return serverError(err)
  }
}
