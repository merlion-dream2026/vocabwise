'use client'
import { useEffect, useState } from 'react'

export default function NoVoiceBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handler = () => setVisible(true)
    window.addEventListener('vocabwise:no-voice', handler)
    return () => window.removeEventListener('vocabwise:no-voice', handler)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[calc(100%-2rem)] flex items-center justify-between gap-2 bg-amber-50 border border-amber-200 rounded-2xl shadow-lg px-4 py-3 text-amber-800 text-sm font-medium">
      <span>Trình duyệt của bạn không hỗ trợ phát âm. Hãy dùng Safari, Chrome, hoặc Edge.</span>
      <button onClick={() => setVisible(false)} className="shrink-0 text-amber-500 hover:text-amber-700 font-bold text-lg leading-none">✕</button>
    </div>
  )
}
