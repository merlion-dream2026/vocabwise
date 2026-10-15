import { mascotCutSrc } from '@/lib/mascots'

// Scenery for ✈️ Máy bay qua mây: a bright sky with slow far clouds and hills scrolling past (so the
// plane feels like it's flying), the plane with Rocky in the cockpit, and the word clouds.

export function FlyingSky() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <style>{`
        @keyframes psScroll { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .ps-far { animation: psScroll 40s linear infinite }
        .ps-hills { animation: psScroll 14s linear infinite }
      `}</style>
      <div className="absolute inset-0 bg-gradient-to-b from-sky-400 via-sky-200 to-sky-50" />
      <div className="absolute right-[8%] top-[6%] h-[13vmin] w-[13vmin] rounded-full bg-yellow-200 shadow-[0_0_50px_20px_rgba(254,240,138,.6)] portrait:top-[10%]" />
      {/* far clouds, drifting slowly */}
      <div className="ps-far absolute left-0 top-[17%] flex h-[9vmin] w-[200%] opacity-60 portrait:top-[25%]">
        {[0, 1].map((k) => (
          <div key={k} className="relative h-full w-1/2">
            {[8, 38, 70].map((x) => (
              <span key={x} className="absolute bottom-0 h-[55%] w-[11%] rounded-full bg-white" style={{ left: `${x}%` }}>
                <span className="absolute -top-[55%] left-[18%] h-[110%] w-[38%] rounded-full bg-white" />
                <span className="absolute -top-[85%] left-[42%] h-[140%] w-[44%] rounded-full bg-white" />
              </span>
            ))}
          </div>
        ))}
      </div>
      {/* hills, scrolling past */}
      <div className="ps-hills absolute bottom-0 left-0 h-[13%] w-[200%]">
        <svg viewBox="0 0 800 100" preserveAspectRatio="none" className="h-full w-full">
          <path d="M0 60 Q50 20 100 55 T200 50 T300 45 T400 60 T500 20 T600 55 T700 45 T800 60 V100 H0 Z" fill="#4ADE80" />
          <path d="M0 80 Q60 55 120 78 T240 72 T360 80 T480 70 T600 78 T720 72 T800 80 V100 H0 Z" fill="#22C55E" />
        </svg>
      </div>
    </div>
  )
}

/** A chubby cartoon plane facing right, Rocky waving from the cockpit. */
export function Plane({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`} aria-hidden>
      <svg viewBox="0 0 160 90" className="h-full w-full overflow-visible">
        {/* tail + back wing */}
        <path d="M14 36 L2 8 L30 8 L44 34 Z" fill="#DC2626" />
        <path d="M60 54 L40 84 L66 84 L88 56 Z" fill="#B91C1C" />
        {/* body */}
        <path d="M10 40 Q12 26 40 26 H118 Q154 30 156 46 Q154 62 118 64 H40 Q12 62 10 40 Z" fill="#EF4444" />
        <path d="M30 50 H134" stroke="#FCA5A5" strokeWidth="5" strokeLinecap="round" />
        {/* cockpit window */}
        <path d="M100 28 Q122 30 128 44 H100 Z" fill="#BAE6FD" stroke="#1E3A8A" strokeWidth="2.5" />
        {/* front wing */}
        <path d="M70 46 L52 16 L76 16 L96 46 Z" fill="#F87171" />
        {/* propeller */}
        <circle cx="156" cy="46" r="4" fill="#475569" />
        <ellipse className="ps-prop" cx="158" cy="46" rx="3" ry="20" fill="#94A3B8" opacity=".7" />
      </svg>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={mascotCutSrc('rocky', 'pose-cheer')} alt="" className="absolute bottom-[42%] left-[58%] h-[60%] w-auto" />
    </div>
  )
}

/** A puffy cloud holding a word; `state` tints it after the plane passes. */
export function WordCloud({ word, state }: { word: string; state: 'idle' | 'right' | 'wrong' | 'hint' }) {
  const tint = state === 'right' ? 'bg-emerald-300' : state === 'wrong' ? 'bg-red-300' : state === 'hint' ? 'bg-emerald-200' : 'bg-white'
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <div className={`absolute inset-x-[4%] bottom-[8%] top-[34%] rounded-full shadow-lg ${tint}`} />
      <div className={`absolute left-[16%] top-[14%] h-[56%] w-[38%] rounded-full ${tint}`} />
      <div className={`absolute right-[14%] top-[4%] h-[66%] w-[44%] rounded-full ${tint}`} />
      <span className="relative mt-[10%] max-w-[86%] truncate text-center text-[clamp(16px,3.6vmin,36px)] font-black text-sky-900">{word}</span>
    </div>
  )
}
