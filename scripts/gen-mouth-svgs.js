#!/usr/bin/env node
/**
 * Generate SVG mouth/tongue cross-section diagrams for 15 difficult phonemes.
 * Output: public/phonics/mouth/[id].svg
 *
 * Coordinate system (200×150 viewBox):
 *   Lips gap: x≈18, y=60-80
 *   Upper teeth: x=30-58, y=22-36
 *   Alveolar ridge peak: x≈82, y=19
 *   Hard palate ceiling: arcs from x=82 to x=155 at y≈12-20
 *   Velum: x=155-172, y=20-52
 *   Back pharynx: x=175, y=52-108
 *   Lower teeth: x=30-58, y=104-118
 *   Jaw floor: y≈120, x=30-175
 */

const fs   = require('fs')
const path = require('path')

const OUT = path.join(__dirname, '..', 'public', 'phonics', 'mouth')
fs.mkdirSync(OUT, { recursive: true })

// ── Shared palate + jaw outline ──────────────────────────────────────────────

const PALATE = `
  <!-- Oral cavity walls -->
  <!-- Upper: lip → teeth → alveolar → hard palate → velum → pharynx -->
  <path d="M 18,60 Q 18,18 35,18 L 58,18 Q 82,15 105,12 Q 140,10 155,18 Q 168,28 172,52 L 175,52 L 175,108 Q 168,112 155,114 L 30,114 Q 18,114 18,80 Z"
        fill="#fce8e0" stroke="#e8b8a8" stroke-width="1.5"/>
  <!-- Hard palate roof line -->
  <path d="M 35,18 L 58,18 Q 82,15 105,12 Q 140,10 155,18 Q 168,28 172,52"
        fill="none" stroke="#d4897a" stroke-width="2"/>
  <!-- Velum marker (soft palate dropdown) -->
  <path d="M 162,38 Q 168,50 165,62" fill="none" stroke="#c4796a" stroke-width="1.5" stroke-dasharray="3,2"/>
  <!-- Jaw floor -->
  <path d="M 18,80 Q 18,114 35,114 L 155,114 Q 168,112 172,108"
        fill="none" stroke="#d4897a" stroke-width="2"/>
  <!-- Upper lip bulge -->
  <ellipse cx="16" cy="56" rx="5" ry="8" fill="#d4786a"/>
  <!-- Lower lip bulge -->
  <ellipse cx="16" cy="76" rx="5" ry="8" fill="#d4786a"/>
  <!-- Lip gap line -->
  <line x1="12" y1="66" x2="22" y2="66" stroke="#a04040" stroke-width="1.5"/>
  <!-- Upper teeth (2 visible) -->
  <rect x="32" y="20" width="10" height="14" rx="1.5" fill="#f8f5e8" stroke="#ddd" stroke-width="1"/>
  <rect x="45" y="20" width="10" height="14" rx="1.5" fill="#f8f5e8" stroke="#ddd" stroke-width="1"/>
  <!-- Lower teeth (2 visible) -->
  <rect x="32" y="102" width="10" height="14" rx="1.5" fill="#f8f5e8" stroke="#ddd" stroke-width="1"/>
  <rect x="45" y="102" width="10" height="14" rx="1.5" fill="#f8f5e8" stroke="#ddd" stroke-width="1"/>
  <!-- Alveolar ridge bump -->
  <path d="M 58,18 Q 75,13 82,19 Q 88,24 90,20" fill="none" stroke="#d4897a" stroke-width="2"/>
`

// ── Legend strip at bottom ────────────────────────────────────────────────────

function wrap(id, label, description, tonguePathEl, extrasEl = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160" width="200" height="160">
  <rect width="200" height="160" fill="#fafafa" rx="10"/>
  ${PALATE}
  ${extrasEl}
  ${tonguePathEl}
  <!-- Label -->
  <rect x="0" y="130" width="200" height="30" fill="white" rx="0"/>
  <rect x="0" y="130" width="200" height="1" fill="#eee"/>
  <text x="100" y="143" text-anchor="middle" font-family="monospace,sans-serif" font-size="11" font-weight="bold" fill="#2563eb">${label}</text>
  <text x="100" y="155" text-anchor="middle" font-family="sans-serif" font-size="9" fill="#777">${description}</text>
</svg>`
}

function tongue(d, color = '#e57373', border = '#c62828') {
  return `<path d="${d}" fill="${color}" stroke="${border}" stroke-width="1.5" stroke-linejoin="round"/>`
}

function dot(x, y, r = 5, color = '#2563eb') {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="0.7"/>`
}

function arrow(x1, y1, x2, y2, color = '#2563eb') {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5" marker-end="url(#arr)"/>`
}

const ARROW_DEF = `<defs><marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
  <path d="M0,0 L6,3 L0,6 Z" fill="#2563eb"/></marker></defs>`

// ── 15 Sounds ────────────────────────────────────────────────────────────────

const diagrams = [

  // 1. θ/ð — tongue tip between teeth (dental)
  {
    id: 'theta',
    label: '/θ/ /ð/',
    desc: 'Đầu lưỡi chạm mặt sau răng trên',
    svg: wrap('theta', '/θ/ /ð/', 'Đầu lưỡi chạm răng trên',
      tongue('M 170,105 Q 145,90 110,80 Q 80,72 55,66 Q 40,63 28,60 L 28,66 Q 42,68 58,72 Q 85,78 110,88 Q 145,98 170,112 Z'),
      `${dot(30, 63, 4, '#2563eb')}
       <text x="42" y="50" font-family="sans-serif" font-size="9" fill="#2563eb">đầu lưỡi</text>
       <line x1="40" y1="52" x2="32" y2="62" stroke="#2563eb" stroke-width="1" stroke-dasharray="2,2"/>`)
  },

  // 2. ɜː — mid-central, tongue neutral mid-height
  {
    id: 'er',
    label: '/ɜː/',
    desc: 'Lưỡi giữa, cao vừa, môi tròn nhẹ',
    svg: wrap('er', '/ɜː/', 'Lưỡi giữa, môi không tròn',
      tongue('M 170,105 Q 148,88 120,76 Q 95,68 75,72 Q 62,76 62,85 Q 62,95 75,98 Q 100,104 135,108 Q 155,110 170,112 Z'),
      `${dot(105, 72, 5, '#2563eb')}
       <text x="108" y="65" font-family="sans-serif" font-size="9" fill="#2563eb">giữa khoang miệng</text>`)
  },

  // 3. æ — low front, mouth open
  {
    id: 'ash',
    label: '/æ/',
    desc: 'Miệng mở rộng, lưỡi thấp và ra trước',
    svg: wrap('ash', '/æ/', 'Miệng mở, lưỡi thấp & trước',
      tongue('M 170,108 Q 148,100 115,96 Q 85,94 65,98 Q 52,102 52,108 Q 52,114 65,114 Q 100,114 145,114 Q 160,114 170,114 Z'),
      `${dot(85, 96, 5, '#2563eb')}
       <text x="88" y="90" font-family="sans-serif" font-size="9" fill="#2563eb">thấp, ra trước</text>
       <!-- open mouth indicator -->
       <line x1="12" y1="60" x2="12" y2="80" stroke="#d4786a" stroke-width="3" stroke-linecap="round"/>`)
  },

  // 4. ŋ — velar nasal, back tongue raised to velum
  {
    id: 'eng',
    label: '/ŋ/',
    desc: 'Gốc lưỡi nâng lên chạm vòm mềm',
    svg: wrap('eng', '/ŋ/', 'Gốc lưỡi chạm vòm mềm',
      tongue('M 65,114 Q 90,112 118,104 Q 145,88 158,65 Q 162,52 158,42 Q 152,36 148,42 Q 142,60 128,80 Q 108,98 80,108 Q 68,112 65,114 Z'),
      `${dot(153, 42, 5, '#2563eb')}
       <text x="120" y="38" font-family="sans-serif" font-size="9" fill="#2563eb">gốc lưỡi</text>
       <line x1="125" y1="40" x2="150" y2="40" stroke="#2563eb" stroke-width="1" stroke-dasharray="2,2"/>`)
  },

  // 5. l — alveolar lateral, tip on ridge, sides down
  {
    id: 'ell',
    label: '/l/',
    desc: 'Đầu lưỡi chạm chân răng, hai bên hở',
    svg: wrap('ell', '/l/', 'Đầu lưỡi chạm ridge, hơi qua hai bên',
      tongue('M 170,108 Q 148,98 120,90 Q 95,84 82,80 Q 76,78 76,78 Q 74,76 78,74 Q 82,72 82,72 Q 95,78 120,86 Q 148,94 170,104 Z'),
      `${dot(80, 22, 5, '#2563eb')}
       <text x="86" y="16" font-family="sans-serif" font-size="9" fill="#2563eb">tip → ridge</text>
       <!-- lateral airflow arrows -->
       <text x="55" y="68" font-family="sans-serif" font-size="8" fill="#22c55e">↓air↓</text>`)
  },

  // 6. r — tongue tip slightly raised, central bunched
  {
    id: 'arr',
    label: '/r/',
    desc: 'Đầu lưỡi cong lên, không chạm vòm',
    svg: wrap('arr', '/r/', 'Đầu lưỡi cong nhẹ, không chạm',
      tongue('M 170,108 Q 148,95 118,85 Q 92,78 80,80 Q 74,83 76,88 Q 78,94 92,96 Q 118,100 148,106 Q 162,108 170,110 Z'),
      `<path d="M 80,80 Q 78,72 82,68" fill="none" stroke="#2563eb" stroke-width="2" stroke-dasharray="3,2"/>
       ${dot(82, 68, 4, '#2563eb')}
       <text x="88" y="64" font-family="sans-serif" font-size="9" fill="#2563eb">cong, không chạm</text>`)
  },

  // 7. v/f — labiodental, lower lip to upper teeth
  {
    id: 'vee',
    label: '/v/ /f/',
    desc: 'Môi dưới chạm nhẹ răng trên',
    svg: wrap('vee', '/v/ /f/', 'Môi dưới chạm răng cửa trên',
      tongue('M 170,108 Q 148,95 115,84 Q 88,76 70,80 Q 60,84 62,92 Q 64,100 78,104 Q 108,110 145,112 Q 160,112 170,112 Z'),
      `${dot(38, 72, 5, '#2563eb')}
       <text x="48" y="88" font-family="sans-serif" font-size="9" fill="#2563eb">môi dưới</text>
       <line x1="50" y1="86" x2="40" y2="76" stroke="#2563eb" stroke-width="1" stroke-dasharray="2,2"/>
       <!-- lower lip emphasis -->
       <ellipse cx="16" cy="76" rx="7" ry="9" fill="none" stroke="#2563eb" stroke-width="2"/>`)
  },

  // 8. w — rounded lips, tongue back high
  {
    id: 'double-u',
    label: '/w/',
    desc: 'Môi tròn chặt, gốc lưỡi nâng',
    svg: wrap('double-u', '/w/', 'Môi tròn, lưỡi sau nâng lên',
      tongue('M 68,114 Q 92,110 120,100 Q 148,86 160,68 Q 164,56 160,48 Q 155,42 150,48 Q 146,62 130,80 Q 108,96 78,108 Q 70,112 68,114 Z'),
      `<!-- Round lips indicator -->
       <ellipse cx="16" cy="66" rx="7" ry="10" fill="none" stroke="#2563eb" stroke-width="2.5"/>
       <text x="28" y="62" font-family="sans-serif" font-size="9" fill="#2563eb">tròn môi</text>
       ${dot(152, 50, 4, '#22c55e')}
       <text x="118" y="44" font-family="sans-serif" font-size="9" fill="#22c55e">lưỡi sau</text>`)
  },

  // 9. ʃ — post-alveolar, tongue slightly retracted
  {
    id: 'esh',
    label: '/ʃ/',
    desc: 'Lưỡi gần ridge nhưng hơi lui sau',
    svg: wrap('esh', '/ʃ/', 'Lưỡi gần ridge, hơi lui sau',
      tongue('M 170,108 Q 148,92 115,80 Q 90,72 80,74 Q 72,76 74,84 Q 76,92 90,96 Q 115,104 148,108 Q 162,110 170,112 Z'),
      `${dot(88, 26, 5, '#2563eb')}
       <text x="95" y="22" font-family="sans-serif" font-size="9" fill="#2563eb">sau ridge</text>
       <!-- lip slightly rounded indicator -->
       <ellipse cx="16" cy="66" rx="5" ry="7" fill="none" stroke="#2563eb" stroke-width="1.5"/>`)
  },

  // 10. ʒ — voiced post-alveolar
  {
    id: 'ezh',
    label: '/ʒ/',
    desc: 'Như /ʃ/ nhưng có rung thanh đới',
    svg: wrap('ezh', '/ʒ/', 'Như /ʃ/, thêm rung thanh đới',
      tongue('M 170,108 Q 148,92 115,80 Q 90,72 80,74 Q 72,76 74,84 Q 76,92 90,96 Q 115,104 148,108 Q 162,110 170,112 Z'),
      `${dot(88, 26, 5, '#2563eb')}
       <text x="95" y="22" font-family="sans-serif" font-size="9" fill="#2563eb">sau ridge (voiced)</text>
       <!-- vocal fold vibration symbol -->
       <text x="155" y="128" font-family="sans-serif" font-size="10" fill="#7c3aed">〜vocal〜</text>`)
  },

  // 11. tʃ — affricate, starts at alveolar
  {
    id: 'tesh',
    label: '/tʃ/',
    desc: 'Đầu lưỡi chạm ridge, bật ra thành /ʃ/',
    svg: wrap('tesh', '/tʃ/', 'Tip → ridge, bật ra như /ʃ/',
      tongue('M 170,108 Q 148,92 112,80 Q 88,72 80,72 Q 74,72 76,78 Q 78,86 92,92 Q 118,102 148,108 Q 162,110 170,112 Z'),
      `${dot(80, 22, 5, '#2563eb')}
       <text x="86" y="16" font-family="sans-serif" font-size="9" fill="#2563eb">tip → ridge</text>
       <path d="M 80,24 Q 88,30 88,28" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="2,2"/>
       <text x="90" y="32" font-family="sans-serif" font-size="8" fill="#f59e0b">→ /ʃ/</text>`)
  },

  // 12. dʒ — voiced affricate
  {
    id: 'dezh',
    label: '/dʒ/',
    desc: 'Như /tʃ/ nhưng có rung thanh đới',
    svg: wrap('dezh', '/dʒ/', 'Như /tʃ/, thêm rung thanh đới',
      tongue('M 170,108 Q 148,92 112,80 Q 88,72 80,72 Q 74,72 76,78 Q 78,86 92,92 Q 118,102 148,108 Q 162,110 170,112 Z'),
      `${dot(80, 22, 5, '#2563eb')}
       <text x="86" y="16" font-family="sans-serif" font-size="9" fill="#2563eb">tip → ridge (voiced)</text>
       <text x="148" y="128" font-family="sans-serif" font-size="10" fill="#7c3aed">〜voiced〜</text>`)
  },

  // 13. ɪ — high front lax
  {
    id: 'iota',
    label: '/ɪ/',
    desc: 'Lưỡi cao & trước, nhưng thả lỏng',
    svg: wrap('iota', '/ɪ/', 'Lưỡi gần /iː/ nhưng thả lỏng hơn',
      tongue('M 170,108 Q 148,95 118,82 Q 92,72 80,70 Q 72,70 72,76 Q 72,84 82,88 Q 105,96 138,104 Q 156,108 170,110 Z'),
      `${dot(92, 70, 5, '#2563eb')}
       <text x="98" y="64" font-family="sans-serif" font-size="9" fill="#2563eb">cao & trước, lỏng</text>
       <!-- relaxed indicator -->
       <text x="62" y="90" font-family="sans-serif" font-size="9" fill="#6b7280">thả lỏng</text>`)
  },

  // 14. ə — schwa, tongue mid-central completely neutral
  {
    id: 'schwa',
    label: '/ə/',
    desc: 'Lưỡi giữa khoang miệng, hoàn toàn thả lỏng',
    svg: wrap('schwa', '/ə/', 'Lưỡi ở giữa, không cần cố gắng',
      tongue('M 170,106 Q 148,90 118,80 Q 92,74 78,78 Q 68,82 70,90 Q 72,98 88,102 Q 115,108 148,110 Q 162,110 170,112 Z'),
      `${dot(105, 78, 5, '#2563eb')}
       <text x="108" y="72" font-family="sans-serif" font-size="9" fill="#2563eb">giữa, trung lập</text>
       <text x="60" y="72" font-family="sans-serif" font-size="8" fill="#6b7280">😌 neutral</text>`)
  },

  // 15. eɪ — diphthong, starts mid-front glides up
  {
    id: 'ei',
    label: '/eɪ/',
    desc: 'Bắt đầu /e/ rồi lưỡi trượt lên /ɪ/',
    svg: wrap('ei', '/eɪ/', 'Trượt từ /e/ lên /ɪ/ (glide)',
      tongue('M 170,108 Q 148,96 116,84 Q 90,76 76,76 Q 68,76 70,82 Q 72,90 86,94 Q 112,102 145,108 Q 160,110 170,112 Z'),
      `${dot(90, 76, 4, '#f59e0b')}
       ${dot(80, 70, 4, '#2563eb')}
       <path d="M 90,76 Q 85,73 80,70" fill="none" stroke="#2563eb" stroke-width="1.5" marker-end="url(#arr)"/>
       <text x="60" y="66" font-family="sans-serif" font-size="8" fill="#f59e0b">/e/ bắt đầu</text>
       <text x="60" y="76" font-family="sans-serif" font-size="8" fill="#2563eb">/ɪ/ kết thúc ↑</text>
       ${ARROW_DEF}`)
  },
]

// ── Write files ───────────────────────────────────────────────────────────────

let count = 0
for (const d of diagrams) {
  const filePath = path.join(OUT, `${d.id}.svg`)
  fs.writeFileSync(filePath, d.svg, 'utf8')
  count++
}

console.log(`✅ Generated ${count} SVG mouth diagrams → public/phonics/mouth/`)
diagrams.forEach(d => console.log(`   ${d.id}.svg  —  ${d.label}`))
