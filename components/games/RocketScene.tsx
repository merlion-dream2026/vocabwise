// Scenery for 🚀 Phóng tên lửa: the night launch site (stars, moon, city skyline, runway with a
// spotlight) and the "in space" backdrop with Earth's curve. Decoration only.

// Fixed star field (no Math.random in render): [left %, top %, size px, delay s]
const STARS: [number, number, number, number][] = [
  [6, 10, 2, 0], [14, 34, 3, .6], [22, 8, 2, 1.2], [31, 22, 2, .3], [40, 6, 3, 1.8], [47, 30, 2, .9],
  [58, 12, 2, 1.5], [66, 26, 3, .2], [74, 9, 2, 1.1], [83, 33, 2, .7], [91, 16, 3, 1.4], [36, 40, 2, 2],
  [8, 46, 2, 1.6], [62, 44, 2, .4], [95, 42, 2, 1],
]

export function StarField() {
  return (
    <>
      {STARS.map(([x, y, s, d], i) => (
        <span key={i} className="st-twinkle absolute rounded-full bg-white" aria-hidden
          style={{ left: `${x}%`, top: `${y}%`, width: s, height: s, animationDelay: `${d}s` }} />
      ))}
    </>
  )
}

function Skyline() {
  // Buildings, trees and the launch tower as one silhouette strip sitting on the horizon.
  const win = '#F4C66A'
  return (
    <svg viewBox="0 0 1000 200" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 h-full w-full" aria-hidden>
      <g fill="#1A1C35">
        <path d="M30 200 V95 Q30 60 95 60 Q160 60 160 95 V200 Z" />
        <rect x="210" y="70" width="120" height="130" />
        <circle cx="370" cy="140" r="30" /><rect x="366" y="160" width="8" height="40" />
        <circle cx="420" cy="152" r="22" /><rect x="416" y="165" width="8" height="35" />
        <rect x="490" y="40" width="8" height="160" /><rect x="530" y="40" width="8" height="160" />
        {[60, 90, 120, 150, 180].map((y) => <rect key={y} x="490" y={y} width="48" height="4" />)}
        <rect x="660" y="80" width="140" height="120" />
        <path d="M850 200 V105 Q850 75 905 75 Q960 75 960 105 V200 Z" />
      </g>
      <g fill={win}>
        {[230, 262, 294].map((x) => [92, 122].map((y) => <rect key={`${x}-${y}`} x={x} y={y} width="14" height="12" />))}
        {[680, 712, 744, 776].map((x) => [100, 130].map((y) => <rect key={`${x}-${y}`} x={x} y={y} width="13" height="12" />))}
      </g>
      <g fill="#E2E8F0">{[78, 92, 106].map((x) => <circle key={x} cx={x} cy="80" r="3" />)}</g>
    </svg>
  )
}

/** The launch site. Horizon sits at 70% (landscape) / 58% (portrait). */
export function LaunchSite() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-[#12112E] via-[#2C2A62] to-[#8B5E8C]" aria-hidden>
      <StarField />
      <div className="absolute right-[8%] top-[10%] h-[16vmin] w-[16vmin] rounded-full bg-[#F1EFD2] shadow-[0_0_50px_12px_rgba(241,239,210,.25)] portrait:top-[14%]">
        <span className="absolute left-[24%] top-[22%] h-[18%] w-[18%] rounded-full bg-[#D9D6B4]" />
        <span className="absolute left-[60%] top-[56%] h-[13%] w-[13%] rounded-full bg-[#D9D6B4]" />
      </div>
      <div className="absolute inset-x-0 bottom-[30%] h-[18%] portrait:bottom-[42%] portrait:h-[12%]"><Skyline /></div>
      {/* ground: runway lines + spotlight on the pad */}
      <div className="absolute inset-x-0 bottom-0 h-[30%] bg-[#2A2C45] portrait:h-[42%]">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
          <path d="M50 0 V100 M34 0 L5 100 M66 0 L95 100" stroke="#3B3E5C" strokeWidth=".6" strokeDasharray="3 3" fill="none" />
        </svg>
        <div className="absolute -bottom-[30%] left-[-6%] h-[90%] w-[48%] rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(255,236,170,.35),transparent_70%)]" />
      </div>
    </div>
  )
}

/** Deep space with Earth's curve rising from the bottom. */
export function SpaceBackdrop() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-[#07071A] via-[#141236] to-[#2B2867]" aria-hidden>
      <StarField />
      <div className="absolute left-1/2 top-[62%] aspect-square w-[140vmax] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_50%_30%,#6EA8FF,#2F5FCB_55%,#1E3A8A)] shadow-[0_0_80px_30px_rgba(110,168,255,.35)]">
        <span className="absolute left-[38%] top-[4%] h-[5%] w-[9%] rounded-[50%] bg-emerald-500/70" />
        <span className="absolute left-[55%] top-[7%] h-[4%] w-[7%] rounded-[50%] bg-emerald-500/60" />
      </div>
    </div>
  )
}
