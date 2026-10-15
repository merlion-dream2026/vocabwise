// Scenery for 🦘 Hô to để nhảy: a sunny meadow whose ground scrolls while Rocky runs, the
// obstacles (log, rock, bush, puddle) with a sign post, and the finish flag. Decoration only.

/** Where the ground starts (fraction of the stage height). */
export const GROUND_Y = { wide: 0.66, tall: 0.62, short: 0.58 }

export function Meadow({ groundY, running }: { groundY: number; running: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <style>{`
        @keyframes jsScroll { from { background-position-x: 0 } to { background-position-x: -24vmin } }
        @keyframes jsHills { from { transform: translateX(0) } to { transform: translateX(-50%) } }
      `}</style>
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300 to-sky-100" />
      <div className="absolute right-[8%] top-[6%] h-[12vmin] w-[12vmin] rounded-full bg-yellow-200 shadow-[0_0_40px_16px_rgba(254,240,138,.6)] portrait:top-[10%]" />
      <div className="absolute left-0 h-[14%] w-[200%]" style={{ bottom: `${100 - groundY * 100}%`, animation: running ? 'jsHills 12s linear infinite' : undefined }}>
        <svg viewBox="0 0 800 60" preserveAspectRatio="none" className="h-full w-full">
          <path d="M0 60 V30 Q60 0 130 28 T260 24 T400 30 Q460 0 530 28 T660 24 T800 30 V60 Z" fill="#86EFAC" />
        </svg>
      </div>
      <div className="absolute inset-x-0 bottom-0 bg-[#65A30D]" style={{ top: `${groundY * 100}%` }}>
        <div className="absolute inset-x-0 top-0 h-[2.4vmin] bg-[#4D7C0F]"
          style={{ backgroundImage: 'repeating-linear-gradient(90deg, #4D7C0F 0 12vmin, #3F6212 12vmin 24vmin)', animation: running ? 'jsScroll .6s linear infinite' : undefined }} />
        <div className="absolute inset-0 top-[2.4vmin] bg-gradient-to-b from-[#A16207] to-[#713F12]" />
      </div>
    </div>
  )
}

const OBSTACLES = ['log', 'rock', 'bush', 'puddle'] as const

/** One of four obstacles (picked by index), with a sign post holding `sign` above it. */
export function Obstacle({ index, sign }: { index: number; sign?: React.ReactNode }) {
  const kind = OBSTACLES[index % OBSTACLES.length]
  return (
    <div className="relative h-full w-full" aria-hidden>
      {sign && (
        <div className="absolute bottom-[96%] left-1/2 flex -translate-x-1/2 flex-col items-center">
          {sign}
          <span className="h-[6vmin] w-[1.2vmin] bg-[#78350F]" />
        </div>
      )}
      <svg viewBox="0 0 100 60" className="absolute inset-0 h-full w-full overflow-visible">
        {kind === 'log' && <>
          <rect x="6" y="22" width="88" height="34" rx="16" fill="#92400E" stroke="#451A03" strokeWidth="3" />
          <ellipse cx="88" cy="39" rx="9" ry="16" fill="#D97706" stroke="#451A03" strokeWidth="3" />
          <ellipse cx="88" cy="39" rx="4" ry="8" fill="none" stroke="#92400E" strokeWidth="2" />
        </>}
        {kind === 'rock' && <path d="M8 58 Q4 30 26 20 Q40 6 62 14 Q90 18 94 58 Z" fill="#94A3B8" stroke="#475569" strokeWidth="3" strokeLinejoin="round" />}
        {kind === 'bush' && <>
          <circle cx="28" cy="40" r="20" fill="#16A34A" /><circle cx="52" cy="30" r="24" fill="#22C55E" /><circle cx="76" cy="40" r="20" fill="#16A34A" />
          <circle cx="44" cy="26" r="3" fill="#F43F5E" /><circle cx="66" cy="38" r="3" fill="#F43F5E" />
        </>}
        {kind === 'puddle' && <ellipse cx="50" cy="52" rx="48" ry="9" fill="#38BDF8" stroke="#0284C7" strokeWidth="3" />}
      </svg>
    </div>
  )
}

/** Chequered finish flag on a pole. */
export function FinishFlag() {
  return (
    <svg viewBox="0 0 40 80" className="h-full w-full" aria-hidden>
      <rect x="4" y="2" width="4" height="78" fill="#475569" />
      <rect x="8" y="4" width="30" height="20" fill="#F8FAFC" stroke="#111827" strokeWidth="1.5" />
      {[0, 1, 2].map((r) => [0, 1, 2, 3, 4].map((c) => (r + c) % 2 ? null : <rect key={`${r}${c}`} x={8 + c * 6} y={4 + r * 6.67} width="6" height="6.67" fill="#111827" />))}
    </svg>
  )
}
