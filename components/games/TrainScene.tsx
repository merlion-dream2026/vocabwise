import { mascotCutSrc } from '@/lib/mascots'

// Scenery for 🚂 Tàu chở chữ: rolling hills, the rail line and the station platform; the steam
// engine with Rocky at the controls, the letter wagons and the wooden letter crates. Decoration only.

/** Where the rails run (fraction of the stage height, from the top). */
export const RAIL_Y = { wide: 0.5, tall: 0.42, short: 0.52 }

export function Countryside({ railY }: { railY: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300 to-sky-100" />
      <div className="absolute right-[8%] top-[5%] h-[12vmin] w-[12vmin] rounded-full bg-yellow-200 shadow-[0_0_40px_16px_rgba(254,240,138,.6)] portrait:top-[9%]" />
      {/* hills behind the line */}
      <svg viewBox="0 0 400 60" preserveAspectRatio="none" className="absolute inset-x-0 h-[16%] w-full" style={{ bottom: `${100 - railY * 100}%` }}>
        <path d="M0 60 V30 Q50 0 110 28 T220 22 T330 30 T400 18 V60 Z" fill="#86EFAC" />
        <path d="M0 60 V44 Q70 24 140 42 T280 38 T400 40 V60 Z" fill="#4ADE80" />
      </svg>
      {/* ground + platform below the rails */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-[#A3A3A3] to-[#78716C]" style={{ top: `${railY * 100}%` }}>
        <div className="absolute inset-x-0 top-[3vmin] h-[2vmin] bg-[#FDE047]" />
        <div className="absolute inset-0 top-[5vmin] opacity-25" style={{ background: 'repeating-linear-gradient(90deg, transparent 0 9vmin, #44403C 9vmin 9.4vmin)' }} />
      </div>
      {/* rails: two steel lines on sleepers */}
      <div className="absolute inset-x-0 h-[3vmin] -translate-y-full" style={{ top: `${railY * 100}%`, background: 'repeating-linear-gradient(90deg, #78350F 0 1.6vmin, transparent 1.6vmin 4vmin)' }}>
        <div className="absolute inset-x-0 top-[15%] h-[0.7vmin] bg-slate-600" />
        <div className="absolute inset-x-0 bottom-[10%] h-[0.7vmin] bg-slate-500" />
      </div>
    </div>
  )
}

function Wheels({ count }: { count: number }) {
  return (
    <div className="absolute -bottom-[0.5vmin] inset-x-[8%] flex justify-around">
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="block aspect-square w-[min(4.4vmin,28%)] rounded-full border-[0.8vmin] border-slate-800 bg-slate-400" />
      ))}
    </div>
  )
}

/** The steam engine, facing right, Rocky in the cab. Width comes from the caller; height follows. */
export function Locomotive({ width, steaming = false }: { width: number; steaming?: boolean }) {
  return (
    <div className="relative shrink-0" style={{ width, height: width * 0.78 }} aria-hidden>
      {steaming && [0, 0.35, 0.7].map((d) => (
        <span key={d} className="tr-puff absolute left-[66%] top-[-6%] h-[26%] w-[26%] rounded-full bg-white/90" style={{ animationDelay: `${d}s` }} />
      ))}
      <svg viewBox="0 0 100 78" className="absolute inset-0 h-full w-full overflow-visible">
        <rect x="60" y="4" width="12" height="20" rx="2" fill="#1F2937" />
        <rect x="2" y="8" width="40" height="44" rx="5" fill="#DC2626" stroke="#7F1D1D" strokeWidth="3" />
        <rect x="8" y="14" width="28" height="20" rx="3" fill="#BAE6FD" />
        <path d="M40 26 H88 Q98 26 98 40 V62 H40 Z" fill="#2563EB" stroke="#1E3A8A" strokeWidth="3" strokeLinejoin="round" />
        <rect x="40" y="56" width="58" height="8" fill="#FACC15" />
        <circle cx="94" cy="40" r="4" fill="#FDE047" stroke="#CA8A04" strokeWidth="1.5" />
      </svg>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={mascotCutSrc('rocky', 'pose-cheer')} alt="" className="absolute bottom-[40%] left-[2%] h-[64%] w-auto" />
      <Wheels count={3} />
    </div>
  )
}

/** One wagon carrying a letter (or waiting for one). `next` = the wagon the next crate goes into. */
export function Wagon({ letter, width, next, filled }: { letter: string; width: number; next: boolean; filled: boolean }) {
  return (
    <div className="relative shrink-0" style={{ width, height: width * 1.05 }}>
      <div className={`absolute inset-x-0 bottom-[14%] top-0 flex items-center justify-center rounded-[18%] border-[0.6vmin] ${
        filled ? 'border-[#92400E] bg-[#F59E0B]' : next ? 'tr-next border-dashed border-[#FACC15] bg-white/60' : 'border-dashed border-white/60 bg-white/15'}`}>
        {filled && (
          <span className="tr-drop font-black uppercase leading-none text-[#451A03]" style={{ fontSize: Math.max(14, width * 0.62) }}>{letter}</span>
        )}
      </div>
      <Wheels count={2} />
    </div>
  )
}

/** A wooden crate stamped with a letter. */
export function Crate({ letter, state, onClick, size }: {
  letter: string; state: 'idle' | 'wrong' | 'hint'; onClick: () => void; size: number
}) {
  return (
    <button type="button" onClick={onClick} aria-label={letter}
      className={`relative flex items-center justify-center rounded-xl border-b-[6px] font-black uppercase shadow-lg transition-transform active:translate-y-1 active:border-b-2 ${
        state === 'wrong' ? 'ax-shake border-red-800 bg-red-400 text-white'
        : state === 'hint' ? 'tr-hint border-emerald-700 bg-emerald-300 text-emerald-950'
        : 'border-[#78350F] bg-[#D97706] text-[#FFF7ED]'}`}
      style={{ width: size, height: size, fontSize: size * 0.55,
        backgroundImage: state === 'idle' ? 'repeating-linear-gradient(0deg, rgba(120,53,15,.25) 0 2px, transparent 2px 33%)' : undefined }}>
      {letter}
    </button>
  )
}
