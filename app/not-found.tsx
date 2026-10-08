import Link from 'next/link'
import Mascot from '@/components/Mascot'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="text-8xl font-bold text-purple-200 mb-2">404</div>
        <Mascot shot="pose-lost" size={176} priority className="mi-pop mb-4 rounded-3xl shadow-md ring-4 ring-white" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Không tìm thấy trang</h1>
        <p className="text-gray-500 text-sm mb-6">Trang này không tồn tại hoặc đã bị xóa.</p>
        <Link
          href="/"
          className="inline-block bg-purple-600 text-white font-bold px-6 py-3 rounded-2xl active:scale-95 transition-transform"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  )
}
