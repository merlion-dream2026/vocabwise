// POST { otp, newPin } — verify the emailed code, save the new admin PIN, and open Superadmin.
// `step` in error responses tells the UI which screen to return to ('otp' | 'pin').
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'
import { hashPin } from '@/lib/auth'
import { serverError } from '@/lib/api'
import {
  getOwner, notOwner, clientIp, isSixDigits, isWeakPin, otpMatches, grantAdminSession, OTP_MAX_ATTEMPTS,
} from '@/lib/ownerAdmin'

const CLEAR_OTP = { admin_otp_hash: null, admin_otp_expires_at: null, admin_otp_attempts: 0 }

export async function POST(req: NextRequest) {
  try {
    const owner = await getOwner()
    if (!owner) return notOwner()

    const { otp, newPin } = await req.json().catch(() => ({}))

    // Validate the PIN before touching the code, so a typo in the PIN doesn't burn an OTP attempt.
    if (!isSixDigits(newPin)) return NextResponse.json({ error: 'PIN gồm 6 chữ số.', step: 'pin' }, { status: 400 })
    if (isWeakPin(newPin)) return NextResponse.json({ error: 'PIN quá dễ đoán (số lặp hoặc dãy liên tiếp). Chọn PIN khác.', step: 'pin' }, { status: 400 })

    if (!owner.admin_otp_hash || !owner.admin_otp_expires_at || new Date(owner.admin_otp_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Mã đã hết hạn hoặc chưa được gửi. Bấm "Gửi lại mã".', step: 'otp', expired: true }, { status: 401 })
    }
    if (!isSixDigits(otp) || !otpMatches(otp, owner.admin_otp_hash)) {
      const attempts = (owner.admin_otp_attempts ?? 0) + 1
      if (attempts >= OTP_MAX_ATTEMPTS) {
        await supabase.from('families').update(CLEAR_OTP).eq('id', owner.id)
        return NextResponse.json({ error: 'Nhập sai quá nhiều lần, mã đã bị huỷ. Bấm "Gửi lại mã".', step: 'otp', expired: true }, { status: 401 })
      }
      await supabase.from('families').update({ admin_otp_attempts: attempts }).eq('id', owner.id)
      return NextResponse.json({ error: `❌ Mã không đúng. Còn ${OTP_MAX_ATTEMPTS - attempts} lần thử.`, step: 'otp' }, { status: 401 })
    }

    const { error } = await supabase.from('families').update({
      ...CLEAR_OTP,
      admin_pin_hash: await hashPin(newPin),
      admin_pin_failed: 0,
      admin_pin_locked_until: null,
    }).eq('id', owner.id)
    if (error) return serverError(error)

    return grantAdminSession(clientIp(req), 'mã email')
  } catch (err) {
    return serverError(err)
  }
}
