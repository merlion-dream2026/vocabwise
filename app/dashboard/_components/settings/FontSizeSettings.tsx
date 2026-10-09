'use client'

import { useState, useEffect } from 'react'

const FONT_OPTIONS = [
  { value: '', label: 'Mặc định', size: 'A' },
  { value: 'large', label: 'Lớn hơn', size: 'A+' },
  { value: 'xl', label: 'Rất lớn', size: 'A++' },
]

export function FontSizeSettings() {
  const [current, setCurrent] = useState('')
  useEffect(() => { setCurrent(localStorage.getItem('vw_fontsize') ?? '') }, [])
  function apply(v: string) {
    localStorage.setItem('vw_fontsize', v)
    document.documentElement.classList.remove('vw-large', 'vw-xl')
    if (v === 'large') document.documentElement.classList.add('vw-large')
    else if (v === 'xl') document.documentElement.classList.add('vw-xl')
    setCurrent(v)
  }
  return (
    <div className="flex gap-3">
      {FONT_OPTIONS.map(opt => (
        <button key={opt.value} onClick={() => apply(opt.value)}
          className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl border-2 transition-all ${
            current === opt.value
              ? 'border-purple-500 bg-purple-50 text-purple-700'
              : 'border-gray-200 text-gray-500 hover:border-gray-300'
          }`}>
          <span className="font-bold" style={{ fontSize: opt.value === '' ? 16 : opt.value === 'large' ? 20 : 24 }}>{opt.size}</span>
          <span className="text-xs font-semibold">{opt.label}</span>
        </button>
      ))}
    </div>
  )
}
