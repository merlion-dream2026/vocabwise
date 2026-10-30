'use client'

// Shared UI pieces for the "Phát âm cùng AI" games (SpeakGame, PhonicsSpeak).

import { cta } from '@/components/ChunkyUI'

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
export type Scores = { pronScore: number; accuracy: number; fluency: number; completeness: number }

const CHIP: Record<Mark['level'], string> = {
  good: 'bg-green-100 text-green-700',
  weak: 'bg-amber-100 text-amber-700',
  bad: 'bg-red-100 text-red-600',
}

/** Word chips: green = good, amber = borderline, red = mispronounced / not heard. With Azure
 *  (`scored`) the colours are real pronunciation scores; with Whisper red only means "not heard".
 *  `onSpeak` → tap a chip to hear the model pronunciation. */
export function WordMarks({ marks, scored, onSpeak }: { marks: Mark[]; scored?: boolean; onSpeak?: (text: string) => void }) {
  if (!marks.length) return null
  const anyBad = marks.some(m => m.level === 'bad')
  return (
    <>
      <p className="mt-2 flex flex-wrap justify-center gap-1">
        {marks.map((m, i) => onSpeak
          ? <button key={i} onClick={() => onSpeak(m.text)} className={`px-1.5 py-0.5 rounded-lg font-bold text-base active:scale-95 ${CHIP[m.level]}`}>{m.text}</button>
          : <span key={i} className={`px-1.5 py-0.5 rounded-lg font-bold text-base ${CHIP[m.level]}`}>{m.text}</span>)}
      </p>
      {anyBad && (
        <p className="text-xs text-slate-500 font-semibold mt-1.5">
          {scored ? 'Từ màu đỏ: đọc chưa chuẩn' : 'Từ màu đỏ: AI chưa nghe rõ'}{onSpeak ? ' · chạm để nghe cách đọc đúng' : ''}
        </p>
      )}
    </>
  )
}

/** Azure's three sub-scores under the result. */
export function ScoreTiles({ s }: { s: Scores }) {
  return (
    <div className="grid grid-cols-3 gap-2 w-full text-center text-[11px] font-semibold text-slate-500">
      {([['Chính xác', s.accuracy], ['Trôi chảy', s.fluency], ['Đầy đủ', s.completeness]] as const).map(([label, v]) => (
        <div key={label} className="rounded-xl bg-white border-2 border-slate-100 py-1.5">
          <b className="block text-base text-slate-700">{v}</b>{label}
        </div>
      ))}
    </div>
  )
}

/** Result card: ⭐⭐⭐ / ⭐⭐ when passed, a gentle 💪 otherwise (no red ❌ for kids). With Azure
 *  scores the headline carries the score ("Giỏi lắm! 86 điểm") and the transcript line is dropped. */
export function ResultCard({ correct, stars, marks, transcript, scores, onSpeak }: {
  correct: boolean; stars: number; marks: Mark[]; transcript: string; scores?: Scores; onSpeak?: (text: string) => void
}) {
  const title = correct ? (stars === 3 ? 'Xuất sắc!' : 'Giỏi lắm!') : 'Gần được rồi! Thử lại nhé'
  return (
    <div className={`w-full rounded-3xl p-4 text-center border-2 border-b-[4px] ${correct ? 'bg-green-50 border-green-200 border-b-green-300' : 'bg-orange-50 border-orange-200 border-b-orange-300'}`}>
      <p className="text-2xl tracking-wider">{correct ? (stars === 3 ? '⭐⭐⭐' : '⭐⭐') : '💪'}</p>
      <p className={`font-black mt-1 ${correct ? 'text-green-700' : 'text-orange-700'}`}>
        {title}{scores && <> · {scores.pronScore} điểm</>}
      </p>
      <WordMarks marks={marks} scored={!!scores} onSpeak={onSpeak} />
      {transcript && !scores && (
        <p className="text-xs text-gray-400 font-medium mt-1.5">AI nghe được: <span className="italic">&ldquo;{transcript}&rdquo;</span></p>
      )}
    </div>
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
