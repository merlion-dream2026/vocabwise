// VocabWise logo: two book pages forming a "V" (Vocab) + a spark ("Wise").
// Plain SVG, no hooks — also rendered by next/og (app/icon.tsx, apple-icon, opengraph-image).

const GRAD_ID = 'vw-logo-grad'

type MarkProps = {
  size: number
  /** Gradient rounded-square background. false = mark only (on an existing gradient). */
  tile?: boolean
  /** Corner radius of the tile in viewBox units (0–50). iOS masks its own corners → 0. */
  radius?: number
}

export function LogoMark({ size, tile = true, radius = 22 }: MarkProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      {/* no fragments: next/og only accepts intrinsic elements inside <svg> */}
      {tile && (
        <defs>
          <linearGradient id={GRAD_ID} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#9333ea" />
            <stop offset="1" stopColor="#db2777" />
          </linearGradient>
        </defs>
      )}
      {tile && <rect width="100" height="100" rx={radius} fill={`url(#${GRAD_ID})`} />}
      <path d="M27 28 L50 74" stroke="#ffffff" strokeWidth="17" strokeLinecap="round" />
      <path d="M73 28 L50 74" stroke="#fbbf24" strokeWidth="17" strokeLinecap="round" />
      <path
        d="M50 16 C51.2 23 53 24.8 60 26 C53 27.2 51.2 29 50 36 C48.8 29 47 27.2 40 26 C47 24.8 48.8 23 50 16Z"
        fill="#ffffff"
      />
    </svg>
  )
}

/** Mark + "VocabWise" wordmark. `onDark` = white "Vocab" for gradient/dark headers. */
export function BrandLogo({ size = 32, onDark = false, className = '' }: { size?: number; onDark?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-black tracking-tight ${className}`}>
      <LogoMark size={size} tile={!onDark} />
      <span className={onDark ? 'text-white' : 'text-gray-800'}>
        Vocab
        <span className={onDark ? 'text-white' : 'bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'}>Wise</span>
      </span>
    </span>
  )
}
