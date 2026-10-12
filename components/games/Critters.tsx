// The two critters of 🔨 Đập chuột chũi, drawn inline (no image requests): a round orange hamster
// and a mole in a miner's helmet. Moods: up (peeking), dizzy (whacked right), tease (whacked wrong —
// tongue out, one eye shut), dance (win scene).

export type CritterKind = 'hamster' | 'mole'
export type CritterMood = 'up' | 'dizzy' | 'tease' | 'dance'

const PALETTE = {
  hamster: { fur: '#F5A65B', shade: '#E08A3C', belly: '#FFF1DC', ear: '#F9C4C4' },
  mole:    { fur: '#8C6A58', shade: '#6F5244', belly: '#B99583', ear: '#C9A08C' },
}

function Eyes({ mood }: { mood: CritterMood }) {
  if (mood === 'dizzy') {
    // ✕ ✕ eyes
    return (
      <g stroke="#3B2A22" strokeWidth="3.5" strokeLinecap="round">
        <path d="M33 47 l9 9 M42 47 l-9 9" /><path d="M58 47 l9 9 M67 47 l-9 9" />
      </g>
    )
  }
  if (mood === 'tease' || mood === 'dance') {
    // left eye shut in a happy arc
    return (
      <g>
        <path d="M32 53 q6 -7 12 0" fill="none" stroke="#3B2A22" strokeWidth="3.5" strokeLinecap="round" />
        {mood === 'dance'
          ? <path d="M56 53 q6 -7 12 0" fill="none" stroke="#3B2A22" strokeWidth="3.5" strokeLinecap="round" />
          : <><circle cx="62" cy="51" r="5.5" fill="#2B1D17" /><circle cx="64" cy="49" r="1.8" fill="#fff" /></>}
      </g>
    )
  }
  return (
    <g>
      <circle cx="38" cy="51" r="5.5" fill="#2B1D17" /><circle cx="40" cy="49" r="1.8" fill="#fff" />
      <circle cx="62" cy="51" r="5.5" fill="#2B1D17" /><circle cx="64" cy="49" r="1.8" fill="#fff" />
    </g>
  )
}

function Mouth({ mood }: { mood: CritterMood }) {
  if (mood === 'tease') {
    return (
      <g>
        <path d="M43 67 q7 6 14 0" fill="#7A2E2E" stroke="#3B2A22" strokeWidth="2" />
        <path d="M47 69 q3 9 7 0" fill="#F47C8C" stroke="#C94F62" strokeWidth="1.5" />
      </g>
    )
  }
  if (mood === 'dizzy') return <ellipse cx="50" cy="69" rx="4" ry="5" fill="#7A2E2E" />
  return <path d="M44 67 q3 4 6 0 q3 4 6 0" fill="none" stroke="#3B2A22" strokeWidth="2.2" strokeLinecap="round" />
}

export function Critter({ kind, mood, className = '' }: { kind: CritterKind; mood: CritterMood; className?: string }) {
  const c = PALETTE[kind]
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      {/* ears */}
      <circle cx="24" cy="34" r="11" fill={c.shade} /><circle cx="24" cy="34" r="5.5" fill={c.ear} />
      <circle cx="76" cy="34" r="11" fill={c.shade} /><circle cx="76" cy="34" r="5.5" fill={c.ear} />
      {/* body + belly */}
      <ellipse cx="50" cy="66" rx="36" ry="38" fill={c.fur} />
      <ellipse cx="50" cy="80" rx="22" ry="20" fill={c.belly} />
      {kind === 'mole' ? (
        <>
          {/* miner helmet with lamp */}
          <path d="M17 42 Q50 0 83 42 Z" fill="#FACC15" stroke="#CA8A04" strokeWidth="2" />
          <rect x="12" y="39" width="76" height="7" rx="3.5" fill="#EAB308" stroke="#CA8A04" strokeWidth="1.5" />
          <circle cx="50" cy="24" r="7.5" fill="#FEF9C3" stroke="#CA8A04" strokeWidth="2" />
          <circle cx="50" cy="24" r="3.5" fill="#FDE047" />
          {/* pink snout + nose */}
          <ellipse cx="50" cy="63" rx="11" ry="7.5" fill="#F4A3A8" />
          <ellipse cx="50" cy="59.5" rx="4.5" ry="3" fill="#5B2B2B" />
        </>
      ) : (
        <>
          {/* chubby cheeks + tiny nose */}
          <ellipse cx="27" cy="64" rx="8" ry="5.5" fill="#F7A3A3" opacity="0.75" />
          <ellipse cx="73" cy="64" rx="8" ry="5.5" fill="#F7A3A3" opacity="0.75" />
          <ellipse cx="50" cy="60" rx="3.5" ry="2.6" fill="#E46F7E" />
          {/* forehead stripe */}
          <path d="M44 22 q6 -5 12 0 l-2 12 q-4 2 -8 0 Z" fill={c.shade} opacity="0.6" />
        </>
      )}
      <Eyes mood={mood} />
      <Mouth mood={mood} />
      {/* little paws at the hole's edge */}
      <ellipse cx="33" cy="94" rx="8" ry="5" fill={kind === 'mole' ? '#F4A3A8' : '#FFE2C4'} />
      <ellipse cx="67" cy="94" rx="8" ry="5" fill={kind === 'mole' ? '#F4A3A8' : '#FFE2C4'} />
    </svg>
  )
}
