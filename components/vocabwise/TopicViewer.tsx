'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { speak } from '@/lib/speak'
import VWExerciseRunner from './VWExerciseRunner'
import VWFlashcard from './VWFlashcard'
import EWordClass from './EWordClass'
import UpgradeBanner from '@/components/UpgradeBanner'
import UpgradeModal from '@/components/UpgradeModal'
import type { ExercisesData } from './types'
import WordListPicker from '@/components/WordListPicker'
import PassageGrammarNote from './PassageGrammarNote'

type GlossaryItem = {
  id: number
  type?: string
  // word items (1–10)
  word?: string; ipa?: string; pos?: string
  word_family?: Record<string, string | null> | null
  false_friend?: { word_vi: string; explanation_vi: string } | null
  // collocation items (11–15)
  collocation?: string
  // shared
  meaning_vi: string; example_en: string; example_vi: string
  receptive_productive?: string | null
}
type Paragraph = { index: number; text_en: string; text_vi: string }

export type TopicData = {
  meta: { topic_title: string; theme_title: string; cefr_level: string; topic_number: number }
  passage: { word_count: number; paragraphs: Paragraph[] }
  glossary: GlossaryItem[]
  exercises: ExercisesData
  answer_key: Record<string, Record<string, string>>
}

type AcademicTopicSync = {
  read: boolean
  ex_scores: Record<string, number>
  completed: boolean
  mastered: boolean
}
type Session = { plan: string; username?: string; free_trial_expires_at?: string | null; plan_end_date?: string | null }

type Tab = 'passage' | 'glossary' | 'exercises'

function renderPassage(text: string) {
  return (text ?? '').replace(/\*\*(.+?)\*\*/g, '<strong class="text-blue-700 font-black">$1</strong>')
}

const POS_SHORT: Record<string, string> = {
  noun: 'n', verb: 'v', adjective: 'adj', adverb: 'adv',
  preposition: 'prep', conjunction: 'conj', pronoun: 'pron',
  phrase: 'phr', idiom: 'idiom', interjection: 'interj',
}
function posShort(pos: string): string {
  return (pos ?? '').split(' / ').map(p => POS_SHORT[p.trim().toLowerCase()] ?? p.trim()).join(' / ')
}


function getExerciseTypes(exercises: ExercisesData): string[] {
  return ['ex1', 'ex2', 'ex3', 'ex4', 'ex5']
    .map(p => {
      const n = Number(p.replace('ex', ''))
      const key = Object.keys(exercises).find(k => k.startsWith(`ex${n}_`))
      if (!key) return null
      return (exercises as unknown as Record<string, { type: string }>)[key].type
    })
    .filter((t): t is string => t !== null)
}

// ZWSP (U+200B)=0 · ZWNJ (U+200C)=1 — invisible to readers, survives copy-paste
function embedWatermark(text: string, seed: string): string {
  const mark = seed.replace(/-/g, '').slice(0, 8).split('')
    .map(c => c.charCodeAt(0) % 2 === 0 ? '​' : '‌').join('')
  return text.replace(/(\. )/, `$1${mark}`)
}

export default function TopicViewer({ data, book, topicId }: { data: TopicData; book: string; topicId: string }) {
  const router = useRouter()
  const [tab, setTab]       = useState<Tab>('passage')
  const [wmId, setWmId]     = useState('')
  const [showVI, setShowVI] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [flashcardMode, setFlashcardMode] = useState(false)
  const [wordClassMode, setWordClassMode] = useState(false)

  const [childId, setChildId]   = useState<string | null>(null)
  const [session, setSession]   = useState<Session | null>(null)
  const [fullSync, setFullSync] = useState<Record<string, AcademicTopicSync>>({})
  const [topicSync, setTopicSync] = useState<AcademicTopicSync | null>(null)
  const [savedSrs,     setSavedSrs]     = useState<Record<string, { due: string; interval: number }>>({})
  const [savedHistory, setSavedHistory] = useState<Record<string, { topics?: number; xp?: number; games?: number; words?: number; topicIds?: string[] }>>({})
  const [savedWords,     setSavedWords]     = useState<Set<string>>(new Set())
  const [pickerItem,     setPickerItem]     = useState<GlossaryItem | null>(null)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [explanations, setExplanations] = useState<Record<string, string>>({})
  const [explaining,   setExplaining]   = useState<Set<string>>(new Set())
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Stop speech on unmount or tab switch away from passage
  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current = null
      window.speechSynthesis?.cancel()
    }
  }, [])
  useEffect(() => {
    if (tab !== 'passage') {
      audioRef.current?.pause()
      audioRef.current = null
      window.speechSynthesis?.cancel()
      setSpeaking(false)
    }
  }, [tab])

  function handleSpeak() {
    if (speaking) {
      audioRef.current?.pause()
      audioRef.current = null
      window.speechSynthesis?.cancel()
      setSpeaking(false)
      return
    }
    const ttsPlayback = () => {
      const chunks = passage.paragraphs.map(p => (wmId ? embedWatermark(p.text_en, wmId) : p.text_en).replace(/\*\*(.+?)\*\*/g, '$1'))
      setSpeaking(true)
      let idx = 0
      const playNext = () => {
        if (idx >= chunks.length) { setSpeaking(false); return }
        const chunk = chunks[idx]; idx++
        speak(chunk, {
          rate: 0.9,
          onEnd: () => setTimeout(playNext, 50),
          onError: () => setSpeaking(false),
        })
      }
      playNext()
    }
    const audio = new Audio(`/audio/academic/${topicId}.mp3`)
    audioRef.current = audio
    audio.addEventListener('canplaythrough', () => { audio.play(); setSpeaking(true) }, { once: true })
    audio.addEventListener('ended', () => { setSpeaking(false); audioRef.current = null }, { once: true })
    audio.addEventListener('error', () => { audioRef.current = null; ttsPlayback() }, { once: true })
    audio.load()
  }

  useEffect(() => {
    const cid = typeof window !== 'undefined' ? localStorage.getItem('vw_active_child') : null
    if (!cid) return
    setChildId(cid)
    Promise.all([
      fetch(`/api/sync/${cid}?level=academic`).then(r => r.ok ? r.json() : null),
      fetch('/api/auth/me').then(r => r.ok ? r.json() : null),
      fetch(`/api/vocabwise/wordlist?topic_id=${topicId}`).then(r => r.ok ? r.json() : { saved: [] }),
    ]).then(([d, sess, wl]) => {
      const mastery: Record<string, AcademicTopicSync> = d?.mastery ?? {}
      setFullSync(mastery)
      setTopicSync(mastery[topicId] ?? null)
      setSavedSrs(d?.srs ?? {})
      setSavedHistory(d?.history ?? {})
      setSession(sess)
      if (sess?.familyId && sess.familyId !== 'superadmin') setWmId(sess.familyId)
      setSavedWords(new Set((wl.saved ?? []).map((w: { word: string }) => w.word)))
    }).catch(() => {})
  }, [topicId])

  const handleExercisesComplete = (scores: number[]) => {
    const exTypes  = getExerciseTypes(data.exercises)
    const prevSync = fullSync[topicId]
    const ex_scores: Record<string, number> = {}
    exTypes.forEach((type, i) => {
      ex_scores[type] = Math.max(scores[i] ?? 0, prevSync?.ex_scores[type] ?? 0)
    })
    const total = Object.values(ex_scores).reduce((s, v) => s + v, 0)
    const newSync: AcademicTopicSync = {
      read: true, ex_scores, completed: true, mastered: total >= 20,
    }
    setTopicSync(newSync)

    if (childId) {
      const newFull = { ...fullSync, [topicId]: newSync }
      setFullSync(newFull)

      // SRS scheduling based on score (max 25 per topic, 5 exercises × 5 pts)
      const interval = total >= 20 ? 7 : total >= 15 ? 3 : total >= 10 ? 1 : 0
      const newSrs = { ...savedSrs }
      if (interval > 0) {
        const due = new Date(Date.now() + interval * 86400000).toISOString().split('T')[0]
        newSrs[topicId] = { due, interval }
        setSavedSrs(newSrs)
      }

      // XP history — merge into existing, keyed by date
      const today = new Date().toISOString().split('T')[0]
      const prev  = savedHistory[today] ?? {}
      const prevTopicIds: string[] = prev.topicIds ?? []
      const newHistory = {
        ...savedHistory,
        [today]: {
          topics:   (prev.topics  ?? 0) + 1,
          xp:       (prev.xp      ?? 0) + total,
          games:    (prev.games   ?? 0) + 1,
          words:     prev.words   ?? 0,
          topicIds: prevTopicIds.includes(topicId) ? prevTopicIds : [...prevTopicIds, topicId],
        },
      }
      setSavedHistory(newHistory)

      fetch(`/api/sync/${childId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: 'academic',
          mastery:    newFull,
          seen:       [],
          weak_words: {},
          streak:     {},
          battle:     {},
          history:    newHistory,
          srs:        newSrs,
        }),
      }).catch(() => {})
    }
  }

  async function explainWord(item: GlossaryItem) {
    const word = item.word ?? ''
    if (!word || explanations[word] || explaining.has(word)) return
    setExplaining(prev => new Set(prev).add(word))
    try {
      const res = await fetch('/api/vocabwise/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, pos: item.pos ?? '', meaning_vi: item.meaning_vi, example_en: item.example_en }),
      })
      const d = await res.json()
      if (d.explanation) setExplanations(prev => ({ ...prev, [word]: d.explanation }))
    } finally {
      setExplaining(prev => { const s = new Set(prev); s.delete(word); return s })
    }
  }

  function toggleSave(item: GlossaryItem) {
    const word = item.word ?? item.collocation ?? ''
    if (!word) return
    if (savedWords.has(word)) {
      setSavedWords(prev => { const s = new Set(prev); s.delete(word); return s })
      fetch('/api/vocabwise/wordlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, topic_id: topicId }),
      }).catch(() => {})
    } else {
      setPickerItem(item)
    }
  }

  async function saveItemToList(item: GlossaryItem, listId: number | null) {
    const word = item.word ?? item.collocation ?? ''
    if (!word) return
    setSavedWords(prev => new Set(prev).add(word))
    setPickerItem(null)
    const res = await fetch('/api/vocabwise/wordlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        word,
        meaning_vi: item.meaning_vi,
        pos: item.pos ?? '',
        ipa: item.ipa ?? '',
        example_en: item.example_en,
        book_id: book,
        topic_id: topicId,
        topic_title: meta.topic_title,
        source: 'academic',
        list_id: listId,
      }),
    }).catch(() => null)
    if (res?.status === 403) {
      setSavedWords(prev => { const s = new Set(prev); s.delete(word); return s })
      setShowLimitModal(true)
    }
  }

  const { meta, passage, glossary, exercises, answer_key } = data
  const prevTotal = topicSync ? Object.values(topicSync.ex_scores ?? {}).reduce((s, v) => s + v, 0) : 0

  return (
    <div className="min-h-screen bg-white">
      {showLimitModal && <UpgradeModal onClose={() => setShowLimitModal(false)} />}
      {session && (
        <UpgradeBanner
          plan={session.plan}
          freeTrialExpiresAt={session.free_trial_expires_at}
          planEndDate={session.plan_end_date}
          username={session.username}
        />
      )}
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 pt-12 pb-4 text-white">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 mb-3 bg-white/20 hover:bg-white/30 text-white font-bold text-sm px-3 py-1.5 rounded-full transition-all active:scale-95">
          ← {meta.theme_title}
        </button>
        <h1 className="text-xl font-black leading-tight">{meta.topic_title}</h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-black bg-white/20 px-2 py-0.5 rounded-full">{meta.cefr_level}</span>
          <span className="text-xs text-blue-200">Topic {meta.topic_number}</span>
          {topicSync?.mastered && <span className="text-xs bg-yellow-400/90 text-yellow-900 font-black px-2 py-0.5 rounded-full">🏆 Thành thạo</span>}
          {topicSync?.completed && !topicSync.mastered && <span className="text-xs bg-white/20 text-white font-black px-2 py-0.5 rounded-full">✅ {prevTotal}/25</span>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
        {(['passage', 'glossary', 'exercises'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 font-black text-sm transition-all ${
              tab === t ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400 hover:text-gray-600'
            }`}>
            {t === 'passage' ? '📄 Bài đọc' : t === 'glossary' ? '📚 Từ vựng' : '✏️ Bài tập'}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 pb-12">

        {/* PASSAGE TAB */}
        {tab === 'passage' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-black text-gray-700 text-sm">{meta.topic_title}</h2>
                <p className="text-xs text-gray-400 mt-0.5">📄 Bài đọc · {passage.word_count} từ</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleSpeak}
                  className={`text-xs font-black px-3 py-1.5 rounded-full transition-colors ${
                    speaking
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {speaking ? '⏹ Dừng' : '🔊 Nghe'}
                </button>
                <button onClick={() => setShowVI(v => !v)}
                  className="text-xs font-black px-3 py-1.5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors">
                  {showVI ? '🇬🇧 Ẩn dịch' : '🇻🇳 Xem dịch'}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-3 text-center">Nhấn vào câu bất kỳ để phân tích ngữ pháp</p>
            <div className="space-y-4">
              {passage.paragraphs.map(para => (
                <PassageGrammarNote
                  key={para.index}
                  textEn={wmId ? embedWatermark(para.text_en, wmId) : para.text_en}
                  textVi={para.text_vi}
                  showVI={showVI}
                  cefr={meta.cefr_level}
                />
              ))}
            </div>
            <button onClick={() => setTab('glossary')}
              className="w-full mt-6 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-black py-3 rounded-2xl shadow active:scale-95 transition-all">
              📚 Xem từ vựng →
            </button>
          </div>
        )}

        {/* GLOSSARY TAB */}
        {tab === 'glossary' && (
          <div>
            {flashcardMode ? (
              <VWFlashcard glossary={glossary} onExit={() => setFlashcardMode(false)} />
            ) : wordClassMode ? (
              <div className="space-y-4">
                <button onClick={() => setWordClassMode(false)} className="text-sm font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1">← Quay lại</button>
                <EWordClass glossary={glossary} onDone={() => setWordClassMode(false)} />
              </div>
            ) : (
            <>
            {(() => {
              const wordCount = glossary.filter(i => i.type !== 'collocation').length
              const collCount = glossary.filter(i => i.type === 'collocation').length
              const hasPosWords = glossary.filter(i => i.type !== 'collocation' && i.word && i.pos).length >= 4
              return (
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-gray-400">
                    {collCount > 0
                      ? `${wordCount} từ · ${collCount} collocation · Nhấn để xem chi tiết`
                      : `${glossary.length} từ · Nhấn vào từ để xem chi tiết`
                    }
                  </p>
                  <div className="flex gap-2 ml-2">
                    {hasPosWords && (
                      <button
                        onClick={() => setWordClassMode(true)}
                        className="text-xs font-black px-3 py-1.5 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors flex-shrink-0"
                      >
                        🏷️ Từ loại
                      </button>
                    )}
                    <button
                      onClick={() => setFlashcardMode(true)}
                      className="text-xs font-black px-3 py-1.5 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors flex-shrink-0"
                    >
                      🃏 Tự kiểm tra
                    </button>
                  </div>
                </div>
              )
            })()}
            <div className="space-y-3">
              {glossary.map(item => {
                const isCollocation = item.type === 'collocation'
                const displayText = isCollocation ? (item.collocation ?? '') : (item.word ?? '')
                return (
                  <details key={item.id} className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden group"
                    onToggle={e => { if ((e.currentTarget as HTMLDetailsElement).open) speak(displayText) }}>
                    <summary className="px-4 py-3 cursor-pointer list-none flex items-start gap-2">
                      {/* Badge */}
                      {isCollocation ? (
                        <span className="w-7 h-7 rounded-xl bg-purple-50 text-purple-500 font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">💬</span>
                      ) : (
                        <span className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{item.id}</span>
                      )}
                      {/* Word + POS */}
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-gray-800 text-sm leading-snug">{displayText}</p>
                        {isCollocation
                          ? <p className="text-purple-400 text-[11px]">col</p>
                          : item.pos && <p className="text-gray-400 text-[11px] italic">{posShort(item.pos)}</p>
                        }
                      </div>
                      {/* Meaning — full, up to 2 lines */}
                      <span className="text-blue-600 font-bold text-sm text-right leading-snug line-clamp-2 max-w-[38%]">
                        {(item.meaning_vi ?? '').split(';')[0]}
                      </span>
                      {/* Speaker + Star stacked */}
                      <div className="flex flex-col items-center flex-shrink-0">
                        <button
                          onClick={e => { e.preventDefault(); speak(displayText) }}
                          className="text-gray-300 hover:text-blue-500 active:text-blue-600 transition-colors p-1"
                          aria-label={`Phát âm ${displayText}`}
                        >🔊</button>
                        <button
                          onClick={e => { e.preventDefault(); toggleSave(item) }}
                          className={`p-1 transition-colors ${savedWords.has(displayText) ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}
                          aria-label={savedWords.has(displayText) ? 'Bỏ lưu' : 'Lưu từ này'}
                        >{savedWords.has(displayText) ? '⭐' : '☆'}</button>
                      </div>
                      {/* Arrow */}
                      <span className="text-gray-300 group-open:rotate-180 transition-transform flex-shrink-0 self-center text-sm">▾</span>
                    </summary>
                    <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-2">
                      {/* IPA — shown only in expanded */}
                      {!isCollocation && item.ipa && (
                        <p className="text-gray-400 text-xs font-mono">{item.ipa}</p>
                      )}
                      <p className="text-gray-600 text-xs"><span className="font-black text-gray-700">Nghĩa: </span>{item.meaning_vi}</p>
                      <div className="flex items-start gap-1">
                        <p className="text-blue-700 text-xs font-bold italic flex-1">{item.example_en}</p>
                        <button
                          onClick={() => speak(item.example_en)}
                          className="text-gray-300 hover:text-blue-500 active:text-blue-600 transition-colors flex-shrink-0 p-0.5 mt-0.5"
                          aria-label="Phát âm câu ví dụ"
                        >🔊</button>
                      </div>
                      <p className="text-gray-500 text-xs italic">{item.example_vi}</p>
                      {!isCollocation && item.word_family && Object.values(item.word_family).some(v => v) && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {Object.entries(item.word_family).map(([pos, form]) =>
                            form ? (
                              <span key={pos} className="text-xs bg-purple-50 text-purple-600 font-bold px-2 py-0.5 rounded-lg">
                                {pos}: {form}
                              </span>
                            ) : null
                          )}
                        </div>
                      )}
                      {!isCollocation && item.false_friend && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                          <p className="text-amber-700 text-xs"><span className="font-black">⚠️ False friend: </span>{item.false_friend.explanation_vi}</p>
                        </div>
                      )}
                      {!isCollocation && item.word && (
                        <div className="pt-1">
                          {explanations[item.word] ? (
                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl px-3 py-3">
                              <p className="text-xs font-black text-indigo-600 mb-1.5">✨ Giải nghĩa</p>
                              <p className="text-indigo-800 text-xs leading-relaxed">{explanations[item.word]}</p>
                            </div>
                          ) : (
                            <button
                              onClick={() => explainWord(item)}
                              disabled={explaining.has(item.word)}
                              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 disabled:from-gray-300 disabled:to-gray-400 text-white font-black text-xs py-2.5 rounded-xl active:scale-95 transition-all shadow-sm"
                            >
                              {explaining.has(item.word) ? '⏳ Đang giải thích...' : '✨ Giải nghĩa'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </details>
                )
              })}
            </div>
            <button onClick={() => setTab('exercises')}
              className="w-full mt-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black py-3 rounded-2xl shadow active:scale-95 transition-all">
              ✏️ Làm bài tập →
            </button>
            </>
            )}
          </div>
        )}

        {/* EXERCISES TAB — always mounted to preserve in-progress state */}
        <div className={tab !== 'exercises' ? 'hidden' : ''}>
          <VWExerciseRunner
            exercises={exercises}
            answerKey={answer_key}
            topicTitle={meta.topic_title}
            cefr={meta.cefr_level}
            prevScores={topicSync?.ex_scores}
            glossaryWords={glossary.filter(i => i.type !== 'collocation' && i.word).map(i => i.word!)}
            isPro={!!session && session.plan !== 'free'}
            onBack={() => setTab('passage')}
            onComplete={handleExercisesComplete}
          />
        </div>

      </div>

      {/* WordListPicker modal */}
      {pickerItem && (
        <WordListPicker
          word={pickerItem.word ?? pickerItem.collocation ?? ''}
          onConfirm={listId => saveItemToList(pickerItem, listId)}
          onCancel={() => setPickerItem(null)}
        />
      )}
    </div>
  )
}
