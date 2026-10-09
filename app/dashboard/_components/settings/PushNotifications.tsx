'use client'

import { useState, useEffect } from 'react'
import { urlBase64ToUint8Array } from '../../_utils'
import { PushScheduleEditor } from './PushScheduleEditor'

// ── Push notification opt-in ──────────────────────────────────────────────────
export function PushNotificationContent() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'subscribed' | 'denied' | 'unsupported' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      // Browser/Safari-without-PWA does not support push — NOT a permission denial
      setStatus('unsupported')
      return
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const existing = await reg.pushManager.getSubscription()
      if (existing) {
        setStatus('subscribed')
      } else if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
        // User previously denied permission in browser settings
        setStatus('denied')
      }
    }).catch(() => {/* ignore */})
  }, [])

  async function subscribe() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setMsg('Trình duyệt không hỗ trợ thông báo đẩy.')
      setStatus('error')
      return
    }
    setStatus('loading')
    setMsg('')
    try {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        setStatus('error')
        setMsg('❌ Tính năng thông báo chưa được cấu hình. Vui lòng liên hệ admin.')
        return
      }
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('denied')
        setMsg('Bạn đã từ chối quyền thông báo.')
        return
      }
      const reg = await navigator.serviceWorker.ready
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      })
      if (res.ok) {
        setStatus('subscribed')
        setMsg('✅ Đã bật thông báo!')
      } else {
        const d = await res.json()
        setStatus('error')
        setMsg(`❌ ${d.error ?? 'Lỗi'}`)
      }
    } catch (e) {
      setStatus('error')
      setMsg(`❌ ${String(e)}`)
    }
  }

  async function sendTest() {
    setMsg('⏳ Đang gửi…')
    try {
      const res = await fetch('/api/push/test', { method: 'POST' })
      const d = await res.json()
      if (!res.ok) { setMsg(`❌ ${d.error ?? 'Lỗi'}`); return }
      if (d.result === 'sent') setMsg('✅ Đã gửi — thông báo sẽ hiện trong vài giây.')
      else if (d.result === 'expired' || d.result === 'no_subscription') {
        // Server no longer has a valid subscription for this device → let the user re-enable
        const reg = await navigator.serviceWorker.ready
        await (await reg.pushManager.getSubscription())?.unsubscribe()
        setStatus('idle')
        setMsg('⚠️ Đăng ký thông báo đã hết hạn — bấm Bật lại.')
      } else setMsg('❌ Gửi thất bại, thử lại sau.')
    } catch (e) {
      setMsg(`❌ ${String(e)}`)
    }
  }

  async function unsubscribe() {
    setStatus('loading')
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) await sub.unsubscribe()
      await fetch('/api/push/subscribe', { method: 'DELETE' })
      setStatus('idle')
      setMsg('')
    } catch (e) {
      setStatus('error')
      setMsg(`❌ ${String(e)}`)
    }
  }

  return (
    <>
      {status === 'subscribed' ? (
        <div className="space-y-2">
          <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-2.5 flex items-center gap-2">
            <span className="text-green-600 font-bold text-sm">✅ Đã bật thông báo nhắc học</span>
          </div>
          <PushScheduleEditor />
          <button onClick={sendTest}
            className="w-full bg-purple-50 text-purple-600 font-bold text-sm py-2.5 rounded-2xl active:scale-95 transition-transform">
            📨 Gửi thử thông báo
          </button>
          <button onClick={unsubscribe}
            className="w-full text-xs text-gray-400 hover:text-red-400 py-1.5 transition-colors">
            Tắt thông báo
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={subscribe}
            disabled={status === 'loading' || status === 'denied' || status === 'unsupported'}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 rounded-2xl disabled:opacity-50 active:scale-95 transition-transform text-sm">
            {status === 'loading'
              ? 'Đang bật...'
              : status === 'denied'
              ? '🚫 Quyền bị từ chối trong cài đặt trình duyệt'
              : status === 'unsupported'
              ? '📲 Cài app để dùng thông báo'
              : '🔔 Bật thông báo nhắc học'}
          </button>
          {status === 'unsupported' && (
            <div className="mt-3 bg-blue-50 border border-blue-100 rounded-2xl p-3.5 space-y-2.5">
              <p className="text-xs font-bold text-blue-700">📲 Cách cài app lên màn hình chính:</p>
              <div className="space-y-1.5">
                <p className="text-xs font-bold text-gray-600">🍎 iPhone / iPad (Safari)</p>
                <p className="text-xs text-gray-500 leading-relaxed">① Bấm nút <span className="font-bold">Chia sẻ</span> <span className="font-mono bg-gray-100 px-1 rounded">⬆️</span> ở thanh dưới Safari</p>
                <p className="text-xs text-gray-500">② Chọn <span className="font-bold">&quot;Thêm vào Màn hình chính&quot;</span></p>
                <p className="text-xs text-gray-500">③ Bấm <span className="font-bold">Thêm</span> → mở app từ icon vừa tạo</p>
              </div>
              <div className="border-t border-blue-100 pt-2 space-y-1.5">
                <p className="text-xs font-bold text-gray-600">🤖 Android (Chrome)</p>
                <p className="text-xs text-gray-500 leading-relaxed">① Bấm menu <span className="font-bold">⋮</span> góc trên phải Chrome</p>
                <p className="text-xs text-gray-500">② Chọn <span className="font-bold">&quot;Thêm vào Màn hình chính&quot;</span> hoặc <span className="font-bold">&quot;Cài đặt ứng dụng&quot;</span></p>
                <p className="text-xs text-gray-500">③ Bấm <span className="font-bold">Thêm</span> → mở app từ icon vừa tạo</p>
              </div>
              <p className="text-[11px] text-blue-400 font-semibold text-center pt-1">Sau khi cài xong, mở lại app và bật thông báo nhắc học tại đây</p>
            </div>
          )}
          {status === 'denied' && (
            <p className="text-xs text-orange-500 font-semibold mt-2 text-center">
              Vào Cài đặt → trình duyệt → Thông báo → cho phép vocabwise.id.vn
            </p>
          )}
        </>
      )}
      {msg && (
        <p className={`text-xs font-bold mt-2 ${msg.startsWith('✅') ? 'text-green-600' : msg.startsWith('⏳') || msg.startsWith('⚠️') ? 'text-amber-600' : 'text-red-500'}`}>{msg}</p>
      )}
    </>
  )
}
