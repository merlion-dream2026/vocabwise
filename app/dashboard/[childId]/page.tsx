'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getPhonicsProgress, getAllDailyProgress, getAllAcademicProgress, type SyncLevel } from '@/lib/childProgress'
import { getAvatarSrc } from '@/lib/avatars'
import UpgradeBanner from '@/components/UpgradeBanner'
import LearningHistoryPanel from '@/components/LearningHistoryPanel'


const KID_FAQ = [
  {
    q: '📖 Học một chủ đề như thế nào?',
    a: 'Bắt đầu bằng Flashcard để xem và nghe từ mới.\nSau đó chọn các trò chơi để luyện tập.\nHoàn thành Flashcard + 3 trò chơi → nhận 🏆!',
  },
  {
    q: '🎮 Có những trò chơi gì?',
    a: 'Level Seeker / Starter / Ranger:\n📖 Flashcard từ mới\n👂 Nghe & Chọn\n✅ Đúng / Sai\n🖼️ Nối từ với hình\n🧠 Lật thẻ\n🫧 Bắn bong bóng\n🔡 Điền chữ thiếu\n🔤 Đánh vần\n🔁 Sắp xếp câu\n🎤 Phát âm cùng AI ✨\n\nLevel Explorer / Scholar / Master: thêm\n❓ Trắc nghiệm · ✏️ Điền từ\n⌨️ Gõ từ nhanh 15s · 🔀 Ghép định nghĩa',
  },
  {
    q: '🏆 Khi nào chủ đề được tính là hoàn thành?',
    a: 'Cần đủ 2 điều kiện:\n① Xem hết Flashcard tất cả các từ trong chủ đề\n② Đạt kết quả tốt trong ít nhất 3 trò chơi khác nhau\n\nHoàn thành rồi thì chủ đề sẽ hiện 🏆!',
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

function PhonicsEntryCard({ childId, syncByLevel }: { childId: string; syncByLevel: SyncByLevel }) {
  const router = useRouter()
  const phonics = getPhonicsProgress(syncByLevel['phonics'])
  const pct = phonics.total > 0 ? Math.round((phonics.mastered / phonics.total) * 100) : 0

  return (
    <button
      onClick={() => router.push(`/dashboard/${childId}/phonics`)}
      className="w-full text-left bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-4 shadow-sm active:scale-95 transition-transform duration-150"
    >
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-3xl shadow-sm flex-shrink-0">
          🔤
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="font-black text-amber-700 text-base">Phonics</span>
            <span className="text-xs text-gray-400 font-semibold bg-white/60 px-1.5 py-0.5 rounded-md">IPA</span>
          </div>
          <p className="text-xs font-semibold text-amber-600">
            {phonics.seen === 0
              ? `${phonics.total} bài · Nguyên âm · Phụ âm · Khó với người Việt`
              : `${phonics.seen}/${phonics.total} bài (${Math.floor(phonics.seen / phonics.total * 100)}%)`
            }
          </p>
        </div>
        <span className="text-amber-600 font-black text-lg flex-shrink-0">→</span>
      </div>
      {phonics.mastered > 0 && (
        <div className="mt-3 h-2 bg-white/60 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(pct, 2)}%` }}
          />
        </div>
      )}
    </button>
  )
}

export default function ChildRoadmap() {
  const router = useRouter()
  const { childId } = useParams<{ childId: string }>()
  const [child, setChild] = useState<Child | null>(null)
  const [syncByLevel, setSyncByLevel] = useState<SyncByLevel>({})
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/children').then(r => r.json()),
      fetch(`/api/sync/${childId}`).then(r => r.json()).catch(() => ({})),
      fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
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

  // Progress aggregates (consistent with kids profile card)
  const pf = (a: number, b: number) => b > 0 ? (a >= b ? 100 : Math.floor(a / b * 100)) : 0
  const allDaily = getAllDailyProgress(syncByLevel)
  const allAcad  = getAllAcademicProgress(syncByLevel['academic'] as SyncLevel | undefined)
  const kidsStarted = allDaily.seenWords > 0

  // Daily missions
  const todayStr = new Date().toISOString().split('T')[0]
  type DayEntry = { games?: number; topics?: number; words?: number }
  const todayPhonics  = ((syncByLevel['phonics'] as { history?: Record<string, DayEntry> } | undefined)?.history?.[todayStr]?.games ?? 0) > 0
  const todayDaily    = LEVEL_ORDER.some(l => ((syncByLevel[l] as { history?: Record<string, DayEntry> } | undefined)?.history?.[todayStr]?.games ?? 0) > 0)
  const todayAcademic = ((syncByLevel['academic'] as { history?: Record<string, DayEntry> } | undefined)?.history?.[todayStr]?.topics ?? 0) > 0
  const missionsDone  = [todayPhonics, todayDaily, todayAcademic].filter(Boolean).length
  const allMissions   = missionsDone === 3

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
        <button onClick={() => router.push('/kids')} className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none">←</button>
        <img src={getAvatarSrc(child!.emoji)} className="w-10 h-10 rounded-full object-cover flex-shrink-0" alt="" />
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
        </div>
      </div>

      {/* Kid FAQ */}
      <div className="max-w-lg mx-auto mb-4">
        <KidFaqSection />
      </div>

      <div className="space-y-3 max-w-lg mx-auto">

        {/* Section 1: Luyện Phát Âm */}
        <PhonicsEntryCard childId={childId} syncByLevel={syncByLevel} />

        {/* Section 2: VocabWise Daily */}
        <button
          onClick={() => router.push(`/dashboard/${childId}/kids`)}
          className="w-full text-left bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-2xl p-4 shadow-sm active:scale-95 transition-transform duration-150"
        >
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-3xl shadow-sm flex-shrink-0">
              📚
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="font-black text-purple-700 text-base">Daily</span>
                <span className="text-xs text-gray-400 font-semibold bg-white/60 px-1.5 py-0.5 rounded-md">Pre-A1 → C2</span>
              </div>
              <p className="text-xs font-semibold text-purple-600">
                {kidsStarted
                  ? `${allDaily.topicsCompleted}/${allDaily.totalTopics} chủ đề (${pf(allDaily.topicsCompleted, allDaily.totalTopics)}%) · ${allDaily.seenWords}/${allDaily.totalWords} từ (${pf(allDaily.seenWords, allDaily.totalWords)}%)`
                  : '180 chủ đề · 4.500+ từ · 6 cấp độ CEFR'}
              </p>
            </div>
            <span className="text-purple-500 font-black text-lg flex-shrink-0">→</span>
          </div>
        </button>

        {/* Section 3: VocabWise Academic */}
        <button
          onClick={() => { localStorage.setItem('vw_active_child', childId); router.push('/vocabwise') }}
          className="w-full text-left bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-4 shadow-sm active:scale-95 transition-transform duration-150"
        >
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl shadow-sm flex-shrink-0">
              🎓
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="font-black text-blue-700 text-base">VocabWise Academic</span>
                <span className="text-xs text-gray-400 font-semibold bg-white/60 px-1.5 py-0.5 rounded-md">IELTS · SAT</span>
              </div>
              <p className="text-xs font-semibold text-blue-600">
                {allAcad.completed > 0
                  ? `${allAcad.completed}/${allAcad.total} chủ đề (${pf(allAcad.completed, allAcad.total)}%) · ${allAcad.seenWords}/${allAcad.totalWords} từ (${pf(allAcad.seenWords, allAcad.totalWords)}%)`
                  : 'Từ vựng học thuật · Passage · 5 dạng bài tập · B1 → C2'}
              </p>
            </div>
            <span className="text-blue-600 font-black text-lg flex-shrink-0">→</span>
          </div>
        </button>

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
