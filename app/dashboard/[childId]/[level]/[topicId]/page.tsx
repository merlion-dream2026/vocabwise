'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { loadOfflineProgress, clearOfflineProgress } from '@/lib/offlineStorage'
import { isTopicMastered, type MasteryEntry } from '@/lib/topicMastery'
import { HubStyles, Rise, TopicHero, WordPreview, PRESS } from '@/components/TopicHub'
import { RoundCards } from '@/components/TopicRounds'
import { DAILY_HUB_THEMES, hubTheme } from '@/components/hubTheme'
import PageSkeleton from '@/components/PageSkeleton'
import TopicFaq from '@/components/TopicFaq'
import MiniStory, { type Story } from '@/components/MiniStory'
import TopicVideos from '@/components/TopicVideos'

const TrophyModal = dynamic(() => import('@/components/TrophyModal'), { ssr: false })

type Child = { id: string; name: string; emoji: string; level: string }
type MasteryData = MasteryEntry
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
  { key: 'rocket',        label: 'Phóng tên lửa',      emoji: '🚀' }, // arcade (Thử thách thêm)
  { key: 'whack',         label: 'Đập chuột chũi',     emoji: '🔨' }, // arcade (Thử thách thêm)
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
  { key: 'rocket',          label: 'Phóng tên lửa',      emoji: '🚀' }, // arcade (Thử thách thêm)
  { key: 'whack',           label: 'Đập chuột chũi',     emoji: '🔨' }, // arcade (Thử thách thêm)
]

const LEVEL_COLORS: Record<string, { bg: string; header: string; text: string; soft: string; deep: string; edge: string }> = {
  seeker:   { bg: 'from-violet-50 to-purple-50',  header: 'bg-violet-500',  text: 'text-violet-600',  soft: 'bg-violet-100',  deep: 'text-violet-800' , edge: 'border-violet-700' },
  starter:  { bg: 'from-pink-50 to-rose-50',       header: 'bg-pink-500',    text: 'text-pink-600',    soft: 'bg-pink-100',    deep: 'text-pink-800'   , edge: 'border-pink-700' },
  ranger:   { bg: 'from-emerald-50 to-teal-50',    header: 'bg-emerald-500', text: 'text-emerald-600', soft: 'bg-emerald-100', deep: 'text-emerald-800', edge: 'border-emerald-700' },
  explorer: { bg: 'from-blue-50 to-indigo-50',     header: 'bg-blue-500',    text: 'text-blue-600',    soft: 'bg-blue-100',    deep: 'text-blue-800'   , edge: 'border-blue-700' },
  scholar:  { bg: 'from-indigo-50 to-violet-50',   header: 'bg-indigo-500',  text: 'text-indigo-600',  soft: 'bg-indigo-100',  deep: 'text-indigo-800' , edge: 'border-indigo-700' },
  master:   { bg: 'from-gray-50 to-slate-100',     header: 'bg-gray-700',    text: 'text-gray-700',    soft: 'bg-gray-200',    deep: 'text-gray-800'   , edge: 'border-gray-900' },
}

function getGamesForLevel(level: string) {
  return ['explorer', 'scholar', 'master'].includes(level) ? EXPLORER_GAMES : STARTER_GAMES
}

export default function TopicPage() {
  const router = useRouter()
  const { childId, level, topicId } = useParams<{ childId: string; level: string; topicId: string }>()
  const [child, setChild] = useState<Child | null>(null)
  const [mastery, setMastery] = useState<MasteryData>({ flashcard: false, games: [] })
  const [topic, setTopic] = useState<{ id: string; name: string; emoji: string; color: string; words: { word: string; meaning: string; emoji: string; example: string }[] } | null>(null)
  const [allTopics, setAllTopics] = useState<{ id: string; name: string; emoji: string }[]>([])
  const [story, setStory] = useState<Story | null>(null)
  const [loading, setLoading] = useState(true)
  const [offlineUnavailable, setOfflineUnavailable] = useState(false)
  const [syncToast, setSyncToast] = useState(false)
  const [showTrophy, setShowTrophy] = useState(false)
  const [showFaq, setShowFaq] = useState(false)
  const [sticker, setSticker] = useState<{ legacy: boolean } | null>(null)
  useEffect(() => {
    // No connection: topics are not downloadable, so just ask to reconnect.
    if (!navigator.onLine) {
      setOfflineUnavailable(true)
      setLoading(false)
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
          <span className="font-bold text-lg">Mất kết nối mạng</span>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">📴</div>
            <h2 className="text-xl font-black text-gray-800 mb-2">Chưa có kết nối internet</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">Kết nối internet rồi mở lại chủ đề này để tiếp tục học nhé.</p>
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
  const theme = hubTheme(DAILY_HUB_THEMES, level, 'explorer')
  const backUrl = `/dashboard/${childId}/${level}`

  const topicIdx = allTopics.findIndex((t: { id: string }) => t.id === topicId)
  const prevTopic = topicIdx > 0 ? allTopics[topicIdx - 1] : null
  const nextTopic = topicIdx < allTopics.length - 1 ? allTopics[topicIdx + 1] : null

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
          onOpenAlbum={() => router.push(`/dashboard/${childId}/profile?tab=daily&back=1`)}
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
          <button onClick={() => (new URLSearchParams(window.location.search).get('from') === 'album' ? router.back() : router.push(backUrl))} aria-label="Quay lại"
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
            words={(topic as { words: { word: string }[] }).words}
            theme={theme}
            onDetail={() => router.push(`/dashboard/${childId}/${level}/${topicId}/flashcard`)}
          />
        </Rise>

        {/* Hero (status + journey + next-step button) */}
        <Rise i={1}>
          <TopicHero
            theme={theme}
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
            onToggleFaq={() => setShowFaq(v => !v)}
          />
        </Rise>

        {/* Inline FAQ — shown when toggled */}
        {showFaq && <TopicFaq />}

        {/* Vòng 1 / Vòng 2 */}
        <Rise i={2}>
          <RoundCards
            level={level}
            entry={mastery}
            games={games}
            theme={theme}
            onOpen={(key) => router.push(`/dashboard/${childId}/${level}/${topicId}/${key}`)}
          />
        </Rise>

        {story && (
          <MiniStory key={topicId} story={story} words={(topic as { words: { word: string }[] }).words}
            level={level} topicId={topicId} topicIdx={topicIdx} childId={childId} />
        )}

        {/* Optional extra at the very end — not part of the journey */}
        <TopicVideos videoKey={`daily/${level}/${topicId}`} theme={theme} />
      </div>
    </div>
  )
}
