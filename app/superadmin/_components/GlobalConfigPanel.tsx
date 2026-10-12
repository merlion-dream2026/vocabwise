import { FREE_KIDS, PAID_PLANS } from '@/lib/plans'

// Kid caps follow the plan (lib/plans.ts → getMaxKids in lib/planUtils.ts). The old global
// free_max_kids / pro_max_kids settings in admin_config are no longer read.
export function GlobalConfigPanel() {
  return (
    <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm p-5 mb-6">
      <h2 className="font-semibold text-indigo-600 mb-2">⚙️ Giới hạn hồ sơ bé theo gói</h2>
      <p className="text-sm text-slate-600">
        Dùng thử: {FREE_KIDS} bé · {PAID_PLANS.map(p => `${p.label}: ${p.kids} bé`).join(' · ')}
      </p>
      <p className="text-xs text-slate-500 mt-1">
        Đổi mặc định trong <code>lib/plans.ts</code>. Ngoại lệ cho một gia đình: Sửa gia đình → giới hạn bé.
      </p>
    </div>
  )
}
