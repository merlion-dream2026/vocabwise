'use client'
import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error) }, [error])

  return (
    <html>
      <body className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-black text-gray-800 mb-2">Có lỗi xảy ra</h1>
          <p className="text-gray-500 text-sm mb-6">Lỗi hệ thống đã được ghi lại. Thử tải lại trang.</p>
          <button
            onClick={reset}
            className="bg-purple-600 text-white font-black px-6 py-3 rounded-2xl active:scale-95 transition-transform"
          >
            Tải lại
          </button>
        </div>
      </body>
    </html>
  )
}
