'use client'
import type { ReactNode } from 'react'
import { tap, Stars, TAP } from '@/components/TopicHub'
import BottomSheet from '@/components/BottomSheet'
import type { HubTheme } from '@/components/hubTheme'
import type { RowStatus } from '@/components/TopicRounds'

// Compact game pickers for the Daily topic hub: a one-line strip of emoji tiles on the round card
// (tiles shrink to fit up to ~7 on a phone; stars at a glance, tap = play) and a bottom sheet with
// the same games as a labelled 3-column grid.

export type GameTile = { id: string; emoji: string; label: string; ai: boolean; status: RowStatus; stars: number; sub: string; tag?: string }

// Small corner badge: emerald ✓ at 3★, amber "n★" once started, nothing before.
function Badge({ tile }: { tile: GameTile }) {
  if (tile.status === 'done') return <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white">✓</span>
  if (tile.stars > 0) return <span className="absolute -right-1.5 -top-1 rounded-full bg-amber-400 px-1 text-[9px] font-bold leading-4 text-amber-950">{tile.stars}★</span>
  return null
}

export function GameStrip({ tiles, theme, onOpen }: { tiles: GameTile[]; theme: HubTheme; onOpen: (id: string) => void }) {
  return (
    <div className="mt-2.5 flex gap-1.5">
      {tiles.map((t) => (
        <button key={t.id} type="button" onClick={() => { tap(); onOpen(t.id) }} aria-label={`${t.label} · ${t.sub}`}
          className={`relative flex aspect-square min-w-0 max-w-[48px] flex-1 items-center justify-center rounded-xl border bg-white text-2xl ${TAP} ${
            t.status === 'next' ? `border-transparent ring-4 ${theme.ring}` : 'border-slate-200'
          } ${t.status === 'todo' ? 'opacity-70' : ''}`}>
          {t.emoji}
          <Badge tile={t} />
        </button>
      ))}
    </div>
  )
}

export function GamePickerSheet({ title, note, tiles, extra, theme, onOpen, onClose }: {
  title: string; note?: ReactNode; tiles: GameTile[]; theme: HubTheme; onOpen: (id: string) => void; onClose: () => void
  /** A second, titled grid under the main one (a round's arcade games from Khu vui chơi). */
  extra?: { title: string; tiles: GameTile[] } | false
}) {
  return (
    <BottomSheet title={title} titleClass={theme.title} onClose={onClose}>
      {note && <div className="px-4 pb-2 text-xs font-semibold leading-snug text-slate-500">{note}</div>}
      <TileGrid tiles={tiles} theme={theme} onOpen={onOpen} />
      {extra && extra.tiles.length > 0 && (
        <>
          <p className="px-4 pb-2 pt-4 text-sm font-bold text-slate-700">{extra.title}</p>
          <TileGrid tiles={extra.tiles} theme={theme} onOpen={onOpen} />
        </>
      )}
    </BottomSheet>
  )
}

function TileGrid({ tiles, theme, onOpen }: { tiles: GameTile[]; theme: HubTheme; onOpen: (id: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2 px-4">
      {tiles.map((t) => (
        <button key={t.id} type="button" onClick={() => { tap(); onOpen(t.id) }}
          className={`relative flex min-h-[112px] flex-col items-center gap-1 rounded-2xl border-2 p-2 text-center ${TAP} ${
            t.status === 'next' ? `${theme.soft} ${theme.card}` : 'border-slate-200 bg-white'
          }`}>
          {t.ai && <span className="absolute right-1.5 top-1.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-1.5 text-[9px] font-bold text-white">AI</span>}
          {t.tag && <span className={`absolute left-1.5 top-1.5 rounded-full px-1.5 text-[9px] font-bold ${theme.soft} ${theme.accent}`}>{t.tag}</span>}
          <span className="text-3xl leading-none">{t.emoji}</span>
          <span className="text-xs font-bold leading-tight text-slate-800">{t.label}</span>
          <span className="mt-auto">
            {t.status === 'next' ? <span className={`text-[11px] font-bold ${theme.accent}`}>Làm tiếp ›</span>
              : t.stars > 0 ? <span className="[&>span]:text-xs"><Stars filled={t.stars} /></span>
              : <span className="text-[11px] font-bold text-slate-400">{t.status === 'done' ? 'Đã xong' : 'Chưa làm'}</span>}
          </span>
        </button>
      ))}
    </div>
  )
}
