'use client'
import { useState } from 'react'
import { getAvatarSrc } from '@/lib/avatars'

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫']

type Props = { childId: string; name: string; emoji: string; color: string; onSuccess: () => void; onClose?: () => void }

export default function PinGate({ childId, name, emoji, color, onSuccess, onClose }: Props) {
  const [pin,     setPin]     = useState('')
  const [shake,   setShake]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(false)

  async function handleKey(k: string) {
    if (loading || shake) return
    if (k === '⌫') { setPin(p => p.slice(0, -1)); setError(false); return }
    if (k === '' || pin.length === 4) return

    const next = pin + k
    setPin(next)

    if (next.length === 4) {
      setLoading(true)
      try {
        const res = await fetch(`/api/children/${childId}/verify-pin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: next }),
        })
        const data = await res.json()
        if (data.ok) {
          sessionStorage.setItem(`pinVerified_${childId}`, '1')
          onSuccess()
        } else {
          setError(true)
          setShake(true)
          setTimeout(() => { setShake(false); setPin(''); setError(false) }, 700)
        }
      } catch {
        // Network error — treat as wrong PIN, let user retry
        setError(true)
        setShake(true)
        setTimeout(() => { setShake(false); setPin(''); setError(false) }, 700)
      } finally {
        setLoading(false)
      }
    }
  }

  const ringColor = color === 'pink' ? 'bg-pink-500' : 'bg-blue-500'
  const btnColor  = color === 'pink'
    ? 'bg-pink-50 text-pink-700 hover:bg-pink-100 active:bg-pink-200'
    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 active:bg-blue-200'

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-xs text-center relative" onClick={e => e.stopPropagation()}>
        {onClose && (
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 text-xl leading-none">×</button>
        )}
        <img src={getAvatarSrc(emoji)} className="w-[77px] h-[77px] rounded-full object-cover mx-auto mb-2" alt="" />
        <h2 className="text-2xl font-black text-gray-800">{name}</h2>
        <p className="text-gray-400 font-semibold text-sm mt-1 mb-6">Nhập PIN 4 chữ số</p>

        {/* 4 dots */}
        <div className={`flex justify-center gap-4 mb-7 transition-transform ${shake ? 'animate-[shake_0.6s_ease-in-out]' : ''}`}>
          {[0,1,2,3].map(i => (
            <div key={i} className={`w-5 h-5 rounded-full border-2 transition-all duration-150 ${
              error && pin.length === 0
                ? 'border-red-400 bg-red-400'
                : pin.length > i
                  ? `${ringColor} border-transparent`
                  : 'border-gray-300'
            }`} />
          ))}
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3">
          {KEYS.map((k, i) => (
            k === '' ? <div key={i} /> : (
              <button key={i} onClick={() => handleKey(k)} disabled={loading}
                className={`h-16 rounded-2xl font-black text-2xl transition-all active:scale-90 disabled:opacity-40 ${
                  k === '⌫' ? 'bg-gray-100 text-gray-500 text-xl' : btnColor
                }`}>
                {k}
              </button>
            )
          ))}
        </div>
      </div>
    </div>
  )
}
