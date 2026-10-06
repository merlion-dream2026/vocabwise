// A topic sticker: the topic's emoji on a white, slightly tilted tile with a white outline.
// `locked` shows the not-yet-earned silhouette used in the album.
const SIZES = {
  sm: 'h-12 w-12 text-2xl rounded-xl',
  md: 'h-16 w-16 text-4xl rounded-2xl',
  lg: 'h-28 w-28 text-6xl rounded-3xl',
} as const

export default function Sticker({
  emoji, size = 'md', tilt = -6, locked = false, className = '',
}: { emoji: string; size?: keyof typeof SIZES; tilt?: number; locked?: boolean; className?: string }) {
  return (
    <span
      className={`inline-flex flex-shrink-0 items-center justify-center bg-white ring-4 ring-white shadow-md ${SIZES[size]} ${locked ? 'opacity-40 grayscale' : ''} ${className}`}
      style={{ transform: `rotate(${tilt}deg)` }}
      aria-hidden
    >
      {locked ? '❔' : emoji}
    </span>
  )
}
