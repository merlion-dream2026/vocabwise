import type { ReactNode } from 'react'

// Scenery for 🔨 Đập chuột chũi: sky, sun, drifting clouds, rolling hills, and the dirt holes the
// critters pop out of. Pure decoration — the game passes the critter in as `children`.

function Cloud({ className, delay = '0s' }: { className: string; delay?: string }) {
  return (
    <div className={`st-drift absolute ${className}`} style={{ animationDelay: delay }} aria-hidden>
      <div className="relative h-[6vmin] w-[16vmin] rounded-full bg-white/95">
        <div className="absolute -top-[3.4vmin] left-[2.6vmin] h-[7vmin] w-[7vmin] rounded-full bg-white/95" />
        <div className="absolute -top-[4.6vmin] left-[6.6vmin] h-[8.4vmin] w-[8.4vmin] rounded-full bg-white/95" />
      </div>
    </div>
  )
}

/** Sky + sun + clouds + hills; the field starts lower on an upright phone to clear the HUD. */
export function Meadow() {
  return (
    <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-100 to-lime-100" aria-hidden>
      <div className="absolute right-[7%] top-[9%] h-[22vmin] w-[22vmin] rounded-full bg-yellow-300/80 shadow-[0_0_60px_25px_rgba(253,224,71,.45)] portrait:top-[13%]" />
      <Cloud className="left-[12%] top-[14%] portrait:top-[20%]" />
      <Cloud className="left-[54%] top-[8%] scale-75 portrait:left-[40%] portrait:top-[24%]" delay="-6s" />
      {/* back hill, front field, bushes on the edges */}
      <div className="absolute -inset-x-[15%] bottom-0 top-[29%] rounded-t-[50%] bg-green-400 portrait:top-[32%]" />
      <div className="absolute -inset-x-[5%] bottom-0 top-[33%] rounded-t-[35%] bg-green-500 portrait:top-[36%]" />
      <div className="absolute -left-[4%] top-[37%] h-[12vmin] w-[22vmin] rounded-[50%] bg-green-700/45 portrait:top-[39%]" />
      <div className="absolute -right-[4%] top-[38%] h-[13vmin] w-[24vmin] rounded-[50%] bg-green-700/45 portrait:top-[40%]" />
    </div>
  )
}

/**
 * One hole. The critter (children) rises out of the hole's middle; everything below that line is
 * clipped, so it reads as climbing out of the ground.
 */
export function MoleHole({ children }: { children?: ReactNode }) {
  return (
    <div className="relative h-full w-full">
      {/* back of the hole */}
      <div className="absolute bottom-[6%] left-1/2 h-[22%] w-[82%] max-w-[260px] -translate-x-1/2 rounded-[50%] bg-[#4A2A12] shadow-[inset_0_8px_14px_rgba(0,0,0,.45)]" />
      {/* the critter window, clipped at the hole's middle; it reaches above the cell so a critter can
          stand taller than its row (it then overlaps the hole behind it, which reads as depth) */}
      <div className="absolute inset-x-0 bottom-[17%] -top-[28%] flex items-end justify-center overflow-hidden" style={{ overflow: 'clip' }}>
        {children}
      </div>
      {/* front lip */}
      <div className="absolute bottom-[2%] left-1/2 h-[13%] w-[88%] max-w-[280px] -translate-x-1/2 rounded-[50%] bg-[#7A4A24] shadow-md" />
    </div>
  )
}
