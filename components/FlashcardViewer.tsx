'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { speak as speakWord } from '@/lib/speak'
import { stripMarkdown } from '@/lib/textFormat'
import { useGameSync } from '@/lib/GameSyncContext'
import Confetti from '@/components/Confetti'
import WordIcon from '@/components/WordIcon'
import WordListPicker from '@/components/WordListPicker'
import UpgradeModal from '@/components/UpgradeModal'
import { GameHeader, PrimaryButton, buzz, cta } from '@/components/ChunkyUI'
import { PRESS, HubStyles } from '@/components/TopicHub'

type Example = {
  en: string
  vi: string
}

const CLASS_LABEL: Record<string, string> = {
  n: 'n - danh từ',
  v: 'v - động từ',
  adj: 'adj - tính từ',
  adv: 'adv - trạng từ',
  prep: 'prep - giới từ',
}

type WordFamilyForm = {
  pos: string
  word: string
  meaning: string
}

type Collocation = {
  phrase: string
  meaning: string
}

type Word = {
  word: string
  ipa?: string
  meaning: string
  emoji: string
  class?: string
  examples: Example[]
  wordFamily?: WordFamilyForm[]
  collocations?: Collocation[]
}

// Word family table only makes sense from Ranger up (level 3+) — Seeker/Starter
// kids aren't ready for word-form comparisons yet.
const WORD_FAMILY_LEVELS = ['ranger', 'explorer', 'scholar', 'master']

type Topic = {
  id: string
  name: string
  emoji: string
  color: string
  words: Word[]
}

type Props = {
  topic: Topic
  level: string
  isStarter: boolean
  backUrl: string
}

const levelConfig = {
  starter: {
    headerBg: 'bg-gradient-to-br from-pink-400 to-rose-400',
    cardBg: 'bg-gradient-to-br from-pink-50 to-rose-50',
    cardBorder: 'border-pink-200 border-b-pink-400',
    wordColor: 'text-pink-600',
    speakBg: 'bg-pink-500 hover:bg-pink-600 active:bg-pink-700',
    navBg: 'bg-pink-100 hover:bg-pink-200 active:bg-pink-300 text-pink-700',
    navBgDisabled: 'bg-gray-100 text-gray-300',
    progressBg: 'bg-pink-200',
    progressFill: 'bg-pink-500',
    dotActive: 'bg-pink-500',
    dotInactive: 'bg-pink-200',
    finishBg: 'bg-pink-500 hover:bg-pink-600',
    exampleBg: 'bg-pink-100',
    exampleText: 'text-pink-700',
    backColor: 'text-pink-100',
    emojiSize: 'text-8xl',
  },
  explorer: {
    headerBg: 'bg-gradient-to-br from-blue-500 to-cyan-400',
    cardBg: 'bg-gradient-to-br from-blue-50 to-cyan-50',
    cardBorder: 'border-blue-200 border-b-blue-400',
    wordColor: 'text-blue-600',
    speakBg: 'bg-blue-500 hover:bg-blue-600 active:bg-blue-700',
    navBg: 'bg-blue-100 hover:bg-blue-200 active:bg-blue-300 text-blue-700',
    navBgDisabled: 'bg-gray-100 text-gray-300',
    progressBg: 'bg-blue-200',
    progressFill: 'bg-blue-500',
    dotActive: 'bg-blue-500',
    dotInactive: 'bg-blue-200',
    finishBg: 'bg-blue-500 hover:bg-blue-600',
    exampleBg: 'bg-blue-100',
    exampleText: 'text-blue-700',
    backColor: 'text-blue-100',
    emojiSize: 'text-7xl',
  },
}

export default function FlashcardViewer({ topic, level, isStarter, backUrl }: Props) {
  const router = useRouter()
  const { markSeen, recordActivity, recordFlashcardDone, flush } = useGameSync()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [explanations, setExplanations] = useState<Record<string, string>>({})
  const [explaining, setExplaining] = useState<Set<string>>(new Set())
  const [explainErrors, setExplainErrors] = useState<Record<string, string>>({})
  const [savedWords,     setSavedWords]     = useState<Set<string>>(new Set())
  const [pickerWord,     setPickerWord]     = useState<{ word: string; meaning: string; cls: string } | null>(null)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [hasStory,       setHasStory]       = useState(false)
  const [collocationsOpen, setCollocationsOpen] = useState(false)
  const [giaiNghiaOpen,    setGiaiNghiaOpen]    = useState(false)

  // Load saved words for this topic on mount
  useEffect(() => {
    fetch(`/api/vocabwise/wordlist?topic_id=${encodeURIComponent(topic.id)}`)
      .then(r => r.ok ? r.json() : { saved: [] })
      .then(d => setSavedWords(new Set((d.saved ?? []).map((w: { word: string }) => w.word))))
      .catch(() => {})
  }, [topic.id])

  function handleStarClick(w: Word) {
    const isSaved = savedWords.has(w.word)
    if (isSaved) {
      setSavedWords(prev => { const s = new Set(prev); s.delete(w.word); return s })
      fetch('/api/vocabwise/wordlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: w.word, topic_id: topic.id }),
      }).catch(() => {})
    } else {
      setPickerWord({ word: w.word, meaning: w.meaning, cls: w.class ?? '' })
    }
  }

  async function saveWord(w: Word, listId: number | null) {
    setSavedWords(prev => new Set(prev).add(w.word))
    setPickerWord(null)
    const res = await fetch('/api/vocabwise/wordlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        word: w.word,
        meaning_vi: w.meaning,
        pos: w.class ?? '',
        ipa: w.ipa ?? '',
        example_en: w.examples[0]?.en ?? '',
        book_id: level,
        topic_id: topic.id,
        topic_title: topic.name,
        source: 'kids',
        list_id: listId,
      }),
    }).catch(() => null)
    if (res?.status === 403) {
      setSavedWords(prev => { const s = new Set(prev); s.delete(w.word); return s })
      setShowLimitModal(true)
    }
  }

  const styles = levelConfig[level as keyof typeof levelConfig] ?? levelConfig.explorer
  const word = topic.words[currentIndex]
  const total = topic.words.length

  const speak = useCallback((text: string, id: string) => {
    speakWord(text, {
      rate: isStarter ? 0.85 : 1.0,
      pitch: isStarter ? 1.2 : 1.0,
      onStart: () => { setSpeakingId(id) },
      onEnd: () => { setSpeakingId(null) },
      onError: () => { setSpeakingId(null) },
    })
  }, [isStarter])

  // Auto-play pronunciation when card changes
  useEffect(() => {
    const timer = setTimeout(() => {
      speak(topic.words[currentIndex].word, 'word')
    }, 150)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex])

  // Collapse the accordions when moving to a different card
  useEffect(() => {
    setCollocationsOpen(false)
    setGiaiNghiaOpen(false)
  }, [currentIndex])

  const goNext = () => {
    markSeen(level, topic.id, word.word)
    if (currentIndex < total - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      recordActivity(level)
      recordFlashcardDone(level, topic.id)
      flush()
      setCompleted(true)
      setShowConfetti(true)
    }
  }

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  async function explainWord(w: Word) {
    if (explanations[w.word] || explaining.has(w.word)) return
    setExplaining(prev => new Set(prev).add(w.word))
    setExplainErrors(prev => { const { [w.word]: _, ...rest } = prev; return rest })
    try {
      const res = await fetch('/api/vocabwise/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: w.word, pos: w.class, meaning_vi: w.meaning, example_en: w.examples[0]?.en, mode: 'kids' }),
      })
      const data = await res.json()
      if (res.ok && data.explanation) setExplanations(prev => ({ ...prev, [w.word]: data.explanation }))
      else setExplainErrors(prev => ({ ...prev, [w.word]: data.error || 'Không thể giải nghĩa. Thử lại sau.' }))
    } catch {
      setExplainErrors(prev => ({ ...prev, [w.word]: 'Không thể giải nghĩa. Thử lại sau.' }))
    }
    setExplaining(prev => { const s = new Set(prev); s.delete(w.word); return s })
  }

  // Check if this topic has a Mini Story, to show the nudge on the completion screen
  useEffect(() => {
    if (!completed) return
    fetch(`/api/stories/${level}/${topic.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setHasStory(!!d))
      .catch(() => {})
  }, [completed, level, topic.id])

  const restart = () => {
    setCurrentIndex(0)
    setCompleted(false)
    setShowConfetti(false)
  }

  if (completed) {
    return (
      <div className="flex flex-col min-h-screen">
        <HubStyles />
        {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
        <GameHeader colorCls={styles.headerBg} title={`${topic.emoji} ${topic.name}`} subtitle="Đã học hết Flashcard" onBack={() => router.push(backUrl)} />
        <div className="flex-1 bg-gradient-to-b from-purple-50 to-pink-50 flex flex-col items-center justify-center px-4 py-8">
          <div className="hub-shine mb-5 flex h-24 w-24 -rotate-6 items-center justify-center rounded-3xl bg-white text-6xl shadow-md ring-4 ring-amber-100">🎉</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Giỏi lắm!</h2>
          <p className="text-gray-500 font-semibold text-lg text-center mb-8">
            Bé đã học hết <strong>{total} từ</strong> trong chủ đề này!
          </p>

          {hasStory && (
            <button
              onClick={() => router.push(`${backUrl}#mini-story`)}
              className={`w-full ${styles.cardBg} ${styles.cardBorder} border-2 border-b-[4px] rounded-3xl px-4 py-3.5 mb-4 flex items-center gap-3 text-left ${PRESS}`}
            >
              <span className="flex h-12 w-12 flex-shrink-0 -rotate-6 items-center justify-center rounded-2xl bg-white text-3xl shadow">📖</span>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-sm leading-tight">Nâng trình cùng Mini Story</p>
                <p className="text-gray-500 text-xs mt-0.5">Đọc chuyện dùng {total} từ vừa học — chỉ 3 phút!</p>
              </div>
              <span className={`${styles.wordColor} font-black text-lg flex-shrink-0`}>→</span>
            </button>
          )}

          <div className="w-full space-y-3">
            <PrimaryButton tone="amber" onClick={restart}>🔄 Học lại từ đầu</PrimaryButton>
            <PrimaryButton tone="slate" onClick={() => router.push(backUrl)}>📚 Chọn chế độ khác</PrimaryButton>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {showLimitModal && <UpgradeModal onClose={() => setShowLimitModal(false)} />}
      {/* Header — one row: back icon + topic name (small eyebrow) + game name (title) + counter,
          matching every other Daily game's header (ListenGame, MatchGame, ...) */}
      <GameHeader
        colorCls={styles.headerBg}
        title="📖 Flashcard"
        subtitle={topic.name}
        onBack={() => router.push(backUrl)}
        right={`${currentIndex + 1}/${total}`}
        progress={{ value: currentIndex + 1, max: total }}
      />

      {/* Card area */}
      <div className="flex-1 bg-gradient-to-b from-purple-50 to-pink-50 px-4 py-6 flex flex-col">
        {/* Flashcard */}
        <div className={`
          ${styles.cardBg} ${styles.cardBorder} border-2 border-b-[6px] rounded-3xl
          p-5 flex flex-col items-center text-center
          flex-1 justify-start relative
        `}>
          {/* Star button */}
          <button
            onClick={() => handleStarClick(word)}
            className="absolute top-3 right-3 p-2 transition-all active:scale-90"
            aria-label={savedWords.has(word.word) ? 'Bỏ lưu' : 'Lưu từ này'}
          >
            <span className={`text-2xl transition-all ${savedWords.has(word.word) ? '' : 'opacity-30 hover:opacity-70'}`}>
              {savedWords.has(word.word) ? '⭐' : '☆'}
            </span>
          </button>
          {/* Header: icon on the left, word/IPA/POS/meaning stacked on the right — compact instead
              of a tall fully-centered stack */}
          <div className="w-full flex items-center gap-5 mb-4 pr-10">
            <div className="flex-shrink-0 flex items-center justify-center">
              <WordIcon
                word={word.word}
                emoji={word.emoji}
                emojiClass="text-7xl"
                iconSize={88}
                className="text-gray-600"
              />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center flex-wrap gap-2 mb-0.5">
                <h2 className={`text-2xl font-black ${styles.wordColor} tracking-tight break-words`}>
                  {word.word}
                </h2>
                <button
                  onClick={() => speak(word.word, 'word')}
                  disabled={speakingId === 'word'}
                  className={`
                    ${styles.speakBg} text-white flex-shrink-0
                    w-8 h-8 rounded-lg text-sm
                    flex items-center justify-center
                    shadow-md transition-all duration-150
                    active:scale-90 disabled:opacity-70
                  `}
                  aria-label="Phát âm từ"
                >
                  {speakingId === 'word' ? '⏸' : '🔊'}
                </button>

                {/* IPA + word class — same row, right after the speak button */}
                {(word.ipa || word.class) && (
                  <span className="text-gray-400 text-xs">
                    {word.ipa && <span className="font-mono">{word.ipa}</span>}
                    {word.ipa && word.class && <span className="mx-1.5">·</span>}
                    {word.class && <span>{CLASS_LABEL[word.class] ?? word.class}</span>}
                  </span>
                )}
              </div>

              {/* Vietnamese meaning */}
              <p className="text-lg font-bold text-gray-700">
                {word.meaning}
              </p>
            </div>
          </div>

          {/* Example sentences */}
          <div className="w-full space-y-2">
            {word.examples.map((ex, idx) => (
              <div key={idx} className={`${styles.exampleBg} rounded-2xl px-3.5 py-2.5 text-left`}>
                <div className="flex items-start gap-2">
                  <button
                    onClick={() => speak(ex.en, `ex-${idx}`)}
                    disabled={speakingId === `ex-${idx}`}
                    className={`
                      flex-shrink-0 w-7 h-7 rounded-xl
                      ${styles.speakBg} text-white text-sm
                      flex items-center justify-center mt-0.5
                      transition-all active:scale-90 disabled:opacity-60
                    `}
                    aria-label={`Nghe ví dụ ${idx + 1}`}
                  >
                    {speakingId === `ex-${idx}` ? '⏸' : '🔊'}
                  </button>
                  <div>
                    <p className={`${styles.exampleText} font-bold text-sm leading-snug italic`}>
                      &quot;{ex.en}&quot;
                    </p>
                    <p className="text-gray-500 text-sm mt-0.5 leading-snug">
                      {ex.vi}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Word Family — Ranger+ only, hidden when the word has no meaningful family */}
          {WORD_FAMILY_LEVELS.includes(level) && word.wordFamily && word.wordFamily.length >= 2 && (
            <div className="w-full mt-2 bg-white border-2 border-teal-100 rounded-2xl px-3.5 py-2.5">
              <p className="text-sm font-black text-teal-600 mb-1.5 text-left">🌳 Họ từ <span className="font-normal text-teal-400">(Word Family)</span></p>
              <div className="space-y-1">
                {word.wordFamily.map((form, idx) => {
                  const isCurrent = form.pos === word.class && form.word.toLowerCase() === word.word.toLowerCase()
                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 rounded-xl px-2 py-1 text-left ${isCurrent ? 'bg-teal-50 border border-teal-200' : ''}`}
                    >
                      <button
                        onClick={() => speak(form.word, `wf-${idx}`)}
                        disabled={speakingId === `wf-${idx}`}
                        className="flex-shrink-0 w-6 h-6 rounded-lg bg-teal-500 text-white text-xs flex items-center justify-center active:scale-90 disabled:opacity-60 transition-all"
                        aria-label={`Nghe ${form.word}`}
                      >
                        {speakingId === `wf-${idx}` ? '⏸' : '🔊'}
                      </button>
                      <span className="text-xs font-bold text-gray-400 w-7 flex-shrink-0">
                        {CLASS_LABEL[form.pos]?.split(' - ')[0] ?? form.pos}
                      </span>
                      <span className={`font-bold text-sm flex-shrink-0 ${isCurrent ? 'text-teal-700' : 'text-gray-700'}`}>
                        {form.word}
                      </span>
                      <span className="text-gray-400 text-xs break-words min-w-0 flex-1">{form.meaning}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Collocations — collapsed by default, same accordion pattern as Giải nghĩa below,
              so the card doesn't force a long scroll before the AI Explainer / Next button.
              React-controlled (not native <details>) — <details>+key remounting was leaving
              duplicate disclosure widgets behind on iOS Safari after repeated Next taps. */}
          {word.collocations && word.collocations.length > 0 && (
            <div className="w-full mt-2 bg-white border-2 border-sky-100 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => setCollocationsOpen(o => !o)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between"
              >
                <p className="text-sm font-black text-sky-600 text-left">🔗 Cụm từ phổ biến <span className="font-normal text-sky-400">(Collocations)</span></p>
                <span className={`text-sky-400 text-sm flex-shrink-0 ml-2 transition-transform ${collocationsOpen ? 'rotate-180' : ''}`}>▾</span>
              </button>
              {collocationsOpen && (
                <div className="px-3.5 pb-2.5 pt-1 flex flex-col gap-1.5">
                  {word.collocations.map((col, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 bg-sky-50 rounded-xl px-2.5 py-2 text-left">
                      <button
                        onClick={() => speak(col.phrase, `col-${idx}`)}
                        disabled={speakingId === `col-${idx}`}
                        className="flex-shrink-0 w-6 h-6 rounded-lg bg-sky-500 text-white text-xs flex items-center justify-center active:scale-90 disabled:opacity-60 transition-all"
                        aria-label={`Nghe ${col.phrase}`}
                      >
                        {speakingId === `col-${idx}` ? '⏸' : '🔊'}
                      </button>
                      <span className="font-bold text-sm text-gray-700 flex-shrink-0 pt-0.5">{col.phrase}</span>
                      <span className="text-gray-400 text-xs break-words min-w-0 flex-1 pt-0.5">{col.meaning}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AI Explainer — fetched on tap, not prefetched. React-controlled for the same reason
              as Collocations above (avoid native <details> + key-remount duplication on Safari) */}
          <div className="w-full mt-2 bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => {
                setGiaiNghiaOpen(o => !o)
                if (!explanations[word.word] && !explaining.has(word.word)) explainWord(word)
              }}
              className="w-full px-3.5 py-2.5 flex items-center justify-between"
            >
              <p className="text-sm font-black text-amber-600">✨ Giải nghĩa</p>
              <span className={`text-amber-400 text-sm transition-transform ${giaiNghiaOpen ? 'rotate-180' : ''}`}>▾</span>
            </button>
            {giaiNghiaOpen && (
              <div className="px-3.5 pb-2.5 pt-1 border-t border-amber-200">
                {explaining.has(word.word) ? (
                  <>
                    <div className="h-3 bg-amber-200 rounded animate-pulse w-3/4 mb-2" />
                    <div className="h-3 bg-amber-200 rounded animate-pulse w-full mb-2" />
                    <div className="h-3 bg-amber-200 rounded animate-pulse w-2/3" />
                  </>
                ) : explanations[word.word] ? (
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line text-left">{stripMarkdown(explanations[word.word])}</p>
                ) : explainErrors[word.word] ? (
                  <p className="text-sm text-red-500 text-left">{explainErrors[word.word]}</p>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Navigation — small back button + wide next; progress lives in the header bar */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={() => { buzz(); goPrev() }}
            disabled={currentIndex === 0}
            aria-label="Từ trước"
            className={`flex h-14 w-16 flex-shrink-0 items-center justify-center rounded-2xl border-2 border-b-[4px] text-xl font-bold ${PRESS} border-slate-200 border-b-slate-300 bg-white text-slate-600 disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-300 disabled:active:translate-y-0 disabled:active:border-b-[4px]`}
          >
            ←
          </button>
          <button
            onClick={() => { buzz(); goNext() }}
            className={cta(level === 'starter' ? 'pink' : 'blue', 'flex-1')}
          >
            {currentIndex === total - 1 ? '🎉 Xong!' : 'Tiếp →'}
          </button>
        </div>
      </div>

      {/* WordListPicker modal */}
      {pickerWord && (
        <WordListPicker
          word={pickerWord.word}
          onConfirm={listId => saveWord(word, listId)}
          onCancel={() => setPickerWord(null)}
        />
      )}
    </div>
  )
}
