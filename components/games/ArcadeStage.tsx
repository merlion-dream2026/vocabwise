'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { buzz } from '@/components/ChunkyUI'
import { isGameSoundEnabled, setGameSoundEnabled, onGameSoundToggle } from '@/lib/gameSound'

// Full-screen frame shared by the arcade games (🚀 rocket, 🔨 whack): the scene fills the viewport,
// a HUD floats on top (exit, sound and a real Fullscreen API toggle stacked on the left next to the
// round timer dial, score cards on the right) so the bottom edge stays free for answers on a phone,
// and start / result panels open as modals over the scene. The game page hides its global
// GameSoundToggle for these games — the HUD carries its own.

export type StageTone = 'wood' | 'space' | 'sea' | 'sky' | 'pond'

const CARD: Record<StageTone, string> = {
  wood:  'border-[#5B3A1E] bg-[#FFF8E7] text-[#4A2C14]',
  space: 'border-[#C7CCF0] bg-[#EEF0FD] text-[#1E1B4B]',
  sea:   'border-[#0369A1] bg-[#F0F9FF] text-[#0C4A6E]',
  sky:   'border-[#1D4ED8] bg-[#EFF6FF] text-[#1E3A8A]',
  pond:  'border-[#15803D] bg-[#F0FDF4] text-[#14532D]',
}
const MODAL: Record<StageTone, string> = {
  wood:  'border-amber-300 bg-[#FFF8E7] text-[#4A2C14]',
  space: 'border-white/70 bg-[#EEF0FD] text-[#1E1B4B]',
  sea:   'border-sky-300 bg-[#F0F9FF] text-[#0C4A6E]',
  sky:   'border-blue-300 bg-[#EFF6FF] text-[#1E3A8A]',
  pond:  'border-green-300 bg-[#F0FDF4] text-[#14532D]',
}
const DIAL: Record<StageTone, string> = { wood: '#65A30D', space: '#6366F1', sea: '#0284C7', sky: '#2563EB', pond: '#16A34A' }

// ── Fullscreen (Android / desktop / iPad; iPhone Safari has no element fullscreen → button hidden) ──
type FsDoc = Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => Promise<void> }
type FsEl = HTMLElement & { webkitRequestFullscreen?: () => Promise<void> }

function fsActive() {
  const d = document as FsDoc
  return !!(d.fullscreenElement ?? d.webkitFullscreenElement)
}
export function enterFullscreen() {
  try {
    const el = document.documentElement as FsEl
    if (fsActive()) return
    ;(el.requestFullscreen?.() ?? el.webkitRequestFullscreen?.())?.catch?.(() => {})
  } catch { /* unsupported — the stage already fills the viewport */ }
}
function exitFullscreen() {
  try {
    const d = document as FsDoc
    if (!fsActive()) return
    ;(d.exitFullscreen?.() ?? d.webkitExitFullscreen?.())?.catch?.(() => {})
  } catch { /* ignore */ }
}

export function ArcadeStage({ children, className = '' }: { children: ReactNode; className?: string }) {
  useEffect(() => {
    // The app's page behind must not scroll under the stage.
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev; exitFullscreen() }
  }, [])

  return (
    // overflow: clip (not just hidden): the scenery is drawn wider than the screen, and a "hidden" box is
    // still a scroll container — focus / scroll-into-view could slide the whole stage sideways.
    // Browsers without `clip` ignore the inline value and keep the class's `hidden`.
    <div className={`fixed inset-0 z-30 select-none overflow-hidden font-nunito touch-manipulation ${className}`} style={{ overflow: 'clip' }}>
      <style>{`
        @keyframes stPop { 0% { transform: scale(.85); opacity: 0 } 100% { transform: scale(1); opacity: 1 } }
        @keyframes stDrift { 0% { transform: translateX(0) } 50% { transform: translateX(26px) } 100% { transform: translateX(0) } }
        @keyframes stTwinkle { 0%,100% { opacity: .35 } 50% { opacity: 1 } }
        .st-pop { animation: stPop .25s ease-out both }
        .st-drift { animation: stDrift 14s ease-in-out infinite }
        .st-twinkle { animation: stTwinkle 2.4s ease-in-out infinite }
      `}</style>
      {children}
    </div>
  )
}

// Four corner brackets: pointing out = enter fullscreen, pointing in = leave (the ⛶ glyph is missing
// from most fonts and showed as an empty box).
function FsIcon({ exit }: { exit: boolean }) {
  const d = exit
    ? 'M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6'
    : 'M3 9V3h6M21 9V3h-6M3 15v6h6M21 15v6h-6'
  return (
    <svg viewBox="0 0 24 24" className="h-[55%] w-[55%]" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  )
}

const ROUND_BTN = 'flex items-center justify-center rounded-full border-[3px] font-black shadow-md active:scale-90'

/** Top bar: exit / sound / fullscreen column + timer dial on the left, cards on the right. */
export function StageHud({ onExit, dial, cards, tone }: {
  onExit: () => void; dial?: ReactNode; cards: { label: string; value: ReactNode }[]; tone: StageTone
}) {
  const [fs, setFs] = useState(false)
  const [canFs, setCanFs] = useState(false)
  const [sound, setSound] = useState(true)
  useEffect(() => {
    const el = document.documentElement as FsEl
    setCanFs(!!(el.requestFullscreen || el.webkitRequestFullscreen))
    setFs(fsActive())
    setSound(isGameSoundEnabled())
    const on = () => setFs(fsActive())
    document.addEventListener('fullscreenchange', on)
    document.addEventListener('webkitfullscreenchange', on)
    const off = onGameSoundToggle(setSound)
    return () => {
      document.removeEventListener('fullscreenchange', on)
      document.removeEventListener('webkitfullscreenchange', on)
      off()
    }
  }, [])
  const small = `${ROUND_BTN} h-[clamp(38px,6.6vmin,56px)] w-[clamp(38px,6.6vmin,56px)] text-[clamp(16px,3vmin,26px)] ${CARD[tone]}`

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-3 sm:p-5">
      <div className="pointer-events-auto flex items-start gap-2">
        <div className="flex flex-col items-center gap-2">
          <button type="button" onClick={() => { buzz(); onExit() }} aria-label="Thoát game"
            className={`${ROUND_BTN} h-[clamp(44px,8vmin,68px)] w-[clamp(44px,8vmin,68px)] text-[clamp(18px,3.6vmin,32px)] ${CARD[tone]}`}>✕</button>
          <button type="button" onClick={() => { buzz(); setGameSoundEnabled(!sound) }}
            aria-label={sound ? 'Tắt âm thanh' : 'Bật âm thanh'} className={small}>{sound ? '🔊' : '🔇'}</button>
          {canFs && (
            <button type="button" onClick={() => { buzz(); if (fs) exitFullscreen(); else enterFullscreen() }}
              aria-label={fs ? 'Thoát toàn màn hình' : 'Toàn màn hình'} className={small}><FsIcon exit={fs} /></button>
          )}
        </div>
        {dial}
      </div>
      <div className="flex gap-2">
        {cards.map((c) => (
          <div key={c.label} className={`min-w-[clamp(72px,15vmin,160px)] rounded-2xl border-[3px] border-b-[6px] px-[clamp(8px,1.8vmin,20px)] py-[clamp(4px,1vmin,12px)] text-center shadow-md ${CARD[tone]}`}>
            <p className="text-[clamp(11px,2.2vmin,20px)] font-black uppercase tracking-widest opacity-70">{c.label}</p>
            <p className="text-[clamp(24px,6.4vmin,64px)] font-black leading-tight">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Round countdown as a clock face whose ring drains; turns red in the last stretch. */
export function TimerDial({ pct, seconds, urgent, tone, icon = '⏱' }: {
  pct: number; seconds: number; urgent?: boolean; tone: StageTone; icon?: string
}) {
  const r = 26
  const len = 2 * Math.PI * r
  const p = Math.max(0, Math.min(100, pct)) / 100
  return (
    <div className={`relative flex h-[clamp(64px,14vmin,140px)] w-[clamp(64px,14vmin,140px)] items-center justify-center rounded-full border-[3px] shadow-md ${CARD[tone]}`}
      role="timer" aria-label={`Còn ${seconds} giây`}>
      <svg viewBox="0 0 64 64" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeOpacity=".12" strokeWidth="7" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={urgent ? '#EF4444' : DIAL[tone]}
          strokeWidth="7" strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - p)}
          style={{ transition: 'stroke-dashoffset 1s linear, stroke .3s' }} />
      </svg>
      <span className={`relative text-center leading-none ${urgent ? 'animate-pulse text-red-600' : ''}`}>
        <span className="block text-[clamp(12px,2.6vmin,26px)]">{icon}</span>
        <span className={`font-black ${seconds >= 100 ? 'text-[clamp(17px,3.9vmin,38px)]' : 'text-[clamp(20px,5vmin,50px)]'}`}>{seconds}</span>
      </span>
    </div>
  )
}

/** Centered panel over the scene (start, result, messages). */
export function StageModal({ children, tone, dim = true }: { children: ReactNode; tone: StageTone; dim?: boolean }) {
  return (
    <div className={`absolute inset-0 z-30 flex items-center justify-center p-4 ${dim ? 'bg-black/35' : ''}`}>
      <div className={`st-pop max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[28px] border-[5px] p-5 text-center shadow-2xl sm:p-8 [@media(max-height:500px)]:p-3 ${
        MODAL[tone]}`}>
        {children}
      </div>
    </div>
  )
}

/** Big chunky call-to-action used inside the modals. */
export function StageButton({ children, onClick, tone }: { children: ReactNode; onClick: () => void; tone: 'wood' | 'gold' }) {
  return (
    <button type="button" onClick={() => { buzz(); onClick() }}
      className={`mx-auto mt-5 flex min-w-[200px] items-center justify-center gap-2 rounded-2xl border-b-[6px] px-8 py-3.5 text-2xl font-black [@media(max-height:500px)]:mt-3 [@media(max-height:500px)]:py-2 shadow-lg transition-transform active:translate-y-1 active:border-b-2 ${
        tone === 'wood' ? 'border-[#3A2410] bg-[#6B4423] text-[#FFF8E7]' : 'border-[#C28A12] bg-[#FACC48] text-[#1E1B4B]'}`}>
      {children}
    </button>
  )
}
