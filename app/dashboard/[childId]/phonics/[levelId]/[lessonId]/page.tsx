'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { speak } from '@/lib/speak'
import { playPhoneme } from '@/lib/phonemeAudio'
import {
  initPhonicsSync, isPairSeen, isLessonMastered,
  getPairGames, markPairSeen, flushPhonics,
} from '@/lib/phonicsSync'
import QuickRecordButton from '@/components/QuickRecordButton'
import phonicsLevels from '@/data/phonicsLevels.json'
import phonicsKnowledge from '@/data/phonicsKnowledge.json'

type KnowledgeEntry = {
  how_to?: string[]
  vs_vietnamese?: string
  spelling?: { pattern: string; examples: string[]; examples_ipa?: string[] }[]
  mistakes?: string[]
  mnemonic?: string
  why?: string
  exceptions?: string[]
}

type Level  = typeof phonicsLevels.levels[number]
type Lesson = Level['lessons'][number]
type Sound  = { symbol: string; keyword: string; emoji: string; vi: string; wikiAudio: string | null; learnAudio: string | null }
type PairLesson = Lesson & { type: 'pair'; sounds: Sound[]; practice_words: string[]; practice_words_ipa?: string[]; tip: string }
type RuleLesson = Lesson & { type: 'rule'; buckets: { label: string; condition: string; tip?: string; words: string[] }[] }

const GAME_META: Record<string, { emoji: string; label: string; desc: string }> = {
  'minimal-pairs': { emoji: '🎧', label: 'Nghe & Phân biệt', desc: 'Nghe từ → chọn đúng âm' },
  'listen-pick':   { emoji: '🔊', label: 'Nghe & Chọn',      desc: 'Nghe âm → chọn ký hiệu IPA' },
  'speak':         { emoji: '🎤', label: 'Phát âm cùng AI ✨', desc: 'Nghe mẫu → đọc to → AI chấm' },
  'sort-words':    { emoji: '🎯', label: 'Phân loại âm',      desc: 'Nghe từ → tap đúng bucket' },
  'sort-rule':     { emoji: '📏', label: 'Phân loại từ',      desc: 'Đọc từ → tap đúng nhóm phát âm' },
  'rhythm':        { emoji: '🎶', label: 'Nhịp điệu câu',    desc: 'Nghe mẫu → đọc to → AI chấm' },
  'shadow':        { emoji: '🎙', label: 'Shadowing ✨',      desc: 'Nghe câu → đọc theo ngay lập tức' },
}

const LESSON_MOUTH_SVG: Record<string, string> = {
  'iː-ɪ':     'iota',
  'e-æ':      'ash',
  'ɜː':       'er',
  'ə':        'schwa',
  'eɪ-aɪ':   'ei',
  'f-v':      'vee',
  'θ-ð':      'theta',
  'ʃ-ʒ':      'esh',
  'tʃ-dʒ':   'tesh',
  'm-n-ŋ':    'eng',
  'h-w-j':    'double-u',
  'l-r':      'ell',
  'θ-s-viet': 'theta',
  'v-w-viet': 'double-u',
  'ɜː-ə':     'schwa',
}

const BUCKET_COLORS = [
  { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', chip: 'bg-green-100 text-green-700 border-green-200' },
  { bg: 'bg-blue-50',  border: 'border-blue-200',  text: 'text-blue-700',  chip: 'bg-blue-100 text-blue-700 border-blue-200' },
  { bg: 'bg-rose-50',  border: 'border-rose-200',  text: 'text-rose-700',  chip: 'bg-rose-100 text-rose-700 border-rose-200' },
]

// ── Knowledge Panel — always open ────────────────────────────────────────────
function KnowledgePanel({ lessonId, levelText, levelBorder, levelBg }: {
  lessonId: string; levelText: string; levelBorder: string; levelBg: string
}) {
  const knowledge = (phonicsKnowledge as Record<string, KnowledgeEntry>)[lessonId]
  if (!knowledge) return null

  return (
    <div className={`bg-white rounded-2xl border-2 ${levelBorder} overflow-hidden`}>
      <div className={`flex items-center gap-2 px-4 py-3 ${levelBg} border-b ${levelBorder}`}>
        <span className="text-base">📖</span>
        <span className={`font-black text-sm ${levelText}`}>Bài học chi tiết</span>
      </div>

      <div className="px-4 py-4 space-y-4">
        {knowledge.why && (
          <div>
            <p className="text-xs font-black text-gray-500 uppercase tracking-wide mb-1.5">💡 Tại sao có quy tắc này?</p>
            <p className="text-xs text-gray-700 font-semibold leading-relaxed">{knowledge.why}</p>
          </div>
        )}

        {knowledge.how_to && knowledge.how_to.length > 0 && (
          <div>
            <p className="text-xs font-black text-gray-500 uppercase tracking-wide mb-1.5">
              {knowledge.why ? '📋 Cách áp dụng' : '👄 Cách tạo âm'}
            </p>
            {LESSON_MOUTH_SVG[lessonId] && (
              <div className="mb-2.5 flex justify-center">
                <img
                  src={`/phonics/mouth/${LESSON_MOUTH_SVG[lessonId]}.svg`}
                  alt={`Vị trí lưỡi cho ${lessonId}`}
                  width={180} height={144}
                  className="rounded-xl border border-gray-100"
                />
              </div>
            )}
            <ol className="space-y-1.5">
              {knowledge.how_to.map((step, i) => (
                <li key={i} className="flex gap-2 text-xs text-gray-700 font-semibold leading-relaxed">
                  <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${levelBg} ${levelText} border ${levelBorder}`}>{i + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {knowledge.vs_vietnamese && (
          <div className="bg-yellow-50 rounded-xl px-3 py-2.5 border border-yellow-200">
            <p className="text-xs font-black text-yellow-700 mb-1">🇻🇳 So sánh với tiếng Việt</p>
            <p className="text-xs text-yellow-800 font-semibold leading-relaxed">{knowledge.vs_vietnamese}</p>
          </div>
        )}

        {knowledge.spelling && knowledge.spelling.length > 0 && (
          <div>
            <p className="text-xs font-black text-gray-500 uppercase tracking-wide mb-1.5">✍️ Chính tả → Phát âm</p>
            <div className="space-y-1.5">
              {knowledge.spelling.map((s, i) => (
                <div key={i} className="flex gap-2 text-xs">
                  <span className={`shrink-0 font-black ${levelText} font-mono`}>{s.pattern}</span>
                  <span className="text-gray-500">→</span>
                  <span className="text-gray-600 font-semibold">
                    {s.examples.map((ex, j) => (
                      <span key={j}>
                        {j > 0 && ', '}
                        {ex}
                        {s.examples_ipa?.[j] && (
                          <span className="text-gray-400 font-mono font-normal ml-0.5">{s.examples_ipa[j]}</span>
                        )}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {knowledge.mistakes && knowledge.mistakes.length > 0 && (
          <div>
            <p className="text-xs font-black text-gray-500 uppercase tracking-wide mb-1.5">⚠️ Lỗi thường gặp</p>
            <ul className="space-y-1">
              {knowledge.mistakes.map((m, i) => (
                <li key={i} className="flex gap-2 text-xs text-gray-700 font-semibold leading-relaxed">
                  <span className="text-red-400 shrink-0">✗</span><span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {knowledge.exceptions && knowledge.exceptions.length > 0 && (
          <div>
            <p className="text-xs font-black text-gray-500 uppercase tracking-wide mb-1.5">🔀 Ngoại lệ</p>
            <ul className="space-y-1">
              {knowledge.exceptions.map((e, i) => (
                <li key={i} className="flex gap-2 text-xs text-gray-700 font-semibold leading-relaxed">
                  <span className="text-orange-400 shrink-0">•</span><span>{e}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {knowledge.mnemonic && (
          <div className="bg-purple-50 rounded-xl px-3 py-2.5 border border-purple-200">
            <p className="text-xs font-black text-purple-700 mb-1">🧠 Mẹo nhớ</p>
            <p className="text-xs text-purple-800 font-semibold leading-relaxed">{knowledge.mnemonic}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Practice words grouped by sound ──────────────────────────────────────────
function PracticeWords({ lesson, level }: { lesson: PairLesson; level: Level }) {
  const { practice_words: words, practice_words_ipa: ipas, sounds } = lesson
  const hasTwoSounds = sounds.length >= 2

  if (!hasTwoSounds) {
    // Single sound — flat list
    return (
      <div>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wide mb-2">Đọc thử từng từ</p>
        <div className="flex flex-wrap gap-2">
          {words.slice(0, 8).map((w, i) => (
            <div key={w} className="flex flex-col items-center gap-0.5">
              <button onClick={() => speak(w, { rate: 0.75 })}
                className={`${level.text} text-xs font-bold px-2 py-0.5 ${level.bg} border ${level.border} rounded-lg active:scale-90`}>
                {w} 🔊
              </button>
              {ipas?.[i] && <span className="text-[10px] text-gray-400 font-mono">{ipas[i]}</span>}
              <QuickRecordButton word={w} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Two sounds — split even/odd into two groups
  const s0 = sounds[0]; const s1 = sounds[1]
  const words0 = words.filter((_, i) => i % 2 === 0)
  const words1 = words.filter((_, i) => i % 2 === 1)
  const ipas0  = ipas?.filter((_, i) => i % 2 === 0) ?? []
  const ipas1  = ipas?.filter((_, i) => i % 2 === 1) ?? []

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-400 font-bold uppercase tracking-wide">Đọc thử từng từ</p>
      {[
        { sound: s0, words: words0, ipas: ipas0 },
        { sound: s1, words: words1, ipas: ipas1 },
      ].map(({ sound, words: wList, ipas: iList }) => (
        <div key={sound.symbol} className={`${level.bg} rounded-xl border ${level.border} px-3 py-2.5`}>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-base">{sound.emoji}</span>
            <span className={`font-black text-sm font-mono ${level.text}`}>/{sound.symbol}/</span>
            <span className="text-xs text-gray-400 font-semibold">{sound.keyword}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {wList.slice(0, 6).map((w, i) => (
              <div key={w} className="flex flex-col items-center gap-0.5">
                <button onClick={() => speak(w, { rate: 0.75 })}
                  className={`${level.text} text-xs font-bold px-2 py-0.5 bg-white border ${level.border} rounded-lg active:scale-90`}>
                  {w} 🔊
                </button>
                {iList[i] && <span className="text-[10px] text-gray-400 font-mono">{iList[i]}</span>}
                <QuickRecordButton word={w} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LessonPage() {
  const router = useRouter()
  const params = useParams<{ childId: string; levelId: string; lessonId: string }>()
  const childId  = params.childId
  const levelId  = decodeURIComponent(params.levelId)
  const lessonId = decodeURIComponent(params.lessonId)
  const [ready, setReady]   = useState(false)
  const [, forceUpdate]     = useState(0)

  const level      = phonicsLevels.levels.find(l => l.id === levelId) as Level | undefined
  const lessonIdx  = level?.lessons.findIndex(l => l.id === lessonId) ?? -1
  const lesson     = level?.lessons[lessonIdx] as Lesson | undefined
  const prevLesson = level && lessonIdx > 0 ? level.lessons[lessonIdx - 1] : null
  const nextLesson = level && lessonIdx < (level.lessons.length - 1) ? level.lessons[lessonIdx + 1] : null

  useEffect(() => {
    if (!level || !lesson) { router.push(`/dashboard/${childId}/phonics`); return }
    fetch(`/api/sync/${childId}?level=phonics`)
      .then(r => r.json()).catch(() => null)
      .then(data => {
        initPhonicsSync(childId, data)
        markPairSeen(lessonId)
        flushPhonics()
        setReady(true)
        forceUpdate(n => n + 1)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId, levelId, lessonId])

  const refresh = useCallback(() => forceUpdate(n => n + 1), [])

  const navigate = useCallback((targetLessonId: string) => {
    router.push(`/dashboard/${childId}/phonics/${levelId}/${encodeURIComponent(targetLessonId)}`)
  }, [router, childId, levelId])

  if (!level || !lesson || !ready) return (
    <div className={`min-h-screen ${level?.bg ?? 'bg-gray-50'} flex items-center justify-center`}>
      <div className="text-4xl animate-pulse">{lesson?.emoji ?? '🔤'}</div>
    </div>
  )

  const seen      = isPairSeen(lessonId)
  const games     = getPairGames(lessonId)
  const mastered  = isLessonMastered(lessonId, lesson.masteryGames)
  const pairLesson = lesson.type === 'pair' ? lesson as PairLesson : null
  const ruleLesson = lesson.type === 'rule' ? lesson as RuleLesson : null

  return (
    <div className={`min-h-screen ${level.bg} pb-10`}>

      {/* ── Compact 1-line header ── */}
      <div className={`bg-gradient-to-r ${level.gradient} text-white sticky top-0 z-10 shadow-sm`}>
        <div className="max-w-lg mx-auto px-3 py-3 flex items-center gap-2">
          <button onClick={() => router.back()}
            className="text-white/70 hover:text-white font-bold text-lg w-8 shrink-0">←</button>
          <div className="flex-1 min-w-0 text-center">
            <p className="text-[11px] text-white/60 font-semibold leading-none mb-0.5">{level.titleVi}</p>
            <p className="font-black text-sm font-mono leading-none truncate">
              {lesson.title}
              {mastered && <span className="ml-1.5 text-xs">🏆</span>}
            </p>
          </div>
          <button
            onClick={() => prevLesson && navigate(prevLesson.id)}
            disabled={!prevLesson}
            className="text-white/70 hover:text-white disabled:opacity-20 font-black text-xl w-8 text-center shrink-0">‹</button>
          <button
            onClick={() => nextLesson && navigate(nextLesson.id)}
            disabled={!nextLesson}
            className="text-white/70 hover:text-white disabled:opacity-20 font-black text-xl w-8 text-center shrink-0">›</button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">

        {/* ── Mastery checklist ── */}
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-2">Tiến độ thành thạo</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            <div className="flex items-center gap-1.5 col-span-2">
              <span className={`text-sm ${seen ? 'text-green-500' : 'text-gray-200'}`}>{seen ? '✅' : '⬜'}</span>
              <span className="text-xs text-gray-600 font-semibold">Đã đọc bài học</span>
            </div>
            {lesson.games.map(g => {
              const done   = games.includes(g)
              const meta   = GAME_META[g]
              const isBonus = !lesson.masteryGames.includes(g)
              return (
                <div key={g} className="flex items-center gap-1.5">
                  <span className={`text-sm ${done ? 'text-green-500' : 'text-gray-200'}`}>{done ? '✅' : '⬜'}</span>
                  <span className="text-xs text-gray-600 font-semibold leading-tight">
                    {meta?.emoji} {meta?.label}
                    {isBonus && <span className="text-gray-400"> (bonus)</span>}
                  </span>
                </div>
              )
            })}
          </div>
          {mastered && (
            <p className={`text-xs ${level.text} font-black mt-2 pt-1.5 border-t border-gray-100`}>🏆 Thành thạo!</p>
          )}
        </div>

        {/* ── Knowledge Panel — always open ── */}
        <KnowledgePanel lessonId={lessonId} levelText={level.text} levelBorder={level.border} levelBg={level.bg} />

        {/* ── PAIR LESSON ── */}
        {pairLesson && (
          <>
            {/* Condensed sound cards — 2 lines each */}
            <div className={`grid gap-2 ${pairLesson.sounds.length <= 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {pairLesson.sounds.map(s => (
                <button key={s.symbol}
                  onClick={() => playPhoneme(s as Parameters<typeof playPhoneme>[0], { thenKeyword: true })}
                  className={`bg-white rounded-xl border-2 ${level.border} px-3 py-2.5 text-left active:scale-90 transition-transform`}>
                  {/* Line 1: emoji + keyword + IPA of keyword */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="text-xl">{s.emoji}</span>
                    <div className="min-w-0">
                      <span className="font-bold text-gray-800 text-sm">{s.keyword}</span>
                      <span className="text-[10px] text-gray-400 font-mono ml-1">{s.vi}</span>
                    </div>
                  </div>
                  {/* Line 2: target sound + speaker */}
                  <div className="flex items-center gap-1.5">
                    <span className={`font-black text-base ${level.text} font-mono`}>/{s.symbol}/</span>
                    <span className={`text-xs ${level.text} ml-auto`}>🔊</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Tip */}
            {pairLesson.tip && (
              <div className="bg-white/80 rounded-xl px-3 py-2.5 border border-gray-100">
                <p className="text-xs text-gray-600 font-semibold leading-relaxed">
                  <span className={`${level.text} font-black`}>💡 </span>{pairLesson.tip}
                </p>
              </div>
            )}

            {/* Practice words — grouped by sound */}
            <PracticeWords lesson={pairLesson} level={level} />
          </>
        )}

        {/* ── RULE LESSON ── */}
        {ruleLesson && (
          <div className={`bg-white rounded-3xl shadow-sm overflow-hidden border-2 ${level.border}`}>
            <div className={`${level.bg} px-4 py-3 border-b ${level.border}`}>
              <p className={`font-black ${level.text} text-sm`}>📊 {ruleLesson.title} — quy tắc</p>
              <p className={`text-xs ${level.text} opacity-60 font-semibold mt-0.5`}>{ruleLesson.subtitle}</p>
            </div>
            <div className="divide-y divide-gray-50">
              {ruleLesson.buckets.map((bucket, i) => {
                const col = BUCKET_COLORS[i] ?? BUCKET_COLORS[0]
                return (
                  <div key={bucket.label} className={`${col.bg} px-4 py-3.5`}>
                    <p className={`font-black text-sm ${col.text} mb-1.5`}>{bucket.label}</p>
                    <p className="text-xs text-gray-600 font-semibold leading-relaxed mb-1">{bucket.condition}</p>
                    {bucket.tip && <p className={`text-xs font-bold ${col.text} mb-2`}>💡 {bucket.tip}</p>}
                    <div className="flex flex-wrap gap-1.5">
                      {bucket.words.slice(0, 5).map(w => (
                        <button key={w} onClick={() => speak(w, { rate: 0.75 })}
                          className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${col.chip} active:scale-90 transition-transform`}>
                          {w} 🔊
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── RHYTHM LESSON ── */}
        {lesson.type === 'rhythm' && (
          <div className={`bg-white rounded-3xl shadow-sm overflow-hidden border-2 ${level.border}`}>
            <div className={`${level.bg} px-4 py-3 border-b ${level.border}`}>
              <p className={`font-black ${level.text} text-sm`}>🎶 Câu luyện tập</p>
              <p className={`text-xs ${level.text} opacity-60 font-semibold mt-0.5`}>Từ in đậm = nhấn mạnh khi đọc</p>
            </div>
            <div className="px-4 py-3 space-y-2.5">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {((lesson as any).sentences ?? []).slice(0, 4).map((s: { en: string; vi: string }, i: number) => (
                <div key={i}>
                  <p className="text-xs text-gray-700 font-semibold leading-relaxed">{i + 1}. {s.en}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{s.vi}</p>
                </div>
              ))}
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {((lesson as any).sentences?.length ?? 0) > 4 && (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <p className="text-xs text-gray-400 font-medium">+ {(lesson as any).sentences.length - 4} câu nữa trong game...</p>
              )}
            </div>
          </div>
        )}

        {/* ── Game buttons ── */}
        <div className="space-y-2">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wide px-1">Luyện tập</p>
          {lesson.games.map(g => {
            const done    = games.includes(g)
            const meta    = GAME_META[g]
            const isBonus = !lesson.masteryGames.includes(g)
            return (
              <button key={g}
                onClick={() => { refresh(); router.push(`/dashboard/${childId}/phonics/${levelId}/${lessonId}/${g}`) }}
                className={`w-full flex items-center gap-3 bg-white border-2 ${level.border} rounded-2xl px-4 py-4 active:scale-95 transition-all shadow-sm`}>
                <span className="text-2xl">{meta?.emoji}</span>
                <div className="text-left flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`font-black ${level.text} text-sm`}>{meta?.label}</p>
                    {isBonus && <span className="text-xs text-gray-400 font-semibold bg-gray-100 px-1.5 py-0.5 rounded-full">bonus</span>}
                  </div>
                  <p className="text-xs text-gray-400 font-semibold">{meta?.desc}</p>
                </div>
                {done
                  ? <span className="text-green-500 font-black text-sm">✅</span>
                  : <span className={`${level.text} font-black`}>→</span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
