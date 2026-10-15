import { mascotCutSrc } from '@/lib/mascots'

// Scenery for 🧺 Hứng từ: an orchard (sky, the tree canopy the apples drop from, grass), the word
// apples and Rocky's basket. Decoration only — the game moves things.

export const APPLE_COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#EC4899', '#8B5CF6']

export function Orchard() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-100 to-lime-100" />
      {/* canopy along the top: overlapping leafy blobs */}
      <div className="absolute inset-x-[-5%] top-[-7vmin] h-[24vmin]">
        {[0, 12, 25, 38, 51, 64, 77, 90].map((x, i) => (
          <span key={x} className="absolute rounded-full" style={{ left: `${x}%`, top: `${i % 2 ? 10 : 0}%`, width: '18%', height: '100%', background: i % 2 ? '#16A34A' : '#22C55E' }} />
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-[9%] rounded-t-[30%] bg-gradient-to-b from-lime-400 to-green-600" />
      {['🌼', '🌷', '🌼', '🌸'].map((f, i) => (
        <span key={i} className="absolute bottom-[3%] text-[4vmin]" style={{ left: `${8 + i * 27}%` }}>{f}</span>
      ))}
    </div>
  )
}

/** A round apple carrying a word; `state` tints it after a catch. */
export function WordApple({ word, color, state = 'idle' }: { word: string; color: string; state?: 'idle' | 'right' | 'wrong' }) {
  const fill = state === 'right' ? '#34D399' : state === 'wrong' ? '#94A3B8' : color
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full drop-shadow-md" aria-hidden>
        <path d="M50 18 Q54 6 62 4" stroke="#78350F" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M54 12 Q68 2 76 12 Q64 18 54 12 Z" fill="#22C55E" />
        <path d="M50 22 C20 8 2 40 12 66 C22 92 42 98 50 90 C58 98 78 92 88 66 C98 40 80 8 50 22 Z" fill={fill} />
        <ellipse cx="32" cy="42" rx="8" ry="12" fill="#fff" opacity=".35" />
      </svg>
      <span className="relative mt-[12%] max-w-[94%] break-words rounded-lg bg-white/90 px-1 text-center font-black leading-none text-slate-800"
        style={{ fontSize: word.length > 8 ? 'clamp(11px, 2.4vmin, 22px)' : 'clamp(13px, 3vmin, 28px)' }}>{word}</span>
    </div>
  )
}

/** The woven basket with Rocky beside it (the catch zone is the basket only). */
export function Basket({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={mascotCutSrc('rocky', 'pose-cheer')} alt="" className="absolute bottom-0 right-[80%] h-[130%] w-auto" />
      <svg viewBox="0 0 120 60" className="absolute inset-0 h-full w-full overflow-visible">
        <path d="M4 8 H116 L102 58 H18 Z" fill="#B45309" stroke="#78350F" strokeWidth="3" strokeLinejoin="round" />
        {[18, 30, 42].map((y) => <path key={y} d={`M${8 + (y - 8) * 0.28} ${y} H${112 - (y - 8) * 0.28}`} stroke="#FCD34D" strokeWidth="3" opacity=".7" />)}
        {[30, 50, 70, 90].map((x) => <path key={x} d={`M${x} 8 L${x + (x < 60 ? 3 : -3)} 58`} stroke="#78350F" strokeWidth="2" opacity=".5" />)}
        <rect x="0" y="2" width="120" height="9" rx="4" fill="#92400E" />
      </svg>
    </div>
  )
}
