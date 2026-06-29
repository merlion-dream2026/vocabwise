type ColorScheme = 'amber' | 'purple' | 'blue'

const SCHEMES: Record<ColorScheme, {
  bg: string; border: string; icon: string; title: string; sub: string; arrow: string; bar: string; badgeCls: string
}> = {
  amber: {
    bg:       'bg-gradient-to-br from-amber-50 to-orange-50',
    border:   'border-amber-200',
    icon:     'bg-gradient-to-br from-amber-400 to-orange-500',
    title:    'text-amber-700',
    sub:      'text-amber-600',
    arrow:    'text-amber-600',
    bar:      'from-amber-400 to-orange-400',
    badgeCls: 'text-gray-400 bg-white/60',
  },
  purple: {
    bg:       'bg-gradient-to-br from-purple-50 to-pink-50',
    border:   'border-purple-200',
    icon:     'bg-gradient-to-br from-purple-500 to-pink-500',
    title:    'text-purple-700',
    sub:      'text-purple-600',
    arrow:    'text-purple-500',
    bar:      'from-purple-400 to-pink-400',
    badgeCls: 'text-gray-400 bg-white/60',
  },
  blue: {
    bg:       'bg-gradient-to-br from-blue-50 to-indigo-50',
    border:   'border-blue-200',
    icon:     'bg-gradient-to-br from-blue-500 to-indigo-600',
    title:    'text-blue-700',
    sub:      'text-blue-600',
    arrow:    'text-blue-600',
    bar:      'from-blue-400 to-indigo-400',
    badgeCls: 'text-gray-400 bg-white/60',
  },
}

type Props = {
  onClick: () => void
  icon: string
  title: string
  badge: string
  description: string  // shown when mastered === 0
  mastered: number     // primary completion metric (flashcard + ≥3 games)
  total: number
  unit: string         // "bài" | "chủ đề"
  secondary?: string   // e.g. "1200/2400 từ" — shown alongside mastered count
  scheme: ColorScheme
}

export default function ModuleCard({ onClick, icon, title, badge, description, mastered, total, unit, secondary, scheme }: Props) {
  const c = SCHEMES[scheme]
  const started = mastered > 0
  const pct = total > 0 ? Math.round(mastered / total * 100) : 0

  return (
    <button
      onClick={onClick}
      className={`w-full text-left ${c.bg} border-2 ${c.border} rounded-2xl p-4 shadow-sm active:scale-95 transition-transform duration-150`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-14 h-14 rounded-xl ${c.icon} flex items-center justify-center text-3xl shadow-sm flex-shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className={`font-black ${c.title} text-base`}>{title}</span>
            <span className={`text-xs font-semibold ${c.badgeCls} px-1.5 py-0.5 rounded-md`}>{badge}</span>
          </div>
          <p className={`text-xs font-semibold ${c.sub}`}>
            {started
              ? `${mastered}/${total} ${unit} hoàn thành (${pct}%)${secondary ? ` · ${secondary}` : ''}`
              : description}
          </p>
        </div>
        <span className={`${c.arrow} font-black text-lg flex-shrink-0`}>→</span>
      </div>
      {started && (
        <div className="mt-3 h-2 bg-white/60 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${c.bar} rounded-full transition-all duration-500`}
            style={{ width: `${Math.max(pct, 2)}%` }}
          />
        </div>
      )}
    </button>
  )
}
