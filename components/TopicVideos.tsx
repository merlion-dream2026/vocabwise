'use client'
import { useEffect, useRef, useState } from 'react'
import type { HubTheme } from '@/components/hubTheme'
import { PRESS, tap } from '@/components/TopicHub'
import type { TopicVideo } from '@/app/api/videos/route'

// "Video học thêm" — reward-style card at the bottom of a topic hub (Daily + Academic). Opens a
// bottom sheet with the topic's 3 curated YouTube videos, played in-app via youtube-nocookie.
// Optional extra: not counted in progress. Renders nothing when the topic has no videos yet.
// The iframe only loads once a video is tapped, so the hub itself pays nothing for this.

type YTPlayer = { destroy: () => void; playVideo: () => void }
type YTGlobal = { Player: new (el: HTMLElement, opts: object) => YTPlayer; PlayerState: { ENDED: number } }
declare global { interface Window { YT?: YTGlobal; onYouTubeIframeAPIReady?: () => void } }

// Loads the IFrame Player API once (used to show our own end screen instead of YouTube's
// "more videos" wall, which would pull kids out of the app).
let apiPromise: Promise<YTGlobal> | null = null
function loadYT(): Promise<YTGlobal> {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  apiPromise ??= new Promise((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => { prev?.(); resolve(window.YT!) }
    const s = document.createElement('script')
    s.src = 'https://www.youtube.com/iframe_api'
    s.onerror = () => { apiPromise = null; reject(new Error('yt api')) }
    document.head.appendChild(s)
  })
  return apiPromise
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
const thumb = (id: string) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`

export default function TopicVideos({ videoKey, theme }: { videoKey: string; theme: HubTheme }) {
  const [videos, setVideos] = useState<TopicVideo[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let alive = true
    fetch(`/api/videos?key=${encodeURIComponent(videoKey)}`)
      .then(r => (r.ok ? r.json() : { videos: [] }))
      .then(d => { if (alive) setVideos(d.videos ?? []) })
      .catch(() => {})
    return () => { alive = false }
  }, [videoKey])

  if (!videos.length) return null

  return (
    <>
      <button type="button" onClick={() => { tap(); setOpen(true) }}
        className={`flex w-full items-center gap-3 rounded-2xl border-2 border-b-[5px] bg-white p-3 text-left ${theme.card} ${PRESS}`}>
        <span className="relative flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- remote YouTube thumbnail, no need for next/image */}
          <img src={thumb(videos[0].id)} alt="" className="h-14 w-24 rounded-xl object-cover" />
          <span className="absolute inset-0 flex items-center justify-center text-2xl drop-shadow">▶️</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block text-sm font-bold ${theme.title}`}>🎬 Video học thêm</span>
          <span className="block text-xs text-slate-500">{videos.length} video về chủ đề này · xem nếu thích</span>
        </span>
        <span className="flex-shrink-0 text-lg font-bold text-slate-400" aria-hidden>›</span>
      </button>
      {open && <VideoSheet videos={videos} theme={theme} onClose={() => setOpen(false)} />}
    </>
  )
}

function VideoSheet({ videos, theme, onClose }: { videos: TopicVideo[]; theme: HubTheme; onClose: () => void }) {
  const [playing, setPlaying] = useState<number | null>(null)
  const [ended, setEnded] = useState(false)
  const holder = useRef<HTMLDivElement>(null)

  // Lock page scroll + close on Escape while the sheet is open.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [onClose])

  // Mount a player for the chosen video. Falls back to a plain iframe if the API script can't load.
  useEffect(() => {
    if (playing === null || !holder.current) return
    const el = document.createElement('div')
    el.className = 'h-full w-full'
    holder.current.replaceChildren(el)
    const id = videos[playing].id
    let player: YTPlayer | null = null
    let cancelled = false
    loadYT().then(YT => {
      if (cancelled) return
      player = new YT.Player(el, {
        videoId: id,
        host: 'https://www.youtube-nocookie.com',
        width: '100%', height: '100%',
        playerVars: { autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1, fs: 1, iv_load_policy: 3 },
        events: { onStateChange: (e: { data: number }) => { if (e.data === YT.PlayerState.ENDED) setEnded(true) } },
      })
    }).catch(() => {
      if (cancelled) return
      const f = document.createElement('iframe')
      f.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0&modestbranding=1`
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'
      f.className = 'h-full w-full'
      el.replaceWith(f)
    })
    return () => { cancelled = true; player?.destroy() }
  }, [playing, videos])

  const play = (i: number) => { tap(); setEnded(false); setPlaying(i) }
  const next = playing !== null && playing + 1 < videos.length ? playing + 1 : null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div role="dialog" aria-label="Video học thêm" onClick={e => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 pb-2 pt-3">
          <h2 className={`text-base font-bold ${theme.title}`}>🎬 Video học thêm</h2>
          <button type="button" onClick={onClose} aria-label="Đóng"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-slate-500">✕</button>
        </div>

        {playing !== null && (
          <div className="relative mx-4 mb-3 aspect-video overflow-hidden rounded-2xl bg-black">
            <div ref={holder} className="h-full w-full" />
            {ended && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-900/95 p-4 text-white">
                <p className="text-sm font-bold">🎉 Xem xong rồi!</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => play(playing)} className="rounded-full bg-white/20 px-4 py-2 text-sm font-bold">↺ Xem lại</button>
                  {next !== null && <button type="button" onClick={() => play(next)} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-800">Video tiếp ›</button>}
                </div>
              </div>
            )}
          </div>
        )}

        <ul className="space-y-2 px-4">
          {videos.map((v, i) => (
            <li key={v.id}>
              <button type="button" onClick={() => play(i)}
                className={`flex w-full items-center gap-3 rounded-2xl border-2 p-2 text-left ${i === playing ? `${theme.soft} ${theme.card}` : 'border-slate-100 bg-white'}`}>
                <span className="relative flex-shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element -- remote YouTube thumbnail */}
                  <img src={thumb(v.id)} alt="" loading="lazy" className="h-16 w-28 rounded-xl object-cover" />
                  <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1 text-[10px] font-bold text-white">{mmss(v.sec)}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-sm font-bold text-slate-800">{v.title}</span>
                  <span className="block truncate text-xs text-slate-500">{v.channel}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="px-4 pt-3 text-center text-[11px] text-slate-400">Video từ YouTube · không tính vào tiến độ</p>
      </div>
    </div>
  )
}
