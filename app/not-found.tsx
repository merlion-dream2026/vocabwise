import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="text-8xl font-black text-purple-200 mb-2">404</div>
        <div className="text-4xl mb-4">🔍</div>
        <h1 className="text-2xl font-black text-gray-800 mb-2">Không tìm thấy trang</h1>
        <p className="text-gray-500 text-sm mb-6">Trang này không tồn tại hoặc đã bị xóa.</p>
        <Link
          href="/"
          className="inline-block bg-purple-600 text-white font-black px-6 py-3 rounded-2xl active:scale-95 transition-transform"
        >
          Về trang chủ
        </Link>
      </div>
    </div>
  )
}
