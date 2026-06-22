'use client'

import { useCallback, useState } from 'react'
import { useOfflineDailyDownload } from '@/lib/useOfflineDailyDownload'

interface Props {
  childId: string
  level: string
  topicId: string
  downloadedCount: number
  downloadLimit: number | null  // null = unlimited
  className?: string
}

export default function OfflineDailyDownloadButton({ childId, level, topicId, downloadedCount, downloadLimit, className = '' }: Props) {
  const { state, download, remove } = useOfflineDailyDownload(childId, level, topicId)
  const [showRemove, setShowRemove] = useState(false)

  const atLimit = downloadLimit !== null && downloadedCount >= downloadLimit && state !== 'downloaded'

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (state === 'downloaded') {
      if (showRemove) {
        await remove()
        setShowRemove(false)
      } else {
        setShowRemove(true)
        setTimeout(() => setShowRemove(false), 2500)
      }
      return
    }

    if (state === 'downloading' || atLimit) return
    await download()
  }, [state, showRemove, atLimit, download, remove])

  const label = state === 'downloaded'
    ? (showRemove ? 'Xóa' : 'Đã tải')
    : atLimit
    ? `${downloadedCount}/${downloadLimit} đã tải`
    : 'Tải offline'

  const icon = (() => {
    if (state === 'downloading') return (
      <span className="block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
    )
    if (state === 'downloaded') return showRemove ? (
      <span className="text-[10px] font-black">✕</span>
    ) : (
      <span className="text-[10px] font-black text-green-600">✓</span>
    )
    if (state === 'error') return <span className="text-[10px]">!</span>
    if (atLimit) return <span className="text-[10px]">⊘</span>
    return <span className="text-[10px] font-black">↓</span>
  })()

  const colorCls = state === 'downloaded'
    ? showRemove
      ? 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100'
      : 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100'
    : atLimit
    ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
    : state === 'error'
    ? 'bg-red-50 border-red-200 text-red-500'
    : 'bg-white/90 border-gray-200 text-gray-500 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600'

  return (
    <button
      onClick={handleClick}
      disabled={state === 'downloading' || atLimit}
      aria-label={label}
      title={label}
      className={`flex items-center justify-center w-6 h-6 rounded-full border shadow-sm transition-all duration-150 ${colorCls} ${className}`}
    >
      {icon}
    </button>
  )
}
