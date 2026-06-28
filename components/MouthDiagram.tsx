'use client'

import type { ReactNode } from 'react'

// ── Inline SVG articulation diagrams — no external file loading ───────────────

type Dot = { x: number; y: number; lbl: string; c: string }

// Vowel chart — IPA trapezoid, viewBox 0 0 160 124
// Corners: TL(22,14) TR(138,14) BL(42,100) BR(118,100)
function VTrap({ dots, title, lines }: {
  dots: Dot[]
  title: string
  lines?: { x1: number; y1: number; x2: number; y2: number }[]
}) {
  return (
    <svg viewBox="0 0 160 124" xmlns="http://www.w3.org/2000/svg">
      <rect width="160" height="124" fill="#eff6ff" rx="10"/>
      {/* Grid */}
      <line x1="25" y1="40" x2="135" y2="40" stroke="#dbeafe" strokeWidth="0.8" strokeDasharray="3,2"/>
      <line x1="29" y1="66" x2="131" y2="66" stroke="#dbeafe" strokeWidth="0.8" strokeDasharray="3,2"/>
      {/* Trapezoid */}
      <polygon points="22,14 138,14 118,100 42,100" fill="none" stroke="#93c5fd" strokeWidth="1.5"/>
      {/* Axis labels */}
      <text x="6" y="17" fontSize="8" fill="#60a5fa">Front</text>
      <text x="114" y="17" fontSize="8" fill="#60a5fa">Back</text>
      <text x="80" y="11" textAnchor="middle" fontSize="7" fill="#bfdbfe">HIGH</text>
      <text x="80" y="113" textAnchor="middle" fontSize="7" fill="#bfdbfe">LOW</text>
      {/* Movement lines for diphthongs */}
      {lines?.map((l, i) => (
        <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke="#94a3b8" strokeWidth="2" strokeDasharray="4,3" opacity="0.7"/>
      ))}
      {/* Vowel dots */}
      {dots.map((d, i) => (
        <g key={i}>
          <circle cx={d.x} cy={d.y} r="11" fill={d.c} opacity="0.9"/>
          <text x={d.x} y={d.y + 4} textAnchor="middle" fontSize="9" fill="white"
            fontWeight="bold" fontFamily="monospace">{d.lbl}</text>
        </g>
      ))}
      <text x="80" y="122" textAnchor="middle" fontSize="9" fill="#475569" fontWeight="600">{title}</text>
    </svg>
  )
}

// Shared mouth outline elements (used inside SVGWrap)
function MouthBase() {
  return (
    <>
      {/* Upper palate */}
      <path d="M 10,44 Q 10,20 28,18 Q 55,14 90,13 Q 120,13 137,23 Q 150,33 151,52"
            fill="#fce8e0" stroke="#e0a090" strokeWidth="1.5"/>
      {/* Lower jaw floor */}
      <path d="M 10,76 Q 10,102 28,105 L 146,105 Q 152,102 152,94"
            fill="none" stroke="#e0a090" strokeWidth="1.5"/>
      {/* Upper lip */}
      <ellipse cx="8" cy="48" rx="5" ry="9" fill="#d4786a"/>
      {/* Lower lip */}
      <ellipse cx="8" cy="70" rx="5" ry="9" fill="#d4786a"/>
      {/* Lip gap */}
      <line x1="4" y1="59" x2="14" y2="59" stroke="#a04040" strokeWidth="1.5"/>
      {/* Upper teeth */}
      <rect x="22" y="18" width="7" height="11" rx="1" fill="#f8f5e8" stroke="#ccc" strokeWidth="0.8"/>
      <rect x="30" y="18" width="7" height="11" rx="1" fill="#f8f5e8" stroke="#ccc" strokeWidth="0.8"/>
      {/* Lower teeth */}
      <rect x="22" y="93" width="7" height="11" rx="1" fill="#f8f5e8" stroke="#ccc" strokeWidth="0.8"/>
      <rect x="30" y="93" width="7" height="11" rx="1" fill="#f8f5e8" stroke="#ccc" strokeWidth="0.8"/>
    </>
  )
}

function SVGWrap({ children, title, bg = '#fff8f5' }: {
  children: ReactNode; title: string; bg?: string
}) {
  return (
    <svg viewBox="0 0 160 124" xmlns="http://www.w3.org/2000/svg">
      <rect width="160" height="124" fill={bg} rx="10"/>
      {children}
      <text x="80" y="122" textAnchor="middle" fontSize="9" fill="#475569" fontWeight="600">{title}</text>
    </svg>
  )
}

// Labiodental: f/v — lower lip touches upper front teeth
function LabioDental({ title }: { title: string }) {
  return (
    <SVGWrap title={title}>
      <MouthBase/>
      {/* Tongue (neutral) */}
      <path d="M 28,100 Q 60,88 100,85 Q 130,83 150,88 L 150,105 L 28,105 Z"
            fill="#e06050" opacity="0.7"/>
      {/* Lower lip raised toward teeth */}
      <ellipse cx="8" cy="56" rx="6" ry="13" fill="#c06050"/>
      {/* Contact highlight: lower lip at upper teeth */}
      <circle cx="25" cy="26" r="9" fill="#ef4444" opacity="0.85"/>
      <text x="25" y="30" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">lip↑</text>
      {/* Airflow arrow */}
      <path d="M 42,50 L 75,50" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4,2"/>
      <text x="77" y="54" fontSize="10" fill="#3b82f6">→</text>
    </SVGWrap>
  )
}

// Dental: θ/ð — tongue tip at/between teeth
function Dental({ title }: { title: string }) {
  return (
    <SVGWrap title={title}>
      <MouthBase/>
      {/* Tongue body */}
      <path d="M 30,100 Q 50,88 80,82 Q 110,78 148,82 L 148,105 L 30,105 Z"
            fill="#e06050" opacity="0.7"/>
      {/* Tongue tip protruding toward front teeth */}
      <path d="M 26,96 Q 16,78 18,62 Q 20,50 26,50 Q 34,50 36,62 Q 38,76 30,96 Z"
            fill="#d04040" opacity="0.9"/>
      {/* Highlight at teeth contact */}
      <circle cx="28" cy="44" r="9" fill="#f59e0b" opacity="0.9"/>
      <text x="28" y="48" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">tip</text>
      {/* Airflow between tongue and teeth */}
      <path d="M 44,48 L 78,48" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4,2"/>
      <text x="80" y="52" fontSize="10" fill="#3b82f6">→</text>
    </SVGWrap>
  )
}

// Postalveolar: ʃ/ʒ, tʃ/dʒ — tongue near alveolar ridge, lips rounded
function PostAlv({ title }: { title: string }) {
  return (
    <SVGWrap title={title}>
      <MouthBase/>
      {/* Tongue raised high toward alveolar ridge */}
      <path d="M 28,103 Q 42,88 58,72 Q 70,60 82,60 Q 100,60 125,68 Q 140,74 150,84 L 150,105 L 28,105 Z"
            fill="#e06050" opacity="0.8"/>
      {/* Highlight at alveolar ridge */}
      <circle cx="60" cy="20" r="9" fill="#8b5cf6" opacity="0.9"/>
      <text x="60" y="24" textAnchor="middle" fontSize="6" fill="white" fontWeight="bold">ridge</text>
      {/* Rounded lips — draw double ellipse */}
      <ellipse cx="8" cy="56" rx="7" ry="13" fill="#c06050" stroke="#a04040" strokeWidth="1.5"/>
      <ellipse cx="8" cy="56" rx="4" ry="8" fill="none" stroke="#a04040" strokeWidth="1"/>
      <text x="8" y="72" textAnchor="middle" fontSize="7" fill="#7c2d12">○</text>
    </SVGWrap>
  )
}

// Nasal: m/n/ŋ — velum lowered, air through nose
function Nasal({ title }: { title: string }) {
  return (
    <SVGWrap title={title} bg="#f0fdf4">
      <MouthBase/>
      {/* Tongue (varies per sound — show neutral) */}
      <path d="M 28,103 Q 55,92 85,88 Q 115,85 148,89 L 148,105 L 28,105 Z"
            fill="#e06050" opacity="0.7"/>
      {/* Velum open — nasal passage */}
      <path d="M 118,15 Q 118,4 128,3 Q 142,2 148,10" fill="none" stroke="#10b981" strokeWidth="2"/>
      {/* Nasal airflow */}
      <path d="M 118,12 L 118,3" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3,2"/>
      <text x="128" y="8" fontSize="7" fill="#10b981" fontWeight="bold">↑ nose</text>
      {/* Velum label */}
      <circle cx="120" cy="28" r="7" fill="#6ee7b7" opacity="0.85"/>
      <text x="120" y="32" textAnchor="middle" fontSize="6" fill="#065f46" fontWeight="bold">vel</text>
    </SVGWrap>
  )
}

// Lateral/Rhotic: l/r — tongue tip at alveolar ridge
function Lateral({ title }: { title: string }) {
  return (
    <SVGWrap title={title}>
      <MouthBase/>
      {/* Tongue raised, tip at alveolar */}
      <path d="M 28,103 Q 42,90 55,74 Q 65,62 76,60 Q 100,58 130,65 Q 145,70 150,82 L 150,105 L 28,105 Z"
            fill="#e06050" opacity="0.8"/>
      {/* Tongue tip highlight at alveolar */}
      <circle cx="56" cy="22" r="9" fill="#6366f1" opacity="0.9"/>
      <text x="56" y="26" textAnchor="middle" fontSize="6" fill="white" fontWeight="bold">l · r</text>
      {/* Airflow around tongue sides */}
      <path d="M 68,52 L 100,52" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4,2"/>
      <text x="102" y="56" fontSize="10" fill="#3b82f6">→</text>
    </SVGWrap>
  )
}

// Approximant: h/w/j — loose constriction, no contact
function Approx({ title }: { title: string }) {
  return (
    <SVGWrap title={title}>
      <MouthBase/>
      {/* Tongue mid-height, not touching */}
      <path d="M 28,103 Q 48,92 72,82 Q 95,74 118,74 Q 138,74 150,82 L 150,105 L 28,105 Z"
            fill="#e06050" opacity="0.75"/>
      {/* Gap between tongue and palate (no contact) */}
      <path d="M 50,58 Q 75,55 100,56" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3,2"/>
      <text x="75" y="50" textAnchor="middle" fontSize="7" fill="#94a3b8">gap — no touch</text>
      {/* Open airflow */}
      <path d="M 55,45 L 105,45" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4,2"/>
      <text x="107" y="49" fontSize="10" fill="#3b82f6">→</text>
    </SVGWrap>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function MouthDiagram({ lessonId }: { lessonId: string }) {
  switch (lessonId) {
    case 'iː-ɪ':
      return <VTrap title="Lưỡi cao, phía trước miệng" dots={[
        { x: 28, y: 20, lbl: 'iː', c: '#3b82f6' },
        { x: 40, y: 35, lbl: 'ɪ',  c: '#8b5cf6' },
      ]}/>

    case 'e-æ':
      return <VTrap title="Lưỡi giữa & thấp, phía trước" dots={[
        { x: 32, y: 48, lbl: 'e',  c: '#10b981' },
        { x: 44, y: 84, lbl: 'æ',  c: '#f59e0b' },
      ]}/>

    case 'ɜː':
      return <VTrap title="Lưỡi trung tâm, vị trí giữa" dots={[
        { x: 80, y: 52, lbl: 'ɜː', c: '#6366f1' },
      ]}/>

    case 'ə':
      return <VTrap title="Schwa — lưỡi thả lỏng hoàn toàn" dots={[
        { x: 80, y: 58, lbl: 'ə', c: '#64748b' },
      ]}/>

    case 'ɜː-ə':
      return <VTrap title="ɜː dài & căng — ə ngắn & lỏng" dots={[
        { x: 76, y: 50, lbl: 'ɜː', c: '#6366f1' },
        { x: 84, y: 62, lbl: 'ə',  c: '#64748b' },
      ]}/>

    case 'eɪ-aɪ':
      return <VTrap title="Diphthong: trượt âm → /ɪ/" dots={[
        { x: 44, y: 84, lbl: 'a',  c: '#ef4444' },
        { x: 32, y: 48, lbl: 'e',  c: '#3b82f6' },
        { x: 38, y: 26, lbl: 'ɪ',  c: '#8b5cf6' },
      ]} lines={[
        { x1: 44, y1: 84, x2: 38, y2: 26 },
        { x1: 32, y1: 48, x2: 38, y2: 26 },
      ]}/>

    case 'f-v':
    case 'v-w-viet':
      return <LabioDental title="Môi dưới chạm răng trên → /f/ /v/"/>

    case 'θ-ð':
    case 'θ-s-viet':
      return <Dental title="Đầu lưỡi nhô ra chân răng → /θ/ /ð/"/>

    case 'ʃ-ʒ':
    case 'tʃ-dʒ':
      return <PostAlv title="Lưỡi gần ngạc, môi tròn → /ʃ/ /ʒ/"/>

    case 'm-n-ŋ':
      return <Nasal title="Khí qua mũi — velum mở → /m/ /n/ /ŋ/"/>

    case 'l-r':
      return <Lateral title="Đầu lưỡi tại ngạc răng → /l/ /r/"/>

    case 'h-w-j':
      return <Approx title="Không chạm — khí thoát nhẹ → /h/ /w/ /j/"/>

    default:
      return null
  }
}
