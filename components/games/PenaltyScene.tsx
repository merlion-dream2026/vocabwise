import type { CSSProperties, ReactNode } from 'react'
import type { Celebration, Corner } from '@/lib/arcadeGames'

// Scenery for ⚽ Sút penalty: the night stadium (floodlights, crowd, striped pitch), the goal with
// its net, the keeper, the ball and the cartoon striker whose 3★ celebrations are drawn here
// (jump-spin-land "spin", both arms to the sky "sky"). Generic kit, no real player's name/number.
// Decoration only — the game moves things.

const STYLES = `
  @keyframes pnRun { 0%,100% { transform: rotate(var(--a)) } 50% { transform: rotate(calc(var(--a) * -1)) } }
  @keyframes pnSpinBody {
    0%   { transform: translate(-55vw, 0) rotateY(0) scale(1, 1) }
    32%  { transform: translate(0, 0) rotateY(0) scale(1, 1) }
    40%  { transform: translate(0, 4%) rotateY(0) scale(1.04, .94) }
    55%  { transform: translate(0, -32%) rotateY(110deg) scale(1, 1) }
    68%  { transform: translate(0, -30%) rotateY(180deg) scale(1, 1) }
    80%  { transform: translate(0, 0) rotateY(180deg) scale(1.07, .9) }
    88%, 100% { transform: translate(0, 0) rotateY(180deg) scale(1, 1) }
  }
  @keyframes pnSpinArm {
    0%, 16% { transform: rotate(-30deg) } 8%, 24% { transform: rotate(30deg) } 32% { transform: rotate(10deg) }
    40% { transform: rotate(20deg) } 55% { transform: rotate(165deg) } 68% { transform: rotate(150deg) }
    80%, 100% { transform: rotate(68deg) }
  }
  @keyframes pnSpinLeg {
    0%, 16% { transform: rotate(25deg) } 8%, 24% { transform: rotate(-25deg) } 32%, 40% { transform: rotate(0) }
    55%, 68% { transform: rotate(-10deg) } 80%, 100% { transform: rotate(20deg) }
  }
  @keyframes pnSkyBody {
    0%   { transform: translate(-55vw, 0) }
    35%  { transform: translate(0, 0) }
    45%  { transform: translate(0, -12%) }
    55%, 100% { transform: translate(0, 0) }
  }
  @keyframes pnSkyArm {
    0%, 16% { transform: rotate(-30deg) } 8%, 24% { transform: rotate(30deg) } 35% { transform: rotate(0) }
    50%, 100% { transform: rotate(172deg) }
  }
  @keyframes pnSkyLeg { 0%, 16% { transform: rotate(25deg) } 8%, 24% { transform: rotate(-25deg) } 35%, 100% { transform: rotate(0) } }
  @keyframes pnCaption { 0%, 78% { opacity: 0; transform: scale(.4) } 88% { opacity: 1; transform: scale(1.15) } 100% { opacity: 1; transform: scale(1) } }
  @keyframes pnFlash { 0%, 100% { opacity: 0 } 50% { opacity: 1 } }
  .pn-flash { animation: pnFlash 1.1s ease-in-out infinite }
`

// ── Stadium ─────────────────────────────────────────────────────────────────────────────────────
// Camera flashes in the stands: [left %, top %, delay s]
const FLASHES: [number, number, number][] = [
  [8, 30, 0], [19, 22, .5], [31, 34, .2], [44, 26, .8], [57, 31, .35], [69, 21, .65], [81, 33, .1], [92, 25, .9],
]

/** Night stadium. The pitch starts at 52% (landscape) / 40% (portrait). */
export function Stadium({ flashes = false }: { flashes?: boolean }) {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-[#0B1430] via-[#16275A] to-[#1E3A6E]" aria-hidden>
      <style>{STYLES}</style>
      {/* floodlights */}
      {[8, 92].map((x) => (
        <div key={x} className="absolute top-[4%] h-[9vmin] w-[16vmin] -translate-x-1/2 rounded-lg bg-[#F8FAFC] shadow-[0_0_60px_24px_rgba(248,250,252,.35)]"
          style={{ left: `${x}%`, backgroundImage: 'radial-gradient(circle, #FEF9C3 30%, transparent 32%)', backgroundSize: '3vmin 3vmin' }} />
      ))}
      {/* stands: crowd as coloured dots on dark tiers */}
      <div className="absolute inset-x-0 top-[16%] h-[36%] portrait:h-[24%]"
        style={{
          background: 'radial-gradient(circle, #F87171 28%, transparent 30%) 0 0 / 3.2vmin 3vmin, radial-gradient(circle, #FACC15 28%, transparent 30%) 1.6vmin 1.5vmin / 3.2vmin 3vmin, radial-gradient(circle, #60A5FA 26%, transparent 28%) .8vmin .7vmin / 2.6vmin 2.4vmin, linear-gradient(#24305E, #1B2550)',
        }} />
      {flashes && FLASHES.map(([x, y, d]) => (
        <span key={x} className="pn-flash absolute h-[2.2vmin] w-[2.2vmin] rounded-full bg-white shadow-[0_0_14px_6px_rgba(255,255,255,.8)]"
          style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${d}s` }} />
      ))}
      {/* advertising boards */}
      <div className="absolute inset-x-0 top-[50%] h-[3%] bg-gradient-to-r from-[#2563EB] via-[#F59E0B] to-[#2563EB] portrait:top-[38%]" />
      {/* striped pitch */}
      <div className="absolute inset-x-0 bottom-0 top-[53%] portrait:top-[41%]"
        style={{ background: 'repeating-linear-gradient(90deg, #2F9E44 0 8%, #37B24D 8% 16%)' }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          <path d="M8 8 H92 M22 8 V40 H78 V8 M36 40 Q50 58 64 40" stroke="#E9F5EC" strokeWidth=".5" fill="none" />
        </svg>
      </div>
    </div>
  )
}

// ── Player (striker / keeper share the figure) ───────────────────────────────────────────────
type Kit = { shirt: string; trim: string; shorts: string; socks: string }
export const STRIKER_KIT: Kit = { shirt: '#2563EB', trim: '#FACC15', shorts: '#F8FAFC', socks: '#2563EB' }
export const KEEPER_KIT: Kit = { shirt: '#22C55E', trim: '#14532D', shorts: '#14532D', socks: '#22C55E' }

const part = (x: number, y: number, anim?: string, a = 0): CSSProperties => ({
  transformBox: 'view-box', transformOrigin: `${x}px ${y}px`,
  ...(anim ? { animation: anim } : { transform: `rotate(${a}deg)` }),
})

/** Cartoon footballer, viewBox 100×160. Arm/leg angles in degrees (positive = outward). */
export function Player({ kit, arms = 8, legs = 4, gloves = false, anim, className = '', style }: {
  kit: Kit; arms?: number; legs?: number; gloves?: boolean; className?: string; style?: CSSProperties
  /** CSS animations for the limbs (written for the left side; the right side mirrors them). */
  anim?: { arm: string; leg: string }
}) {
  const hand = gloves ? '#F97316' : '#F2C09A'
  // Both sides are drawn as the left limb; the right one is that limb mirrored around x = 50,
  // so one angle / animation swings both outward together.
  const limb = (side: 'l' | 'r', kind: 'arm' | 'leg') => {
    const x = kind === 'arm' ? 37 : 45
    const y = kind === 'arm' ? 60 : 104
    const inner = (
      <g style={part(x, y, anim?.[kind], kind === 'arm' ? arms : legs)}>
        {kind === 'arm'
          ? <><rect x={x - 4} y={y - 2} width="8" height="20" rx="4" fill={kit.shirt} /><rect x={x - 3.5} y={y + 14} width="7" height="18" rx="3.5" fill="#F2C09A" /><circle cx={x} cy={y + 33} r="4.6" fill={hand} /></>
          : <><rect x={x - 5} y={y - 4} width="10" height="22" rx="4" fill="#F2C09A" /><rect x={x - 5} y={y + 14} width="10" height="18" rx="3" fill={kit.socks} /><path d={`M${x - 6} ${y + 31} h13 q4 0 4 4 v2 h-17 z`} fill="#111827" /></>}
      </g>
    )
    return side === 'l' ? inner : <g style={{ transformBox: 'view-box', transformOrigin: '50px 0', transform: 'scaleX(-1)' }}>{inner}</g>
  }
  return (
    <svg viewBox="0 0 100 160" className={className} style={style} aria-hidden overflow="visible">
      {limb('l', 'leg')}{limb('r', 'leg')}
      <rect x="37" y="92" width="26" height="16" rx="4" fill={kit.shorts} />
      {limb('l', 'arm')}{limb('r', 'arm')}
      <path d="M36 62 Q36 54 44 54 H56 Q64 54 64 62 V96 H36 Z" fill={kit.shirt} />
      <path d="M44 54 L50 62 L56 54" fill="none" stroke={kit.trim} strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M50 70 l2.6 5.3 5.8 .8 -4.2 4.1 1 5.8 -5.2 -2.7 -5.2 2.7 1 -5.8 -4.2 -4.1 5.8 -.8 z" fill={kit.trim} />
      <rect x="46" y="46" width="8" height="9" fill="#E8B48C" />
      <circle cx="50" cy="38" r="13" fill="#F2C09A" />
      <path d="M37 37 Q37 22 50 22 Q63 22 63 35 Q57 29 50 30 Q42 30 37 37 Z" fill="#3F2A1D" />
      <circle cx="45" cy="39" r="1.6" fill="#1F2937" /><circle cx="55" cy="39" r="1.6" fill="#1F2937" />
      <path d="M45 44 Q50 48 55 44" fill="none" stroke="#9A3412" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

// ── Goal, keeper, ball ───────────────────────────────────────────────────────────────────────────
const DIVE: Record<Corner, string> = {
  tl: 'translate(-120%, -42%) rotate(-62deg)', tr: 'translate(20%, -42%) rotate(62deg)',
  bl: 'translate(-130%, 6%) rotate(-82deg)', br: 'translate(30%, 6%) rotate(82deg)',
}

/** Goal frame + net; the answers (children) fill it as a 2×2 grid with the keeper in the middle lane. */
export function Goal({ children, dive, className = '' }: { children: ReactNode; dive: Corner | null; className?: string }) {
  return (
    <div className={`relative rounded-t-md border-x-[1.6vmin] border-t-[1.6vmin] border-[#F8FAFC] shadow-[0_0_0_2px_rgba(0,0,0,.25)] ${className}`}
      style={{ background: 'repeating-linear-gradient(0deg, rgba(255,255,255,.28) 0 2px, transparent 2px 3.2vmin), repeating-linear-gradient(90deg, rgba(255,255,255,.28) 0 2px, transparent 2px 3.2vmin), rgba(15,23,42,.35)' }}>
      <div className="absolute inset-[4%] grid grid-cols-[1fr_24%_1fr] grid-rows-2 gap-y-[6%]">{children}</div>
      <Player kit={KEEPER_KIT} gloves arms={dive ? 150 : 128} legs={dive ? 14 : 18}
        className="pointer-events-none absolute bottom-0 left-1/2 z-10 h-[78%] w-auto"
        style={{ transform: `translateX(-50%) ${dive ? DIVE[dive] : ''}`, transition: 'transform .45s cubic-bezier(.2,.8,.3,1)' }} />
    </div>
  )
}

export function Ball({ className = '', style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 40 40" className={className} style={style} aria-hidden>
      <circle cx="20" cy="20" r="18" fill="#F8FAFC" stroke="#111827" strokeWidth="1.6" />
      <path d="M20 12 l7 5 -2.7 8.2 h-8.6 L13 17 z" fill="#111827" />
      <path d="M20 12 V3 M27 17 l8 -3 M24.3 25.2 l5 7 M15.7 25.2 l-5 7 M13 17 l-8 -3" stroke="#111827" strokeWidth="1.6" />
    </svg>
  )
}

// ── 3★ celebration ───────────────────────────────────────────────────────────────────────────────
const CELEBRATION: Record<Celebration, { body: string; arm: string; leg: string; caption: string; ms: number }> = {
  spin: { body: 'pnSpinBody 2.6s ease-in-out both', arm: 'pnSpinArm 2.6s ease-in-out both', leg: 'pnSpinLeg 2.6s ease-in-out both', caption: 'YESSS! 🔥', ms: 2600 },
  sky:  { body: 'pnSkyBody 2.2s ease-out both', arm: 'pnSkyArm 2.2s ease-out both', leg: 'pnSkyLeg 2.2s ease-out both', caption: 'GOOOAL! ☝️☝️', ms: 2200 },
}
export const celebrationMs = (c: Celebration) => CELEBRATION[c].ms

export function CelebrationScene({ kind }: { kind: Celebration }) {
  const c = CELEBRATION[kind]
  return (
    <div className="absolute inset-0 flex items-end justify-center pb-[6%]" style={{ perspective: '600px' }} aria-hidden>
      <div className="aspect-[100/160] h-[70%] portrait:h-[50%]" style={{ animation: c.body }}>
        <Player kit={STRIKER_KIT} anim={{ arm: c.arm, leg: c.leg }} className="h-full w-full drop-shadow-[0_10px_8px_rgba(0,0,0,.35)]" />
      </div>
      <p className="absolute inset-x-0 top-[16%] text-center text-[clamp(44px,13vmin,140px)] font-black text-[#FACC48] drop-shadow-[0_6px_0_rgba(0,0,0,.4)]"
        style={{ animation: `pnCaption ${c.ms}ms ease-out both` }}>{c.caption}</p>
    </div>
  )
}
