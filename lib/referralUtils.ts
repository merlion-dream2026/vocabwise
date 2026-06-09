import { createClient } from '@supabase/supabase-js'
import { addBonusDays } from './planUtils'
import { sendEmail } from './email'
import { sendPushToFamily } from './pushNotifications'
import { referralSignupRewardEmailHtml, referralPaidRewardEmailHtml } from './emailTemplates'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

/**
 * 2A — Trigger signup reward (gọi từ sync route sau khi bé học được gì đó).
 * Điều kiện: referral status = 'pending' + created_at trong 14 ngày.
 * → chuyển sang 'signup_triggered', set signup_reward_available_at = now + 24h.
 * Fire-and-forget: không throw, không block sync response.
 */
export async function triggerSignupReward(familyId: string): Promise<void> {
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

  const { data: referral } = await supabase
    .from('referrals')
    .select('id')
    .eq('referred_id', familyId)
    .eq('status', 'pending')
    .gte('created_at', fourteenDaysAgo)
    .maybeSingle()

  if (!referral) return

  const now = new Date()
  await supabase
    .from('referrals')
    .update({
      status: 'signup_triggered',
      signup_triggered_at: now.toISOString(),
      signup_reward_available_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    })
    .eq('id', referral.id)
}

/**
 * 2B — Release signup rewards đã đủ 24h (gọi từ me route khi referrer load dashboard).
 * → Cộng bonus Pro days vào referrer, đánh dấu referral là 'signup_rewarded'.
 * → Gửi email + push notification cho referrer.
 * Returns: newBonusExpiresAt nếu có reward được release, null nếu không có gì.
 */
export async function releasePendingSignupRewards(
  referrerId: string,
  currentBonusExpiresAt: string | null
): Promise<string | null> {
  // Query song song: pending rewards + referrer info để gửi notification
  const [{ data: pending }, { data: referrer }] = await Promise.all([
    supabase
      .from('referrals')
      .select('id, signup_reward_days')
      .eq('referrer_id', referrerId)
      .eq('status', 'signup_triggered')
      .lte('signup_reward_available_at', new Date().toISOString()),
    supabase
      .from('families')
      .select('name, email')
      .eq('id', referrerId)
      .single(),
  ])

  if (!pending || pending.length === 0) return null

  const totalDays = pending.reduce((sum, r) => sum + (r.signup_reward_days ?? 7), 0)
  const newBonusExpiresAt = addBonusDays(currentBonusExpiresAt, totalDays)

  await Promise.all([
    supabase
      .from('families')
      .update({ bonus_pro_expires_at: newBonusExpiresAt })
      .eq('id', referrerId),
    supabase
      .from('referrals')
      .update({ status: 'signup_rewarded', signup_rewarded_at: new Date().toISOString() })
      .in('id', pending.map(r => r.id)),
  ])

  // Gửi email + push (fire-and-forget, không block)
  if (referrer?.email) {
    const displayName = referrer.name || referrerId
    const expiryFmt = fmtDate(newBonusExpiresAt)
    sendEmail({
      to: referrer.email,
      subject: `🎁 Bạn vừa nhận được ${totalDays} ngày Pro miễn phí!`,
      html: referralSignupRewardEmailHtml(displayName, totalDays, expiryFmt),
    }).catch(err => console.error('[referral] signup reward email error:', err))
  }

  sendPushToFamily(referrerId, {
    title: '🎁 Phần thưởng giới thiệu!',
    body: `Bạn vừa nhận +${totalDays} ngày Pro. Người bạn mời đã bắt đầu học!`,
    url: '/dashboard',
  }).catch(err => console.error('[referral] signup reward push error:', err))

  return newBonusExpiresAt
}

/**
 * 2C — Trigger paid reward (gọi từ superadmin PATCH khi set plan → paid).
 * Điều kiện: referral status = 'signup_rewarded' (đã qua bước 1).
 * → cộng paid_reward_days bonus cho referrer, chuyển status → 'paid_rewarded'.
 * → Gửi email + push notification cho referrer.
 * Fire-and-forget: không throw, không block admin response.
 */
export async function triggerPaidReward(referredFamilyId: string): Promise<void> {
  const { data: referral } = await supabase
    .from('referrals')
    .select('id, referrer_id, paid_reward_days')
    .eq('referred_id', referredFamilyId)
    .eq('status', 'signup_rewarded')
    .maybeSingle()

  if (!referral) return

  const { data: referrer } = await supabase
    .from('families')
    .select('name, email, bonus_pro_expires_at')
    .eq('id', referral.referrer_id)
    .single()

  if (!referrer) return

  const days = referral.paid_reward_days ?? 14
  const newBonusExpiresAt = addBonusDays(referrer.bonus_pro_expires_at, days)

  await Promise.all([
    supabase
      .from('families')
      .update({ bonus_pro_expires_at: newBonusExpiresAt })
      .eq('id', referral.referrer_id),
    supabase
      .from('referrals')
      .update({ status: 'paid_rewarded', paid_rewarded_at: new Date().toISOString() })
      .eq('id', referral.id),
  ])

  // Gửi email + push (fire-and-forget, không block)
  if (referrer.email) {
    const displayName = referrer.name || referral.referrer_id
    const expiryFmt = fmtDate(newBonusExpiresAt)
    sendEmail({
      to: referrer.email,
      subject: `🏆 +${days} ngày Pro thêm — bạn của bạn vừa mua Pro!`,
      html: referralPaidRewardEmailHtml(displayName, days, expiryFmt),
    }).catch(err => console.error('[referral] paid reward email error:', err))
  }

  sendPushToFamily(referral.referrer_id, {
    title: '🏆 Bạn của bạn vừa mua Pro!',
    body: `Bạn nhận thêm +${days} ngày Pro. Cảm ơn vì đã giới thiệu!`,
    url: '/dashboard',
  }).catch(err => console.error('[referral] paid reward push error:', err))
}
