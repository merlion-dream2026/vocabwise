'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import UpgradeModal from '@/components/UpgradeModal'

export default function ExpiredPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [showModal, setShowModal] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (d.username) setUsername(d.username) })
      .catch(() => {})
  }, [])

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-8">
        <div className="text-7xl mb-4">⏸️</div>
        <h1 className="text-2xl font-black text-gray-800 mb-2">Tài khoản đã hết hạn</h1>
        <p className="text-gray-500 text-sm font-semibold leading-relaxed">
          Hành trình học tiếng Anh đang tạm dừng.<br />
          Gia hạn Pro để tiếp tục ngay!
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-8">
        {[
          { icon: '📚', text: '4.500+ từ vựng' },
          { icon: '🎤', text: 'AI chấm phát âm' },
          { icon: '🎮', text: '10 game/chủ đề' },
          { icon: '📊', text: 'Báo cáo tiến độ' },
        ].map(({ icon, text }) => (
          <div key={text} className="bg-white/70 rounded-2xl p-3 text-center border border-white shadow-sm">
            <div className="text-2xl">{icon}</div>
            <p className="text-xs font-bold text-gray-500 mt-1">{text}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black text-lg py-4 rounded-2xl shadow-lg active:scale-95 transition-all"
        >
          ⭐ Gia hạn Pro ngay
        </button>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full bg-green-500 text-white font-black py-3 rounded-2xl shadow active:scale-95 transition-all disabled:opacity-60 text-sm"
        >
          ✅ Đã gia hạn — Đăng nhập lại
        </button>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full text-gray-400 text-sm font-semibold py-2"
        >
          Đăng xuất
        </button>
      </div>

      {showModal && (
        <UpgradeModal username={username} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}
