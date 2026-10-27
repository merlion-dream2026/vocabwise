import { buzz } from '@/components/ChunkyUI'
import WordIcon from '@/components/WordIcon'
import type { ArcadeWord, RocketQuestion } from '@/lib/arcadeGames'
import { fitText } from '@/components/games/fitText'

// The 4-choice question shared by 🚀 Phóng tên lửa and 🏎️ Đua xe: the prompt + picture card and the
// answer buttons. Layout (where they sit on the stage) comes from the caller's className.

export type ChoiceQuestion = RocketQuestion

// Longest single word decides the size, so a word is never split mid-letters ("bathroo/m").
const wordSize = (w: string) => {
  const n = Math.max(...w.split(' ').map((p) => p.length))
  return n <= 5 ? 'text-[clamp(20px,5.2vmin,54px)]' : n <= 8 ? 'text-[clamp(17px,3.9vmin,42px)]' : 'text-[clamp(15px,3vmin,34px)]'
}

const PROMPT: Record<ChoiceQuestion['kind'], string> = {
  vi: 'Từ tiếng Anh nào?',
  listen: 'Nghe và chọn từ đúng',
  en: 'Từ này nghĩa là gì?',
}

export function PromptCard({ q, picked, onSay, className = '', cardClass = '' }: {
  q: ChoiceQuestion; picked: string | null; onSay: () => void; className?: string; cardClass?: string
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-[2.5vmin] ${className}`}>
      <p className="text-center text-[clamp(22px,5.6vmin,58px)] font-black text-white drop-shadow">{PROMPT[q.kind]}</p>
      <div className={`flex aspect-square min-h-[120px] flex-col items-center justify-center gap-1 rounded-[24px] border-[7px] border-[#FACC48] bg-white p-2 shadow-2xl ${cardClass}`}>
        {q.kind === 'vi' && (
          <>
            <WordIcon word={q.target.word} emoji={q.target.emoji} emojiClass="text-[11vmin] leading-none" iconSize={90} />
            <span className={`text-center font-black leading-tight text-[#1E1B4B] ${fitText(q.target.meaning, ['text-[clamp(18px,4.6vmin,46px)]', 'text-[clamp(15px,3.6vmin,36px)]', 'text-[clamp(13px,2.8vmin,28px)]'])}`}>{q.target.meaning}</span>
          </>
        )}
        {q.kind === 'listen' && (
          <button type="button" onClick={() => { buzz(); onSay() }} aria-label="Nghe lại" className="flex flex-col items-center gap-1 text-[#1E1B4B]">
            <span className="text-[12vmin] leading-none">🔊</span>
            <span className="text-[clamp(16px,3.6vmin,36px)] font-black">{picked ? q.target.word : 'Nghe lại'}</span>
          </button>
        )}
        {q.kind === 'en' && (
          <button type="button" onClick={() => { buzz(); onSay() }} className="flex flex-col items-center gap-1 px-1 text-[#1E1B4B]">
            <span className="break-words text-center text-[clamp(22px,6vmin,56px)] font-black leading-tight">{q.target.word}</span>
            <span className="text-[4vmin]">🔊</span>
          </button>
        )}
      </div>
    </div>
  )
}

export function AnswerGrid({ q, picked, onPick, className = '' }: {
  q: ChoiceQuestion; picked: string | null; onPick: (c: ArcadeWord) => void; className?: string
}) {
  const cls = (c: ArcadeWord) => {
    const base = 'rounded-2xl border-b-[6px] px-2 font-black shadow-lg transition-[transform,background-color] active:translate-y-1 active:border-b-2'
    if (picked === null) return `${base} border-[#B9C0E8] bg-[#E8ECFB] text-[#1E1B4B]`
    if (c.word === q.target.word) return `${base} border-emerald-700 bg-emerald-400 text-emerald-950`
    return c.word === picked ? `${base} ax-shake border-red-700 bg-red-400 text-white` : `${base} border-[#3B3E5C] bg-[#565A7E] text-[#9EA3C8]`
  }
  return (
    <div className={`grid gap-[1.5vmin] ${className}`}>
      {q.choices.map((c) => (
        <button key={c.word} type="button" disabled={picked !== null} onClick={() => { buzz(); onPick(c) }} className={cls(c)}>
          {q.kind === 'en'
            ? <span className={`block leading-tight ${fitText(c.meaning, ['text-[clamp(16px,4vmin,42px)]', 'text-[clamp(14px,3.2vmin,32px)]', 'text-[clamp(12px,2.6vmin,26px)]'])}`}>{c.emoji} {c.meaning}</span>
            : <span className={`block leading-tight ${wordSize(c.word)}`}>{c.word}</span>}
        </button>
      ))}
    </div>
  )
}
