import type { ReactNode } from 'react'
import { mascotCutSrc } from '@/lib/mascots'

// The rocket of 🚀 Phóng tên lửa as 10 SVG parts in build order (pad first, star last). Parts not
// built yet show as a faint grey silhouette so kids see what's missing; a part drops in with a bounce
// the moment it's built. `stage` drives the countdown rumble, lift-off, cruising in space (flame on,
// gentle bob) and the out-of-fuel fizzle.

export type RocketStage = 'build' | 'countdown' | 'launch' | 'cruise' | 'fizzle'

const BODY = '#F8FAFC'
const EDGE = '#CBD5E1'
const RED = '#EF4444'

// Index = build order. Draw order is separate (fins sit behind the body).
const PARTS: ReactNode[] = [
  // 0 launch pad
  <g key="pad"><rect x="34" y="330" width="132" height="12" rx="4" fill="#64748B" /><rect x="44" y="342" width="10" height="16" fill="#475569" /><rect x="146" y="342" width="10" height="16" fill="#475569" /></g>,
  // 1 engine nozzle
  <path key="nozzle" d="M82 300 L118 300 L128 328 L72 328 Z" fill="#94A3B8" stroke="#64748B" strokeWidth="2" />,
  // 2 lower body
  <g key="lower"><rect x="70" y="236" width="60" height="66" fill={BODY} stroke={EDGE} strokeWidth="2" /><rect x="70" y="262" width="60" height="10" fill={RED} /></g>,
  // 3 left fin
  <path key="finL" d="M70 246 L36 300 L36 324 L70 306 Z" fill={RED} stroke="#B91C1C" strokeWidth="2" />,
  // 4 right fin
  <path key="finR" d="M130 246 L164 300 L164 324 L130 306 Z" fill={RED} stroke="#B91C1C" strokeWidth="2" />,
  // 5 middle body
  <g key="mid"><rect x="70" y="168" width="60" height="70" fill={BODY} stroke={EDGE} strokeWidth="2" /><rect x="70" y="173" width="60" height="6" fill="#3B82F6" /></g>,
  // 6 window with Rocky inside
  <g key="window">
    <defs><clipPath id="rk-porthole"><circle cx="100" cy="208" r="17" /></clipPath></defs>
    <circle cx="100" cy="208" r="17" fill="#BAE6FD" />
    <image href={mascotCutSrc('rocky', 'pose-cheer')} x="80" y="190" width="40" height="40" clipPath="url(#rk-porthole)" preserveAspectRatio="xMidYMin slice" />
    <circle cx="100" cy="208" r="18" fill="none" stroke="#1E3A8A" strokeWidth="5" />
  </g>,
  // 7 upper body
  <g key="upper"><rect x="70" y="118" width="60" height="52" fill={BODY} stroke={EDGE} strokeWidth="2" /><rect x="70" y="150" width="60" height="8" fill="#F59E0B" /></g>,
  // 8 nose cone
  <path key="nose" d="M70 120 Q100 30 130 120 Z" fill={RED} stroke="#B91C1C" strokeWidth="2" />,
  // 9 antenna + star
  <g key="star"><line x1="100" y1="76" x2="100" y2="48" stroke="#64748B" strokeWidth="3" /><path d="M100 26 l5 10 11 1.5 -8 7.5 2 11 -10 -5.5 -10 5.5 2 -11 -8 -7.5 11 -1.5 Z" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.5" /></g>,
]
const DRAW_ORDER = [3, 4, 1, 2, 5, 7, 6, 8, 9] // everything but the pad, back to front

function Part({ i, built }: { i: number; built: number }) {
  const done = i < built
  return (
    <g className={done ? 'rk-in' : undefined} opacity={done ? 1 : 0.28}
      style={done ? undefined : { filter: 'grayscale(1) brightness(1.6)' }}>
      {PARTS[i]}
    </g>
  )
}

export function RocketArt({ built, stage, className = '' }: { built: number; stage: RocketStage; className?: string }) {
  const flying = stage === 'launch' || stage === 'cruise'
  return (
    <svg viewBox="0 0 200 360" className={`overflow-visible ${className}`} aria-hidden>
      <style>{`
        @keyframes rkIn { 0% { transform: translateY(-46px); opacity: 0 } 60% { transform: translateY(5px); opacity: 1 } 80% { transform: translateY(-3px) } 100% { transform: translateY(0) } }
        @keyframes rkShake { 0%,100% { transform: translate(0,0) } 25% { transform: translate(-1.5px,1px) } 75% { transform: translate(1.5px,-1px) } }
        @keyframes rkFly { 0% { transform: translateY(0) } 18% { transform: translateY(6px) } 100% { transform: translateY(-900px) } }
        @keyframes rkFlame { 0%,100% { transform: scaleY(1) } 50% { transform: scaleY(1.25) } }
        @keyframes rkSmoke { 0% { transform: scale(.4); opacity: .9 } 100% { transform: scale(2.2) translateY(-6px); opacity: 0 } }
        @keyframes rkSag { 0%,100% { transform: rotate(0) } 50% { transform: rotate(-2deg) } }
        .rk-in { animation: rkIn .5s cubic-bezier(.3,1.4,.5,1) both; transform-box: fill-box }
        .rk-shake { animation: rkShake .09s linear infinite }
        .rk-fly { animation: rkFly 2.6s cubic-bezier(.55,0,.85,.4) forwards }
        .rk-flame { animation: rkFlame .12s ease-in-out infinite; transform-origin: 100px 328px }
        .rk-smoke { animation: rkSmoke 1.1s ease-out infinite; transform-box: fill-box; transform-origin: center }
        .rk-cruise { animation: rkCruise 1.6s ease-in-out infinite }
        @keyframes rkCruise { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
        .rk-sag { animation: rkSag 1.6s ease-in-out infinite; transform-origin: 100px 330px }
      `}</style>

      {stage !== 'cruise' && <Part i={0} built={built} />}

      {(stage === 'launch' || stage === 'fizzle') && (
        <g fill={stage === 'fizzle' ? '#94A3B8' : '#E2E8F0'}>
          {[[70, 330, 0], [130, 330, 0.3], [100, 322, 0.6], [55, 338, 0.45], [145, 338, 0.15]].map(([x, y, d]) => (
            <circle key={`${x}-${y}`} className="rk-smoke" cx={x} cy={y} r="14" style={{ animationDelay: `${d}s` }} />
          ))}
        </g>
      )}

      <g className={stage === 'launch' ? 'rk-fly' : stage === 'cruise' ? 'rk-cruise' : stage === 'countdown' ? 'rk-shake' : stage === 'fizzle' ? 'rk-sag' : undefined}>
        {(stage === 'countdown' || flying) && (
          <g className="rk-flame">
            <path d={flying ? 'M78 326 Q100 430 122 326 Z' : 'M86 326 Q100 360 114 326 Z'} fill="#F97316" />
            <path d={flying ? 'M88 326 Q100 395 112 326 Z' : 'M92 326 Q100 346 108 326 Z'} fill="#FDE047" />
          </g>
        )}
        {DRAW_ORDER.map((i) => <Part key={i} i={i} built={built} />)}
      </g>
    </svg>
  )
}

// Win scene: the rocket parked on a ringed planet named after the topic, Rocky cheering with a flag.
export function PlanetScene({ topicEmoji }: { topicEmoji: string }) {
  return (
    <div className="relative mx-auto h-full w-full max-w-[min(92vw,120vmin)]">
      <style>{`
        @keyframes rkLand { 0% { transform: translateY(-120%) } 70% { transform: translateY(4%) } 100% { transform: translateY(0) } }
        @keyframes rkBob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
        .rk-land { animation: rkLand 1.1s cubic-bezier(.3,1.2,.5,1) both }
        .rk-bob { animation: rkBob 1.4s ease-in-out infinite }
      `}</style>
      <svg viewBox="0 0 300 200" className="absolute inset-x-0 bottom-0 w-full" aria-hidden>
        <defs>
          <radialGradient id="rk-planet" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#C4B5FD" /><stop offset="60%" stopColor="#8B5CF6" /><stop offset="100%" stopColor="#5B21B6" />
          </radialGradient>
        </defs>
        <ellipse cx="150" cy="150" rx="150" ry="26" fill="none" stroke="#FDE68A" strokeWidth="7" opacity=".85" />
        <circle cx="150" cy="190" r="110" fill="url(#rk-planet)" />
        <circle cx="105" cy="160" r="12" fill="#7C3AED" opacity=".5" /><circle cx="200" cy="175" r="8" fill="#7C3AED" opacity=".5" />
        <path d="M0 150 A150 26 0 0 0 300 150" fill="none" stroke="#FDE68A" strokeWidth="7" opacity=".85" />
      </svg>
      <div className="rk-land absolute bottom-[58%] left-[18%] h-[52%]">
        <RocketArt built={10} stage="build" className="h-full" />
      </div>
      <div className="rk-bob absolute bottom-[54%] right-[14%] flex items-end">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mascotCutSrc('rocky', 'pose-cheer')} alt="" className="h-24 w-auto" />
        <div className="-ml-2 mb-6 flex flex-col items-start">
          <span className="rounded-md bg-white px-1.5 text-2xl shadow">{topicEmoji}</span>
          <span className="ml-1 h-12 w-1 rounded bg-slate-200" />
        </div>
      </div>
    </div>
  )
}
