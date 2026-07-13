'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getPhonicsProgress, getAllDailyProgress, getAllAcademicProgress, getGlobalStreak, getDailyXP, DAILY_XP_GOAL, type SyncLevel } from '@/lib/childProgress'
import Image from 'next/image'
import { getAvatarSrc } from '@/lib/avatars'
import UpgradeBanner from '@/components/UpgradeBanner'
import LearningHistoryPanel from '@/components/LearningHistoryPanel'
import ModuleCard from '@/components/ModuleCard'
import { cachedFetch } from '@/lib/cachedFetch'


const KID_FAQ = [
  {
    q: '📖 Học một chủ đề như thế nào?',
    a: 'Bắt đầu bằng Flashcard để xem và nghe từ mới.\nSau đó chọn các trò chơi để luyện tập.\nHoàn thành Flashcard + 3 trò chơi → nhận 🏆!',
  },
  {
    q: '🎮 Có những trò chơi gì?',
    a: 'Level Seeker / Starter / Ranger (10 trò):\n📖 Flashcard từ mới · 👂 Nghe & Chọn · ✅ Đúng / Sai · 🖼️ Nối từ với hình\n🧠 Lật thẻ · 🫧 Bắn bong bóng · 🔡 Điền chữ thiếu\n🔤 Đánh vần · 🔁 Sắp xếp câu · 🎤 Phát âm cùng AI ✨\n\nLevel Explorer / Scholar / Master (11 trò khác):\n📖 Flashcard · 👂 Nghe & Chọn · ✅ Đúng / Sai · 🖼️ Nối từ với hình\n❓ Trắc nghiệm · ✏️ Điền từ · 🔀 Ghép định nghĩa · 🎤 Phát âm cùng AI ✨\n⌨️ Gõ từ nhanh 15s · 🔁 Sắp xếp câu · ⚡ Speed Round',
  },
  {
    q: '🏆 Khi nào chủ đề được tính là hoàn thành?',
    a: 'Cần đủ 2 điều kiện:\n① Xem hết Flashcard tất cả các từ trong chủ đề\n② Đạt kết quả tốt trong ít nhất 3 trò chơi khác nhau\n\nHoàn thành rồi thì chủ đề sẽ hiện 🏆!',
  },
  {
    q: '⭐ XP là gì? Tính như thế nào?',
    a: 'XP (điểm kinh nghiệm) được tặng mỗi khi hoàn thành game.\n\nGame khó → nhiều XP hơn:\n🔴 Đánh vần, Gõ từ nhanh, Điền chữ thiếu, Speed Round: 2 XP/câu đúng\n🟡 Trắc nghiệm, Điền từ, Nghe & Chọn, Sắp xếp câu, Câu chuyện, Phát âm AI, Ghép định nghĩa: 1,5 XP/câu\n🟢 Nối từ, Lật thẻ, Đúng/Sai, Bắn bong bóng: 1 XP/câu\n\nMục tiêu mỗi ngày: đạt 20 XP → thanh XP trên màn hình này sẽ đầy!\n\nXP tích lũy giúp bạn lên cấp: 🌱 → 🔍 → ⚔️ → 📜 → 👑',
  },
  {
    q: '📚 Mini Story là gì?',
    a: 'Mỗi chủ đề có 1 câu chuyện ngắn dùng các từ vừa học.\nVào trang chủ đề → cuộn xuống → bấm "Mini Story".\nĐọc chuyện tiếng Anh + tiếng Việt, nghe audio.\nBấm "Làm bài" → điền từ vào chỗ trống trong chuyện!',
  },
  {
    q: '🎤 Game Phát âm cùng AI ✨ dùng như thế nào?',
    a: 'Bấm nút micro 🎤 → đọc to từ (hoặc câu) hiển thị trên màn hình.\nApp sẽ nhận diện giọng bạn và cho biết đúng hay sai.\nBấm 🔊 "Nghe mẫu" để nghe phát âm chuẩn trước.\nSau khi đọc, bấm ▶️ để nghe lại giọng của chính mình!\n\n⚠️ Cần cho phép quyền Microphone khi trình duyệt hỏi.',
  },
  {
    q: '🔤 Module Phonics là gì?',
    a: 'Ngoài học từ vựng theo chủ đề, bạn còn có thể luyện phát âm tiếng Anh theo chuẩn IPA!\n\nBấm card 🔤 "Phonics" ở màn hình chọn level để vào.\n\nCó 3 nhóm âm cần học theo thứ tự:\n① 🎵 Nguyên âm — /iː/ vs /ɪ/, /æ/ vs /e/...\n② 🔊 Phụ âm — /p/ vs /b/, /θ/ vs /ð/...\n③ 🇻🇳 Khó với người Việt — /l/ vs /r/, âm cuối, cụm phụ âm\n\nMỗi nhóm âm: học → 3 game đạt ≥70% = 🏆 Thành thạo!',
  },
]

function KidFaqSection() {
  const [open, setOpen] = useState<number | null>(null)
  const [visible, setVisible] = useState(false)
  return (
    <div className="max-w-lg mx-auto mt-4 mb-6">
      <button
        onClick={() => setVisible(v => !v)}
        className="w-full flex items-center justify-between bg-white/70 backdrop-blur-sm border-2 border-purple-100 rounded-2xl px-4 py-3 shadow-sm">
        <span className="font-black text-purple-700 text-sm">❓ Hướng dẫn học</span>
        <span className={`text-purple-400 font-black text-sm transition-transform duration-200 ${visible ? 'rotate-180' : ''}`}>▾</span>
      </button>
      {visible && (
        <div className="mt-2 bg-white/80 backdrop-blur-sm border-2 border-purple-100 rounded-2xl overflow-hidden shadow-sm divide-y divide-purple-50">
          {KID_FAQ.map((item, i) => (
            <div key={i}>
              <button
                onClick={() => setOpen(o => o === i ? null : i)}
                className="w-full text-left px-4 py-3 flex items-center justify-between gap-2 hover:bg-purple-50/50 transition-colors">
                <span className="font-bold text-gray-700 text-sm leading-snug">{item.q}</span>
                <span className={`text-gray-400 font-black text-sm flex-shrink-0 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {open === i && (
                <div className="px-4 pb-3">
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
          ))}
        </div>
      )}
    </div>
  )
}

const LEVEL_ORDER = ['seeker', 'starter', 'ranger', 'explorer', 'scholar', 'master'] as const

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

  useEffect(() => {
    Promise.all([
      cachedFetch('/api/children').then(r => r.json()),
      fetch(`/api/sync/${childId}`).then(r => r.json()).catch(() => ({})),
      cachedFetch('/api/auth/me').then(r => r.ok ? r.json() : null) as Promise<Session | null>,
    ]).then(([kids, allSync, sess]) => {
      const found = (kids as Child[]).find(k => k.id === childId)
      if (!found) { router.push('/kids'); return }
      setChild(found)
      setSyncByLevel(allSync ?? {})
      setSession(sess)
      setLoading(false)
    })
  }, [childId, router])

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
      <div className="text-4xl animate-pulse">🌟</div>
    </div>
  )

  // Progress aggregates
  const phonics  = getPhonicsProgress(syncByLevel['phonics'])
  const allDaily = getAllDailyProgress(syncByLevel)
  const allAcad  = getAllAcademicProgress(syncByLevel['academic'] as SyncLevel | undefined)

  // Daily missions
  const todayStr = new Date().toISOString().split('T')[0]
  type DayEntry = { games?: number; topics?: number; words?: number }
  const todayPhonics  = ((syncByLevel['phonics'] as { history?: Record<string, DayEntry> } | undefined)?.history?.[todayStr]?.games ?? 0) > 0
  const todayDaily    = LEVEL_ORDER.some(l => ((syncByLevel[l] as { history?: Record<string, DayEntry> } | undefined)?.history?.[todayStr]?.games ?? 0) > 0)
  const todayAcademic = ((syncByLevel['academic'] as { history?: Record<string, DayEntry> } | undefined)?.history?.[todayStr]?.topics ?? 0) > 0
  const missionsDone  = [todayPhonics, todayDaily, todayAcademic].filter(Boolean).length
  const allMissions   = missionsDone === 3

  const todayXP       = getDailyXP(syncByLevel as Record<string, SyncLevel>)
  const xpGoalDone    = todayXP >= DAILY_XP_GOAL
  const xpPct         = Math.min(100, Math.round((todayXP / DAILY_XP_GOAL) * 100))
  const { current: globalStreak } = getGlobalStreak(syncByLevel as Record<string, SyncLevel>)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 px-4 py-6">
      <UpgradeBanner
        plan={session?.plan ?? 'free'}
        freeTrialExpiresAt={session?.free_trial_expires_at}
        planEndDate={session?.plan_end_date}
        username={session?.username}
      />
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 max-w-lg mx-auto">
        <button onClick={() => router.push('/kids')} aria-label="Quay lại" className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none">←</button>
        <Image src={getAvatarSrc(child!.emoji)} width={40} height={40} className="rounded-full object-cover flex-shrink-0" alt="" unoptimized />
        <div>
          <h1 className="text-xl font-black text-gray-800 leading-tight">{child!.name}</h1>
          <p className="text-gray-400 text-xs font-semibold">Chọn module để học</p>
        </div>
      </div>

      {/* Daily missions */}
      <div className="max-w-lg mx-auto mb-4">
        <div className={`rounded-2xl border-2 p-4 ${allMissions ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200' : 'bg-white/70 border-purple-100'}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className={`font-black text-sm ${allMissions ? 'text-yellow-700' : 'text-purple-700'}`}>
                {allMissions ? '🎉 Hoàn thành nhiệm vụ hôm nay!' : `🎯 Nhiệm vụ hôm nay — ${missionsDone}/3`}
              </p>
              {!allMissions && <p className="text-xs text-gray-400 font-semibold mt-0.5">Hoàn thành cả 3 để nhận ngôi sao vàng ⭐</p>}
            </div>
            <div className="flex gap-1">
              {[todayPhonics, todayDaily, todayAcademic].map((done, i) => (
                <div key={i} className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${done ? 'bg-green-400 text-white' : 'bg-gray-100 text-gray-300'}`}>
                  {done ? '✓' : '○'}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            {[
              { done: todayPhonics,  icon: '🔤', label: 'Phonics', desc: 'Học 1 bài phonics' },
              { done: todayDaily,    icon: '📚', label: 'Daily', desc: 'Chơi 1 game từ vựng' },
              { done: todayAcademic, icon: '🎓', label: 'Academic', desc: 'Làm 1 bài tập chủ đề' },
            ].map(m => (
              <div key={m.label} className="flex items-center gap-2.5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${m.done ? 'bg-green-400 text-white' : 'bg-gray-100 text-gray-400'}`}>
                  {m.done ? '✓' : '○'}
                </div>
                <span className={`text-xs font-bold ${m.done ? 'text-green-600 line-through decoration-green-400' : 'text-gray-600'}`}>
                  {m.icon} {m.label}
                </span>
                {!m.done && <span className="text-xs text-gray-400">{m.desc}</span>}
              </div>
            ))}
          </div>

          {/* Daily XP goal + global streak */}
          <div className="mt-3 pt-3 border-t border-purple-100/60 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500">⭐ XP hôm nay</span>
              <span className={`text-xs font-black ${xpGoalDone ? 'text-green-600' : 'text-gray-600'}`}>
                {todayXP}/{DAILY_XP_GOAL} XP {xpGoalDone ? '✅' : ''}
              </span>
            </div>
            <div className="h-2 bg-white/60 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${xpGoalDone ? 'bg-gradient-to-r from-green-400 to-emerald-400' : 'bg-gradient-to-r from-purple-400 to-pink-400'}`}
                style={{ width: `${Math.max(xpPct, todayXP > 0 ? 3 : 0)}%` }}
              />
            </div>
            {globalStreak > 0 && (
              <p className="text-xs font-bold text-orange-500">🔥 Streak {globalStreak} ngày liên tiếp</p>
            )}
          </div>
        </div>
      </div>

      {/* Kid FAQ */}
      <div className="max-w-lg mx-auto mb-4">
        <KidFaqSection />
      </div>

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
          onClick={() => { localStorage.setItem('vw_active_child', childId); router.push('/vocabwise') }}
          icon="🎓"
          title="VocabWise Academic"
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <LearningHistoryPanel syncByLevel={syncByLevel as Record<string, { history?: Record<string, { words: number; games: number; xp: number; topics?: number; topicIds?: string[] }> } | undefined>} />
        </div>
      </div>
    </div>
  )
}
