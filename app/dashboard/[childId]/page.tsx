'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import phonemesData from '@/data/phonemes.json'

const TOTAL_PAIRS = phonemesData.groups.reduce((s, g) => s + g.pairs.length, 0)
const ALL_PAIR_IDS = phonemesData.groups.flatMap(g => g.pairs.map(p => p.id))


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
    q: '🔤 Module Luyện Phát Âm là gì?',
    a: 'Ngoài học từ vựng theo chủ đề, bạn còn có thể luyện phát âm tiếng Anh theo chuẩn IPA!\n\nBấm card 🔤 "Luyện Phát Âm" ở màn hình chọn level để vào.\n\nCó 3 nhóm âm cần học theo thứ tự:\n① 🎵 Nguyên âm — /iː/ vs /ɪ/, /æ/ vs /e/...\n② 🔊 Phụ âm — /p/ vs /b/, /θ/ vs /ð/...\n③ 🇻🇳 Khó với người Việt — /l/ vs /r/, âm cuối, cụm phụ âm\n\nMỗi nhóm âm: học → 3 game đạt ≥70% = 🏆 Thành thạo!',
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
type SyncRow = { seen?: string[]; mastery?: Record<string, { flashcard: boolean; games: string[] }> }
type SyncByLevel = Record<string, SyncRow>

function PhonicsEntryCard({ childId, syncByLevel }: { childId: string; syncByLevel: SyncByLevel }) {
  const router = useRouter()
  const phonicsMastery = syncByLevel['phonics']?.mastery ?? {}
  const seenCount     = Object.values(phonicsMastery).filter(m => m.flashcard).length
  const masteredCount = ALL_PAIR_IDS.filter(id => {
    const m = phonicsMastery[id]
    return m?.flashcard && ['minimal-pairs', 'listen-pick', 'speak'].every(g => m.games?.includes(g))
  }).length
  const pct = TOTAL_PAIRS > 0 ? Math.round((masteredCount / TOTAL_PAIRS) * 100) : 0

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
            <span className="font-black text-amber-700 text-base">Luyện Phát Âm</span>
            <span className="text-xs text-gray-400 font-semibold bg-white/60 px-1.5 py-0.5 rounded-md">IPA</span>
          </div>
          <p className="text-xs font-semibold text-amber-600">
            {seenCount === 0
              ? `${TOTAL_PAIRS} nhóm âm · Nguyên âm · Phụ âm · Khó với người Việt`
              : `${seenCount}/${TOTAL_PAIRS} đã học · 🏆 ${masteredCount}/${TOTAL_PAIRS} thành thạo`
            }
          </p>
        </div>
        <span className="text-amber-600 font-black text-lg flex-shrink-0">→</span>
      </div>
      {masteredCount > 0 && (
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

  useEffect(() => {
    Promise.all([
      fetch('/api/children').then(r => r.json()),
      fetch(`/api/sync/${childId}`).then(r => r.json()).catch(() => ({})),
    ]).then(([kids, allSync]) => {
      const found = (kids as Child[]).find(k => k.id === childId)
      if (!found) { router.push('/kids'); return }
      setChild(found)
      setSyncByLevel(allSync ?? {})
      setLoading(false)
    })
  }, [childId, router])

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
      <div className="text-4xl animate-pulse">🌟</div>
    </div>
  )

  // Count overall Kids progress for the section card
  const totalSeenWords = LEVEL_ORDER.reduce((sum, lvl) => sum + (syncByLevel[lvl]?.seen?.length ?? 0), 0)
  const totalMastered  = LEVEL_ORDER.reduce((sum, lvl) =>
    sum + Object.values(syncByLevel[lvl]?.mastery ?? {}).filter(m => m.flashcard && m.games.length >= 3).length, 0)
  const kidsStarted = totalSeenWords > 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 max-w-lg mx-auto">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none">←</button>
        <div className="text-4xl">{child!.emoji}</div>
        <div>
          <h1 className="text-xl font-black text-gray-800 leading-tight">{child!.name}</h1>
          <p className="text-gray-400 text-xs font-semibold">Chọn module để học</p>
        </div>
      </div>

      {/* Kid FAQ */}
      <div className="max-w-lg mx-auto mb-4">
        <KidFaqSection />
      </div>

      <div className="space-y-3 max-w-lg mx-auto">

        {/* Section 1: Luyện Phát Âm */}
        <PhonicsEntryCard childId={childId} syncByLevel={syncByLevel} />

        {/* Section 2: VocabWise Kids */}
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
                <span className="font-black text-purple-700 text-base">VocabWise Kids</span>
                <span className="text-xs text-gray-400 font-semibold bg-white/60 px-1.5 py-0.5 rounded-md">Pre-A1 → C2</span>
              </div>
              <p className="text-xs font-semibold text-purple-600">
                {kidsStarted
                  ? `${totalSeenWords} từ đã học · ${totalMastered} chủ đề hoàn thành`
                  : '180 chủ đề · 2.300+ từ · 6 cấp độ CEFR'}
              </p>
            </div>
            <span className="text-purple-500 font-black text-lg flex-shrink-0">→</span>
          </div>
        </button>

        {/* Section 3: VocabWise Academic */}
        <button
          onClick={() => { sessionStorage.setItem('vw_active_child', childId); router.push('/vocabwise') }}
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
                Từ vựng học thuật · Passage · 5 dạng bài tập · B1 → C2
              </p>
            </div>
            <span className="text-blue-600 font-black text-lg flex-shrink-0">→</span>
          </div>
        </button>

      </div>
    </div>
  )
}
