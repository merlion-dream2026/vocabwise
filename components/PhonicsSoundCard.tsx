'use client'
import type { PhonicsVerdict } from '@/lib/pronunciationScore'

type Sound = { symbol: string; keyword?: string }

const tone = (score: number) => score >= 80 ? 'bg-green-100 text-green-700' : score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'

/** Phonics luyện nói, Azure-scored: the practice words split into sounds (IPA), the lesson's own
 *  sounds ringed, plus one line on the weakest one ("Âm /iː/ mới được 45/100, nghe giống /ɪ/"). */
export default function PhonicsSoundCard({ verdict, sounds, tip }: { verdict: PhonicsVerdict; sounds: Sound[]; tip?: string }) {
  const w = verdict.weakest
  const keyword = (sym?: string) => sounds.find(s => s.symbol === sym)?.keyword
  return (
    <div className="w-full rounded-2xl border-2 border-slate-100 bg-white p-3 text-center">
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
        {verdict.words.map((word, i) => (
          <div key={i}>
            <p className="text-xs font-bold text-slate-500">{word.word}</p>
            <div className="mt-0.5 flex justify-center gap-0.5 font-mono text-lg font-bold">
              {word.phonemes.map((p, j) => (
                <span key={j} className={`rounded px-1 ${tone(p.score)} ${p.focus ? 'ring-2 ring-indigo-300' : ''}`}>{p.p}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      {w && (
        <p className="mt-2 text-sm font-semibold text-slate-700">
          {verdict.ok
            ? <>Âm <b>/{w.symbol}/</b> chuẩn rồi! <b>{w.score}/100</b></>
            : <>Âm <b>/{w.symbol}/</b> mới được <b>{w.score}/100</b>
                {w.heardAs && <>, nghe giống <b>/{w.heardAs}/</b>{keyword(w.heardAs) && <> ({keyword(w.heardAs)})</>}</>}</>}
        </p>
      )}
      {!verdict.ok && tip && <p className="mt-1 text-xs text-slate-500">💡 {tip}</p>}
    </div>
  )
}
