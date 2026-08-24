'use client'
import { useState, useEffect, useRef } from 'react'

const PLANS = [
  { key: '1month',  label: '1 tháng',  price: '59.000đ',  amount: 59000,  note: '2 bé',                          badge: null,            badgeCls: '' },
  { key: '3months', label: '3 tháng',  price: '159.000đ', amount: 159000, note: '3 bé · Tiết kiệm 10%',          badge: 'PHỔ BIẾN',      badgeCls: 'bg-orange-400 text-white' },
  { key: '6months', label: '6 tháng',  price: '299.000đ', amount: 299000, note: '3 bé · Tiết kiệm 16%',          badge: 'GIÁ TỐT NHẤT',  badgeCls: 'bg-amber-400 text-amber-900' },
]

const PLAN_EXTRAS: Record<string, string[]> = {
  '1month':  ['✅ 2 hồ sơ bé', '✅ AI phát âm 40 lần/ngày', '✅ Giải nghĩa & gợi ý AI 40 lần/ngày', '✅ Push notification nhắc học', '✅ Báo cáo email thủ công'],
  '3months': ['✅ 3 hồ sơ bé', '✅ AI phát âm không giới hạn', '✅ Giải nghĩa & gợi ý AI không giới hạn', '✅ Module Word Stress', '✅ Báo cáo email tự động hàng tuần'],
  '6months': ['✅ 3 hồ sơ bé', '✅ AI phát âm không giới hạn', '✅ Giải nghĩa & gợi ý AI không giới hạn', '✅ Module Word Stress', '✅ Báo cáo tự động hàng tuần', '🎁 Tặng bạn bè 14 ngày Pro (1 lần)', '📅 Email tổng kết học tập hàng tháng'],
}

const BANK_INFO = {
  bank:    'Timo Bank',
  bankCode: 'TIMO',
  account: '0977347707',
  name:    'NGUYEN TUNG ANH',
  phone:   '0977347707',
}

type Props = {
  onClose: () => void
  username?: string
}

export default function UpgradeModal({ onClose, username }: Props) {
  const [selectedPlan, setSelectedPlan] = useState('3months')
  const [copied, setCopied] = useState(false)
  const [phone, setPhone] = useState(username ?? '')
  const closeBtnRef = useRef<HTMLButtonElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  // Esc to close + focus management (focus close btn on open, restore on unmount)
  useEffect(() => {
    triggerRef.current = (document.activeElement as HTMLElement) ?? null
    closeBtnRef.current?.focus()
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => {
      document.removeEventListener('keydown', handler)
      triggerRef.current?.focus?.()
    }
  }, [onClose])

  const chosen = PLANS.find(p => p.key === selectedPlan) ?? PLANS[1]
  const transferContent = `VocabWise ${chosen.label}${phone.trim() ? ` ${phone.trim()}` : ''}`

  const qrUrl = `https://img.vietqr.io/image/${BANK_INFO.bankCode}-${BANK_INFO.account}-compact2.jpg?amount=${chosen.amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(BANK_INFO.name)}`

  const zaloUrl = `https://zalo.me/${BANK_INFO.phone}`

  async function copyTransfer() {
    await navigator.clipboard.writeText(transferContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center px-4 pb-4 sm:items-center" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="upgrade-modal-title" className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-5 text-center relative">
          <button ref={closeBtnRef} onClick={onClose} aria-label="Đóng" className="absolute right-4 top-4 text-white/70 hover:text-white text-xl leading-none">×</button>
          <h2 id="upgrade-modal-title" className="text-white font-black text-xl flex items-center justify-center gap-2">⭐ Nâng cấp Pro</h2>
          <p className="text-white/80 text-sm font-semibold mt-0.5">5.100+ từ · Daily + Academic · Gói dài = nhiều ưu đãi hơn</p>
        </div>

        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Comparison table */}
          <div className="overflow-x-auto rounded-2xl border border-gray-100">
            <table className="w-full text-xs min-w-[300px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-3 py-2 font-black text-gray-500 w-[38%]">Tính năng</th>
                  <th className="px-1 py-2 font-black text-gray-400 text-center">Free</th>
                  <th className="px-1 py-2 font-black text-purple-600 text-center">1T</th>
                  <th className="px-1 py-2 font-black text-purple-600 text-center">3T</th>
                  <th className="px-1 py-2 font-black text-indigo-600 text-center">6T</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  ['Hồ sơ bé',          '1',       '2',        '3',     '3'  ],
                  ['Chủ đề Daily',       '1/level', '✅',       '✅',    '✅' ],
                  ['Chủ đề Academic',    '1/book',  '✅',       '✅',    '✅' ],
                  ['Phát âm IPA',        '1 bài',   '✅',       '✅',    '✅' ],
                  ['Trọng âm từ',        '❌',      '❌',       '✅',    '✅' ],
                  ['Từ của tôi ⭐',      '20 từ',   '✅',       '✅',    '✅' ],
                  ['Ôn SRS từ yếu',      '20 từ',   '✅',       '✅',    '✅' ],
                  ['Luyện phát âm AI',   '10/ngày', '40/ngày',  '∞',    '∞'  ],
                  ['Giải nghĩa & gợi ý AI', '10/ngày', '40/ngày', '∞',   '∞'  ],
                  ['Nhắc học (Push)',     '❌',      '✅',       '✅',    '✅' ],
                  ['Báo cáo email',       '❌',      'Thủ công', 'Auto', 'Auto'],
                  ['Tổng kết tháng',     '❌',      '❌',       '❌',    '✅' ],
                  ['🎁 Tặng bạn bè',     '❌',      '❌',       '❌',    '✅' ],
                ].map(([feat, free, p1, p3, p6]) => (
                  <tr key={feat} className="hover:bg-gray-50">
                    <td className="px-3 py-2 font-semibold text-gray-700">{feat}</td>
                    <td className="px-1 py-2 text-center text-gray-400">{free}</td>
                    <td className="px-1 py-2 text-center text-purple-600 font-bold">{p1}</td>
                    <td className="px-1 py-2 text-center text-purple-600 font-bold">{p3}</td>
                    <td className="px-1 py-2 text-center text-indigo-600 font-bold">{p6}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Plan selector */}
          <div className="grid grid-cols-3 gap-2">
            {PLANS.map(p => (
              <button
                key={p.key}
                onClick={() => setSelectedPlan(p.key)}
                className={`relative rounded-2xl border-2 p-3 text-center transition-all ${selectedPlan === p.key ? 'border-purple-400 bg-purple-50' : 'border-gray-100 bg-gray-50 hover:border-purple-200'}`}
              >
                {p.badge && (
                  <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap ${p.badgeCls}`}>
                    {p.badge}
                  </span>
                )}
                <p className="font-black text-gray-800 text-sm">{p.label}</p>
                <p className="font-black text-purple-600 text-base mt-0.5">{p.price}</p>
                {p.note && <p className="text-green-600 font-bold text-[10px] mt-0.5 leading-tight">{p.note}</p>}
              </button>
            ))}
          </div>

          {/* Plan-specific extras */}
          <div className="bg-indigo-50 rounded-2xl p-3 space-y-1.5">
            <p className="text-[11px] font-black text-indigo-500 uppercase tracking-wide mb-1">
              {selectedPlan === '1month' ? 'Gói 1 tháng bao gồm:' : selectedPlan === '3months' ? 'Gói 3 tháng bao gồm:' : '👑 Gói 6 tháng bao gồm:'}
            </p>
            {(PLAN_EXTRAS[selectedPlan] ?? []).map(item => (
              <p key={item} className="text-xs font-semibold text-indigo-700">{item}</p>
            ))}
          </div>

          {/* VietQR */}
          <div className="flex flex-col items-center bg-gray-50 rounded-2xl p-4">
            <p className="text-xs font-black text-gray-600 mb-2">📱 Quét QR để chuyển khoản ngay</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt="QR chuyển khoản VietQR"
              width={180}
              height={180}
              className="rounded-xl border border-gray-200"
            />
            <p className="text-[11px] text-gray-400 mt-2 text-center">Quét bằng app ngân hàng bất kỳ · Số tiền & nội dung tự điền</p>
          </div>

          {/* Manual transfer info */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
            <p className="font-black text-gray-800 text-sm">Hoặc chuyển khoản thủ công:</p>
            <div className="bg-white rounded-xl p-2.5 border border-gray-200 text-xs space-y-1.5">
              <div><span className="text-gray-400">Ngân hàng:</span> <strong>{BANK_INFO.bank}</strong></div>
              <div><span className="text-gray-400">Số TK:</span> <strong>{BANK_INFO.account}</strong></div>
              <div><span className="text-gray-400">Tên:</span> <strong>{BANK_INFO.name}</strong></div>
              <div>
                <span className="text-gray-500">Nội dung:</span>{' '}
                <strong className="text-purple-700 break-all">{transferContent}</strong>
              </div>
              <div className="pt-1 border-t border-gray-100">
                <p className="text-gray-500 mb-1">SĐT của bạn (thêm vào nội dung CK):</p>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="09xxxxxxxx"
                  aria-label="Số điện thoại của bạn"
                  className="w-full border border-purple-200 rounded-lg px-2 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-purple-400"
                />
              </div>
            </div>
            <button
              onClick={copyTransfer}
              className={`w-full font-black rounded-xl py-2.5 text-sm transition-all active:scale-95 ${copied ? 'bg-green-500 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
            >
              {copied ? '✅ Đã copy!' : '📋 Copy nội dung chuyển khoản'}
            </button>
          </div>

          {/* Step 3 — send proof */}
          <div className="bg-blue-50 rounded-2xl p-4">
            <p className="font-black text-gray-800 text-sm mb-2">
              <span className="text-purple-600 font-black mr-1">3.</span>
              Gửi ảnh chụp giao dịch để được kích hoạt
            </p>
            <a
              href={zaloUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-black py-3 rounded-xl text-sm transition-colors active:scale-95"
            >
              📸 Gửi ảnh xác nhận thanh toán
            </a>
            <p className="text-[11px] text-gray-400 mt-2 text-center">Admin xác nhận và kích hoạt Pro, chậm nhất 12h</p>
          </div>

          <button onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-500 font-semibold rounded-2xl py-2.5 text-sm transition-colors">
            Để sau
          </button>
        </div>
      </div>
    </div>
  )
}
