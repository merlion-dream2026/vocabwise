'use client'

import { useCallback, useState } from 'react'
import { useOfflineDailyDownload } from '@/lib/useOfflineDailyDownload'

interface Props {
  childId: string
  level: string
  topicId: string
  topicName?: string
  downloadedCount: number
  downloadLimit: number | null  // null = unlimited
  className?: string
}

export default function OfflineDailyDownloadButton({ childId, level, topicId, topicName, downloadedCount, downloadLimit, className = '' }: Props) {
  const { state, download, remove } = useOfflineDailyDownload(childId, level, topicId)
  const [showConfirm, setShowConfirm] = useState(false)

  const atLimit = downloadLimit !== null && downloadedCount >= downloadLimit && state !== 'downloaded'

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (state === 'downloaded') { setShowConfirm(true); return }
    if (state === 'downloading' || atLimit) return
    await download()
  }, [state, atLimit, download])

  async function handleConfirmRemove(e: React.MouseEvent) {
    e.stopPropagation()
    await remove()
    setShowConfirm(false)
  }

  const label = state === 'downloaded'
    ? 'Đã tải'
    : atLimit
    ? `${downloadedCount}/${downloadLimit} đã tải`
    : 'Tải offline'

  const icon = (() => {
    if (state === 'downloading') return (
      <span className="block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
    )
    if (state === 'downloaded') return <span className="text-[10px] font-black text-green-600">✓</span>
    if (state === 'error') return <span className="text-[10px]">!</span>
    if (atLimit) return <span className="text-[10px]">⊘</span>
    return <span className="text-[10px] font-black">↓</span>
  })()

  const colorCls = state === 'downloaded'
    ? 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
    : atLimit
    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
    : state === 'error'
    ? 'bg-red-50 border-red-200 text-red-500'
    : 'bg-white/90 border-gray-200 text-gray-500 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600'

  return (
    <>
      <button
        onClick={handleClick}
        disabled={state === 'downloading' || atLimit}
        aria-label={label}
        title={label}
        className={`flex items-center justify-center w-6 h-6 rounded-full border shadow-sm transition-all duration-150 ${colorCls} ${className}`}
      >
        {icon}
      </button>

      {showConfirm && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-4"
          onClick={e => { e.stopPropagation(); setShowConfirm(false) }}
        >
          <div
            className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl mb-2"
            onClick={e => e.stopPropagation()}
          >
            <p className="font-black text-gray-800 text-base mb-1">Xóa bản offline?</p>
            <p className="text-gray-500 text-sm mb-4">
              {topicName ? <><span className="font-semibold text-gray-700">&ldquo;{topicName}&rdquo;</span> </> : 'Chủ đề này '}
              sẽ bị xóa khỏi bộ nhớ thiết bị. Bạn có thể tải lại bất cứ lúc nào.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleConfirmRemove}
                className="flex-1 bg-red-500 text-white font-black py-3 rounded-2xl active:scale-95 transition-all"
              >
                Xóa
              </button>
              <button
                onClick={e => { e.stopPropagation(); setShowConfirm(false) }}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-2xl active:scale-95 transition-all"
              >
                Huỷ
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
