'use client'

import { useEffect, useState } from 'react'

const PREPARATION_SECONDS = 60

export default function Part2PreparationTimer() {
  const [secondsLeft, setSecondsLeft] = useState(PREPARATION_SECONDS)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    if (!running || secondsLeft <= 0) return
    const timer = window.setInterval(() => {
      setSecondsLeft(previous => {
        if (previous <= 1) {
          setRunning(false)
          return 0
        }
        return previous - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [running, secondsLeft])

  const reset = () => {
    setRunning(false)
    setSecondsLeft(PREPARATION_SECONDS)
  }

  const progress = Math.round(((PREPARATION_SECONDS - secondsLeft) / PREPARATION_SECONDS) * 100)

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-amber-700">1 phút chuẩn bị</p>
          <p className="mt-0.5 text-sm font-black text-amber-950">
            {secondsLeft === 0 ? 'Hết giờ — bắt đầu nói' : `${secondsLeft} giây`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRunning(previous => !previous)}
            disabled={secondsLeft === 0}
            className="rounded-xl bg-amber-600 px-3 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:bg-amber-200"
          >
            {running ? 'Tạm dừng' : secondsLeft === PREPARATION_SECONDS ? 'Bắt đầu' : 'Tiếp tục'}
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-black text-amber-800"
          >
            Làm lại
          </button>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-amber-100">
        <div
          className="h-full rounded-full bg-amber-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-amber-800">
        Chỉ ghi 4–6 keywords: bối cảnh, chi tiết mạnh nhất, cảm xúc và câu reflection. Không viết cả câu.
      </p>
    </div>
  )
}
