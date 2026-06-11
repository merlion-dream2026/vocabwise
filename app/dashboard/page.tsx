'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { buildSyncSummary, computeEarnedBadges, getXpLevel } from '@/lib/badges'
import {
  getPhonicsProgress, getDailyHighestLevel, getDailyProgress, getAcademicProgress, getXPAndBadge,
  type SyncLevel, type SyncAllLevels,
} from '@/lib/childProgress'
import UpgradeBanner from '@/components/UpgradeBanner'
import UpgradeModal from '@/components/UpgradeModal'
import { useExpiryGuard, daysUntilExpiry } from '@/lib/useExpiryGuard'
import ReferralTab from './ReferralTab'
import OnboardingChecklist from '@/components/OnboardingChecklist'

type Child = { id: string; name: string; emoji: string; level: string; theme?: string | null; pin?: string | null; streak?: { current: number; lastActive?: string } }
type Session = { familyId: string; username: string; plan: string; free_trial_expires_at?: string | null; plan_end_date?: string | null; plan_start_date?: string | null; bonus_pro_expires_at?: string | null; max_kids?: number | null; gift_token?: string | null }
type WeakVal = number | { wrong: number; correctStreak: number; lastWrong: string }
type SyncData = {
  seen?: string[]
  weak_words?: Record<string, WeakVal>
  streak?: { current?: number; best?: number; lastActive?: string }
  mastery?: Record<string, { flashcard: boolean; games: string[] }>
  history?: SyncHistory
}
function weakCount(v: WeakVal): number { return typeof v === 'number' ? v : v.wrong }
type HistEntry = { words: number; games: number; xp: number }
type SyncHistory = Record<string, HistEntry>
type SyncAllFull = Record<string, SyncData>
type ChildStats = { child: Child; syncAll: SyncAllFull }

const LEVEL_INFO_MAP: Record<string, { label: string; desc: string; cefr: string }> = {
  seeker:   { label: 'Seeker',   desc: 'Từ vựng nền tảng',  cefr: 'Pre-A1' },
  starter:  { label: 'Starter',  desc: 'Từ vựng cơ bản',    cefr: 'A1'     },
  ranger:   { label: 'Ranger',   desc: 'Từ vựng mở rộng',   cefr: 'A2'     },
  explorer: { label: 'Explorer', desc: 'Từ vựng nâng cao',  cefr: 'B1'     },
  scholar:  { label: 'Scholar',  desc: 'Từ vựng học thuật', cefr: 'B2'     },
  master:   { label: 'Master',   desc: 'Từ vựng chuyên sâu',cefr: 'C1-C2'  },
}

const THEME_COLORS = {
  pink: { grad: 'from-pink-400 to-rose-400',   bar: 'bg-pink-400',  header: 'from-pink-400 to-rose-500',   text: 'text-pink-600',   ring: 'border-pink-400 bg-pink-50'   },
  blue: { grad: 'from-blue-500 to-cyan-400',   bar: 'bg-blue-400',  header: 'from-blue-500 to-cyan-500',   text: 'text-blue-600',   ring: 'border-blue-400 bg-blue-50'   },
}
const DEFAULT_COLOR = { grad: 'from-purple-400 to-indigo-400', bar: 'bg-purple-400', header: 'from-purple-500 to-indigo-500', text: 'text-purple-600', ring: 'border-purple-400 bg-purple-50' }

const VN_DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return { key: d.toISOString().split('T')[0], day: VN_DAYS[d.getDay()], date: `${d.getDate()}/${d.getMonth() + 1}` }
  })
}

function histDotColor(entry: HistEntry | undefined, theme: string): string {
  if (!entry || entry.words + entry.games + entry.xp === 0) return 'bg-gray-200'
  const act = entry.words + entry.games
  if (theme === 'blue') return act >= 8 ? 'bg-blue-500' : act >= 3 ? 'bg-blue-300' : 'bg-blue-200'
  return act >= 8 ? 'bg-pink-500' : act >= 3 ? 'bg-pink-300' : 'bg-pink-200'
}

function fmtHistEntry(e: HistEntry): string {
  const parts: string[] = []
  if (e.words > 0) parts.push(`${e.words} từ`)
  if (e.games > 0) parts.push(`${e.games} game`)
  if (e.xp > 0) parts.push(`+${e.xp} XP`)
  return parts.join(' · ')
}

const PLAN_BADGE: Record<string, { label: string; cls: string }> = {
  free:     { label: 'FREE',     cls: 'bg-white/20 text-white' },
  '2weeks': { label: '🎁 GIFT2W', cls: 'bg-pink-400 text-white' },
  '1month': { label: 'PRO1',     cls: 'bg-white/30 text-white' },
  '3months':{ label: 'PRO3',     cls: 'bg-white/30 text-white' },
  '6months':{ label: 'PRO6',     cls: 'bg-yellow-300 text-yellow-900' },
}

function getPlanBadge(plan: string, planEndDate?: string | null) {
  const isPremiumExpired = plan !== 'free' && planEndDate && new Date(planEndDate) < new Date()
  if (isPremiumExpired) return { label: 'EXPIRED', cls: 'bg-red-400 text-white' }
  return PLAN_BADGE[plan] ?? PLAN_BADGE.free
}

const EMOJIS = ['🧒','👧','👦','🧒🏻','👧🏻','👦🏻','🧒🏽','👧🏽','👦🏽','🌟','🦄','🐻','🐼','🦊','🐸']

function fmtDateTime(d: Date | string): string {
  const dt = typeof d === 'string' ? new Date(d) : d
  const date = dt.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const time = dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${date} lúc ${time}`
}

function formatLastActive(dateStr?: string): string {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (diff === 0) return 'Hôm nay'
  if (diff === 1) return 'Hôm qua'
  if (diff < 7) return `${diff}d trước`
  const d = new Date(dateStr)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

function PwInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border-2 border-gray-200 rounded-2xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-purple-400 pr-11" />
      <button type="button" onClick={() => setShow(s => !s)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm">
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  )
}

// ── Add child modal ────────────────────────────────────────────────────────────
function AddChildModal({ maxKids, childCount, onClose, onAdded }: {
  maxKids: number; childCount: number; onClose: () => void; onAdded: (c: Child) => void
}) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('👧')
  const [theme, setTheme] = useState<'pink' | 'blue'>('pink')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const blocked = childCount >= maxKids

  async function save(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/children', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, emoji, level: 'seeker', theme }),
    })
    setSaving(false)
    if (res.ok) { onAdded(await res.json()) }
    else { const d = await res.json(); setMsg(d.error) }
  }

  const ringCls = theme === 'pink'
    ? 'bg-pink-100 ring-2 ring-pink-400 scale-110'
    : 'bg-blue-100 ring-2 ring-blue-400 scale-110'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl my-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-black text-lg text-gray-800">➕ Thêm hồ sơ bé</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        {blocked ? (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">🔒</div>
            <p className="text-gray-700 font-bold mb-2">Đã đạt giới hạn {maxKids} hồ sơ</p>
            <p className="text-gray-500 text-sm">Liên hệ để nâng cấp và thêm bé.</p>
          </div>
        ) : (
          <form onSubmit={save} className="space-y-4">
            <input value={name} onChange={e => setName(e.target.value)} required placeholder="Tên bé"
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-semibold focus:outline-none focus:border-purple-400" />

            {/* Theme picker */}
            <div>
              <p className="text-xs font-bold text-gray-500 mb-2">Theme màu</p>
              <div className="grid grid-cols-2 gap-2">
                {(['pink', 'blue'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setTheme(t)}
                    className={`border-2 rounded-2xl p-3 text-center transition-all ${theme === t ? (t === 'pink' ? 'border-pink-400 bg-pink-50' : 'border-blue-400 bg-blue-50') : 'border-gray-200 hover:border-gray-300'}`}>
                    <div className="text-2xl mb-1">{t === 'pink' ? '🩷' : '💙'}</div>
                    <div className="font-black text-sm text-gray-700">{t === 'pink' ? 'Bé gái' : 'Bé trai'}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Emoji */}
            <div>
              <p className="text-xs font-bold text-gray-500 mb-2">Emoji</p>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map(e => (
                  <button key={e} type="button" onClick={() => setEmoji(e)}
                    className={`text-2xl p-1.5 rounded-xl transition-all ${emoji === e ? ringCls : 'hover:bg-gray-100'}`}>{e}</button>
                ))}
              </div>
            </div>

            {msg && <p className="text-sm text-red-500 font-semibold">{msg}</p>}
            <button type="submit" disabled={saving || !name.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black py-3 rounded-2xl disabled:opacity-50 active:scale-95 transition-transform">
              {saving ? 'Đang tạo...' : 'Tạo hồ sơ'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ── Edit child modal ──────────────────────────────────────────────────────────
function EditChildModal({ child, onClose, onSaved, onDeleted }: {
  child: Child; onClose: () => void; onSaved: (c: Child) => void; onDeleted: (id: string) => void
}) {
  const [name, setName] = useState(child.name)
  const [emoji, setEmoji] = useState(child.emoji)
  const [theme, setTheme] = useState<'pink' | 'blue'>((child.theme as 'pink' | 'blue') ?? 'pink')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [msg, setMsg] = useState('')

  async function save(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/children/${child.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, emoji, theme }),
    })
    setSaving(false)
    if (res.ok) { onSaved(await res.json()) }
    else { const d = await res.json(); setMsg(`❌ ${d.error}`) }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    const res = await fetch(`/api/children/${child.id}`, { method: 'DELETE' })
    if (res.ok) { onDeleted(child.id) }
    else { const d = await res.json(); setMsg(`❌ ${d.error}`) }
  }

  const ringCls = theme === 'pink'
    ? 'bg-pink-100 ring-2 ring-pink-400 scale-110'
    : 'bg-blue-100 ring-2 ring-blue-400 scale-110'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl my-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-black text-lg text-gray-800">✏️ Sửa hồ sơ</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <form onSubmit={save} className="space-y-4">
          <input value={name} onChange={e => setName(e.target.value)} required
            className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 font-semibold focus:outline-none focus:border-purple-400" />

          {/* Theme */}
          <div>
            <p className="text-xs font-bold text-gray-500 mb-2">Theme màu</p>
            <div className="grid grid-cols-2 gap-2">
              {(['pink', 'blue'] as const).map(t => (
                <button key={t} type="button" onClick={() => setTheme(t)}
                  className={`border-2 rounded-2xl p-3 text-center transition-all ${theme === t ? (t === 'pink' ? 'border-pink-400 bg-pink-50' : 'border-blue-400 bg-blue-50') : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="text-2xl mb-1">{t === 'pink' ? '🩷' : '💙'}</div>
                  <div className="font-black text-sm text-gray-700">{t === 'pink' ? 'Bé gái' : 'Bé trai'}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Emoji */}
          <div className="flex flex-wrap gap-2">
            {EMOJIS.map(e => (
              <button key={e} type="button" onClick={() => setEmoji(e)}
                className={`text-2xl p-1.5 rounded-xl transition-all ${emoji === e ? ringCls : 'hover:bg-gray-100'}`}>{e}</button>
            ))}
          </div>

          {msg && <p className="text-sm">{msg}</p>}
          <button type="submit" disabled={saving}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-black py-3 rounded-2xl disabled:opacity-50">
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>
        <button onClick={handleDelete}
          className={`w-full mt-3 rounded-2xl py-2.5 text-sm font-bold transition-colors ${confirmDelete ? 'bg-red-500 text-white' : 'text-red-400 hover:bg-red-50'}`}>
          {confirmDelete ? '⚠️ Xác nhận xóa?' : 'Xóa hồ sơ'}
        </button>
      </div>
    </div>
  )
}

// ── FAQ card ──────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    group: '📱 Cấu trúc & nội dung',
    items: [
      {
        q: 'App có mấy level và bao nhiêu từ vựng?',
        a: '6 levels từ Pre-A1 đến C1-C2 (tất cả đã hoàn thiện):\n🌱 Seeker (Pre-A1) · ⭐ Starter (A1) · 🏕️ Ranger (A2) · 🔭 Explorer (B1) · 🎓 Scholar (B2) · 🏆 Master (C1-C2)\n\nMỗi level: 30 chủ đề × 10–15 từ. Tổng toàn app: ~2.360 từ vựng.',
      },
      {
        q: 'Một chủ đề gồm những gì?',
        a: 'Mỗi chủ đề có 10–15 từ vựng. Mỗi từ bao gồm:\n• Từ tiếng Anh + nghĩa tiếng Việt\n• Emoji minh họa\n• 2 câu ví dụ song ngữ (English + Việt)\n\nNgoài ra, mỗi chủ đề có 1 Mini Story — câu chuyện ngắn dùng các từ vừa học để giúp bé ghi nhớ trong ngữ cảnh thực tế.',
      },
    ],
  },
  {
    group: '🏆 Tiêu chí hoàn thành (Mastery)',
    items: [
      {
        q: 'Khi nào một chủ đề được tính là "xong"?',
        a: 'Bé phải hoàn thành đủ 2 điều kiện:\n① Xem hết Flashcard tất cả từ trong chủ đề\n② Đạt kết quả tốt trong ít nhất 3 trò chơi khác nhau\n\nChủ đề xong sẽ hiển thị 🏆 và được tính vào ✅ trên dashboard.',
      },
      {
        q: 'App có những trò chơi gì?',
        a: 'Level cơ bản (Seeker / Starter / Ranger) — 10 trò:\n📖 Flashcard từ mới · 👂 Nghe & Chọn · ✅ Đúng / Sai · 🖼️ Nối từ với hình · 🧠 Lật thẻ · 🫧 Bắn bong bóng · 🔡 Điền chữ thiếu · 🔤 Đánh vần · 🔁 Sắp xếp câu · 🎤 Phát âm cùng AI ✨\n\nLevel nâng cao (Explorer / Scholar / Master) — 10 trò:\n📖 Flashcard từ mới · 👂 Nghe & Chọn · ✅ Đúng / Sai · 🖼️ Nối từ với hình · ❓ Trắc nghiệm · ✏️ Điền từ · ⌨️ Gõ từ nhanh 15s · 🔀 Ghép định nghĩa · 🔁 Sắp xếp câu · 🎤 Phát âm cùng AI ✨\n\nNgoài ra, mỗi chủ đề đều có 📖 Mini Story tích hợp ngay trong trang chủ đề — bé đọc chuyện, nghe audio, rồi làm bài điền từ ngay tại chỗ.',
      },
    ],
  },
  {
    group: '📊 Đọc hiểu Progress Card',
    items: [
      {
        q: 'Các ký hiệu trên thẻ tiến độ nghĩa là gì?',
        a: '% · X/N từ → Số từ bé đã học / tổng từ của level đó\n✅ X/30 chủ đề → Chủ đề hoàn thành đủ flashcard + 3 games\n🔤 Phát âm X/23 nhóm 🏆 → Nhóm âm IPA bé đã thành thạo (học + 3 game đạt ≥70%)\n🔥 Streak → Số ngày học liên tiếp không bỏ ngày nào\n⚠️ Từ yếu → Từ bé trả lời sai nhiều lần, cần ôn thêm\n📅 Ngày → Lần gần nhất bé có hoạt động học\n🏅 Badges → Huy hiệu đạt được theo cột mốc học tập',
      },
      {
        q: '🔤 Module Luyện Phát Âm IPA là gì?',
        a: 'Ngoài học từ vựng, bé còn có thể luyện phát âm tiếng Anh theo chuẩn IPA — module "Luyện Phát Âm" xuất hiện dưới dạng card 🔤 trên màn hình chọn level của bé.\n\nModule độc lập với các level từ vựng — bé học phát âm song song với học từ.\n\nCó 3 nhóm âm:\n• 🎵 Nguyên âm: /iː/ vs /ɪ/, /æ/ vs /e/, và các diphthongs\n• 🔊 Phụ âm: /p/ vs /b/, /θ/ vs /ð/...\n• 🇻🇳 Khó với người Việt: /l/ vs /r/, âm cuối, cụm phụ âm\n\nMỗi nhóm âm thành thạo khi bé: học xem thẻ âm + hoàn thành 3 game đạt ≥70%.\nProgress tracking hiện trên dashboard: 🔤 X/23 nhóm 🏆',
      },
      {
        q: 'Các huy hiệu (badges) có ý nghĩa gì?',
        a: 'Hệ thống huy hiệu tạo động lực cho bé:\n🌱 Ham Học — học 10 từ đầu tiên\n🎯 Tập Trung — hoàn thành 5 lượt game\n🏅 Chinh Phục — xong 1 chủ đề hoàn toàn\n🏆 Xuất Sắc — xong 5 chủ đề\n⭐ Toàn Vẹn — streak 7 ngày liên tiếp\n... và nhiều huy hiệu khác khi đạt các cột mốc cao hơn.',
      },
    ],
  },
  {
    group: '💡 Hướng dẫn học hiệu quả',
    items: [
      {
        q: 'Bé có thể tự học một mình không?',
        a: 'Với bé dưới 10 tuổi, ba/mẹ nên ngồi cùng — ít nhất trong những buổi đầu — để hướng dẫn cách dùng app, giải thích nghĩa từ, và động viên khi bé làm sai.\n\nKinh nghiệm thực tế: các bé còn nhỏ chưa có tính tự giác cao, dễ bỏ cuộc khi gặp từ khó hoặc thua game. Sự có mặt và cổ vũ của ba/mẹ tạo ra sự khác biệt rất lớn — giúp bé vui hơn, kiên trì hơn và học hiệu quả hơn.\n\nGợi ý: biến việc học thành "giờ học cùng nhau" — ba/mẹ cùng đọc từ, cùng chơi game, khen ngợi khi bé đúng. Khi bé đã quen (thường sau 1–2 tuần), bé sẽ tự tin dùng app một mình hơn.',
      },
      {
        q: 'Lịch học như thế nào là tốt nhất?',
        a: '15–20 phút/ngày đều đặn tốt hơn học dồn 1–2 tiếng/tuần.\n\nStreak 🔥 chính là chỉ số đo tính kiên trì — hãy giúp bé duy trì streak càng dài càng tốt. Chỉ cần học 1 chủ đề mỗi ngày là đủ để giữ streak.',
      },
      {
        q: 'Thứ tự học trong một chủ đề?',
        a: '① Flashcard từ mới — làm quen và ghi nhớ từ\n② Nghe & Chọn / Đúng & Sai / Nối từ với hình — luyện nhận diện\n③ Điền chữ thiếu / Đánh vần / Sắp xếp câu — củng cố chính tả và ngữ pháp\n④ 🎤 Phát âm cùng AI ✨ — luyện phát âm, bé nghe lại giọng của chính mình\n⑤ Mini Story 📖 — đọc câu chuyện tích hợp sẵn trong trang topic, rồi làm bài điền từ ngay bên dưới\n\nKhông cần làm tất cả trong 1 buổi. Mỗi game hoàn thành tốt tính là 1 "sao" cho chủ đề đó.',
      },
      {
        q: 'Khi nào chuyển sang level tiếp theo?',
        a: 'Khi bé hoàn thành >70% chủ đề của level hiện tại và cảm thấy tự tin với các từ đã học.\n\nBé vẫn có thể quay lại level cũ bất cứ lúc nào — màn hình chọn level hiển thị % tiến độ từng level để bé và phụ huynh theo dõi.',
      },
    ],
  },
  {
    group: '⭐ Sau khi mua Pro — cần làm gì?',
    items: [
      {
        q: 'Vừa mua Pro xong, tôi cần làm những gì?',
        a: 'Sau khi thanh toán và được kích hoạt Pro, bạn nên làm 3 việc ngay:\n\n① Đổi mật khẩu (bắt buộc)\nMật khẩu ban đầu do admin đặt. Vào Dashboard → Settings → "🔑 Đổi mật khẩu" để đổi sang mật khẩu riêng của gia đình.\n\n② Tạo hồ sơ cho bé\nVào Dashboard → "➕ Thêm hồ sơ bé". Tạo hồ sơ riêng cho từng bé với tên và emoji. Bé có thể tự chọn level phù hợp khi bắt đầu học. Gói Pro mặc định tối đa 3 bé.\n\n③ Cài app lên màn hình chính\nMở trình duyệt trên điện thoại → Bấm "Chia sẻ" (iPhone) hoặc menu "⋮" (Android) → "Thêm vào màn hình chính" — dùng như app thật, không cần cài từ App Store.',
      },
      {
        q: 'Làm sao đổi mật khẩu?',
        a: 'Dashboard → tab ⚙️ Cài đặt → mục "🔑 Đổi mật khẩu"\n\n① Nhập mật khẩu hiện tại (mật khẩu admin đã cấp)\n② Nhập mật khẩu mới (tối thiểu 6 ký tự)\n③ Xác nhận mật khẩu mới → bấm "Đổi mật khẩu"\n\nSau khi đổi thành công, lần đăng nhập tiếp theo dùng mật khẩu mới. Lưu ý: nếu quên mật khẩu mới, liên hệ admin để reset.',
      },
      {
        q: 'Tôi quên mật khẩu thì làm sao?',
        a: 'Vào trang đăng nhập → bấm "Quên mật khẩu?" → nhập email đăng ký → bấm Gửi.\n\nHệ thống sẽ gửi link đặt lại mật khẩu vào email của bạn (hiệu lực 1 giờ). Bấm vào link → nhập mật khẩu mới → đăng nhập lại bình thường.\n\nLưu ý: kiểm tra hòm thư rác nếu không thấy email. Nếu vẫn không nhận được, liên hệ admin qua Zalo 0977 347 707.',
      },
      {
        q: 'Gói Pro tạo được mấy hồ sơ bé? Dùng được trên mấy thiết bị?',
        a: '👶 Hồ sơ bé theo gói:\n• Pro 1 tháng: tối đa 2 hồ sơ bé\n• Pro 3 tháng và 6 tháng: tối đa 3 hồ sơ bé\nMỗi bé có tiến độ, streak, huy hiệu và lịch sử học riêng biệt.\n\n📱 Thiết bị: không giới hạn. Cả gia đình dùng chung 1 tài khoản — Ba/Mẹ xem dashboard trên điện thoại, bé học trên máy tính bảng — dữ liệu đồng bộ tự động.\n\n⚠️ Tài khoản chỉ dành cho 1 gia đình. Chia sẻ cho gia đình khác vi phạm điều khoản và có thể bị khóa tài khoản.',
      },
      {
        q: 'Gói Pro hết hạn thì dữ liệu có mất không? Gia hạn như thế nào?',
        a: '💾 Dữ liệu: tiến độ, streak, huy hiệu của bé được lưu trên server và KHÔNG bị xóa khi hết hạn. Sau khi gia hạn, bé tiếp tục từ chỗ đã học — không mất gì.\n\n🔄 Gia hạn: liên hệ admin qua Zalo 0977 347 707 trước khi hết hạn để được hỗ trợ gia hạn. Thanh toán chuyển khoản → admin kích hoạt trong vòng 24 giờ.\n\nApp sẽ hiển thị cảnh báo ⏰ khi còn 3 ngày là hết hạn để nhắc bạn gia hạn kịp thời.',
      },
    ],
  },
  {
    group: '🔧 Tính năng & cài đặt',
    items: [
      {
        q: 'PIN bảo vệ và Reset dùng khi nào?',
        a: '🔒 PIN (Cài đặt → PIN cho bé): đặt mã 4 số nếu nhiều bé dùng chung thiết bị — bé phải nhập đúng PIN mới vào học được, tránh nhầm lẫn hồ sơ.\n\n🔄 Reset (Cài đặt → Reset tiến độ): dùng khi bé muốn bắt đầu lại từ đầu hoàn toàn. ⚠️ Toàn bộ tiến độ, streak và huy hiệu sẽ bị xóa vĩnh viễn.',
      },
      {
        q: 'Báo cáo email tự động hoạt động như thế nào?',
        a: 'Vào Cài đặt → "📬 Báo cáo qua email" để thiết lập:\n\n• Gói Pro 1 tháng: gửi thủ công (bấm "Gửi ngay" bất kỳ lúc nào)\n• Gói Pro 3 tháng và 6 tháng: ngoài gửi thủ công, có thể bật tự động hàng tuần vào một ngày cố định trong tuần\n\nBáo cáo gồm: số từ đã học, topics hoàn thành, streak hiện tại, từ yếu cần ôn và huy hiệu của bé.\n\nLưu ý: cần có email đăng ký tài khoản để nhận báo cáo.',
      },
      {
        q: 'Email tổng kết hàng tháng là gì? (Pro 6 tháng)',
        a: 'Tính năng độc quyền dành cho gói Pro 6 tháng.\n\nVào ngày 1 mỗi tháng, hệ thống tự động gửi email tổng kết tháng vừa rồi cho từng bé, bao gồm:\n• Số ngày học / tổng số ngày trong tháng\n• Tổng từ học được, lượt game, XP tháng này\n• So sánh với tháng trước (↑ tăng / ↓ giảm)\n• Streak hiện tại, topics hoàn thành và badges\n\nĐể bật: Cài đặt → "📬 Báo cáo qua email" → bật toggle "Tổng kết hàng tháng".',
      },
      {
        q: 'Gift code "Tặng bạn bè" dùng như thế nào? (Pro 6 tháng)',
        a: 'Tính năng độc quyền dành cho gói Pro 6 tháng.\n\nKhi kích hoạt gói 6 tháng, hệ thống tự động tạo cho bạn 1 mã quà tặng 8 ký tự (ví dụ: ABCD1234). Bạn tìm thấy mã này trong Cài đặt → card "🎁 Tặng bạn bè".\n\nCách dùng:\n① Copy link hoặc mã chia sẻ cho bạn bè\n② Bạn bè đăng ký VocabWise và nhập mã vào ô "Nhận mã từ bạn bè"\n③ Bạn bè nhận ngay 14 ngày Pro miễn phí\n\nLưu ý: mã chỉ dùng được 1 lần và sau khi dùng sẽ không thể khôi phục.',
      },
    ],
  },
  {
    group: '⭐ So sánh các gói Pro',
    items: [
      {
        q: 'Pro 1 tháng, 3 tháng và 6 tháng khác nhau thế nào?',
        a: 'Tất cả gói Pro đều có đầy đủ:\n✅ 180 chủ đề · 4.500+ từ vựng (6 levels)\n✅ 10 trò chơi/chủ đề · Mini Story audio\n✅ Module phát âm IPA đầy đủ\n✅ SRS ôn tập từ yếu · Push notification nhắc học\n✅ Dashboard phụ huynh · Không giới hạn thiết bị\n\nĐiểm khác biệt:\n• Pro 1 tháng (59k): 2 hồ sơ bé · AI phát âm 30 lần/ngày · Báo cáo email thủ công\n• Pro 3 tháng (53k/th): 3 hồ sơ bé · AI không giới hạn · Module Word Stress · Báo cáo tự động hàng tuần\n• Pro 6 tháng (50k/th): Tất cả như 3 tháng + 🎁 Tặng bạn bè 14 ngày Pro + 📅 Email tổng kết học hàng tháng',
      },
      {
        q: 'Module Word Stress là gì? (Pro 3 tháng trở lên)',
        a: 'Module Word Stress giúp bé luyện nhấn âm — kỹ năng quan trọng để phát âm tiếng Anh tự nhiên và dễ hiểu.\n\nTrong tiếng Anh, từ nhiều âm tiết luôn có 1 âm được nhấn mạnh hơn (ví dụ: PREsent vs preSENT). Đọc sai trọng âm khiến người bản ngữ khó hiểu, dù phát âm từng âm đúng.\n\nModule này đi kèm với module Phonics, truy cập qua màn hình học Phonics của bé.',
      },
    ],
  },
]

function FaqCard() {
  const [open, setOpen] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(true)

  function toggle(key: string) {
    setOpen(o => o === key ? null : key)
  }

  return (
    <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
        <div className="text-left">
          <h2 className="font-black text-gray-800 text-base">❓ Câu hỏi thường gặp</h2>
          {collapsed && <p className="text-xs text-gray-400 font-semibold mt-0.5">Hướng dẫn sử dụng app hiệu quả</p>}
        </div>
        <span className={`text-gray-400 font-black text-sm flex-shrink-0 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}>▾</span>
      </button>

      {!collapsed && <div className="border-t border-gray-100 divide-y divide-gray-50">
        {FAQ_ITEMS.map(group => (
          <div key={group.group}>
            {/* Group header */}
            <div className="px-5 py-2 bg-gray-50">
              <p className="text-xs font-black text-gray-500 uppercase tracking-wider">{group.group}</p>
            </div>

            {group.items.map((item, i) => {
              const key = `${group.group}-${i}`
              const isOpen = open === key
              return (
                <div key={key} className="border-t border-gray-100 first:border-t-0">
                  <button
                    onClick={() => toggle(key)}
                    className="w-full text-left px-5 py-3.5 flex items-start justify-between gap-3 hover:bg-gray-50 transition-colors">
                    <p className="text-sm font-bold text-gray-700 leading-snug">{item.q}</p>
                    <span className={`text-gray-400 font-black text-sm flex-shrink-0 mt-0.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                      ▾
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4">
                      <div className="bg-gray-50 rounded-2xl p-3.5">
                        {item.a.split('\n').map((line, j) => (
                          <p key={j} className={`text-xs text-gray-600 leading-relaxed ${j > 0 && line === '' ? 'mt-2' : j > 0 ? 'mt-1' : ''}`}>
                            {line || <span className="block h-1" />}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>}
    </div>
  )
}

// ── Dashboard tab ─────────────────────────────────────────────────────────────
function DashboardTab({ stats, loading, onRefresh, onChildClick, onEditChild, session, onAddChild }: {
  stats: ChildStats[]
  loading: boolean
  onRefresh: () => void
  onChildClick: (child: Child) => void
  onEditChild: (child: Child) => void
  session: Session
  onAddChild: () => void
}) {
  const [lastRefresh, setLastRefresh] = useState<string | null>(null)
  const [expandedHistory, setExpandedHistory] = useState<Record<string, boolean>>({})
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)

  useEffect(() => {
    setSelectedChildId(prev => {
      if (stats.length === 0) return null
      if (prev && stats.find(s => s.child.id === prev)) return prev
      return stats[0].child.id
    })
  }, [stats])

  useEffect(() => {
    if (!loading) {
      const now = new Date()
      setLastRefresh(now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }))
    }
  }, [loading])

  if (loading && stats.length === 0) return <div className="flex justify-center py-16"><p className="text-gray-400 font-bold">Đang tải...</p></div>

  // Onboarding checklist data
  const hasPlayedGame = stats.some(s =>
    Object.values(s.syncAll).some(lv =>
      Object.values(lv.mastery ?? {}).some(m => m.games.length > 0)
    )
  )
  const hasViewedFlashcard = stats.some(s =>
    Object.values(s.syncAll).some(lv =>
      Object.values(lv.mastery ?? {}).some(m => m.flashcard)
    )
  )
  const firstChild = stats[0]?.child

  return (
    <div className="space-y-5">
      {/* Onboarding checklist — hiện cho user mới chưa hoàn thành */}
      <OnboardingChecklist
        familyId={session.familyId}
        hasChildren={stats.length > 0}
        childId={firstChild?.id}
        childLevel={firstChild?.level}
        hasPlayedGame={hasPlayedGame}
        hasViewedFlashcard={hasViewedFlashcard}
      />

      {/* Freemium banner — top so free users always see it */}
      {session.plan === 'free' && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-4 text-center">
          <p className="text-sm text-purple-700 font-bold">🔒 Gói Free: tối đa {session.max_kids ?? 1} hồ sơ · 1 chủ đề/level</p>
          <p className="text-xs text-purple-500 mt-1">Nâng cấp Pro để mở toàn bộ 4.500+ từ và 10 game</p>
        </div>
      )}

      {/* FAQ */}
      <FaqCard />

      {/* Child tabs + add button */}
      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {stats.map(({ child }) => {
          const isActive = child.id === selectedChildId
          const c = child.theme && THEME_COLORS[child.theme as 'pink' | 'blue'] ? THEME_COLORS[child.theme as 'pink' | 'blue'] : DEFAULT_COLOR
          return (
            <button key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl font-black text-sm whitespace-nowrap flex-shrink-0 transition-all ${
                isActive ? `${c.bar} text-white shadow-md` : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300'
              }`}>
              <span>{child.emoji}</span>
              <span>{child.name}</span>
            </button>
          )
        })}
        <button onClick={onAddChild}
          className="flex items-center justify-center w-10 h-10 rounded-2xl font-black text-lg flex-shrink-0 bg-white text-purple-400 border-2 border-dashed border-purple-200 hover:bg-purple-50 transition-all">
          +
        </button>
      </div>

      {/* Selected child card */}
      {stats.length > 0 && (
        <div>
          {stats.filter(s => s.child.id === selectedChildId).map(({ child, syncAll }) => {
            const c = child.theme && THEME_COLORS[child.theme as 'pink' | 'blue']
              ? THEME_COLORS[child.theme as 'pink' | 'blue']
              : DEFAULT_COLOR

            // Progress from shared lib (all modules, consistent with kids card)
            const highestLevel  = getDailyHighestLevel(syncAll as SyncAllLevels)
            const activeLevel   = highestLevel ?? child.level
            const { totalXP, badge: xpBadge } = getXPAndBadge(syncAll as SyncAllLevels)
            const phonics = getPhonicsProgress(syncAll['phonics'] as SyncLevel | undefined)
            const daily   = getDailyProgress(syncAll[activeLevel] as SyncLevel | undefined, activeLevel)
            const acad    = getAcademicProgress(syncAll['academic'] as SyncLevel | undefined)
            const levelInfo = LEVEL_INFO_MAP[activeLevel]

            const dailyPct   = daily.totalWords  > 0 ? Math.round(daily.seenWords   / daily.totalWords  * 100) : 0
            const phonicsPct = phonics.total     > 0 ? Math.round(phonics.seen      / phonics.total     * 100) : 0
            const acadPct    = acad.total        > 0 ? Math.round(acad.completed    / acad.total        * 100) : 0

            // Streak + last active from child record
            const streakCur   = child.streak?.current ?? 0
            const lastActive  = formatLastActive(child.streak?.lastActive)

            // Weak words from active Daily level
            const weakEntries = Object.entries(syncAll[activeLevel]?.weak_words ?? {})
              .sort((a, b) => weakCount(b[1]) - weakCount(a[1])).slice(0, 8)

            // Badges from active level
            const summary   = buildSyncSummary(syncAll[activeLevel] as Parameters<typeof buildSyncSummary>[0])
            const xpInfo    = getXpLevel(summary.xp)
            const topBadges = computeEarnedBadges(summary).slice(0, 3)

            // History — combined across all modules
            const hist: Record<string, HistEntry> = {}
            for (const lvData of Object.values(syncAll)) {
              for (const [day, entry] of Object.entries((lvData as { history?: Record<string, HistEntry> }).history ?? {})) {
                if (!hist[day]) hist[day] = { words: 0, games: 0, xp: 0 }
                hist[day].words += entry.words ?? 0
                hist[day].games += entry.games ?? 0
                hist[day].xp   += entry.xp    ?? 0
              }
            }
            const last7         = getLast7Days()
            const childTheme    = child.theme ?? 'pink'
            const isHistExpanded = expandedHistory[child.id] ?? false

            return (
              <div key={child.id} className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm overflow-hidden">

                {/* Header: avatar + name + XP/streak + edit */}
                <div className="flex items-start gap-3 px-4 pt-4 pb-3">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.grad} flex items-center justify-center text-2xl flex-shrink-0 shadow-sm`}>
                    {child.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-gray-800 text-base leading-tight truncate">{child.name}</p>
                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      {totalXP > 0 && <span className="text-xs font-black text-yellow-600">⭐ {totalXP.toLocaleString()} XP</span>}
                      {xpBadge && <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-full ${xpBadge.cls}`}>{xpBadge.icon} {xpBadge.label}</span>}
                      {!xpBadge && totalXP === 0 && <span className="text-[11px] text-gray-400 font-semibold">{xpInfo.emoji} {xpInfo.name}</span>}
                      {streakCur > 0 && <span className="text-[11px] font-black text-orange-500">🔥 {streakCur} ngày</span>}
                      {lastActive && <span className="text-[11px] text-gray-400 font-semibold">📅 {lastActive}</span>}
                    </div>
                  </div>
                  <button onClick={() => onEditChild(child)}
                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-gray-300 hover:text-purple-500 hover:bg-purple-50 transition-colors mt-0.5">
                    ✏️
                  </button>
                </div>

                {/* Module progress rows (clickable → navigate to child) */}
                <button onClick={() => onChildClick(child)} className="w-full px-4 pb-3 text-left active:bg-gray-50/80 transition-colors">
                  <div className="space-y-2.5">

                    {/* Daily */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className={`font-bold ${c.text}`}>📚 {levelInfo?.label ?? activeLevel} · {levelInfo?.cefr ?? ''}</span>
                        <span className="text-gray-500 font-semibold">{daily.topicsCompleted}/30 chủ đề · {daily.seenWords}/{daily.totalWords} từ</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${c.bar} rounded-full transition-all`} style={{ width: `${Math.max(dailyPct, daily.seenWords > 0 ? 2 : 0)}%` }} />
                        </div>
                        <span className="text-[11px] text-gray-400 font-semibold flex-shrink-0">{dailyPct}%</span>
                      </div>
                    </div>

                    {/* Phonics */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-amber-600">🔤 Phát âm</span>
                        <span className="text-gray-500 font-semibold">
                          {phonics.seen === 0 ? `0/${phonics.total} bài` : `${phonics.seen}/${phonics.total} bài · 🏆 ${phonics.mastered} thành thạo`}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all"
                          style={{ width: `${Math.max(phonicsPct, phonics.seen > 0 ? 2 : 0)}%` }} />
                      </div>
                    </div>

                    {/* Academic */}
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-blue-600">🎓 {acad.book ? `${acad.book} · ${acad.cefr}` : 'Academic'}</span>
                        {acad.book
                          ? <span className="text-gray-500 font-semibold">{acad.completed}/{acad.total} chủ đề</span>
                          : <span className="text-gray-400 font-semibold">Chưa bắt đầu</span>}
                      </div>
                      {acad.book && (
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full transition-all"
                            style={{ width: `${Math.max(acadPct, acad.completed > 0 ? 2 : 0)}%` }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Weak words + badges */}
                  <div className="mt-3 space-y-1.5">
                    {weakEntries.length > 0 ? (
                      <div>
                        <p className="text-xs font-bold text-orange-500 mb-1">⚠️ Từ yếu cần ôn</p>
                        <div className="flex flex-wrap gap-1">
                          {weakEntries.map(([word, val]) => (
                            <span key={word} className="bg-orange-50 border border-orange-200 rounded-xl px-2 py-0.5 text-xs font-bold text-orange-700">
                              {word} <span className="text-orange-400">×{weakCount(val)}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-green-500">✨ Không có từ yếu</span>
                    )}
                    {topBadges.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {topBadges.map(b => (
                          <span key={b.id} className="inline-flex items-center gap-0.5 text-xs font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full">
                            {b.emoji} {b.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>

                {/* History — collapsible, combined across all modules */}
                <div className="border-t border-gray-100">
                  <button
                    onClick={() => setExpandedHistory(prev => ({ ...prev, [child.id]: !isHistExpanded }))}
                    className="w-full px-3 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-gray-400">📅</span>
                      <div className="flex items-center gap-0.5">
                        {last7.map(d => (
                          <span key={d.key} className={`w-2 h-2 rounded-full ${histDotColor(hist[d.key], childTheme)}`} />
                        ))}
                      </div>
                    </div>
                    <span className={`text-gray-400 text-xs font-black transition-transform duration-200 ${isHistExpanded ? 'rotate-180' : ''}`}>▾</span>
                  </button>

                  {isHistExpanded && (
                    <div className="px-3 pb-3 space-y-1">
                      {last7.filter(d => hist[d.key] && (hist[d.key].words + hist[d.key].games + hist[d.key].xp) > 0)
                        .reverse()
                        .map(d => (
                          <div key={d.key} className="flex items-center justify-between text-xs">
                            <span className="text-gray-400 font-semibold">{d.date} {d.day}</span>
                            <span className="text-gray-600 font-bold">{fmtHistEntry(hist[d.key])}</span>
                          </div>
                        ))
                      }
                      {last7.every(d => !hist[d.key] || hist[d.key].words + hist[d.key].games + hist[d.key].xp === 0) && (
                        <p className="text-xs text-gray-400 font-semibold text-center py-1">Chưa có hoạt động</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {stats.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">👨‍👩‍👧</div>
          <p className="font-bold mb-4">Chưa có hồ sơ nào</p>
          <button onClick={onAddChild}
            className="bg-purple-500 text-white font-black px-6 py-3 rounded-2xl hover:bg-purple-600 active:scale-95 transition-all text-sm">
            + Thêm hồ sơ bé
          </button>
        </div>
      )}

      <button onClick={onRefresh} disabled={loading}
        className="w-full bg-white border-2 border-gray-200 rounded-2xl py-3 font-black text-gray-500 active:scale-95 transition-transform disabled:opacity-50">
        {loading ? '⏳ Đang tải...' : '🔄 Tải lại'}
        {lastRefresh && !loading && (
          <span className="block text-xs font-semibold text-gray-400 mt-0.5">Cập nhật lúc {lastRefresh}</span>
        )}
      </button>
    </div>
  )
}

type ReportSettings = { enabled: boolean; schedule: 'manual' | 'weekly'; day: number; monthly_recap: boolean }
const DEFAULT_REPORT: ReportSettings = { enabled: false, schedule: 'manual', day: 1, monthly_recap: false }

function ReportSettingsContent({ plan }: { plan: string }) {
  const [settings, setSettings] = useState<ReportSettings>(DEFAULT_REPORT)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    fetch('/api/report/settings').then(r => r.json()).then(d => {
      setSettings({ ...DEFAULT_REPORT, ...d })
      setLoaded(true)
    }).catch(() => setLoaded(true))
  }, [])

  async function save() {
    setSaving(true); setMsg('')
    const res = await fetch('/api/report/settings', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    setSaving(false)
    setMsg(res.ok ? '✅ Đã lưu' : '❌ Lỗi lưu cài đặt')
    setTimeout(() => setMsg(''), 2500)
  }

  async function sendNow() {
    setSending(true); setMsg('')
    const res = await fetch('/api/report/send', { method: 'POST' })
    setSending(false)
    const d = await res.json().catch(() => ({}))
    setMsg(res.ok ? '✅ Đã gửi email!' : `❌ ${d.error ?? 'Lỗi gửi email'}`)
    setTimeout(() => setMsg(''), 4000)
  }

  if (!loaded) return null

  return (
    <>
      {/* Toggle */}
      <div className="flex items-center justify-between mb-4 pr-1">
        <span className="text-sm font-bold text-gray-700">Tự động gửi hàng tuần</span>
        <button
          onClick={() => setSettings(s => ({ ...s, enabled: !s.enabled, schedule: !s.enabled ? 'weekly' : 'manual' }))}
          className={`relative flex-shrink-0 w-14 h-7 rounded-full transition-colors ${settings.enabled ? 'bg-purple-500' : 'bg-gray-300'}`}>
          <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${settings.enabled ? 'translate-x-8' : 'translate-x-1'}`} />
        </button>
      </div>

      {settings.enabled && (
        <div className="mb-4">
          <p className="text-xs text-gray-500 font-bold mb-2">Gửi vào ngày (lúc 8:00 sáng giờ VN)</p>
          <div className="flex gap-1.5 flex-wrap">
            {VN_DAYS.map((d, i) => (
              <button key={i} onClick={() => setSettings(s => ({ ...s, day: i }))}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-colors ${settings.day === i ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Monthly recap — Pro 6m exclusive */}
      {plan === '6months' && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div>
            <span className="text-sm font-bold text-gray-700">Tổng kết hàng tháng</span>
            <p className="text-xs text-gray-400 mt-0.5">Gửi ngày 1 mỗi tháng · độc quyền Pro 6 tháng</p>
          </div>
          <button
            onClick={() => setSettings(s => ({ ...s, monthly_recap: !s.monthly_recap }))}
            className={`relative flex-shrink-0 w-14 h-7 rounded-full transition-colors ${settings.monthly_recap ? 'bg-indigo-500' : 'bg-gray-300'}`}>
            <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${settings.monthly_recap ? 'translate-x-8' : 'translate-x-1'}`} />
          </button>
        </div>
      )}

      {msg && (
        <p className={`text-sm font-bold mb-3 ${msg.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>
      )}

      <div className="flex gap-2">
        <button onClick={save} disabled={saving}
          className="flex-1 bg-purple-500 text-white font-black py-2.5 rounded-2xl text-sm disabled:opacity-50 active:scale-95 transition-transform">
          {saving ? 'Đang lưu...' : 'Lưu cài đặt'}
        </button>
        <button onClick={sendNow} disabled={sending}
          className="bg-white border-2 border-purple-200 text-purple-500 font-black py-2.5 px-4 rounded-2xl text-sm disabled:opacity-50 active:scale-95 transition-transform">
          {sending ? '...' : 'Gửi ngay'}
        </button>
      </div>
    </>
  )
}

function UpgradeModalButton({ username, expired }: { username: string; expired: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`mt-4 w-full font-black py-3 rounded-2xl text-sm active:scale-95 transition-all ${expired ? 'bg-gradient-to-r from-red-500 to-orange-400 text-white' : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'}`}
      >
        {expired ? '⚠️ Gia hạn ngay' : '⭐ Nâng cấp Pro'}
      </button>
      {open && <UpgradeModal onClose={() => setOpen(false)} username={username} />}
    </>
  )
}

// ── Push notification opt-in ──────────────────────────────────────────────────
function PushNotificationContent() {
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
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setStatus('denied')
        setMsg('Bạn đã từ chối quyền thông báo.')
        return
      }
      const reg = await navigator.serviceWorker.ready
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
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
            <span className="text-green-600 font-black text-sm">✅ Đã bật thông báo nhắc học</span>
          </div>
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
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black py-3 rounded-2xl disabled:opacity-50 active:scale-95 transition-transform text-sm">
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
              <p className="text-xs font-black text-blue-700">📲 Cách cài app lên màn hình chính:</p>
              <div className="space-y-1.5">
                <p className="text-xs font-black text-gray-600">🍎 iPhone / iPad (Safari)</p>
                <p className="text-xs text-gray-500 leading-relaxed">① Bấm nút <span className="font-bold">Chia sẻ</span> <span className="font-mono bg-gray-100 px-1 rounded">⬆️</span> ở thanh dưới Safari</p>
                <p className="text-xs text-gray-500">② Chọn <span className="font-bold">"Thêm vào Màn hình chính"</span></p>
                <p className="text-xs text-gray-500">③ Bấm <span className="font-bold">Thêm</span> → mở app từ icon vừa tạo</p>
              </div>
              <div className="border-t border-blue-100 pt-2 space-y-1.5">
                <p className="text-xs font-black text-gray-600">🤖 Android (Chrome)</p>
                <p className="text-xs text-gray-500 leading-relaxed">① Bấm menu <span className="font-bold">⋮</span> góc trên phải Chrome</p>
                <p className="text-xs text-gray-500">② Chọn <span className="font-bold">"Thêm vào Màn hình chính"</span> hoặc <span className="font-bold">"Cài đặt ứng dụng"</span></p>
                <p className="text-xs text-gray-500">③ Bấm <span className="font-bold">Thêm</span> → mở app từ icon vừa tạo</p>
              </div>
              <p className="text-[11px] text-blue-400 font-semibold text-center pt-1">Sau khi cài xong, mở lại app và bật thông báo nhắc học tại đây</p>
            </div>
          )}
          {status === 'denied' && (
            <p className="text-xs text-orange-500 font-semibold mt-2 text-center">
              Vào Cài đặt → trình duyệt → Thông báo → cho phép vocabwise.vercel.app
            </p>
          )}
        </>
      )}
      {msg && (
        <p className={`text-xs font-bold mt-2 ${msg.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>
      )}
    </>
  )
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray.buffer as ArrayBuffer
}

// ── Collapsible card wrapper ──────────────────────────────────────────────────
function CollapsibleCard({ title, subtitle, defaultOpen = true, warn = false, children }: {
  title: string; subtitle?: string; defaultOpen?: boolean; warn?: boolean; children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`bg-white rounded-3xl border-2 shadow-sm overflow-hidden ${warn ? 'border-orange-200' : 'border-gray-100'}`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
        <div className="text-left">
          <h2 className="font-black text-gray-800 text-base">{title}</h2>
          {subtitle && !open && <p className="text-xs text-gray-400 font-semibold mt-0.5">{subtitle}</p>}
        </div>
        <span className={`text-gray-400 font-black text-sm flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {open && <div className="border-t border-gray-100 px-5 pb-5 pt-4">{children}</div>}
    </div>
  )
}

// ── Settings tab ──────────────────────────────────────────────────────────────
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vocabwise.vercel.app'

function GiftTokenCard({ token }: { token: string }) {
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
        <span className="flex-1 font-black text-indigo-700 text-xl tracking-[0.2em]">{token}</span>
        <button onClick={copyLink}
          className="bg-indigo-500 text-white text-xs font-black px-3 py-1.5 rounded-xl active:scale-95 transition-transform">
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
            className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-black tracking-widest text-center focus:outline-none focus:border-indigo-400"
          />
          <button onClick={redeem} disabled={redeeming || redeemInput.length !== 8}
            className="bg-indigo-500 text-white text-sm font-black px-4 py-2 rounded-xl disabled:opacity-40 active:scale-95 transition-transform">
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

function SettingsTab({ children, session, onChildrenRefresh }: { children: Child[]; session: Session; onChildrenRefresh: () => void }) {
  const [cur, setCur] = useState(''); const [nw, setNw] = useState(''); const [cnf, setCnf] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [resetMsg, setResetMsg] = useState<Record<string, string>>({})
  const [resetConfirm, setResetConfirm] = useState<string | null>(null)
  const [pinInputs, setPinInputs] = useState<Record<string, string>>({})
  const [pinMsg, setPinMsg] = useState<Record<string, string>>({})
  const [pinSaving, setPinSaving] = useState<Record<string, boolean>>({})
  const [showPin, setShowPin] = useState<Record<string, boolean>>({})
  const [selectedPinChildId, setSelectedPinChildId] = useState<string>(() => children[0]?.id ?? '')

  async function setPin(childId: string, pin: string | null) {
    setPinSaving(p => ({ ...p, [childId]: true }))
    const res = await fetch(`/api/children/${childId}/pin`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })
    setPinSaving(p => ({ ...p, [childId]: false }))
    if (res.ok) {
      setPinMsg(p => ({ ...p, [childId]: pin ? '✅ Đã đặt PIN' : '✅ Đã xóa PIN' }))
      setPinInputs(p => ({ ...p, [childId]: '' }))
      onChildrenRefresh()
      setTimeout(() => setPinMsg(p => { const n = { ...p }; delete n[childId]; return n }), 2500)
    } else {
      const d = await res.json()
      setPinMsg(p => ({ ...p, [childId]: `❌ ${d.error}` }))
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault()
    setPwMsg('')
    if (nw !== cnf) { setPwMsg('❌ Mật khẩu xác nhận không khớp'); return }
    if (nw.length < 6) { setPwMsg('❌ Mật khẩu mới tối thiểu 6 ký tự'); return }
    setPwSaving(true)
    const res = await fetch('/api/family/password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: cur, newPassword: nw }),
    })
    setPwSaving(false)
    if (res.ok) { setPwMsg('✅ Đổi mật khẩu thành công!'); setCur(''); setNw(''); setCnf('') }
    else { const d = await res.json(); setPwMsg(`❌ ${d.error}`) }
  }

  async function resetChild(childId: string) {
    if (resetConfirm !== childId) { setResetConfirm(childId); return }
    setResetConfirm(null)
    const res = await fetch(`/api/sync/${childId}/reset`, { method: 'POST' })
    const msg = res.ok ? '✅ Đã reset' : '❌ Lỗi'
    setResetMsg(prev => ({ ...prev, [childId]: msg }))
    setTimeout(() => setResetMsg(prev => { const n = { ...prev }; delete n[childId]; return n }), 3000)
  }

  const isBonusProActive = !!session.bonus_pro_expires_at && new Date(session.bonus_pro_expires_at) > new Date()
  const isPaidPlanActive = session.plan !== 'free' && !!session.plan_end_date && new Date(session.plan_end_date) > new Date()
  const isPro = isPaidPlanActive || isBonusProActive
  const badge = isPro && !isPaidPlanActive
    ? { label: '🎁 PRO Bonus', cls: 'bg-gradient-to-r from-purple-400 to-pink-400 text-white' }
    : getPlanBadge(session.plan, session.plan_end_date)
  const expiryDate = isPaidPlanActive ? session.plan_end_date : isBonusProActive ? session.bonus_pro_expires_at : session.free_trial_expires_at
  const expiryLabel = isPaidPlanActive ? 'Ngày hết hạn' : isBonusProActive ? '🎁 Pro referral hết hạn' : 'Ngày hết dùng thử'
  const daysLeft = expiryDate ? Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000) : null
  // daysLeft <= 0: Math.ceil of any negative = 0 at first moment past expiry → must use <= 0
  const isExpired = daysLeft !== null && daysLeft <= 0
  const isWarning = daysLeft !== null && daysLeft > 0 && daysLeft <= 3
  // Free trial start = expiry - 7 days (trial is always 7 days)
  const freeTrialStart = !isPro && session.free_trial_expires_at
    ? new Date(new Date(session.free_trial_expires_at).getTime() - 7 * 24 * 60 * 60 * 1000)
    : null

  return (
    <div className="space-y-5">
      {/* Plan info */}
      <CollapsibleCard title="📦 Thông tin tài khoản" warn={isWarning || isExpired}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-500">Loại tài khoản</span>
            <span className={`text-xs font-black px-3 py-1 rounded-full ${badge.cls.includes('white') ? 'bg-purple-100 text-purple-700' : badge.cls}`}>
              {badge.label}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-500">Tên đăng nhập</span>
            <span className="text-sm font-bold text-gray-700">{session.username}</span>
          </div>
          {isPaidPlanActive && session.plan_start_date && (
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-gray-500">Ngày bắt đầu</span>
              <span className="text-sm font-bold text-gray-700">{fmtDateTime(session.plan_start_date)}</span>
            </div>
          )}
          {freeTrialStart && (
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-gray-500">Ngày bắt đầu dùng thử</span>
              <span className="text-sm font-bold text-gray-700">{fmtDateTime(freeTrialStart)}</span>
            </div>
          )}
          {expiryDate && (
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-gray-500">{expiryLabel}</span>
              <span className={`text-sm font-bold ${isExpired ? 'text-red-500' : isWarning ? 'text-orange-500' : 'text-gray-700'}`}>
                {fmtDateTime(expiryDate)}
                {daysLeft !== null && daysLeft > 0 && ` · còn ${daysLeft} ngày`}
                {isExpired && ' ⚠️ Hết hạn'}
              </span>
            </div>
          )}
        </div>
        {(isWarning || isExpired || !isPro) && (
          <UpgradeModalButton username={session.username} expired={isExpired} />
        )}
      </CollapsibleCard>

      {/* Change password */}
      <CollapsibleCard title="🔑 Đổi mật khẩu" subtitle="Đổi mật khẩu tài khoản gia đình" defaultOpen={false}>
        <form onSubmit={changePassword} className="space-y-2.5">
          <div>
            <input type="password" value={cur} onChange={e => setCur(e.target.value)}
              placeholder="Mật khẩu hiện tại"
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-purple-400" />
            <p className="text-xs text-gray-400 mt-1 ml-1">Không thể hiện mật khẩu hiện tại vì lý do bảo mật</p>
          </div>
          <PwInput value={nw} onChange={setNw} placeholder="Mật khẩu mới (tối thiểu 6 ký tự)" />
          <PwInput value={cnf} onChange={setCnf} placeholder="Xác nhận mật khẩu mới" />
          {pwMsg && (
            <p className={`text-sm font-bold ${pwMsg.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>{pwMsg}</p>
          )}
          <button type="submit" disabled={pwSaving}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black py-3 rounded-2xl disabled:opacity-50 active:scale-95 transition-transform">
            {pwSaving ? 'Đang lưu...' : 'Đổi mật khẩu'}
          </button>
        </form>
      </CollapsibleCard>

      {/* PIN per child */}
      {children.length > 0 && (
        <CollapsibleCard title="🔢 PIN cho bé" subtitle="Bé phải nhập đúng PIN mới vào học được." defaultOpen={false}>
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4" style={{ scrollbarWidth: 'none' }}>
            {children.map(child => {
              const isActive = child.id === selectedPinChildId
              const c = child.theme && THEME_COLORS[child.theme as 'pink' | 'blue'] ? THEME_COLORS[child.theme as 'pink' | 'blue'] : DEFAULT_COLOR
              return (
                <button key={child.id} onClick={() => setSelectedPinChildId(child.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black text-sm whitespace-nowrap flex-shrink-0 transition-all ${
                    isActive ? `${c.bar} text-white shadow-sm` : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}>
                  <span>{child.emoji}</span>
                  <span>{child.name}</span>
                </button>
              )
            })}
          </div>
          {children.filter(c => c.id === selectedPinChildId).map(child => (
            <div key={child.id}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-black px-2.5 py-1 rounded-full ${child.pin ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                  {child.pin ? (showPin[child.id] ? `PIN: ${child.pin}` : '🔒 Có PIN') : 'Chưa có PIN'}
                </span>
                {child.pin && (
                  <button onClick={() => setShowPin(p => ({ ...p, [child.id]: !p[child.id] }))}
                    className="text-gray-400 hover:text-gray-600 text-sm">
                    {showPin[child.id] ? '🙈' : '👁️'}
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <input type="number" maxLength={4} value={pinInputs[child.id] ?? ''}
                  onChange={e => setPinInputs(p => ({ ...p, [child.id]: e.target.value.slice(0, 4) }))}
                  placeholder="PIN mới (4 số)"
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-center font-bold text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                <button onClick={() => { const p = pinInputs[child.id] ?? ''; if (p.length === 4) setPin(child.id, p) }}
                  disabled={pinSaving[child.id] || (pinInputs[child.id] ?? '').length !== 4}
                  className="bg-purple-500 text-white text-sm font-black px-4 py-2.5 rounded-xl disabled:opacity-40 active:scale-95 transition-transform">
                  Đặt
                </button>
                {child.pin && (
                  <button onClick={() => setPin(child.id, null)} disabled={pinSaving[child.id]}
                    className="bg-gray-100 text-gray-500 text-sm font-black px-3 py-2.5 rounded-xl disabled:opacity-40 active:scale-95 transition-transform">
                    Xóa
                  </button>
                )}
              </div>
              {pinMsg[child.id] && (
                <p className={`text-xs font-bold mt-1.5 ${pinMsg[child.id].startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>
                  {pinMsg[child.id]}
                </p>
              )}
            </div>
          ))}
        </CollapsibleCard>
      )}

      {/* Push notifications */}
      <CollapsibleCard title="🔔 Thông báo nhắc học" subtitle="Nhận thông báo nhắc bé học từ vựng mỗi ngày (8:00 sáng)." defaultOpen={false}>
        <PushNotificationContent />
      </CollapsibleCard>

      {/* Report settings */}
      <CollapsibleCard title="📬 Báo cáo qua email" subtitle="Nhận báo cáo tiến độ học của bé qua email." defaultOpen={false}>
        <ReportSettingsContent plan={session.plan} />
      </CollapsibleCard>

      {/* Gift token — Pro 6m exclusive */}
      {session.plan === '6months' && session.gift_token && (
        <GiftTokenCard token={session.gift_token} />
      )}

      {/* Reset — cuối cùng, collapsed by default */}
      {children.length > 0 && (
        <CollapsibleCard title="🔄 Reset tiến độ học" subtitle="Xóa toàn bộ tiến độ. Không thể hoàn tác." defaultOpen={false}>
          <p className="text-gray-400 text-sm font-semibold mb-4">Xóa toàn bộ tiến độ và bắt đầu lại. Không thể hoàn tác.</p>
          <div className="space-y-3">
            {children.map(child => (
              <div key={child.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{child.emoji}</span>
                  <div>
                    <p className="font-black text-gray-800 text-sm">{child.name}</p>
                    <p className="text-xs text-gray-400">{LEVEL_INFO_MAP[child.level]?.label ?? child.level} · {LEVEL_INFO_MAP[child.level]?.cefr ?? ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {resetMsg[child.id] && <span className="text-xs text-green-500 font-bold">{resetMsg[child.id]}</span>}
                  <button onClick={() => resetChild(child.id)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-black transition-colors ${
                      resetConfirm === child.id ? 'bg-red-500 text-white' : 'bg-red-50 text-red-400 hover:bg-red-100'}`}>
                    {resetConfirm === child.id ? '⚠️ Xác nhận?' : 'Reset'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleCard>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [children, setChildren] = useState<Child[]>([])
  const [stats, setStats] = useState<ChildStats[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'dashboard' | 'referral' | 'settings'>('dashboard')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Child | null>(null)

  useExpiryGuard(session)

  async function loadData() {
    setLoading(true)
    try {
      const [refreshRes, kids] = await Promise.all([
        fetch('/api/auth/refresh', { method: 'POST' }),
        fetch('/api/children').then(r => r.json()).catch(() => []),
      ])
      if (refreshRes.status === 403) {
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/login')
        return
      }
      const sess = await refreshRes.json().catch(() => null)
      if (!sess) { router.push('/login'); return }
      const childList: Child[] = Array.isArray(kids) ? kids : []
      setSession(sess)
      setChildren(childList)
      // Ensure bottom nav can reach child-specific tabs from /dashboard
      if (childList.length > 0) {
        const existing = sessionStorage.getItem('nav_child_id')
        if (!existing || !childList.find(c => c.id === existing)) {
          sessionStorage.setItem('nav_child_id', childList[0].id)
        }
      }

      // Fetch all-levels sync for each child in parallel
      const syncResults = await Promise.all(
        childList.map(c => fetch(`/api/sync/${c.id}`).then(r => r.json()).catch(() => ({})))
      )
      setStats(childList.map((child, i) => ({
        child,
        syncAll: syncResults[i] ?? {},
      })))
    } catch {
      // Network error — keep existing state, user can retry
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  // Supabase Realtime auto-refresh
  useEffect(() => {
    let channel: { unsubscribe: () => void } | null = null
    async function setupRealtime() {
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      channel = supabase.channel('vocab_sync_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'vocab_sync' }, () => loadData())
        .subscribe()
    }
    setupRealtime()
    return () => { channel?.unsubscribe() }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-refresh on tab focus
  useEffect(() => {
    const handler = () => { if (!document.hidden) loadData() }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (!session) return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
      <p className="text-gray-400 font-bold">{loading ? 'Đang tải...' : 'Không thể tải. Vui lòng thử lại.'}</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {showAdd && (
        <AddChildModal maxKids={session!.max_kids ?? (session!.plan === 'free' ? 1 : 3)} childCount={children.length} onClose={() => setShowAdd(false)}
          onAdded={c => { setChildren(p => [...p, c]); setShowAdd(false); loadData() }} />
      )}
      {editing && (
        <EditChildModal child={editing} onClose={() => setEditing(null)}
          onSaved={c => { setChildren(p => p.map(x => x.id === c.id ? c : x)); setEditing(null); loadData() }}
          onDeleted={id => { setChildren(p => p.filter(x => x.id !== id)); setEditing(null); loadData() }} />
      )}

      <UpgradeBanner
        plan={session!.plan}
        freeTrialExpiresAt={session!.free_trial_expires_at}
        planEndDate={session!.plan_end_date}
        username={session!.username}
      />
      {(() => {
        const d = daysUntilExpiry(session!)
        if (d === null || d > 3) return null
        return (
          <div className="mx-auto max-w-xl px-4 pt-3">
            <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl px-4 py-2.5 flex items-center gap-2.5">
              <span className="text-xl flex-shrink-0">⏰</span>
              <p className="text-orange-700 text-xs font-bold leading-snug">
                {d <= 0 ? 'Tài khoản đã hết hạn!' : `Tài khoản hết hạn sau ${d} ngày!`}
                {' '}Vui lòng <button onClick={() => setTab('settings')} className="underline">gia hạn ngay</button>.
              </p>
            </div>
          </div>
        )
      })()}

      {/* Gradient header */}
      <div className="bg-gradient-to-br from-purple-500 to-pink-500">
        <div className="max-w-xl mx-auto px-4 pt-6 pb-0">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-white font-black text-2xl">📚 VocabWise</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-white/70 text-sm font-semibold">{session!.username}</p>
                {(() => {
                  const isBonusActive = !!session!.bonus_pro_expires_at && new Date(session!.bonus_pro_expires_at) > new Date()
                  const b = isBonusActive && session!.plan === 'free'
                    ? { label: '🎁 PRO', cls: 'bg-gradient-to-r from-purple-400 to-pink-400 text-white' }
                    : getPlanBadge(session!.plan, session!.plan_end_date)
                  return <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${b.cls}`}>{b.label}</span>
                })()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => router.push('/kids')}
                className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-2 rounded-2xl transition-colors whitespace-nowrap">
                🎮 Chế độ học
              </button>
              <button onClick={logout}
                className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-2 rounded-2xl transition-colors whitespace-nowrap">
                🚪 Đăng xuất
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {(['dashboard', 'referral', 'settings'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2.5 rounded-t-2xl font-black text-sm transition-colors ${
                  tab === t ? 'bg-white text-gray-800' : 'text-white/70 hover:text-white'}`}>
                {t === 'dashboard' ? '📊 Dashboard' : t === 'referral' ? '🎁 Giới thiệu' : '⚙️ Cài đặt'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-xl mx-auto px-4 py-5">
        {tab === 'dashboard' ? (
          <DashboardTab
            stats={stats} loading={loading}
            onRefresh={loadData}
            onChildClick={child => router.push(`/dashboard/${child.id}`)}
            onEditChild={setEditing}
            session={session!}
            onAddChild={() => setShowAdd(true)}
          />
        ) : tab === 'referral' ? (
          <ReferralTab />
        ) : (
          <SettingsTab children={children} session={session!} onChildrenRefresh={loadData} />
        )}
      </div>
    </div>
  )
}
