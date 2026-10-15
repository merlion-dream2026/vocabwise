import { BuddyImg } from '@/components/games/Buddy'

// Scenery for 🎣 Câu cá: sky band, sea with a wavy surface, sand, swaying seaweed and rising bubbles;
// plus the cute fish, the boat with the buddy and the hook. Decoration only — the game moves things.

/** Where the water starts (also used by the game to place the boat and the hook). */
export const SURFACE = { wide: 0.3, tall: 0.34, short: 0.38 } // short = landscape phone (≤500px high)

export const FISH_COLORS = [
  { body: '#FB923C', fin: '#EA580C' }, // orange
  { body: '#F472B6', fin: '#DB2777' }, // pink
  { body: '#FACC15', fin: '#CA8A04' }, // yellow
  { body: '#4ADE80', fin: '#16A34A' }, // green
  { body: '#A78BFA', fin: '#7C3AED' }, // violet
  { body: '#38BDF8', fin: '#0284C7' }, // sky
]

// Fixed bubble field (no Math.random in render): [left %, size px, duration s, delay s]
const BUBBLES: [number, number, number, number][] = [
  [8, 10, 7, 0], [19, 6, 9, 2], [33, 12, 8, 4], [47, 7, 10, 1], [61, 9, 7.5, 3], [74, 6, 9.5, 5], [88, 11, 8.5, 2.5],
]

export function Sea() {
  return (
    <div className="absolute inset-0" aria-hidden>
      <style>{`
        @keyframes fsBubble { 0% { transform: translateY(0); opacity: 0 } 10% { opacity: .8 } 100% { transform: translateY(-62vh); opacity: 0 } }
        @keyframes fsSway { 0%,100% { transform: rotate(-6deg) } 50% { transform: rotate(6deg) } }
        @keyframes fsWave { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
        .fs-bubble { animation: fsBubble linear infinite }
        .fs-sway { animation: fsSway 3.2s ease-in-out infinite; transform-origin: bottom center }
        .fs-wave { animation: fsWave 9s linear infinite }
      `}</style>
      {/* sky */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300 to-sky-100" />
      <div className="absolute right-[6%] top-[5%] h-[14vmin] w-[14vmin] rounded-full bg-yellow-300 shadow-[0_0_40px_18px_rgba(253,224,71,.45)] portrait:top-[9%]" />
      {/* sea */}
      <div className="absolute inset-x-0 bottom-0 top-[30%] bg-gradient-to-b from-sky-400 via-blue-600 to-indigo-900 portrait:top-[34%] [@media(max-height:500px)]:top-[38%]">
        {/* wavy surface, scrolling sideways */}
        <div className="absolute -top-[3.2vmin] left-0 h-[4vmin] w-[200%] fs-wave">
          <svg viewBox="0 0 400 20" preserveAspectRatio="none" className="h-full w-full">
            <path d="M0 10 Q25 0 50 10 T100 10 T150 10 T200 10 T250 10 T300 10 T350 10 T400 10 V20 H0 Z" fill="#38BDF8" />
          </svg>
        </div>
        {BUBBLES.map(([x, s, d, delay]) => (
          <span key={x} className="fs-bubble absolute bottom-[6%] rounded-full border-2 border-white/60 bg-white/10"
            style={{ left: `${x}%`, width: s, height: s, animationDuration: `${d}s`, animationDelay: `${delay}s` }} />
        ))}
        {/* sand + seaweed */}
        <div className="absolute inset-x-0 bottom-0 h-[7%] rounded-t-[40%] bg-amber-200/90" />
        {[6, 22, 71, 90].map((x, i) => (
          <svg key={x} viewBox="0 0 20 60" className="fs-sway absolute bottom-[3%] h-[16%]" style={{ left: `${x}%`, animationDelay: `${i * 0.6}s` }}>
            <path d="M10 60 Q2 45 10 30 Q18 15 10 0" stroke={i % 2 ? '#15803D' : '#16A34A'} strokeWidth="6" fill="none" strokeLinecap="round" />
          </svg>
        ))}
      </div>
    </div>
  )
}

/** A round cartoon fish facing right (mirror it with `flip` to face left). */
export function Fish({ color, flip = false, className = '' }: { color: (typeof FISH_COLORS)[number]; flip?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 120 80" className={className} style={flip ? { transform: 'scaleX(-1)' } : undefined} aria-hidden>
      <path d="M22 40 L0 18 L4 40 L0 62 Z" fill={color.fin} />
      <ellipse cx="62" cy="40" rx="46" ry="32" fill={color.body} />
      <path d="M52 10 Q66 0 78 12 Z" fill={color.fin} />
      <path d="M58 62 Q64 76 74 66 Z" fill={color.fin} />
      <path d="M40 22 Q46 40 40 58" stroke="#fff" strokeOpacity=".35" strokeWidth="5" fill="none" strokeLinecap="round" />
      <circle cx="88" cy="32" r="9" fill="#fff" /><circle cx="90" cy="32" r="5" fill="#1F2937" /><circle cx="92" cy="30" r="1.8" fill="#fff" />
      <path d="M100 48 Q104 52 100 55" stroke="#1F2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <ellipse cx="78" cy="48" rx="6" ry="3.5" fill="#FB7185" opacity=".55" />
    </svg>
  )
}

/** The little boat the buddy fishes from, with the rod tip at its right. */
export function Boat({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`} aria-hidden>
            <BuddyImg shot="pose-cheer" className="absolute bottom-[38%] left-[18%] h-[110%] w-auto [@media(max-height:500px)]:h-[90%]" />
      <svg viewBox="0 0 120 60" className="absolute inset-0 h-full w-full overflow-visible">
        <line x1="80" y1="30" x2="118" y2="-6" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />
        <path d="M4 30 H116 L100 58 H20 Z" fill="#B45309" stroke="#78350F" strokeWidth="3" strokeLinejoin="round" />
        <path d="M10 38 H110" stroke="#FCD34D" strokeWidth="4" />
      </svg>
    </div>
  )
}

/** A J-shaped hook. */
export function Hook({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 30" className={className} aria-hidden>
      <path d="M10 0 V18 Q10 27 4 26 Q0 25 1 20" stroke="#475569" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="10" cy="2" r="2.5" fill="#EF4444" />
    </svg>
  )
}
