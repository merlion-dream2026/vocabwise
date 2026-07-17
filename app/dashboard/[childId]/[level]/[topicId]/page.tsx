'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { loadDailyTopicOffline, saveLastSync, loadOfflineProgress, clearOfflineProgress } from '@/lib/offlineStorage'

const TrophyModal = dynamic(() => import('@/components/TrophyModal'), { ssr: false })

type Child = { id: string; name: string; emoji: string; level: string }
type MasteryData = { flashcard: boolean; games: string[] }
type StoryBlank = { word: string; options: string[] }
type ParsedExercise = { parts: string[]; blanks: StoryBlank[] }

// Ordered easy → hard (row 1 = recognition, row 5 = synthesis/production)
const STARTER_GAMES = [
  { key: 'flashcard',     label: 'Flashcard từ mới',  emoji: '📖' }, // row 1
  { key: 'listen',        label: 'Nghe & Chọn',        emoji: '👂' }, // row 1
  { key: 'truefalse',     label: 'Đúng / Sai',         emoji: '✅' }, // row 2
  { key: 'match',         label: 'Nối từ với hình',    emoji: '🖼️' }, // row 2
  { key: 'memory',        label: 'Lật thẻ',            emoji: '🧠' }, // row 3
  { key: 'bubble',        label: 'Bắn bong bóng',      emoji: '🫧' }, // row 3
  { key: 'fillletter',    label: 'Điền chữ thiếu',     emoji: '🔡' }, // row 4
  { key: 'speak',         label: 'Phát âm cùng AI ✨',   emoji: '🎤' }, // row 4
  { key: 'spell',         label: 'Đánh vần',            emoji: '🔤' }, // row 5
  { key: 'sentenceorder', label: 'Sắp xếp câu',        emoji: '🔁' }, // row 5
]

// Ordered easy → hard (row 1 = recognition, row 5 = timed/synthesis)
const EXPLORER_GAMES = [
  { key: 'flashcard',       label: 'Flashcard từ mới',  emoji: '📖' }, // row 1
  { key: 'listen',          label: 'Nghe & Chọn',        emoji: '👂' }, // row 1
  { key: 'truefalse',       label: 'Đúng / Sai',         emoji: '✅' }, // row 2
  { key: 'quiz',            label: 'Trắc nghiệm',         emoji: '❓' }, // row 2
  { key: 'gapfill',         label: 'Điền từ',             emoji: '✏️' }, // row 3
  { key: 'definitionmatch', label: 'Ghép định nghĩa',     emoji: '🔀' }, // row 4
  { key: 'speak',           label: 'Phát âm cùng AI ✨',   emoji: '🎤' }, // row 4
  { key: 'typing',          label: 'Gõ từ nhanh 15s',    emoji: '⌨️' }, // row 5
  { key: 'sentenceorder',   label: 'Sắp xếp câu',        emoji: '🔁' }, // row 5
  { key: 'speedround',      label: 'Speed Round ⚡',       emoji: '⚡' }, // row 6
]

const LEVEL_COLORS: Record<string, { bg: string; header: string; text: string }> = {
  seeker:   { bg: 'from-violet-50 to-purple-50',  header: 'bg-violet-500',  text: 'text-violet-600'  },
  starter:  { bg: 'from-pink-50 to-rose-50',       header: 'bg-pink-500',    text: 'text-pink-600'    },
  ranger:   { bg: 'from-emerald-50 to-teal-50',    header: 'bg-emerald-500', text: 'text-emerald-600' },
  explorer: { bg: 'from-blue-50 to-indigo-50',     header: 'bg-blue-500',    text: 'text-blue-600'    },
  scholar:  { bg: 'from-indigo-50 to-violet-50',   header: 'bg-indigo-500',  text: 'text-indigo-600'  },
  master:   { bg: 'from-gray-50 to-slate-100',     header: 'bg-gray-700',    text: 'text-gray-700'    },
}

function shuffleArr<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function parseExercise(en: string, words: { word: string }[]): ParsedExercise | null {
  const wordMap = new Map(words.map(w => [w.word.toLowerCase(), w.word]))
  const boldMatches = Array.from(en.matchAll(/\*\*(.+?)\*\*/g))
  const vocabBolds = boldMatches.filter(m => wordMap.has(m[1].toLowerCase()))
  if (vocabBolds.length === 0) return null

  const blanks: StoryBlank[] = vocabBolds.map(m => {
    const correct = wordMap.get(m[1].toLowerCase()) ?? m[1]
    const distractors = shuffleArr(words.filter(w => w.word.toLowerCase() !== m[1].toLowerCase())).slice(0, 3).map(w => w.word)
    return { word: correct, options: shuffleArr([correct, ...distractors]) }
  })

  const parts: string[] = []
  let remaining = en
  for (const m of vocabBolds) {
    const idx = remaining.indexOf(`**${m[1]}**`)
    parts.push(remaining.slice(0, idx).replace(/\*\*/g, ''))
    remaining = remaining.slice(idx + m[0].length)
  }
  parts.push(remaining.replace(/\*\*/g, ''))

  return { parts, blanks }
}

function getGamesForLevel(level: string) {
  return ['explorer', 'scholar', 'master'].includes(level) ? EXPLORER_GAMES : STARTER_GAMES
}

const KID_FAQ = [
  { q: '📖 Học một chủ đề như thế nào?', a: 'Bắt đầu bằng Flashcard để xem và nghe từ mới.\nSau đó chọn các trò chơi để luyện tập.\nHoàn thành Flashcard + 3 trò chơi → nhận 🏆!' },
  { q: '🎮 Có những trò chơi gì?', a: 'Level Seeker / Starter / Ranger (10 trò):\n📖 Flashcard · 👂 Nghe & Chọn · ✅ Đúng/Sai · 🖼️ Nối từ với hình\n🧠 Lật thẻ · 🫧 Bắn bong bóng · 🔡 Điền chữ thiếu\n🔤 Đánh vần · 🔁 Sắp xếp câu · 🎤 Phát âm cùng AI ✨\n\nLevel Explorer / Scholar / Master (10 trò khác):\n📖 Flashcard · 👂 Nghe & Chọn · ✅ Đúng/Sai\n❓ Trắc nghiệm · ✏️ Điền từ · 🔀 Ghép định nghĩa · 🎤 Phát âm cùng AI ✨\n⌨️ Gõ từ nhanh 15s · 🔁 Sắp xếp câu · ⚡ Speed Round' },
  { q: '🏆 Khi nào chủ đề được tính là hoàn thành?', a: 'Cần đủ 2 điều kiện:\n① Xem hết Flashcard tất cả các từ trong chủ đề\n② Đạt kết quả tốt trong ít nhất 3 trò chơi khác nhau\n\nHoàn thành rồi thì chủ đề sẽ hiện 🏆!' },
  { q: '📚 Mini Story là gì?', a: 'Mỗi chủ đề có 1 câu chuyện ngắn dùng các từ vừa học.\nCuộn xuống → đọc chuyện tiếng Anh + tiếng Việt, nghe audio.\nBấm "Làm bài" → điền từ vào chỗ trống trong chuyện!' },
  { q: '🎤 Game Phát âm cùng AI ✨ dùng như thế nào?', a: 'Bấm nút micro 🎤 → đọc to từ (hoặc câu) trên màn hình.\nApp nhận diện giọng và cho biết đúng hay sai.\nBấm 🔊 để nghe phát âm mẫu · ▶️ để nghe lại giọng mình.\n\n⚠️ Cần cho phép quyền Microphone khi trình duyệt hỏi.' },
]

export default function TopicPage() {
  const router = useRouter()
  const { childId, level, topicId } = useParams<{ childId: string; level: string; topicId: string }>()
  const [child, setChild] = useState<Child | null>(null)
  const [mastery, setMastery] = useState<MasteryData>({ flashcard: false, games: [] })
  const [topic, setTopic] = useState<{ id: string; name: string; emoji: string; color: string; words: { word: string; meaning: string; emoji: string; example: string }[] } | null>(null)
  const [allTopics, setAllTopics] = useState<{ id: string; name: string; emoji: string }[]>([])
  const [story, setStory] = useState<{ emojis: string[]; en: string; vi: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [offlineUnavailable, setOfflineUnavailable] = useState(false)
  const [syncToast, setSyncToast] = useState(false)
  const [showTrophy, setShowTrophy] = useState(false)
  const [showVI, setShowVI] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [showFaq, setShowFaq] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [showVoiceNotice, setShowVoiceNotice] = useState(false)
  const [showExercise, setShowExercise] = useState(false)
  const [exerciseAnswers, setExerciseAnswers] = useState<Record<number, string>>({})
  const [exerciseSubmitted, setExerciseSubmitted] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const exerciseCacheRef = useRef<{ key: string; data: ParsedExercise | null } | null>(null)
  const storyRef = useRef<HTMLDivElement | null>(null)

  const scrollToStory = () => {
    storyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Auto-scroll to Mini Story when arriving via nudge (e.g. from Flashcard completion screen)
  useEffect(() => {
    if (story && window.location.hash === '#mini-story') {
      setTimeout(scrollToStory, 200)
    }
  }, [story])

  useEffect(() => {
    // Offline path: serve from localStorage (avoids failed API calls)
    if (!navigator.onLine) {
      const cached = loadDailyTopicOffline(level, topicId)
      if (cached) {
        const childInfo = JSON.parse(localStorage.getItem('vw_child_' + childId) ?? 'null') as Child | null
        setChild(childInfo ?? { id: childId, name: '', emoji: '🧒', level })
        setTopic(cached.topic)
        setAllTopics(cached.topicList)
        setStory(cached.story)
        setMastery({ flashcard: false, games: [] })
        setLoading(false)
      } else {
        setOfflineUnavailable(true)
        setLoading(false)
      }
      return
    }

    Promise.all([
      fetch(`/api/children/${childId}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/sync/${childId}?level=${level}`).then(r => r.json()),
      fetch(`/api/words/${level}/${topicId}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`/api/words/${level}/topics`).then(r => r.json()).catch(() => []),
      fetch(`/api/stories/${level}/${topicId}`).then(r => r.json()).catch(() => null),
    ]).then(([found, syncData, foundTopic, topicsList, storyData]) => {
      if (!found) { router.push('/kids'); return }
      if (!foundTopic) { router.push(`/dashboard/${childId}/${level}`); return }
      setChild(found)
      setTopic(foundTopic)
      setAllTopics(topicsList ?? [])
      setStory(storyData ?? null)

      // Cache sync data for offline game initialization
      saveLastSync(childId, level, syncData)

      // Auto-sync any offline-accumulated progress silently
      const pending = loadOfflineProgress(childId, level, topicId)
      if (pending) {
        const { level: lvl, seen, weak_words, streak, battle, mastery: offMastery, history, srs } = pending
        fetch(`/api/sync/${childId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ level: lvl, seen, weak_words, streak, battle, mastery: offMastery, history, srs }),
        }).then(res => {
          if (!res.ok) return
          clearOfflineProgress(childId, level, topicId)
          const m: MasteryData = offMastery[topicId] ?? { flashcard: false, games: [] }
          setMastery(m)
          if (m.flashcard && m.games.length >= 3) {
            const flagKey = `trophy_${childId}_${level}_${topicId}`
            if (!sessionStorage.getItem(flagKey)) { sessionStorage.setItem(flagKey, '1'); setShowTrophy(true) }
          }
          setSyncToast(true)
          setTimeout(() => setSyncToast(false), 3000)
        }).catch(() => {})
      }

      const m: MasteryData = syncData?.mastery?.[topicId] ?? { flashcard: false, games: [] }
      setMastery(m)
      const done = m.flashcard && m.games.length >= 3
      const flagKey = `trophy_${childId}_${level}_${topicId}`
      if (done && !sessionStorage.getItem(flagKey)) {
        sessionStorage.setItem(flagKey, '1')
        setShowTrophy(true)
      }
      setLoading(false)
    })
  }, [childId, level, topicId, router])

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
      setSpeaking(false)
    }
  }, [topicId])

  // One-time notice: Mini Story narrator switches to a male voice from Scholar onward
  useEffect(() => {
    if (level === 'scholar' && !localStorage.getItem(`voicechange_${childId}`)) {
      setShowVoiceNotice(true)
    }
  }, [level, childId])

  function dismissVoiceNotice() {
    localStorage.setItem(`voicechange_${childId}`, '1')
    setShowVoiceNotice(false)
  }

  if (loading) {
    const skeletonColors = LEVEL_COLORS[level] ?? LEVEL_COLORS.explorer
    return (
      <div className={`min-h-screen bg-gradient-to-br ${skeletonColors.bg} animate-pulse`}>
        <div className={`${skeletonColors.header} px-4 py-4 flex items-center gap-3`}>
          <div className="h-6 w-6 bg-white/30 rounded-full" />
          <div className="h-6 w-6 bg-white/30 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <div className="h-4 w-32 bg-white/30 rounded-full" />
            <div className="h-3 w-20 bg-white/20 rounded-full" />
          </div>
        </div>
        <div className="max-w-xl mx-auto px-4 py-5 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 h-16 bg-white rounded-2xl shadow-sm" />
            <div className="w-28 h-16 bg-white rounded-2xl shadow-sm" />
          </div>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className={`${skeletonColors.header} h-14`} />
            <div className="divide-y divide-gray-50">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="h-8 w-8 bg-gray-100 rounded-full flex-shrink-0" />
                  <div className="flex-1 h-4 bg-gray-100 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (offlineUnavailable || !topic) {
    const colors = LEVEL_COLORS[level] ?? LEVEL_COLORS.explorer
    return (
      <div className={`min-h-screen bg-gradient-to-br ${colors.bg} flex flex-col`}>
        <div className={`${colors.header} text-white px-4 py-4 flex items-center gap-3`}>
          <button onClick={() => router.back()} className="text-white/70 hover:text-white text-xl">←</button>
          <span className="font-bold text-lg">Đang offline</span>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">📴</div>
            <h2 className="text-xl font-black text-gray-800 mb-2">Chủ đề chưa được tải offline</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">Kết nối internet để xem nội dung này, hoặc nhấn nút tải (↓) khi có mạng trước khi vào chế độ offline.</p>
            <button
              onClick={() => router.back()}
              className={`${colors.header} text-white font-bold px-6 py-3 rounded-2xl active:scale-95 transition-all`}
            >
              ← Quay lại danh sách
            </button>
          </div>
        </div>
      </div>
    )
  }

  const games = getGamesForLevel(level)
  const colors = LEVEL_COLORS[level] ?? LEVEL_COLORS.explorer
  const isDone = mastery.flashcard && mastery.games.length >= 3
  const backUrl = `/dashboard/${childId}/${level}`

  const topicIdx = allTopics.findIndex((t: { id: string }) => t.id === topicId)
  const prevTopic = topicIdx > 0 ? allTopics[topicIdx - 1] : null
  const nextTopic = topicIdx < allTopics.length - 1 ? allTopics[topicIdx + 1] : null

  // Build exercise once per topic (stable shuffled options)
  const cacheKey = `${level}.${topicId}`
  if (!exerciseCacheRef.current || exerciseCacheRef.current.key !== cacheKey) {
    exerciseCacheRef.current = {
      key: cacheKey,
      data: story ? parseExercise(story.en, (topic as { words: { word: string }[] }).words) : null,
    }
  }
  const parsedExercise = exerciseCacheRef.current.data

  function renderHighlighted(text: string) {
    return text.split(/\*\*(.+?)\*\*/).map((part, i) =>
      i % 2 === 1
        ? <strong key={i} className="text-amber-700 bg-amber-100 rounded px-0.5 font-bold not-italic">{part}</strong>
        : <span key={i}>{part}</span>
    )
  }

  function handleSpeak() {
    if (typeof window === 'undefined' || !story) return
    if (speaking) {
      audioRef.current?.pause()
      audioRef.current = null
      window.speechSynthesis?.cancel()
      setSpeaking(false)
      return
    }
    const topicNum = String(topicIdx + 1).padStart(2, '0')
    const mp3Src = `/audio/stories/${level}.${topicNum}.${topicId}.mp3`
    const audio = new Audio(mp3Src)
    audioRef.current = audio

    let fellBack = false
    const fallbackToTTS = () => {
      if (fellBack || audioRef.current !== audio) return
      fellBack = true
      audioRef.current = null
      const plain = story.en.replace(/\*\*/g, '')
      const utt = new SpeechSynthesisUtterance(plain)
      utt.lang = 'en-US'; utt.rate = 0.85
      utt.onend = () => setSpeaking(false)
      setSpeaking(true)
      window.speechSynthesis.speak(utt)
    }

    audio.addEventListener('ended', () => {
      if (audioRef.current !== audio) return
      setSpeaking(false)
      audioRef.current = null
    }, { once: true })
    audio.addEventListener('error', fallbackToTTS, { once: true })

    setSpeaking(true)
    audio.play().catch(fallbackToTTS)
  }

  const LEVEL_LABELS: Record<string, string> = {
    seeker: 'Pre-A1', starter: 'A1', ranger: 'A2',
    explorer: 'B1', scholar: 'B2', master: 'C1',
  }

  function handleShare() {
    const lvLabel = LEVEL_LABELS[level] ?? level
    const text = [
      `🏆 ${child?.name ? child.name + ' vừa' : 'Vừa'} chinh phục chủ đề ${(topic as { emoji: string }).emoji} ${(topic as { name: string }).name}!`,
      `📚 VocabWise Daily${lvLabel ? ` · ${lvLabel}` : ''}`,
      'Học tiếng Anh vui và hiệu quả',
    ].join('\n')
    if (navigator.share) {
      navigator.share({ title: 'VocabWise Daily', text, url: 'https://vocabwise.id.vn' }).catch(() => {})
    } else {
      navigator.clipboard?.writeText(text).catch(() => {})
      alert('Đã sao chép! Dán vào Zalo/Facebook để chia sẻ.')
    }
  }

  function resetExercise() {
    setExerciseAnswers({})
    setExerciseSubmitted(false)
  }

  const exerciseScore = parsedExercise
    ? parsedExercise.blanks.filter((b, i) => exerciseAnswers[i]?.toLowerCase() === b.word.toLowerCase()).length
    : 0
  const allAnswered = parsedExercise
    ? parsedExercise.blanks.every((_, i) => !!exerciseAnswers[i])
    : false

  return (
    <div className={`min-h-screen bg-gradient-to-br ${colors.bg}`}>
      {showTrophy && (
        <TrophyModal
          topicName={(topic as { name: string }).name}
          topicEmoji={(topic as { emoji: string }).emoji}
          childName={child?.name}
          levelName={level}
          onDone={() => setShowTrophy(false)}
        />
      )}

      {/* Auto-sync toast */}
      {syncToast && (
        <div className="fixed bottom-24 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
          <div className="bg-gray-800 text-white text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-lg flex items-center gap-2">
            <span>✅</span> Đã đồng bộ tiến độ offline
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`${colors.header} text-white`}>
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.push(backUrl)} aria-label="Quay lại" className="text-white/70 hover:text-white text-xl">←</button>
          <span className="text-2xl">{(topic as { emoji: string }).emoji}</span>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg leading-tight">{(topic as { name: string }).name}</h1>
            <p className="text-white/70 text-xs">{(topic as { words: unknown[] }).words.length} từ • {child!.name} • {topicIdx + 1}/{allTopics.length}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex flex-col items-center gap-0.5">
              <button
                onClick={() => prevTopic && router.push(`/dashboard/${childId}/${level}/${(prevTopic as { id: string }).id}`)}
                disabled={!prevTopic}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm transition-all"
              >‹</button>
              <span className="text-[10px] text-white/60 leading-none w-12 text-center truncate">
                {prevTopic ? (prevTopic as { name: string }).name : ''}
              </span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <button
                onClick={() => nextTopic && router.push(`/dashboard/${childId}/${level}/${(nextTopic as { id: string }).id}`)}
                disabled={!nextTopic}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm transition-all"
              >›</button>
              <span className="text-[10px] text-white/60 leading-none w-12 text-center truncate">
                {nextTopic ? (nextTopic as { name: string }).name : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-5 space-y-4">
        {/* FAQ + Mastery row */}
        <div className="flex gap-3">
          {/* FAQ toggle button */}
          <button
            onClick={() => { setShowFaq(v => !v); setOpenFaq(null) }}
            className={`w-20 flex-shrink-0 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-1 transition-colors ${showFaq ? 'bg-purple-100 border-2 border-purple-300' : 'bg-white'}`}>
            <span className="text-xl leading-none">❓</span>
            <p className="font-semibold text-gray-700 text-sm leading-tight text-center">Cách học</p>
          </button>

          {/* Mastery progress card */}
          <div className={`flex-1 rounded-2xl p-4 ${isDone ? 'bg-green-100 border border-green-200' : 'bg-white'} shadow-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-700 text-sm mb-1">Tiến độ chinh phục</p>
                <div className="flex items-center gap-3 text-sm">
                  <span className={mastery.flashcard ? 'text-green-600' : 'text-gray-400'}>
                    {mastery.flashcard ? '✅' : '📖'} Flashcard
                  </span>
                  <span className={mastery.games.length >= 3 ? 'text-green-600' : 'text-gray-400'}>
                    {'⭐'.repeat(mastery.games.length)}{'☆'.repeat(Math.max(0, 3 - mastery.games.length))} {mastery.games.length}/3 game
                  </span>
                </div>
              </div>
              {isDone && (
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <span className="text-2xl">🏆</span>
                  <button
                    onClick={handleShare}
                    className="text-[11px] font-bold text-green-600 hover:text-green-700 leading-none">
                    📤 Chia sẻ
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Inline FAQ — shown when toggled */}
        {showFaq && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100">
            {KID_FAQ.map((item, i) => (
              <div key={i}>
                <button
                  onClick={() => setOpenFaq(o => o === i ? null : i)}
                  className="w-full text-left px-4 py-3 flex items-center justify-between gap-2 hover:bg-gray-50 transition-colors">
                  <span className="font-bold text-gray-700 text-sm">{item.q}</span>
                  <span className={`text-gray-400 text-xs font-black flex-shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`}>▾</span>
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-3">
                    <div className="bg-purple-50 rounded-xl p-3">
                      {item.a.split('\n').map((line, j) => (
                        <p key={j} className={`text-xs text-gray-600 leading-relaxed ${j > 0 ? 'mt-1' : ''}`}>
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

        {/* Game picker */}
        <div className="grid grid-cols-2 gap-3">
          {games.map(game => {
            const gameDone = game.key === 'flashcard' ? mastery.flashcard : mastery.games.includes(game.key)
            const isAI = game.key === 'speak'
            return (
              <button key={game.key}
                onClick={() => router.push(`/dashboard/${childId}/${level}/${topicId}/${game.key}`)}
                className={`relative rounded-2xl px-3 py-3 flex items-center gap-3 shadow-sm active:scale-95 transition-all text-left ${
                  isAI
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg hover:brightness-105'
                    : 'bg-white hover:shadow-md'
                }`}>
                {gameDone && (
                  <span className="absolute top-1.5 right-2 text-sm leading-none">⭐</span>
                )}
                {isAI && !gameDone && (
                  <span className="absolute top-1.5 right-2 text-[10px] font-black bg-yellow-300 text-yellow-900 px-1.5 py-0.5 rounded-full leading-none">AI</span>
                )}
                <span className="text-3xl flex-shrink-0">{game.emoji}</span>
                <p className={`font-bold text-sm leading-tight pr-6 ${isAI ? 'text-white' : 'text-gray-800'}`}>{game.label}</p>
              </button>
            )
          })}
        </div>

        {/* One-time voice-change notice (Scholar onward) */}
        {story && showVoiceNotice && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3 flex items-start gap-2">
            <span className="text-lg leading-none flex-shrink-0">🎙️</span>
            <p className="flex-1 text-sm text-indigo-700 leading-relaxed">
              <span className="font-bold">Giọng đọc mới! 😊</span> Giúp bạn làm quen nhiều giọng tiếng Anh khác nhau
            </p>
            <button
              onClick={dismissVoiceNotice}
              aria-label="Đóng"
              className="text-indigo-400 hover:text-indigo-600 text-sm leading-none flex-shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        {/* Mini Story teaser line */}
        {story && (
          <p className={`flex items-center justify-center gap-2 text-center font-black text-base ${colors.text}`}>
            <span className="text-xl animate-bounce">🚀</span>
            Nâng trình nghe, đọc hiểu cùng Mini Story!
          </p>
        )}

        {/* Mini Story */}
        {story && (
          <div ref={storyRef} className="bg-white rounded-2xl shadow-sm overflow-hidden scroll-mt-4">
            {/* Story header */}
            <div className={`${colors.header} px-4 py-3 flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">📖</span>
                <span className="font-bold text-white text-sm">Mini Story</span>
                <span className="text-base">{story.emojis.join(' ')}</span>
              </div>
              <button
                onClick={handleSpeak}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                  speaking ? 'bg-white text-red-500' : 'bg-white/20 text-white hover:bg-white/30'
                }`}
              >
                {speaking ? '⏹ Dừng' : '🔊 Nghe'}
              </button>
            </div>

            {!showExercise || !parsedExercise ? (
              /* ── Read mode ── */
              <div className="px-4 pt-3 pb-4">
                <div className="text-gray-700 text-sm leading-relaxed mb-2">
                  {renderHighlighted(story.en)}
                </div>
                <button
                  onClick={() => setShowVI(v => !v)}
                  className="text-xs text-gray-400 hover:text-gray-600 font-semibold flex items-center gap-1 transition-colors"
                >
                  {showVI ? '🙈 Ẩn tiếng Việt' : '👁 Xem tiếng Việt'}
                </button>
                {showVI && (
                  <div className="mt-2 bg-amber-50 rounded-xl p-3 text-sm text-gray-600 leading-relaxed border border-amber-100">
                    {renderHighlighted(story.vi)}
                  </div>
                )}
                {parsedExercise && (
                  <button
                    onClick={() => { setShowExercise(true); resetExercise() }}
                    className={`mt-3 w-full text-sm font-bold px-4 py-3 rounded-xl transition-all ${colors.header} text-white opacity-80 hover:opacity-100`}
                  >
                    📝 Làm bài tập
                  </button>
                )}
              </div>
            ) : (
              /* ── Exercise mode ── */
              <div className="px-4 pt-3 pb-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">📝 Điền từ vào chỗ trống</p>
                  <button
                    onClick={() => setShowExercise(false)}
                    className="text-xs text-gray-400 hover:text-gray-600 font-semibold"
                  >
                    ← Đọc lại
                  </button>
                </div>

                {/* Story with inline dropdowns */}
                <div className="text-sm text-gray-700 leading-loose mb-4 bg-gray-50 rounded-xl p-3">
                  {parsedExercise.parts.map((part, i) => (
                    <span key={i}>
                      {part}
                      {i < parsedExercise.blanks.length && (() => {
                        const ans = exerciseAnswers[i]
                        const blank = parsedExercise.blanks[i]
                        const isCorrect = exerciseSubmitted && ans?.toLowerCase() === blank.word.toLowerCase()
                        const isWrong = exerciseSubmitted && ans && ans.toLowerCase() !== blank.word.toLowerCase()
                        return (
                          <select
                            value={ans ?? ''}
                            onChange={e => !exerciseSubmitted && setExerciseAnswers(a => ({ ...a, [i]: e.target.value }))}
                            disabled={exerciseSubmitted}
                            className={`inline-block mx-0.5 border-2 rounded-lg px-1 py-0.5 text-xs font-bold bg-white cursor-pointer
                              ${isCorrect ? 'border-green-400 text-green-700 bg-green-50'
                                : isWrong ? 'border-red-400 text-red-600 bg-red-50'
                                : ans ? 'border-blue-400 text-blue-700'
                                : 'border-dashed border-gray-300 text-gray-400'}`}
                          >
                            <option value="">_ _ _</option>
                            {blank.options.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )
                      })()}
                    </span>
                  ))}
                </div>

                {/* Wrong answers correction */}
                {exerciseSubmitted && parsedExercise.blanks.some((b, i) => exerciseAnswers[i]?.toLowerCase() !== b.word.toLowerCase()) && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 text-xs space-y-1">
                    {parsedExercise.blanks.map((b, i) =>
                      exerciseAnswers[i]?.toLowerCase() !== b.word.toLowerCase() ? (
                        <p key={i} className="text-gray-600">
                          Ô {i + 1}: <span className="line-through text-red-400">{exerciseAnswers[i] || '—'}</span>
                          {' → '}<span className="font-bold text-green-600">{b.word}</span>
                        </p>
                      ) : null
                    )}
                  </div>
                )}

                {!exerciseSubmitted ? (
                  <button
                    onClick={() => setExerciseSubmitted(true)}
                    disabled={!allAnswered}
                    className={`w-full font-black text-sm py-3 rounded-xl transition-all ${
                      allAnswered ? `${colors.header} text-white` : 'bg-gray-100 text-gray-300'
                    }`}
                  >
                    Kiểm tra ✓
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-center font-black text-base">
                      {exerciseScore === parsedExercise.blanks.length ? '🏆 Hoàn hảo!' : `${exerciseScore}/${parsedExercise.blanks.length} đúng`}
                    </p>
                    <button onClick={resetExercise} className="w-full bg-gray-100 text-gray-600 font-bold text-sm py-3 rounded-xl">
                      🔄 Thử lại
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
