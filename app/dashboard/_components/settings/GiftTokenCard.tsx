'use client'

import { useState } from 'react'
import { APP_URL } from '../../_utils'
import { CollapsibleCard } from '../shared'

export function GiftTokenCard({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)
  const [redeemInput, setRedeemInput] = useState('')
  const [redeemMsg, setRedeemMsg] = useState('')
  const [redeeming, setRedeeming] = useState(false)

  const giftLink = `${APP_URL}/register?gift=${token}`

  async function copyLink() {
    try { await navigator.clipboard.writeText(giftLink) } catch { /* fallback */ }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function redeem() {
    if (!redeemInput.trim()) return
    setRedeeming(true); setRedeemMsg('')
    const res = await fetch('/api/gift/redeem', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: redeemInput.trim() }),
    })
    setRedeeming(false)
    const d = await res.json().catch(() => ({}))
    setRedeemMsg(res.ok ? '🎉 Đã nhận 14 ngày Pro! Vui lòng đăng xuất và đăng nhập lại.' : `❌ ${d.error ?? 'Lỗi'}`)
  }

  return (
    <CollapsibleCard title="🎁 Tặng bạn bè" subtitle="Độc quyền gói Pro 6 tháng · Tặng 1 người bạn 14 ngày Pro miễn phí." defaultOpen={true}>
      <p className="text-xs text-gray-500 font-semibold mb-3">Mã quà tặng của bạn — chỉ dùng được 1 lần:</p>
      <div className="flex items-center gap-2 bg-indigo-50 border-2 border-indigo-200 rounded-2xl px-4 py-3 mb-3">
        <span className="flex-1 font-bold text-indigo-700 text-xl tracking-[0.2em]">{token}</span>
        <button onClick={copyLink}
          className="bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl active:scale-95 transition-transform">
          {copied ? '✅ Copied!' : 'Copy link'}
        </button>
      </div>
      <p className="text-xs text-gray-400 font-semibold mb-4">
        Link: <span className="text-indigo-400 break-all">{giftLink}</span>
      </p>

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs text-gray-500 font-bold mb-2">Nhận mã từ bạn bè? Nhập tại đây:</p>
        <div className="flex gap-2">
          <input
            value={redeemInput}
            onChange={e => setRedeemInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
            placeholder="XXXXXXXX"
            className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-bold tracking-widest text-center focus:outline-none focus:border-indigo-400"
          />
          <button onClick={redeem} disabled={redeeming || redeemInput.length !== 8}
            className="bg-indigo-500 text-white text-sm font-bold px-4 py-2 rounded-xl disabled:opacity-40 active:scale-95 transition-transform">
            {redeeming ? '...' : 'Nhận'}
          </button>
        </div>
        {redeemMsg && (
          <p className={`text-xs font-bold mt-2 ${redeemMsg.startsWith('🎉') ? 'text-green-600' : 'text-red-500'}`}>
            {redeemMsg}
          </p>
        )}
      </div>
    </CollapsibleCard>
  )
}
