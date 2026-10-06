'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { loadDailyTopicOffline, saveLastSync, loadOfflineProgress, clearOfflineProgress } from '@/lib/offlineStorage'
import { isTopicMastered, type MasteryEntry } from '@/lib/topicMastery'
import { HubStyles, Rise, TopicHero, RoundCards, WordPreview, PRESS } from '@/components/TopicHub'
import PageSkeleton from '@/components/PageSkeleton'

const TrophyModal = dynamic(() => import('@/components/TrophyModal'), { ssr: false })

type Child = { id: string; name: string; emoji: string; level: string }
type MasteryData = MasteryEntry
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
  { key: 'sentence',        label: 'Đặt câu cùng AI ✍️',  emoji: '✍️' }, // row 6 — production: tự viết câu, AI chấm
]

const LEVEL_COLORS: Record<string, { bg: string; header: string; text: string; soft: string; deep: string; edge: string }> = {
  seeker:   { bg: 'from-violet-50 to-purple-50',  header: 'bg-violet-500',  text: 'text-violet-600',  soft: 'bg-violet-100',  deep: 'text-violet-800' , edge: 'border-violet-700' },
  starter:  { bg: 'from-pink-50 to-rose-50',       header: 'bg-pink-500',    text: 'text-pink-600',    soft: 'bg-pink-100',    deep: 'text-pink-800'   , edge: 'border-pink-700' },
  ranger:   { bg: 'from-emerald-50 to-teal-50',    header: 'bg-emerald-500', text: 'text-emerald-600', soft: 'bg-emerald-100', deep: 'text-emerald-800', edge: 'border-emerald-700' },
  explorer: { bg: 'from-blue-50 to-indigo-50',     header: 'bg-blue-500',    text: 'text-blue-600',    soft: 'bg-blue-100',    deep: 'text-blue-800'   , edge: 'border-blue-700' },
  scholar:  { bg: 'from-indigo-50 to-violet-50',   header: 'bg-indigo-500',  text: 'text-indigo-600',  soft: 'bg-indigo-100',  deep: 'text-indigo-800' , edge: 'border-indigo-700' },
  master:   { bg: 'from-gray-50 to-slate-100',     header: 'bg-gray-700',    text: 'text-gray-700',    soft: 'bg-gray-200',    deep: 'text-gray-800'   , edge: 'border-gray-900' },
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
  { q: '📖 Học một chủ đề như thế nào?', a: 'Bắt đầu bằng Flashcard để xem và nghe từ mới.\nSau đó chọn các trò chơi để luyện tập.\nQua Vòng 1 và Vòng 2 → nhận 🏆!' },
  { q: '🎮 Có những trò chơi gì?', a: 'Level Seeker / Starter / Ranger (10 trò):\n📖 Flashcard · 👂 Nghe & Chọn · ✅ Đúng/Sai · 🖼️ Nối từ với hình\n🧠 Lật thẻ · 🫧 Bắn bong bóng · 🔡 Điền chữ thiếu\n🔤 Đánh vần · 🔁 Sắp xếp câu · 🎤 Phát âm cùng AI ✨\n\nLevel Explorer / Scholar / Master (11 trò khác):\n📖 Flashcard · 👂 Nghe & Chọn · ✅ Đúng/Sai\n❓ Trắc nghiệm · ✏️ Điền từ · 🔀 Ghép định nghĩa · 🎤 Phát âm cùng AI ✨\n⌨️ Gõ từ nhanh 15s · 🔁 Sắp xếp câu · ⚡ Speed Round · ✍️ Đặt câu cùng AI' },
  { q: '🏆 Tiêu chí hoàn thành bài học', a: 'Cần đủ 3 điều kiện:\n① Xem hết Flashcard tất cả các từ trong chủ đề\n② Vòng 1 · Làm quen: đạt ⭐⭐⭐ (trên 80% câu đúng) ở ít nhất 3 trong 4 trò chơi\n③ Vòng 2 · Ôn tập: đạt ⭐⭐⭐ ở ít nhất 2 trong 3 trò chơi\n(Các trò ở mục "Thử thách thêm" để chơi cho vui, không bắt buộc.)\n\nSao tính theo lần chơi gần nhất: ≤50% = ⭐ · ≤80% = ⭐⭐ · trên 80% = ⭐⭐⭐.\nChơi lại bao nhiêu lần cũng được để lên sao!' },
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
  const [storyOpen, setStoryOpen] = useState(false)
  const [sticker, setSticker] = useState<{ legacy: boolean } | null>(null)
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
      setStoryOpen(true)
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
      fetch(`/api/stickers/${childId}`).then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([found, syncData, foundTopic, topicsList, storyData, stickerList]) => {
      if (!found) { router.push('/kids'); return }
      if (!foundTopic) { router.push(`/dashboard/${childId}/${level}`); return }
      setChild(found)
      setTopic(foundTopic)
      setAllTopics(topicsList ?? [])
      setStory(storyData ?? null)
      const mine = (stickerList as { level: string; topic_id: string; legacy: boolean }[]).find(s => s.level === level && s.topic_id === topicId)
      setSticker(mine ? { legacy: mine.legacy } : null)

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
        }).then(async res => {
          if (!res.ok) return
          clearOfflineProgress(childId, level, topicId)
          const synced = await res.json().catch(() => null) as { newStickers?: string[] } | null
          if (synced?.newStickers?.includes(topicId)) setSticker({ legacy: false })
          const m: MasteryData = offMastery[topicId] ?? { flashcard: false, games: [] }
          setMastery(m)
          if (isTopicMastered(m, level)) {
            const flagKey = `trophy_${childId}_${level}_${topicId}`
            if (!sessionStorage.getItem(flagKey)) { sessionStorage.setItem(flagKey, '1'); setShowTrophy(true) }
          }
          setSyncToast(true)
          setTimeout(() => setSyncToast(false), 3000)
        }).catch(() => {})
      }

      const m: MasteryData = syncData?.mastery?.[topicId] ?? { flashcard: false, games: [] }
      setMastery(m)
      const done = isTopicMastered(m, level)
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
    return <PageSkeleton header={skeletonColors.header} bg={skeletonColors.bg} cards={[300, 72, 280]} />
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
      <HubStyles />
      {showTrophy && (
        <TrophyModal
          topicName={(topic as { name: string }).name}
          topicEmoji={(topic as { emoji: string }).emoji}
          childName={child?.name}
          levelName={level}
          newSticker={!!sticker && !sticker.legacy}
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
      <div className={`${colors.header} ${colors.edge} rounded-b-3xl border-b-[4px] text-white`}>
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => router.push(backUrl)} aria-label="Quay lại"
            className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-b-[3px] border-black/20 bg-white/25 text-lg font-bold ${PRESS}`}>←</button>
          <span className="flex h-11 w-11 flex-shrink-0 -rotate-6 items-center justify-center rounded-2xl bg-white text-2xl shadow">{(topic as { emoji: string }).emoji}</span>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg leading-tight">{(topic as { name: string }).name}</h1>
            <p className="text-white/80 text-xs font-semibold">{(topic as { words: unknown[] }).words.length} từ • {child!.name} • {topicIdx + 1}/{allTopics.length}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {([['‹', prevTopic], ['›', nextTopic]] as const).map(([arrow, t]) => (
              <div key={arrow} className="flex flex-col items-center gap-0.5">
                <button
                  onClick={() => t && router.push(`/dashboard/${childId}/${level}/${(t as { id: string }).id}`)}
                  disabled={!t}
                  aria-label={arrow === '‹' ? 'Chủ đề trước' : 'Chủ đề sau'}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-b-[3px] border-black/20 bg-white/25 text-base font-bold disabled:opacity-30 ${PRESS}`}
                >{arrow}</button>
                <span className="text-[10px] text-white/70 leading-none w-12 text-center truncate">
                  {t ? (t as { name: string }).name : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-5 space-y-4">
        {/* Topic words: chips to tap-and-hear, "Chi tiết" opens the Flashcard */}
        <Rise i={0}>
          <WordPreview
            words={(topic as { words: { word: string; meaning: string; emoji: string }[] }).words}
            onDetail={() => router.push(`/dashboard/${childId}/${level}/${topicId}/flashcard`)}
          />
        </Rise>

        {/* Hero (status + journey + next-step button) */}
        <Rise i={1}>
          <TopicHero
            colors={colors}
            level={level}
            topicEmoji={(topic as { emoji: string }).emoji}
            wordCount={(topic as { words: unknown[] }).words.length}
            entry={mastery}
            games={games}
            nextTopicName={nextTopic ? (nextTopic as { name: string }).name : null}
            onOpen={(key) => router.push(`/dashboard/${childId}/${level}/${topicId}/${key}`)}
            onNextTopic={() => nextTopic && router.push(`/dashboard/${childId}/${level}/${(nextTopic as { id: string }).id}`)}
            onShare={handleShare}
            onReplayTrophy={() => setShowTrophy(true)}
            hasSticker={!!sticker}
            faqOpen={showFaq}
            onToggleFaq={() => { setShowFaq(v => !v); setOpenFaq(null) }}
          />
        </Rise>

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

        {/* Vòng 1 / Vòng 2 */}
        <Rise i={2}>
          <RoundCards
            level={level}
            entry={mastery}
            games={games}
            onOpen={(key) => router.push(`/dashboard/${childId}/${level}/${topicId}/${key}`)}
          />
        </Rise>

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

        {/* Mini Story */}
        {story && (
          <div ref={storyRef} className="rounded-3xl border-2 border-b-[4px] border-purple-200 border-b-purple-300 bg-purple-50 p-4 scroll-mt-4">
            {/* Story header */}
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border-b-[3px] border-purple-800 bg-purple-600 px-3 py-1.5 text-sm font-bold text-white">
                📖 Mini Story <span className="text-base">{story.emojis.join(' ')}</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSpeak}
                  className={`flex items-center gap-1 rounded-full border-b-[3px] px-3 py-1.5 text-xs font-bold ${PRESS} ${
                    speaking ? 'border-red-700 bg-red-500 text-white' : 'border-amber-600 bg-amber-400 text-amber-950'
                  }`}
                >
                  {speaking ? '⏹ Dừng' : '🔊 Nghe'}
                </button>
                <button
                  onClick={() => setStoryOpen(v => !v)}
                  aria-expanded={storyOpen}
                  className={`rounded-full border-b-[3px] border-purple-300 bg-white px-3 py-1.5 text-xs font-bold text-purple-700 ${PRESS}`}
                >
                  {storyOpen ? 'Thu gọn ▴' : 'Đọc ▾'}
                </button>
              </div>
            </div>
            {!storyOpen && <p className="mt-2 text-xs font-semibold text-purple-700/80">🚀 Nâng trình nghe, đọc hiểu và làm bài tập cùng Mini Story</p>}

            {storyOpen && (!showExercise || !parsedExercise ? (
              /* ── Read mode ── */
              <div className="mt-3 rounded-2xl bg-white p-3">
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
                    className={`mt-3 w-full rounded-2xl border-b-[4px] border-amber-600 bg-amber-400 px-4 py-3 text-sm font-bold text-amber-950 ${PRESS}`}
                  >
                    📝 Làm bài tập
                  </button>
                )}
              </div>
            ) : (
              /* ── Exercise mode ── */
              <div className="mt-3 rounded-2xl bg-white p-3">
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
                    className={`w-full rounded-2xl border-b-[4px] py-3 text-sm font-bold ${PRESS} ${
                      allAnswered ? 'border-amber-600 bg-amber-400 text-amber-950' : 'border-slate-200 bg-slate-100 text-slate-300'
                    }`}
                  >
                    Kiểm tra ✓
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-center font-black text-base">
                      {exerciseScore === parsedExercise.blanks.length ? '🏆 Hoàn hảo!' : `${exerciseScore}/${parsedExercise.blanks.length} đúng`}
                    </p>
                    <button onClick={resetExercise} className={`w-full rounded-2xl border-b-[4px] border-slate-300 bg-slate-100 py-3 text-sm font-bold text-slate-600 ${PRESS}`}>
                      🔄 Thử lại
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
