'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import UpgradeModal from '@/components/UpgradeModal'
import { cachedFetch, invalidateCachedFetch } from '@/lib/cachedFetch'
import { cta } from '@/components/ChunkyUI'

export default function ExpiredPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [showModal, setShowModal] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    cachedFetch('/api/auth/me')
      .then(r => r.json())
      .then((d) => { const s = d as { username?: string }; if (s.username) setUsername(s.username) })
      .catch(() => {})
  }, [])

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    invalidateCachedFetch('/api/auth/me')
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-8">
        <div className="text-7xl mb-4">⏸️</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Tài khoản đã hết hạn</h1>
        <p className="text-gray-500 text-sm font-semibold leading-relaxed">
          Hành trình học tiếng Anh đang tạm dừng.<br />
          Gia hạn Pro để tiếp tục ngay!
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-8">
        {[
          { icon: '📚', text: '5.100+ từ vựng' },
          { icon: '🎤', text: 'AI chấm phát âm' },
          { icon: '🎮', text: '10 game/chủ đề' },
          { icon: '📊', text: 'Báo cáo tiến độ' },
        ].map(({ icon, text }) => (
          <div key={text} className="bg-white/70 rounded-3xl p-3 text-center border-white border-2 border-slate-200 border-b-[4px] border-b-slate-300">
            <div className="text-2xl">{icon}</div>
            <p className="text-xs font-bold text-gray-500 mt-1">{text}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => setShowModal(true)}
          className={cta('purple')}
        >
          ⭐ Gia hạn Pro ngay
        </button>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className={cta('green')}
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
