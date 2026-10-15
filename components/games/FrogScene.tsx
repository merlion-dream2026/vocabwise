import { BuddyImg } from '@/components/games/Buddy'

// Scenery for 🐸 Ếch nhảy lá sen: a calm pond with drifting ripples, reeds and a few decorative
// pads; the frog, the word lily pads and the far bank where the buddy waits. Decoration only.

// Fixed ripples and decorative pads (no Math.random in render): [left %, top %, size vmin, delay s]
const RIPPLES: [number, number, number, number][] = [[12, 30, 9, 0], [78, 22, 7, 1.2], [30, 62, 8, 2.1], [86, 70, 10, 0.6], [55, 40, 6, 1.7]]
const DECOR_PADS: [number, number, number, number][] = [[4, 44, 11, -20], [88, 50, 9, 40], [10, 88, 10, 70], [92, 90, 12, -60]]

export function Pond() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <style>{`
        @keyframes fgRipple { 0% { transform: scale(.3); opacity: .7 } 100% { transform: scale(1.6); opacity: 0 } }
        @keyframes fgReed { 0%,100% { transform: rotate(-4deg) } 50% { transform: rotate(4deg) } }
        .fg-ripple { animation: fgRipple 3.6s ease-out infinite }
        .fg-reed { animation: fgReed 3s ease-in-out infinite; transform-origin: bottom center }
      `}</style>
      <div className="absolute inset-0 bg-gradient-to-b from-[#5EEAD4] via-[#14B8A6] to-[#0F766E]" />
      {RIPPLES.map(([x, y, s, d]) => (
        <span key={x} className="fg-ripple absolute rounded-[50%] border-2 border-white/50"
          style={{ left: `${x}%`, top: `${y}%`, width: `${s}vmin`, height: `${s * 0.5}vmin`, animationDelay: `${d}s` }} />
      ))}
      {DECOR_PADS.map(([x, y, s, r]) => (
        <LilyPad key={x} className="absolute opacity-70" style={{ left: `${x}%`, top: `${y}%`, width: `${s}vmin`, transform: `translate(-50%,-50%) rotate(${r}deg)` }} />
      ))}
      {[2, 6, 93, 97].map((x, i) => (
        <svg key={x} viewBox="0 0 20 80" className="fg-reed absolute bottom-0 h-[22%]" style={{ left: `${x}%`, animationDelay: `${i * 0.7}s` }}>
          <path d="M10 80 V10" stroke="#166534" strokeWidth="3" />
          <rect x="6" y="6" width="8" height="22" rx="4" fill="#78350F" />
        </svg>
      ))}
    </div>
  )
}

/** A round lily pad seen from above, with the classic notch. `tint` recolours it after a hop. */
export function LilyPad({ className = '', style, tint }: { className?: string; style?: React.CSSProperties; tint?: 'right' | 'wrong' | 'hint' }) {
  const fill = tint === 'right' ? '#86EFAC' : tint === 'wrong' ? '#FCA5A5' : tint === 'hint' ? '#BBF7D0' : '#4ADE80'
  const edge = tint === 'wrong' ? '#DC2626' : '#15803D'
  return (
    <svg viewBox="0 0 120 80" className={className} style={style}>
      <path d="M60 40 L112 30 A56 38 0 1 1 104 18 Z" fill={fill} stroke={edge} strokeWidth="3" strokeLinejoin="round" />
      <path d="M60 40 L22 22 M60 40 L14 46 M60 40 L40 72 M60 40 L84 72 M60 40 L110 52" stroke={edge} strokeOpacity=".35" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

/** A chubby cartoon frog seen from the front. */
export function Frog({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 80" className={className} aria-hidden>
      <ellipse cx="22" cy="68" rx="16" ry="8" fill="#15803D" /><ellipse cx="78" cy="68" rx="16" ry="8" fill="#15803D" />
      <ellipse cx="50" cy="50" rx="38" ry="27" fill="#22C55E" />
      <ellipse cx="50" cy="58" rx="24" ry="15" fill="#BBF7D0" />
      <circle cx="30" cy="26" r="14" fill="#22C55E" /><circle cx="70" cy="26" r="14" fill="#22C55E" />
      <circle cx="30" cy="25" r="9" fill="#fff" /><circle cx="70" cy="25" r="9" fill="#fff" />
      <circle cx="32" cy="26" r="5" fill="#1F2937" /><circle cx="68" cy="26" r="5" fill="#1F2937" />
      <circle cx="34" cy="24" r="1.8" fill="#fff" /><circle cx="70" cy="24" r="1.8" fill="#fff" />
      <path d="M36 46 Q50 56 64 46" stroke="#14532D" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="26" cy="46" rx="5" ry="3" fill="#FB7185" opacity=".6" /><ellipse cx="74" cy="46" rx="5" ry="3" fill="#FB7185" opacity=".6" />
      <ellipse cx="34" cy="72" rx="7" ry="5" fill="#16A34A" /><ellipse cx="66" cy="72" rx="7" ry="5" fill="#16A34A" />
    </svg>
  )
}

/** Win scene: the far bank with flowers, the buddy cheering and the frog arriving. */
export function FarBank({ frogW }: { frogW: number }) {
  return (
    <div className="relative mx-auto flex w-full max-w-[min(92vw,110vmin)] flex-col items-center">
      <div className="relative mt-[4vmin] h-[34vmin] w-full">
        <div className="absolute inset-x-0 bottom-0 h-[55%] rounded-t-[50%] bg-gradient-to-b from-lime-300 to-green-500 shadow-xl" />
        {['🌸', '🌼', '🌷', '🌻'].map((f, i) => (
          <span key={f} className="absolute text-[6vmin]" style={{ left: `${8 + i * 26}%`, bottom: `${30 + (i % 2) * 10}%` }} aria-hidden>{f}</span>
        ))}
                <BuddyImg shot="pose-cheer" className="fg-cheer absolute bottom-[24%] right-[18%] h-[78%] w-auto" />
        <div className="fg-arrive absolute bottom-[22%] left-[34%]" style={{ width: frogW }}><Frog className="w-full" /></div>
      </div>
    </div>
  )
}
