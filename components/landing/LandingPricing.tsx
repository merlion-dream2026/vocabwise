import Link from 'next/link'
import LandingUpgradeButton from '@/components/landing/LandingUpgradeButton'
import Reveal from '@/components/landing/Reveal'
import { FOCUS_RING, H2, LEAD, SECTION_Y } from '@/components/landing/ui'
import { ALL_PLANS_INCLUDE, PAID_PLANS, PLAN_PERKS, TRIAL_DAYS, TRIAL_SUMMARY, kVnd, perDay, type PaidPlanKey } from '@/lib/plans'

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
    <section id="pricing" className={`bg-slate-50 ${SECTION_Y} scroll-mt-20`}>
      <Reveal className="max-w-5xl mx-auto px-4 lg:px-12">
        <h2 className={H2}>Gói dịch vụ</h2>
        <p className={LEAD}>1 tài khoản cho cả gia đình · Đồng bộ mọi thiết bị · Thanh toán chuyển khoản</p>

        <div className="bg-white rounded-2xl p-4 lg:p-5 border-2 border-gray-200 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="font-black text-gray-800 text-base">🆓 Mọi tài khoản mới đều bắt đầu với {TRIAL_DAYS} ngày dùng thử miễn phí</p>
            <p className="text-sm text-gray-600 mt-0.5">{TRIAL_SUMMARY}</p>
          </div>
          <Link href="/register" className={`flex-shrink-0 text-center bg-white border-2 border-b-[4px] border-gray-200 text-gray-700 font-black text-sm px-4 py-2.5 rounded-xl hover:border-gray-300 transition-colors ${FOCUS_RING}`}>
            Thử miễn phí →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 items-stretch gap-5 pt-3">
          {PAID_PLANS.map(p => {
            const l = LOOK[p.key]
            return (
              <div key={p.key} className={`relative rounded-2xl p-4 lg:p-5 flex flex-col hover:-translate-y-1 transition-transform ${l.card}`}>
                {p.badge && (
                  <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-xs lg:text-sm font-black px-2.5 py-0.5 rounded-full whitespace-nowrap shadow ${l.badge}`}>{p.badge}</span>
                )}
                <p className={`text-sm font-black uppercase tracking-wide mt-1 ${l.label}`}>{p.label}</p>
                <p className={`text-sm font-semibold ${l.sub}`}>{p.tagline}</p>
                <p className={`text-3xl font-black mt-2 leading-none ${l.price}`}>{kVnd(p.amount)}</p>
                {/* Price per day is the selling point of the longer plans */}
                <p className={`text-sm mt-1.5 mb-3 ${p.savingPct ? 'font-black' : ''} ${l.sub}`}>
                  ≈ {perDay(p)}/ngày{p.savingPct ? ` · tiết kiệm ${p.savingPct}%` : ''}
                </p>
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
          <p className="text-sm font-black text-purple-700 mb-2">Mọi gói Pro đều có trọn nội dung, thêm:</p>
          <ul className="flex flex-wrap gap-2">
            {ALL_PLANS_INCLUDE.map(f => (
              <li key={f} className="text-xs md:text-sm font-bold text-purple-700 bg-white px-2.5 py-1 rounded-lg border border-purple-100">{f}</li>
            ))}
          </ul>
        </div>
      </Reveal>
    </section>
  )
}
