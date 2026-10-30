'use client'

// Shared UI pieces for the "Phát âm cùng AI" games (SpeakGame, PhonicsSpeak).

import { useState } from 'react'
import { cta } from '@/components/ChunkyUI'
import { disputePronunciation } from '@/lib/pronounceClient'
import { normalize } from '@/lib/pronunciation'
import type { Assessment, Bar } from '@/lib/pronunciationScore'

export const SLOW_RATE = 0.6
// After this many wrong tries on one item, play the model slowly and suggest moving on
export const HINT_AFTER_FAILS = 2

/** Live mic level bars — shows the kid the app can hear them. `level` is 0..1. */
export function MicLevelBars({ level }: { level: number }) {
  return (
    <div className="flex items-end justify-center gap-1 h-8" aria-hidden>
      {[0.5, 0.8, 1, 0.8, 0.5].map((f, i) => (
        <div key={i} className="w-2 rounded-full bg-rose-400 transition-[height] duration-75"
          style={{ height: `${6 + level * 26 * f}px` }} />
      ))}
    </div>
  )
}

/** "Giọng mẫu" row — normal + 🐢 slow TTS, shown right above the kid's own recording. */
export function ModelVoiceRow({ onPlay }: { onPlay: (rate?: number) => void }) {
  return (
    <div className="w-full bg-white border-2 border-slate-100 rounded-2xl px-3 py-2 flex items-center gap-2">
      <span className="flex-1 text-xs font-bold text-slate-500">🔊 Giọng mẫu</span>
      <button onClick={() => onPlay()}
        className="bg-rose-50 text-rose-500 font-bold text-sm px-3 py-2 rounded-xl whitespace-nowrap active:scale-95 transition-all">▶ Nghe</button>
      <button onClick={() => onPlay(SLOW_RATE)}
        className="bg-sky-50 text-sky-600 font-bold text-sm px-3 py-2 rounded-xl whitespace-nowrap active:scale-95 transition-all">🐢 Chậm</button>
    </div>
  )
}

export type Mark = { text: string; level: 'good' | 'weak' | 'bad' }
export const marksFromMatch = (m: { text: string; ok: boolean }[]): Mark[] => m.map(x => ({ text: x.text, level: x.ok ? 'good' : 'bad' }))

const CHIP: Record<Mark['level'], string> = {
  good: 'bg-green-100 text-green-700',
  weak: 'bg-amber-100 text-amber-700',
  bad: 'bg-red-100 text-red-600',
}
const RING: Record<Mark['level'], string> = { good: 'ring-2 ring-green-400', weak: 'ring-2 ring-amber-300', bad: 'ring-2 ring-red-300' }

const wordSet = (s?: string) => new Set(normalize(s ?? '').split(' ').filter(Boolean))

/** Word chips: green = good, amber = borderline, red = mispronounced / not heard. With Azure
 *  (`scored`) the colours are real pronunciation scores; with Whisper red only means "not heard".
 *  `keyword` chips get a ring (the word being learned). `onSpeak` → tap a chip to hear it. */
export function WordMarks({ marks, scored, keyword, onSpeak, hideHint }: {
  marks: Mark[]; scored?: boolean; keyword?: string; onSpeak?: (text: string) => void; hideHint?: boolean
}) {
  if (!marks.length) return null
  const anyBad = marks.some(m => m.level === 'bad')
  const keys = wordSet(keyword)
  const cls = (m: Mark) => `px-1.5 py-0.5 rounded-lg font-bold text-base ${CHIP[m.level]} ${keys.has(normalize(m.text)) ? RING[m.level] : ''}`
  return (
    <>
      <p className="mt-2 flex flex-wrap justify-center gap-1">
        {marks.map((m, i) => onSpeak
          ? <button key={i} onClick={() => onSpeak(m.text)} className={`${cls(m)} active:scale-95`}>{m.text}</button>
          : <span key={i} className={cls(m)}>{m.text}</span>)}
      </p>
      {anyBad && !hideHint && (
        <p className="text-xs text-slate-500 font-semibold mt-1.5">
          {scored ? 'Từ màu đỏ: đọc chưa chuẩn' : 'Từ màu đỏ: AI chưa nghe rõ'}{onSpeak ? ' · chạm để nghe cách đọc đúng' : ''}
        </p>
      )}
    </>
  )
}

/** Lowest Azure score among the key word's words (skipped = 0); null when it isn't in the result. */
function keywordScore(a: Assessment, keyword: string): number | null {
  const keys = wordSet(keyword)
  const hits = a.words.filter(w => keys.has(normalize(w.word)) && w.error !== 'Insertion')
  return hits.length ? Math.min(...hits.map(w => (w.error === 'Omission' ? 0 : w.accuracy))) : null
}

/** "Why" behind the score: key word first, then plain-language sub-scores, then the pass rule. */
export function ScoreBars({ a, keyword, bar }: { a: Assessment; keyword?: string; bar?: Bar }) {
  const key = keyword ? keywordScore(a, keyword) : null
  const rows: [React.ReactNode, number][] = [
    ...(keyword && key !== null ? [[<>Từ <b className="text-slate-800">{keyword}</b></>, key] as [React.ReactNode, number]] : []),
    ['Phát âm đúng', a.accuracy], ['Đọc trôi chảy', a.fluency], ['Đọc đủ các từ', a.completeness],
  ]
  const color = (v: number) => (bar && v < bar.word ? 'bg-red-300' : v < 80 ? 'bg-amber-300' : 'bg-green-400')
  return (
    <div className="w-full rounded-2xl bg-white border-2 border-slate-100 p-3 space-y-2 text-xs font-bold text-slate-600">
      {rows.map(([label, v], i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-28 text-left truncate">{label}</span>
          <div className="flex-1 h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${color(v)}`} style={{ width: `${v}%` }} /></div>
          <span className="w-8 text-right">{v}</span>
        </div>
      ))}
      {bar && (
        <p className="text-xs font-semibold text-slate-500 pt-1 text-left">
          Đạt khi điểm chung ≥ {bar.pron}{keyword ? <> và từ {keyword} ≥ {bar.word}</> : null}
        </p>
      )}
    </div>
  )
}

/** Result card. ⭐⭐⭐ / ⭐⭐ when passed, a gentle 💪 otherwise (no red ❌ for kids).
 *  simple (Seeker–Ranger, Phonics): no numbers — stars, word colours and one line saying which word
 *  to fix; scores behind "Xem điểm chi tiết". Otherwise one big score /100 + ScoreBars.
 *  Whisper path (no `assessment`): chips + "AI nghe được". */
export function ResultCard({ correct, stars, marks, transcript, assessment, keyword, bar, simple, details = true, onSpeak, logId }: {
  correct: boolean; stars: number; marks: Mark[]; transcript: string
  assessment?: Assessment; keyword?: string; bar?: Bar; simple: boolean
  details?: boolean // false when another card explains the result (Phonics sound card)
  onSpeak?: (text: string) => void
  logId?: number | null // Azure attempt id → "Con đọc đúng mà" under a fail
}) {
  const [open, setOpen] = useState(false)
  const keys = wordSet(keyword)
  const badKey = assessment && !correct ? marks.find(m => m.level === 'bad' && keys.has(normalize(m.text)))?.text.replace(/[^\w'-]/g, '') : undefined
  const title = correct
    ? (stars === 3 ? (simple && assessment ? 'Xuất sắc! Con đọc rất chuẩn' : 'Xuất sắc!') : 'Giỏi lắm!')
    : badKey ? <>Từ <u>{badKey}</u> chưa chuẩn lắm</> : 'Gần được rồi! Thử lại nhé'
  const showBars = assessment && details && (!simple || open)
  return (
    <>
      <div className={`w-full rounded-3xl p-4 text-center border-2 border-b-[4px] ${correct ? 'bg-green-50 border-green-200 border-b-green-300' : 'bg-orange-50 border-orange-200 border-b-orange-300'}`}>
        <p className="text-2xl tracking-wider">{correct ? (stars === 3 ? '⭐⭐⭐' : '⭐⭐') : '💪'}</p>
        <p className={`font-black mt-1 ${correct ? 'text-green-700' : 'text-orange-700'}`}>{title}</p>
        {badKey && onSpeak && <p className="text-xs text-slate-600 font-semibold mt-1">Chạm vào từ đỏ để nghe cách đọc đúng</p>}
        {assessment && !simple && (
          <p className="mt-1">
            <span className={`text-4xl font-black ${correct ? 'text-green-700' : 'text-orange-700'}`}>{assessment.pronScore}</span>
            <span className={`text-sm font-bold ${correct ? 'text-green-600' : 'text-orange-600'}`}>/100</span>
          </p>
        )}
        <WordMarks marks={marks} scored={!!assessment} keyword={keyword} onSpeak={onSpeak} hideHint={!!badKey && !!onSpeak} />
        {transcript && !assessment && (
          <p className="text-xs text-gray-400 font-medium mt-1.5">AI nghe được: <span className="italic">&ldquo;{transcript}&rdquo;</span></p>
        )}
        {!correct && logId ? <DisputeButton key={logId} logId={logId} /> : null}
      </div>
      {assessment && details && simple && (
        <button onClick={() => setOpen(o => !o)} className="text-xs font-bold text-slate-500 active:scale-95">
          {open ? 'Ẩn điểm chi tiết ▴' : 'Xem điểm chi tiết ▾'}
        </button>
      )}
      {showBars && <ScoreBars a={assessment} keyword={keyword} bar={bar} />}
    </>
  )
}

/** Learner thinks the fail is wrong → logged as a false-reject signal to tune the bars. The
 *  verdict stays (a kid could otherwise tap past every word). */
function DisputeButton({ logId }: { logId: number }) {
  const [sent, setSent] = useState(false)
  if (sent) return <p className="text-xs text-slate-500 font-semibold mt-2">Cảm ơn! Thầy cô sẽ xem lại để AI chấm chuẩn hơn.</p>
  return (
    <button onClick={() => { setSent(true); void disputePronunciation(logId) }}
      className="mt-2 text-xs font-bold text-slate-500 underline underline-offset-2 active:scale-95">
      Con đọc đúng mà
    </button>
  )
}

export function UnclearCard() {
  return (
    <div className="bg-amber-50 border-2 border-b-[4px] border-amber-200 border-b-amber-300 rounded-3xl p-4 text-center w-full">
      <p className="text-2xl mb-1">🔄</p>
      <p className="font-bold text-amber-700">Chưa nghe rõ tiếng Anh</p>
      <p className="text-amber-500 text-sm mt-1">Đọc to hơn và gần micro hơn nhé!</p>
    </div>
  )
}

export function HintCard({ unit = 'từ' }: { unit?: string }) {
  return (
    <div className="w-full bg-sky-50 border-2 border-sky-100 rounded-2xl p-3 text-center">
      <p className="text-sm font-bold text-sky-700">🐢 Nghe chậm rồi đọc theo nhé — hoặc sang {unit} tiếp, mình ôn lại sau!</p>
    </div>
  )
}

/** Recording state: stop button that glows with the voice, level bars, time-left bar. */
export function RecordingView({ level, timeLeft, maxSecs, onStop }: {
  level: number; timeLeft: number; maxSecs: number; onStop: () => void
}) {
  return (
    <>
      <button onClick={onStop} aria-label="Dừng thu âm"
        className="w-20 h-20 rounded-full bg-rose-600 shadow-xl flex items-center justify-center text-3xl active:scale-95 transition-all"
        style={{ boxShadow: `0 0 0 ${4 + level * 18}px rgb(251 113 133 / 0.35)` }}>
        ⏹️
      </button>
      <MicLevelBars level={level} />
      <p className="text-rose-500 font-bold text-sm">Đang nghe... đọc xong mình tự dừng</p>
      <div className="w-full bg-rose-100 rounded-full h-1.5 overflow-hidden">
        <div className="h-full bg-rose-300 rounded-full transition-all duration-1000"
          style={{ width: `${(timeLeft / maxSecs) * 100}%` }} />
      </div>
    </>
  )
}

/** Bottom buttons after scoring. Passed → "Tiếp theo" is primary; otherwise "Thử lại",
 *  until the hint shows — then moving on becomes the primary action. */
export function ResultButtons({ passed, showHint, isLast, unit = 'từ', onRetry, onNext }: {
  passed: boolean; showHint: boolean; isLast: boolean; unit?: string
  onRetry: () => void; onNext: () => void
}) {
  const nextLabel = isLast ? 'Kết quả →' : passed ? 'Tiếp theo →' : `${unit[0].toUpperCase()}${unit.slice(1)} tiếp →`
  return (
    <div className="mt-auto w-full flex gap-3 pb-2">
      {passed ? (
        <>
          <button onClick={onRetry} className={cta('slate', 'flex-1 whitespace-nowrap')}>🔄 Thử lại</button>
          <button onClick={onNext} className={cta('green', 'flex-1 whitespace-nowrap')}>{nextLabel}</button>
        </>
      ) : (
        <>
          <button onClick={onRetry} className={cta(showHint ? 'slate' : 'rose', 'flex-1 whitespace-nowrap')}>🎤 Thử lại</button>
          <button onClick={onNext} className={cta(showHint ? 'green' : 'slate', 'flex-1 whitespace-nowrap')}>{nextLabel}</button>
        </>
      )}
    </div>
  )
}
