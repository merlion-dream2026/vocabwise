'use client'

import { useState } from 'react'

export function PwInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border-2 border-gray-200 rounded-2xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-purple-400 pr-11" />
      <button type="button" onClick={() => setShow(s => !s)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  )
}

// ── Collapsible card wrapper ──────────────────────────────────────────────────
export function CollapsibleCard({ title, subtitle, defaultOpen = true, warn = false, children }: {
  title: string; subtitle?: string; defaultOpen?: boolean; warn?: boolean; children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`bg-white rounded-3xl border-2 shadow-sm overflow-hidden ${warn ? 'border-orange-200' : 'border-gray-100'}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
        <div className="text-left">
          <h2 className="font-black text-gray-800 text-base">{title}</h2>
          {subtitle && !open && <p className="text-xs text-gray-400 font-semibold mt-0.5">{subtitle}</p>}
        </div>
        <span className={`text-gray-400 font-black text-sm flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && <div className="border-t border-gray-100 px-5 pb-5 pt-4">{children}</div>}
    </div>
  )
}
