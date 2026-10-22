'use client'

import { useState } from 'react'

export type SpellTheme = 'candy' | 'sun' | 'purple'

export const SPELL_THEMES: { id: SpellTheme; label: string; swatch: string }[] = [
  { id: 'candy',  label: 'Kẹo pastel', swatch: 'bg-gradient-to-br from-[#ffd6e0] via-[#d4f1ff] to-[#d9f7d9]' },
  { id: 'sun',    label: 'Vàng nắng',  swatch: 'bg-[#ffe08a]' },
  { id: 'purple', label: 'Tím',        swatch: 'bg-white ring-2 ring-inset ring-[#4c1d95]' },
]

// Candy gives each tile its own pastel (cycled by tray position) so kids can tell tiles apart mid-drag.
const CANDY = [
  'bg-[#ffd6e0] text-[#9d174d] border-[#e88aa5]',
  'bg-[#d4f1ff] text-[#075985] border-[#7cc4e8]',
  'bg-[#fff1b8] text-[#854d0e] border-[#e3c35a]',
  'bg-[#d9f7d9] text-[#166534] border-[#7fcf8a]',
  'bg-[#e9ddff] text-[#5b21b6] border-[#a98be8]',
]

export function tileCls(theme: SpellTheme, i: number) {
  if (theme === 'candy') return CANDY[i % CANDY.length]
  if (theme === 'sun') return 'bg-[#ffe08a] text-[#7c2d12] border-[#c2410c]'
  return 'bg-white text-[#4c1d95] border-[#4c1d95]'
}

export function trayCls(theme: SpellTheme) {
  if (theme === 'candy') return 'bg-gradient-to-b from-[#f3efff] to-[#fbf9ff] border-[#c4b5fd]'
  if (theme === 'sun') return 'bg-gradient-to-b from-[#fff7ed] to-[#fffbf5] border-[#fdba74]'
  return 'bg-gradient-to-b from-[#ede9fe] to-[#f5f3ff] border-[#a78bfa]'
}

const KEY = 'vw_spell_theme'

export function useSpellTheme(): [SpellTheme, (t: SpellTheme) => void] {
  const [theme, setTheme] = useState<SpellTheme>(() => {
    try {
      const saved = localStorage.getItem(KEY)
      if (SPELL_THEMES.some((t) => t.id === saved)) return saved as SpellTheme
    } catch {}
    return 'candy'
  })
  const choose = (t: SpellTheme) => {
    setTheme(t)
    try { localStorage.setItem(KEY, t) } catch {}
  }
  return [theme, choose]
}
