'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { speak as speakWord } from '@/lib/speak'
import { useGameSync } from '@/lib/GameSyncContext'
import Confetti from '@/components/Confetti'
import WordIcon from '@/components/WordIcon'
import WordListPicker from '@/components/WordListPicker'
import UpgradeModal from '@/components/UpgradeModal'

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

type Word = {
  word: string
  ipa?: string
  meaning: string
  emoji: string
  class?: string
  examples: Example[]
}

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
    cardBorder: 'border-pink-200',
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
    cardBorder: 'border-blue-200',
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
  const [savedWords,     setSavedWords]     = useState<Set<string>>(new Set())
  const [pickerWord,     setPickerWord]     = useState<{ word: string; meaning: string; cls: string } | null>(null)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [hasStory,       setHasStory]       = useState(false)

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
    try {
      const res = await fetch('/api/vocabwise/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: w.word, pos: w.class, meaning_vi: w.meaning, example_en: w.examples[0]?.en, mode: 'kids' }),
      })
      if (res.ok) {
        const data = await res.json()
        setExplanations(prev => ({ ...prev, [w.word]: data.explanation }))
      }
    } catch {}
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
        {showConfetti && <Confetti onDone={() => setShowConfetti(false)} />}
        <div className={`${styles.headerBg} px-4 pt-12 pb-8 text-white`}>
          <button onClick={() => router.push(backUrl)} className={`${styles.backColor} font-bold text-sm flex items-center gap-1 mb-4 opacity-90`}>
            ← {topic.name}
          </button>
          <h1 className="text-3xl font-black">{topic.emoji} {topic.name}</h1>
        </div>
        <div className="flex-1 bg-gradient-to-b from-purple-50 to-pink-50 flex flex-col items-center justify-center px-4 py-8">
          <div className="text-7xl mb-6">🎉</div>
          <h2 className="text-3xl font-black text-gray-800 mb-2 text-center">Giỏi lắm!</h2>
          <p className="text-gray-500 font-semibold text-lg text-center mb-8">
            Bé đã học hết <strong>{total} từ</strong> trong chủ đề này!
          </p>

          {hasStory && (
            <button
              onClick={() => router.push(`${backUrl}#mini-story`)}
              className={`w-full ${styles.cardBg} ${styles.cardBorder} border-2 rounded-2xl px-4 py-3.5 mb-4 flex items-center gap-3 text-left transition-all active:scale-95 hover:shadow-md`}
            >
              <span className="text-3xl flex-shrink-0">📖</span>
              <div className="flex-1 min-w-0">
                <p className="font-black text-gray-800 text-sm leading-tight">Nâng trình cùng Mini Story</p>
                <p className="text-gray-500 text-xs mt-0.5">Đọc chuyện dùng {total} từ vừa học — chỉ 3 phút!</p>
              </div>
              <span className={`${styles.wordColor} font-black text-lg flex-shrink-0`}>→</span>
            </button>
          )}

          <div className="w-full space-y-3">
            <button
              onClick={restart}
              className={`w-full ${styles.finishBg} text-white font-black text-xl py-4 rounded-2xl transition-colors shadow-lg`}
            >
              🔄 Học lại từ đầu
            </button>
            <button
              onClick={() => router.push(backUrl)}
              className="w-full bg-white border-2 border-gray-200 text-gray-600 font-bold text-xl py-4 rounded-2xl text-center transition-colors hover:bg-gray-50"
            >
              📚 Chọn chế độ khác
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {showLimitModal && <UpgradeModal onClose={() => setShowLimitModal(false)} />}
      {/* Header */}
      <div className={`${styles.headerBg} px-4 pt-12 pb-6 text-white`}>
        <button onClick={() => router.push(backUrl)} className={`${styles.backColor} font-bold text-sm flex items-center gap-1 mb-3 opacity-90`}>
          ← {topic.name}
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black">{topic.emoji} {topic.name}</h1>
          <span className="bg-white/20 px-3 py-1 rounded-full font-black text-sm">
            {currentIndex + 1}/{total}
          </span>
        </div>

        {/* Progress bar */}
        <div className={`mt-3 h-2.5 ${styles.progressBg} rounded-full overflow-hidden`}>
          <div
            className={`h-full ${styles.progressFill} rounded-full transition-all duration-500`}
            style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Card area */}
      <div className="flex-1 bg-gradient-to-b from-purple-50 to-pink-50 px-4 py-6 flex flex-col">
        {/* Flashcard */}
        <div className={`
          ${styles.cardBg} ${styles.cardBorder} border-2 rounded-3xl
          p-6 shadow-xl flex flex-col items-center text-center
          flex-1 justify-center relative
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
          {/* Illustration: Phosphor icon (abstract words) or emoji */}
          <div className={`mb-4 flex items-center justify-center`}>
            <WordIcon
              word={word.word}
              emoji={word.emoji}
              emojiClass={styles.emojiSize}
              iconSize={96}
              className="text-gray-600"
            />
          </div>

          {/* English word */}
          <h2 className={`text-5xl font-black ${styles.wordColor} mb-1 tracking-tight`}>
            {word.word}
          </h2>

          {/* IPA */}
          {word.ipa && (
            <p className="text-gray-400 text-sm font-mono mb-1">{word.ipa}</p>
          )}

          {/* Word class */}
          {word.class && (
            <p className="text-[1.75rem] text-gray-400 font-normal mb-2">
              ({CLASS_LABEL[word.class] ?? word.class})
            </p>
          )}

          {/* Vietnamese meaning */}
          <p className="text-3xl font-bold text-gray-700 mb-6">
            {word.meaning}
          </p>

          {/* Speak word button */}
          <button
            onClick={() => speak(word.word, 'word')}
            disabled={speakingId === 'word'}
            className={`
              ${styles.speakBg} text-white
              w-16 h-16 rounded-2xl text-3xl
              flex items-center justify-center
              shadow-lg transition-all duration-150
              active:scale-90 disabled:opacity-70
              mb-5
            `}
            aria-label="Phát âm từ"
          >
            {speakingId === 'word' ? '⏸' : '🔊'}
          </button>

          {/* Example sentences */}
          <div className="w-full space-y-2.5">
            {word.examples.map((ex, idx) => (
              <div key={idx} className={`${styles.exampleBg} rounded-2xl px-4 py-3 text-left`}>
                <div className="flex items-start gap-2">
                  <button
                    onClick={() => speak(ex.en, `ex-${idx}`)}
                    disabled={speakingId === `ex-${idx}`}
                    className={`
                      flex-shrink-0 w-8 h-8 rounded-xl
                      ${styles.speakBg} text-white text-base
                      flex items-center justify-center mt-0.5
                      transition-all active:scale-90 disabled:opacity-60
                    `}
                    aria-label={`Nghe ví dụ ${idx + 1}`}
                  >
                    {speakingId === `ex-${idx}` ? '⏸' : '🔊'}
                  </button>
                  <div>
                    <p className={`${styles.exampleText} font-bold text-base leading-snug italic`}>
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

          {/* AI Explainer — fetched on tap, not prefetched */}
          <details className="w-full mt-3 bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden group">
            <summary
              onClick={() => { if (!explanations[word.word] && !explaining.has(word.word)) explainWord(word) }}
              className="px-4 py-3 list-none cursor-pointer flex items-center justify-between"
            >
              <p className="text-sm font-black text-amber-600">✨ Giải nghĩa</p>
              <span className="text-amber-400 text-sm group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <div className="px-4 pb-3 pt-1 border-t border-amber-200">
              {explaining.has(word.word) ? (
                <>
                  <div className="h-3 bg-amber-200 rounded animate-pulse w-3/4 mb-2" />
                  <div className="h-3 bg-amber-200 rounded animate-pulse w-full mb-2" />
                  <div className="h-3 bg-amber-200 rounded animate-pulse w-2/3" />
                </>
              ) : explanations[word.word] ? (
                <p className="text-base text-gray-700 leading-relaxed">{explanations[word.word]}</p>
              ) : null}
            </div>
          </details>
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={goPrev}
            disabled={currentIndex === 0}
            className={`
              flex-1 py-4 rounded-2xl font-black text-xl
              transition-colors duration-150 active:scale-95
              ${currentIndex === 0 ? styles.navBgDisabled : styles.navBg}
            `}
          >
            ← Trước
          </button>
          <button
            onClick={goNext}
            className={`
              flex-1 py-4 rounded-2xl font-black text-xl
              ${styles.speakBg} text-white
              transition-colors duration-150 active:scale-95 shadow-md
            `}
          >
            {currentIndex === total - 1 ? '🎉 Xong!' : 'Tiếp →'}
          </button>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 mt-4 flex-wrap">
          {topic.words.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`
                w-2.5 h-2.5 rounded-full transition-all duration-200
                ${idx === currentIndex ? `${styles.dotActive} scale-125` : styles.dotInactive}
              `}
              aria-label={`Từ ${idx + 1}`}
            />
          ))}
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
