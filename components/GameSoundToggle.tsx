'use client'

import { useEffect, useState } from 'react'
import { isGameSoundEnabled, setGameSoundEnabled, onGameSoundToggle } from '@/lib/gameSound'

// Floating toggle for game correct/wrong sound effects — mounted once per game
// wrapper page (not per game component). Fixed bottom-right so it never collides
// with each game's own header (back button + progress live top), and BottomNav
// is already hidden on every route this appears on.
export default function GameSoundToggle() {
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    setEnabled(isGameSoundEnabled())
    return onGameSoundToggle(setEnabled)
  }, [])

  function toggle() {
    const next = !enabled
    setGameSoundEnabled(next)
    setEnabled(next)
  }

  return (
    <button
      onClick={toggle}
      aria-label={enabled ? 'Tắt âm thanh trò chơi' : 'Bật âm thanh trò chơi'}
      aria-pressed={enabled}
      className="fixed bottom-5 right-4 z-40 w-11 h-11 rounded-full bg-white/95 backdrop-blur border-2 border-gray-200 shadow-lg flex items-center justify-center text-xl active:scale-90 transition-transform"
    >
      {enabled ? '🔊' : '🔇'}
    </button>
  )
}
