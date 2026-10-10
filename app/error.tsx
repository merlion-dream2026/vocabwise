'use client'
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import Mascot from '@/components/Mascot'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error) }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <Mascot shot="pose-oops" size={208} priority className="mi-pop mb-4 rounded-3xl shadow-md ring-4 ring-white" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Có lỗi xảy ra</h1>
        <p className="text-gray-500 text-sm mb-6">Lỗi đã được ghi lại. Thử tải lại trang.</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-purple-600 text-white font-bold px-5 py-3 rounded-2xl active:scale-95 transition-transform"
          >
            Thử lại
          </button>
          {/* Plain <a>, not next/link: this boundary can fire from corrupted client-side
              state, so recovery needs a full page reload rather than a client transition
              through the same broken runtime. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            className="bg-gray-100 text-gray-700 font-bold px-5 py-3 rounded-2xl active:scale-95 transition-transform"
          >
            Về trang chủ
          </a>
        </div>
      </div>
    </div>
  )
}
