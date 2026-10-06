import { PRESS } from '@/components/TopicHub'

type ColorScheme = 'amber' | 'purple' | 'blue'

const SCHEMES: Record<ColorScheme, {
  bg: string; border: string; edge: string; icon: string; title: string; sub: string; arrow: string; bar: string; badgeCls: string
}> = {
  amber: {
    bg:       'bg-amber-50',
    border:   'border-amber-200 border-b-amber-400',
    edge:     '',
    icon:     'bg-gradient-to-br from-amber-400 to-orange-500',
    title:    'text-amber-700',
    sub:      'text-amber-600',
    arrow:    'text-amber-600',
    bar:      'from-amber-400 to-orange-400',
    badgeCls: 'text-gray-400 bg-white/60',
  },
  purple: {
    bg:       'bg-purple-50',
    border:   'border-purple-200 border-b-purple-400',
    edge:     '',
    icon:     'bg-gradient-to-br from-purple-500 to-pink-500',
    title:    'text-purple-700',
    sub:      'text-purple-600',
    arrow:    'text-purple-500',
    bar:      'from-purple-400 to-pink-400',
    badgeCls: 'text-gray-400 bg-white/60',
  },
  blue: {
    bg:       'bg-blue-50',
    border:   'border-blue-200 border-b-blue-400',
    edge:     '',
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
      className={`w-full text-left ${c.bg} border-2 border-b-[4px] ${c.border} rounded-3xl p-4 ${PRESS}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 flex-shrink-0 -rotate-6 items-center justify-center rounded-2xl bg-white text-3xl shadow ring-2 ring-white">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className={`font-bold ${c.title} text-base`}>{title}</span>
            <span className={`text-xs font-semibold ${c.badgeCls} px-2 py-0.5 rounded-full`}>{badge}</span>
          </div>
          <p className={`text-xs font-semibold ${c.sub}`}>
            {started
              ? `${mastered}/${total} ${unit} hoàn thành (${pct}%)${secondary ? ` · ${secondary}` : ''}`
              : description}
          </p>
        </div>
        <span className={`${c.arrow} font-bold text-lg flex-shrink-0`}>→</span>
      </div>
      {started && (
        <div className="mt-3 h-3 bg-white rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${c.bar} rounded-full transition-all duration-500`}
            style={{ width: `${Math.max(pct, 2)}%` }}
          />
        </div>
      )}
    </button>
  )
}
