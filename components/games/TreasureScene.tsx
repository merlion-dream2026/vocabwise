// Scenery for 🗺️ Đào kho báu: the sea, the parchment treasure map with a dotted trail of X-marks
// (start → 8 stops → chest), and the letter stones. Decoration only — the game places Rocky.

/** Trail points in % of the map box: the start, then one per right answer; the last is the chest. */
export const TRAIL: [number, number][] = [
  [9, 84], [24, 68], [14, 46], [30, 28], [48, 40], [44, 66], [64, 78], [80, 58], [86, 24],
]

export function SeaBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-sky-400 to-blue-600" aria-hidden>
      <div className="absolute inset-0 opacity-30" style={{ background: 'repeating-radial-gradient(circle at 20% 30%, transparent 0 18px, #fff 18px 20px, transparent 20px 46px)' }} />
    </div>
  )
}

export function TreasureMap({ reached, open }: { reached: number; open: boolean }) {
  const d = TRAIL.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')
  const done = TRAIL.slice(0, reached + 1).map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')
  return (
    <div className="absolute inset-0 rotate-[-1deg] rounded-[6%] border-[1vmin] border-[#92400E] bg-[#FDE9B8] shadow-2xl"
      style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,.5), transparent 40%), radial-gradient(circle at 80% 90%, rgba(146,64,14,.18), transparent 45%)' }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
        <path d={d} stroke="#92400E" strokeOpacity=".45" strokeWidth="1.2" strokeDasharray="2.5 2" fill="none" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 3 }} />
        <path d={done} stroke="#DC2626" strokeWidth="1.2" strokeDasharray="2.5 2" fill="none" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 4, transition: 'd .6s' }} />
      </svg>
      {/* scenery stickers */}
      {[['🌴', 4, 18], ['🌴', 60, 12], ['🦀', 70, 92], ['🐚', 30, 90], ['🌊', 92, 84], ['🧭', 92, 6]].map(([e, x, y]) => (
        <span key={`${x}-${y}`} className="absolute -translate-x-1/2 -translate-y-1/2 text-[6vmin] opacity-80" style={{ left: `${x}%`, top: `${y}%` }} aria-hidden>{e}</span>
      ))}
      {TRAIL.slice(1, -1).map(([x, y], i) => (
        <span key={i} className={`absolute -translate-x-1/2 -translate-y-1/2 font-black leading-none ${i < reached ? 'text-[4vmin] text-emerald-600' : 'text-[5vmin] text-[#B91C1C]'}`}
          style={{ left: `${x}%`, top: `${y}%` }} aria-hidden>{i < reached ? '✔' : '✕'}</span>
      ))}
      <span className={`absolute -translate-x-1/2 -translate-y-1/2 text-[10vmin] leading-none ${open ? 'tb-open' : ''}`}
        style={{ left: `${TRAIL[TRAIL.length - 1][0]}%`, top: `${TRAIL[TRAIL.length - 1][1]}%` }} aria-hidden>{open ? '💰' : '🧰'}</span>
    </div>
  )
}

/** A round grey stepping stone with a letter carved in. */
export function LetterStone({ letter, state, onClick, disabled }: {
  letter: string; state: 'idle' | 'right' | 'wrong' | 'dim'; onClick: () => void; disabled: boolean
}) {
  const look = state === 'right' ? 'border-emerald-800 bg-emerald-400 text-emerald-950'
    : state === 'wrong' ? 'ax-shake border-red-800 bg-red-400 text-white'
    : state === 'dim' ? 'border-slate-600 bg-slate-400 text-slate-600'
    : 'border-slate-600 bg-gradient-to-b from-slate-200 to-slate-400 text-slate-800'
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={letter}
      className={`flex aspect-[1.25] w-full max-w-[24vmin] items-center justify-center rounded-[45%] border-b-[6px] text-[clamp(28px,8vmin,72px)] font-black shadow-lg transition-transform active:translate-y-1 active:border-b-2 ${look}`}>
      {letter}
    </button>
  )
}
