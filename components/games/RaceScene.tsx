import { mascotCutSrc, type MascotCharacter } from '@/lib/mascots'

// Scenery for 🏎️ Đua xe: a sunny circuit (sky, bunting, grandstand, grass), the two-lane track with
// a start line and a chequered finish, and the cartoon race cars. Decoration only.

const FLAGS = ['#EF4444', '#F59E0B', '#22C55E', '#3B82F6', '#A855F7']

export function RaceBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400 via-sky-200 to-sky-100" />
      <div className="absolute inset-x-0 bottom-0 top-[44%] bg-gradient-to-b from-lime-400 to-green-600 portrait:top-[38%]" />
      {/* grass stripes */}
      <div className="absolute inset-x-0 bottom-0 top-[44%] opacity-20 portrait:top-[38%]"
        style={{ background: 'repeating-linear-gradient(90deg, transparent 0 6vmin, #14532D 6vmin 12vmin)' }} />
    </div>
  )
}

/** The two-lane track. Lane 0 (top) is Bubi's, lane 1 (bottom) is Rocky's. `children` are the cars. */
export function RaceTrack({ children }: { children?: React.ReactNode }) {
  return (
    <div className="absolute inset-0">
      {/* bunting + grandstand above the track */}
      <svg viewBox="0 0 400 40" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-[22%] w-full" aria-hidden>
        <path d="M0 4 Q100 18 200 4 T400 4" stroke="#475569" strokeWidth="1.2" fill="none" />
        {Array.from({ length: 20 }, (_, i) => {
          const x = 10 + i * 20
          const y = 4 + 7 * Math.sin((x / 200) * Math.PI) ** 2
          return <path key={i} d={`M${x - 5} ${y} L${x + 5} ${y} L${x} ${y + 10} Z`} fill={FLAGS[i % FLAGS.length]} />
        })}
      </svg>
      <div className="absolute inset-x-0 bottom-[78%] h-[8%] bg-[repeating-linear-gradient(90deg,#F8FAFC_0_10px,#EF4444_10px_20px)] opacity-90" />
      {/* road */}
      <div className="absolute inset-x-0 bottom-0 top-[22%] border-y-[4px] border-white bg-[#475569] shadow-inner">
        <div className="absolute inset-x-0 top-1/2 border-t-[3px] border-dashed border-white/70" />
        {/* start line */}
        <div className="absolute inset-y-0 left-[19%] w-[1.2%] bg-white/90" />
        {/* chequered finish */}
        <div className="absolute inset-y-0 left-[92%] w-[3.5%]"
          style={{ backgroundImage: 'repeating-conic-gradient(#111827 0 25%, #F8FAFC 0 50%)', backgroundSize: '50% 12.5%' }} />
      </div>
      {children}
    </div>
  )
}

/** A chubby race car facing right with a mascot at the wheel. */
export function RaceCar({ color, driver, number, className = '', spinning = false }: {
  color: string; driver: MascotCharacter; number: number; className?: string; spinning?: boolean
}) {
  return (
    <div className={`relative ${className}`} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={mascotCutSrc(driver, 'pose-cheer')} alt="" className="absolute bottom-[34%] left-[30%] h-[88%] w-auto" />
      <svg viewBox="0 0 160 80" className="absolute inset-0 h-full w-full overflow-visible">
        <path d="M6 52 Q8 34 30 32 L52 30 Q62 14 88 14 L104 16 Q116 30 132 34 Q154 38 156 52 L156 60 H6 Z" fill={color} stroke="#1F2937" strokeWidth="3" strokeLinejoin="round" />
        <path d="M60 30 Q68 20 86 20 L100 22 Q108 30 112 32 Z" fill="#BAE6FD" opacity=".55" />
        <rect x="2" y="26" width="10" height="20" rx="3" fill="#1F2937" />
        <circle cx="70" cy="46" r="10" fill="#fff" />
        <text x="70" y="51" textAnchor="middle" fontSize="13" fontWeight="900" fill="#1F2937">{number}</text>
        <g className={spinning ? undefined : 'rc-wheel'} style={{ transformOrigin: '38px 62px' }}>
          <circle cx="38" cy="62" r="15" fill="#1F2937" /><circle cx="38" cy="62" r="6" fill="#CBD5E1" />
          <rect x="36" y="48" width="4" height="28" fill="#475569" />
        </g>
        <g className={spinning ? undefined : 'rc-wheel'} style={{ transformOrigin: '126px 62px' }}>
          <circle cx="126" cy="62" r="15" fill="#1F2937" /><circle cx="126" cy="62" r="6" fill="#CBD5E1" />
          <rect x="124" y="48" width="4" height="28" fill="#475569" />
        </g>
      </svg>
    </div>
  )
}
