import Link from 'next/link'
import LandingUpgradeButton from '@/components/landing/LandingUpgradeButton'
import Reveal from '@/components/landing/Reveal'
import { FOCUS_RING } from '@/components/landing/LandingHero'
import { PRO_INCLUDES } from '@/lib/landingContent'
import { AI_DAILY_LIMIT, FREE_KIDS, PAID_PLANS, PLAN_PERKS, TRIAL_DAYS, kVnd, perMonth, type PaidPlanKey } from '@/lib/plans'

// Per-plan card look; the featured (3 tháng) and best-value (6 tháng) cards are filled.
const LOOK: Record<PaidPlanKey, { card: string; label: string; price: string; sub: string; list: string; btn: string; badge: string }> = {
  '1month': {
    card: 'bg-white border-2 border-b-[4px] border-purple-200', label: 'text-purple-500', price: 'text-purple-600', sub: 'text-gray-500', list: 'text-gray-600',
    btn: 'bg-purple-100 text-purple-700 hover:bg-purple-200', badge: '',
  },
  '3months': {
    card: 'bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg', label: 'text-white/80', price: 'text-white', sub: 'text-white/80', list: 'text-white',
    btn: 'bg-white text-purple-600 hover:bg-purple-50', badge: 'bg-orange-400 text-white',
  },
  '6months': {
    card: 'bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg', label: 'text-white/80', price: 'text-white', sub: 'text-white/80', list: 'text-white',
    btn: 'bg-white text-indigo-600 hover:bg-indigo-50', badge: 'bg-amber-400 text-amber-900',
  },
}

export default function LandingPricing() {
  return (
    <section id="pricing" className="bg-white py-8 lg:py-14 scroll-mt-20">
      <Reveal className="max-w-5xl mx-auto px-4 lg:px-12">
        <h2 className="text-2xl lg:text-3xl font-black text-gray-800 text-center mb-1">Gói dịch vụ</h2>
        <p className="text-gray-600 text-sm lg:text-base text-center mb-6 lg:mb-8">1 tài khoản cho cả gia đình · Đồng bộ mọi thiết bị · Thanh toán chuyển khoản</p>

        <div className="bg-gray-50 rounded-2xl p-4 lg:p-5 border-2 border-gray-100 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="font-black text-gray-800 text-base">🆓 Dùng thử {TRIAL_DAYS} ngày miễn phí</p>
            <p className="text-sm text-gray-600 mt-0.5">
              {FREE_KIDS} bé · chủ đề đầu tiên mỗi level · 1 bài Phonics · AI {AI_DAILY_LIMIT.trial} lần/ngày · không cần thẻ
            </p>
          </div>
          <Link href="/register" className={`flex-shrink-0 text-center bg-white border-2 border-b-[4px] border-gray-200 text-gray-700 font-black text-sm px-4 py-2.5 rounded-xl hover:border-gray-300 transition-colors ${FOCUS_RING}`}>
            Thử miễn phí →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-5">
          {PAID_PLANS.map(p => {
            const l = LOOK[p.key]
            return (
              <div key={p.key} className={`relative rounded-2xl p-4 lg:p-5 flex flex-col hover:-translate-y-1 transition-transform ${l.card}`}>
                {p.badge && (
                  <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs lg:text-sm font-black px-2.5 py-0.5 rounded-full whitespace-nowrap shadow ${l.badge}`}>{p.badge}</span>
                )}
                <p className={`text-sm font-black uppercase tracking-wide mt-1 ${l.label}`}>{p.label}</p>
                <p className={`text-3xl font-black mt-1 leading-none ${l.price}`}>{kVnd(p.amount)}</p>
                <p className={`text-sm mt-1 mb-3 ${l.sub}`}>{perMonth(p)}/tháng{p.savingPct ? ` · tiết kiệm ${p.savingPct}%` : ''}</p>
                <ul className={`text-sm space-y-1.5 flex-1 leading-snug ${l.list}`}>
                  {PLAN_PERKS[p.key].map(x => <li key={x}>{x}</li>)}
                </ul>
                <LandingUpgradeButton label={`Chọn gói ${p.label}`}
                  className={`mt-4 w-full font-black text-sm lg:text-base py-3 rounded-xl transition-colors active:scale-95 ${l.btn} ${FOCUS_RING}`} />
              </div>
            )
          })}
        </div>

        <div className="mt-5 bg-purple-50 rounded-2xl p-4 lg:p-5">
          <p className="text-sm font-black text-purple-700 mb-2">Mọi gói Pro đều có:</p>
          <ul className="flex flex-wrap gap-2">
            {PRO_INCLUDES.map(f => (
              <li key={f} className="text-xs md:text-sm font-bold text-purple-700 bg-white px-2.5 py-1 rounded-lg border border-purple-100">{f}</li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  )
}
