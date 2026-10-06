'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getPhonicsProgress, getAllDailyProgress, getAllAcademicProgress, type SyncLevel } from '@/lib/childProgress'
import Image from 'next/image'
import { getAvatarSrc } from '@/lib/avatars'
import UpgradeBanner from '@/components/UpgradeBanner'
import LearningHistoryPanel from '@/components/LearningHistoryPanel'
import ModuleCard from '@/components/ModuleCard'
import { cachedFetch } from '@/lib/cachedFetch'
import { academicFetch } from '@/lib/academicSync'
import PageSkeleton from '@/components/PageSkeleton'


const KID_FAQ = [
  {
    group: '🔤 Phonics',
    items: [
      {
        q: '🔤 Module Phonics là gì?',
        a: 'Ngoài học từ vựng theo chủ đề, bạn còn có thể luyện phát âm tiếng Anh theo chuẩn IPA!\n\nBấm card 🔤 "Phonics" ở màn hình chọn level để vào.\n\n9 nhóm, 58 bài — học theo thứ tự:\nNguyên âm ngắn · Nguyên âm đôi · Cặp phụ âm · Phụ âm khác · Khó với người Việt · Đọc từ thông minh · Quy tắc phát âm · Ngữ điệu · Nói liên tục',
      },
      {
        q: '🏆 Tiêu chí hoàn thành bài học',
        a: 'Học thẻ âm → hoàn thành các game bắt buộc trong bài đó.\nMỗi game đạt ≥70% = 🏆 Thành thạo!',
      },
    ],
  },
  {
    group: '📚 Daily',
    items: [
      {
        q: '📖 Học một chủ đề như thế nào?',
        a: 'Bắt đầu bằng Flashcard để xem và nghe từ mới.\nSau đó chọn các trò chơi để luyện tập.\nHoàn thành Flashcard + 3 trò chơi → nhận 🏆!',
      },
      {
        q: '🎮 Có những trò chơi gì?',
        a: 'Level Seeker / Starter / Ranger (10 trò):\n📖 Flashcard từ mới · 👂 Nghe & Chọn · ✅ Đúng / Sai · 🖼️ Nối từ với hình\n🧠 Lật thẻ · 🫧 Bắn bong bóng · 🔡 Điền chữ thiếu\n🔤 Đánh vần · 🔁 Sắp xếp câu · 🎤 Phát âm cùng AI ✨\n\nLevel Explorer / Scholar / Master (11 trò khác):\n📖 Flashcard · 👂 Nghe & Chọn · ✅ Đúng / Sai\n❓ Trắc nghiệm · ✏️ Điền từ · 🔀 Ghép định nghĩa · 🎤 Phát âm cùng AI ✨\n⌨️ Gõ từ nhanh 15s · 🔁 Sắp xếp câu · ⚡ Speed Round · ✍️ Đặt câu cùng AI',
      },
      {
        q: '🏆 Tiêu chí hoàn thành bài học',
        a: 'Cần đủ 2 điều kiện:\n① Xem hết Flashcard tất cả các từ trong chủ đề\n② Đạt kết quả tốt trong ít nhất 3 trò chơi khác nhau\n\nHoàn thành rồi thì chủ đề sẽ hiện 🏆!',
      },
      {
        q: '⭐ XP là gì? Tính như thế nào?',
        a: 'XP (điểm kinh nghiệm) được tặng mỗi khi hoàn thành game.\n\nGame khó → nhiều XP hơn:\n🔴 Đánh vần, Gõ từ nhanh, Điền chữ thiếu, Speed Round, Đặt câu cùng AI: 2 XP/câu đúng\n🟡 Trắc nghiệm, Điền từ, Nghe & Chọn, Sắp xếp câu, Câu chuyện, Phát âm AI, Ghép định nghĩa: 1,5 XP/câu\n🟢 Nối từ, Lật thẻ, Đúng/Sai, Bắn bong bóng: 1 XP/câu\n\nMục tiêu mỗi ngày: đạt 20 XP → thanh XP trên màn hình này sẽ đầy!\n\nXP tích lũy giúp bạn lên cấp: 🌱 → 🔍 → ⚔️ → 📜 → 👑',
      },
      {
        q: '📚 Mini Story là gì?',
        a: 'Mỗi chủ đề có 1 câu chuyện ngắn dùng các từ vừa học.\nVào trang chủ đề → cuộn xuống → bấm "Mini Story".\nĐọc chuyện tiếng Anh + tiếng Việt, nghe audio.\nBấm "Làm bài" → điền từ vào chỗ trống trong chuyện!',
      },
      {
        q: '🎤 Game Phát âm cùng AI ✨ dùng như thế nào?',
        a: 'Bấm nút micro 🎤 → đọc to từ (hoặc câu) hiển thị trên màn hình.\nApp sẽ nhận diện giọng bạn và cho biết đúng hay sai.\nBấm 🔊 "Nghe mẫu" để nghe phát âm chuẩn trước.\nSau khi đọc, bấm ▶️ để nghe lại giọng của chính mình!\n\n⚠️ Cần cho phép quyền Microphone khi trình duyệt hỏi.',
      },
    ],
  },
  {
    group: '🎓 Academic',
    items: [
      {
        q: '🎓 Module Academic là gì?',
        a: 'Từ vựng học thuật kiểu IELTS/SAT — khó và nâng cao hơn Daily.\n\nBấm card 🎓 "Academic" ở màn hình chọn level để vào.\n\n3 books: Book 1 (A1–A2) · Book 2 (B1–B2) · Book 3 (C1–C2) — mỗi book 60 chủ đề.\n\nMỗi chủ đề có 4 phần theo thứ tự: 📖 Đọc bài → 📔 Từ vựng → ✏️ Bài tập → 📐 Ngữ pháp (nếu có)',
      },
      {
        q: '🏆 Tiêu chí hoàn thành bài học',
        a: 'Làm xong bài tập → chủ đề có dấu ✅.\nĐạt từ 20/25 điểm trở lên → 🏆 Thành thạo!',
      },
    ],
  },
]

function FaqToggleButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-label="Hướng dẫn học"
      aria-haspopup="true"
      aria-expanded={open}
      className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-b-[3px] border-black/20 bg-white/25 transition-transform active:translate-y-0.5 active:border-b-2"
    >
      <span className="text-xl">❓</span>
    </button>
  )
}

function KidFaqPanel() {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <div className="max-w-lg mx-auto mt-2 mb-6">
      <div className="overflow-hidden rounded-3xl border-2 border-b-[4px] border-purple-200 border-b-purple-300 bg-white">
        <div className="px-4 py-3 bg-purple-50/60">
          <span className="font-bold text-purple-700 text-sm">❓ Hướng dẫn học</span>
        </div>
        {KID_FAQ.map(group => (
          <div key={group.group} className="border-t border-purple-50 divide-y divide-purple-50">
            <div className="px-4 py-1.5 bg-purple-50/40">
              <p className="text-xs font-bold text-purple-400 uppercase tracking-wider">{group.group}</p>
            </div>
            {group.items.map((item, i) => {
              const key = `${group.group}-${i}`
              const isOpen = open === key
              return (
                <div key={key}>
                  <button
                    onClick={() => setOpen(o => o === key ? null : key)}
                    className="w-full text-left pl-7 pr-4 py-3 flex items-center justify-between gap-2 hover:bg-purple-50/50 transition-colors">
                    <span className="font-bold text-gray-700 text-sm leading-snug">{item.q}</span>
                    <span className={`text-gray-400 font-bold text-sm flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>▾</span>
                  </button>
                  {isOpen && (
                    <div className="pl-7 pr-4 pb-3">
                      <div className="bg-purple-50 rounded-xl p-3">
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
      </div>
    </div>
  )
}

type Child = { id: string; name: string; emoji: string; level: string }
type SyncByLevel = Record<string, SyncLevel>
type Session = { plan: string; username?: string; free_trial_expires_at?: string | null; plan_end_date?: string | null }


export default function ChildRoadmap() {
  const router = useRouter()
  const { childId } = useParams<{ childId: string }>()
  const [child, setChild] = useState<Child | null>(null)
  const [syncByLevel, setSyncByLevel] = useState<SyncByLevel>({})
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [faqOpen, setFaqOpen] = useState(false)

  useEffect(() => {
    Promise.all([
      cachedFetch('/api/children').then(r => r.json()),
      fetch(`/api/sync/${childId}`).then(r => r.json()).catch(() => ({})),
      cachedFetch('/api/auth/me').then(r => r.ok ? r.json() : null) as Promise<Session | null>,
      // Academic progress lives in vw_academic_sync_child (per child) — not in the per-level
      // vocab_sync — so it's fetched separately and merged into the 'academic' key.
      academicFetch(undefined, childId).then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([kids, allSync, sess, academicSync]) => {
      const found = (kids as Child[]).find(k => k.id === childId)
      if (!found) { router.push('/kids'); return }
      setChild(found)
      setSyncByLevel({ ...(allSync ?? {}), ...(academicSync ? { academic: academicSync } : {}) })
      setSession(sess)
      setLoading(false)
    })
  }, [childId, router])

  if (loading) return <PageSkeleton header="bg-purple-500" bg="from-purple-50 via-pink-50 to-rose-50" cards={[90, 90, 90]} />

  // Progress aggregates
  const phonics  = getPhonicsProgress(syncByLevel['phonics'])
  const allDaily = getAllDailyProgress(syncByLevel)
  const allAcad  = getAllAcademicProgress(syncByLevel['academic'] as SyncLevel | undefined)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 pb-6">
      <UpgradeBanner
        plan={session?.plan ?? 'free'}
        freeTrialExpiresAt={session?.free_trial_expires_at}
        planEndDate={session?.plan_end_date}
        username={session?.username}
      />
      {/* Header */}
      <div className="mb-4 rounded-b-3xl border-b-[4px] border-black/20 bg-purple-500 text-white">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-4">
          <button onClick={() => router.push('/kids')} aria-label="Quay lại"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-b-[3px] border-black/20 bg-white/25 text-lg font-bold text-white transition-transform active:translate-y-0.5 active:border-b-2">←</button>
          <Image src={getAvatarSrc(child!.emoji)} width={44} height={44} className="h-11 w-11 flex-shrink-0 rounded-full border-2 border-white/80 object-cover" alt="" unoptimized />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold leading-tight">{child!.name}</h1>
            <p className="text-xs font-semibold text-white/80">Chọn module để học</p>
          </div>
          <FaqToggleButton open={faqOpen} onToggle={() => setFaqOpen(v => !v)} />
        </div>
      </div>
      <div className="px-4">

      {faqOpen && <KidFaqPanel />}

      <div className="space-y-3 max-w-lg mx-auto">
        <ModuleCard
          onClick={() => router.push(`/dashboard/${childId}/phonics`)}
          icon="🔤"
          title="Phonics"
          badge="IPA"
          description="Học phát âm chuẩn IPA quốc tế · Âm lẻ · Từ · Câu"
          mastered={phonics.mastered}
          total={phonics.total}
          unit="bài"
          scheme="amber"
        />
        <ModuleCard
          onClick={() => router.push(`/dashboard/${childId}/kids`)}
          icon="📚"
          title="Daily"
          badge="Pre-A1 → C2"
          description="Từ vựng hàng ngày · 180 chủ đề · ~2.400 từ · Pre-A1 → C2"
          mastered={allDaily.topicsCompleted}
          total={allDaily.totalTopics}
          unit="chủ đề"
          secondary={`${allDaily.seenWords}/${allDaily.totalWords} từ`}
          scheme="purple"
        />
        <ModuleCard
          onClick={() => { localStorage.setItem('vw_active_child', childId); localStorage.setItem('nav_child_id', childId); router.push('/vocabwise') }}
          icon="🎓"
          title="Academic"
          badge="IELTS · SAT"
          description="Từ vựng học thuật · 180 chủ đề · ~2.700 từ · A1 → C2"
          mastered={allAcad.completed}
          total={allAcad.total}
          unit="chủ đề"
          secondary={`${allAcad.seenWords}/${allAcad.totalWords} từ`}
          scheme="blue"
        />
      </div>

      {/* Learning history */}
      <div className="max-w-lg mx-auto mt-3">
        <div className="overflow-hidden rounded-3xl border-2 border-b-[4px] border-slate-200 border-b-slate-300 bg-white">
          <LearningHistoryPanel syncByLevel={syncByLevel as Record<string, { history?: Record<string, { words: number; games: number; xp: number; topics?: number; topicIds?: string[] }> } | undefined>} />
        </div>
      </div>
      </div>
    </div>
  )
}
