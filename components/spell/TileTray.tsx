'use client'

import { useRef, useState } from 'react'
import { SPELL_THEMES, tileCls, trayCls, type SpellTheme } from './themes'

export type Tile = { id: string; letter: string; used: boolean }

type Props = {
  tiles: Tile[]
  theme: SpellTheme
  onTheme: (t: SpellTheme) => void
  disabled: boolean
  onTap: (tile: Tile) => void
  /** Called when a tile is dropped onto an answer slot (elements marked `data-spell-slot={index}`). */
  onDrop: (tile: Tile, slotIdx: number) => void
}

const TILT = [-3, 2, -1.5, 3, -2, 1.5]
const DRAG_THRESHOLD = 8 // px moved before a press counts as a drag rather than a tap

export default function TileTray({ tiles, theme, onTheme, disabled, onTap, onDrop }: Props) {
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(null)
  const start = useRef<{ id: string; x: number; y: number } | null>(null)
  const justDragged = useRef(false)

  const down = (e: React.PointerEvent, tile: Tile) => {
    justDragged.current = false // some mobile browsers fire no click after a drag, so never let the flag outlive one press
    if (disabled || tile.used) return
    start.current = { id: tile.id, x: e.clientX, y: e.clientY }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const move = (e: React.PointerEvent) => {
    const s = start.current
    if (!s) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (drag || Math.hypot(dx, dy) > DRAG_THRESHOLD) setDrag({ id: s.id, dx, dy })
  }

  const up = (e: React.PointerEvent, tile: Tile) => {
    const wasDrag = drag?.id === tile.id
    start.current = null
    setDrag(null)
    if (!wasDrag) return
    // The click that follows pointerup must not also count as a tap.
    justDragged.current = true
    const slot = document.elementsFromPoint(e.clientX, e.clientY)
      .find((el) => el instanceof HTMLElement && el.dataset.spellSlot !== undefined) as HTMLElement | undefined
    if (slot) onDrop(tile, Number(slot.dataset.spellSlot))
  }

  const click = (tile: Tile) => {
    if (justDragged.current) { justDragged.current = false; return }
    if (!disabled && !tile.used) onTap(tile)
  }

  return (
    <div className="self-stretch mt-auto mb-5">
      <div className="flex justify-end items-center gap-2 mb-2 pr-1">
        <span className="text-xs font-bold text-gray-500">Màu thẻ</span>
        {SPELL_THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => onTheme(t.id)}
            aria-label={t.label}
            aria-pressed={theme === t.id}
            className={`w-6 h-6 rounded-full ${t.swatch} ${theme === t.id ? 'outline outline-2 outline-offset-2 outline-[#3b2a8a]' : 'opacity-70'}`}
          />
        ))}
      </div>
      <div className={`rounded-t-[18px] rounded-b-xl border-t-[5px] px-2.5 pt-4 pb-5 flex flex-wrap gap-2.5 justify-center ${trayCls(theme)}`}>
        {tiles.map((tile, i) => {
          const d = drag?.id === tile.id ? drag : null
          const tilt = TILT[i % TILT.length]
          return (
            <button
              key={tile.id}
              onPointerDown={(e) => down(e, tile)}
              onPointerMove={move}
              onPointerUp={(e) => up(e, tile)}
              onPointerCancel={() => { start.current = null; setDrag(null) }}
              onClick={() => click(tile)}
              disabled={disabled || tile.used}
              style={{
                transform: d ? `translate(${d.dx}px, ${d.dy}px) rotate(-6deg) scale(1.12)` : tile.used ? undefined : `rotate(${tilt}deg)`,
                touchAction: 'none',
              }}
              className={`w-[52px] h-[56px] rounded-xl text-3xl font-black flex items-center justify-center select-none
                ${tile.used
                  ? 'bg-transparent border-[2.5px] border-dashed border-black/15 text-transparent'
                  : `border-[2.5px] border-b-[7px] ${tileCls(theme, i)} ${d ? 'relative z-50 shadow-xl' : 'transition-transform duration-150 active:translate-y-0.5'}`}`}
            >
              {tile.used ? '' : tile.letter}
            </button>
          )
        })}
      </div>
    </div>
  )
}
