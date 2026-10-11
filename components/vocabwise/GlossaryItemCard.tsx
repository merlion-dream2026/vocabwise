'use client'
import { speak } from '@/lib/speak'
import { stripMarkdown } from '@/lib/textFormat'
import { cta } from '@/components/ChunkyUI'

// One entry of an Academic topic's "Từ vựng" tab: a collapsible card (word or collocation) with
// pronunciation, save-to-My-Words star, example, word family, false-friend note and AI explanation.

export type GlossaryItem = {
  id: number
  type?: string
  // word items (1–10)
  word?: string; ipa?: string; pos?: string
  word_family?: Record<string, string | null> | null
  false_friend?: {
    word?: string; explanation_vi: string
    example_en?: string; example_vi?: string
    ff_example_en?: string; ff_example_vi?: string
  } | null
  // collocation items (11–15)
  collocation?: string
  // shared
  meaning_vi: string; example_en: string; example_vi: string
  receptive_productive?: string | null
  explanation_vi?: string | null
}

const POS_SHORT: Record<string, string> = {
  noun: 'n', verb: 'v', adjective: 'adj', adverb: 'adv',
  preposition: 'prep', conjunction: 'conj', pronoun: 'pron',
  phrase: 'phr', idiom: 'idiom', interjection: 'interj',
}
function posShort(pos: string): string {
  return (pos ?? '').split(' / ').map(p => POS_SHORT[p.trim().toLowerCase()] ?? p.trim()).join(' / ')
}

export default function GlossaryItemCard({ item, saved, onToggleSave, explanation, explaining, explainError, onExplain }: {
  item: GlossaryItem
  saved: boolean
  onToggleSave: () => void
  explanation: string | undefined
  explaining: boolean
  explainError: string | undefined
  onExplain: () => void
}) {
  const isCollocation = item.type === 'collocation'
  const displayText = isCollocation ? (item.collocation ?? '') : (item.word ?? '')
  return (
      <details className="bg-white rounded-3xl overflow-hidden group border-2 border-slate-200 border-b-[4px] border-b-slate-300"
        onToggle={e => { if ((e.currentTarget as HTMLDetailsElement).open) speak(displayText) }}>
        <summary className="px-4 py-2.5 cursor-pointer list-none flex items-center gap-2">
          {/* Badge */}
          {isCollocation ? (
            <span className="w-7 h-7 rounded-xl bg-blue-50 text-blue-500 font-bold text-xs flex items-center justify-center flex-shrink-0">💬</span>
          ) : (
            <span className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center flex-shrink-0">{item.id}</span>
          )}
          {/* Word + POS inline */}
          <div className="flex-1 min-w-0 flex items-baseline gap-1.5">
            <p className="font-bold text-gray-800 text-sm leading-snug truncate">{displayText}</p>
            {isCollocation
              ? <span className="text-blue-400 text-xs flex-shrink-0">col</span>
              : item.pos && <span className="text-gray-400 text-xs italic flex-shrink-0">{posShort(item.pos)}</span>
            }
          </div>
          {/* Meaning — first clause, single line */}
          <span className="text-blue-600 font-bold text-sm text-right truncate max-w-[34%]">
            {(item.meaning_vi ?? '').split(';')[0]}
          </span>
          {/* Speaker + Star inline */}
          <div className="flex items-center flex-shrink-0">
            <button
              onClick={e => { e.preventDefault(); speak(displayText) }}
              className="text-gray-300 hover:text-blue-500 active:text-blue-600 transition-colors p-1"
              aria-label={`Phát âm ${displayText}`}
            >🔊</button>
            <button
              onClick={e => { e.preventDefault(); onToggleSave() }}
              className={`p-1 transition-colors ${saved ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}
              aria-label={saved ? 'Bỏ lưu' : 'Lưu từ này'}
            >{saved ? '⭐' : '☆'}</button>
          </div>
          {/* Arrow */}
          <span className="text-gray-300 group-open:rotate-180 transition-transform flex-shrink-0 text-sm">▾</span>
        </summary>
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-2">
          {/* IPA — shown only in expanded */}
          {!isCollocation && item.ipa && (
            <p className="text-gray-400 text-xs font-mono">{item.ipa}</p>
          )}
          <p className="text-gray-600 text-sm"><span className="font-bold text-gray-700">Nghĩa: </span>{item.meaning_vi}</p>
          <div className="flex items-start gap-1">
            <p className="text-blue-700 text-sm font-bold italic flex-1">{item.example_en}</p>
            <button
              onClick={() => speak(item.example_en)}
              className="text-gray-300 hover:text-blue-500 active:text-blue-600 transition-colors flex-shrink-0 p-0.5 mt-0.5"
              aria-label="Phát âm câu ví dụ"
            >🔊</button>
          </div>
          <p className="text-gray-500 text-sm italic">{item.example_vi}</p>
          {!isCollocation && item.word_family && Object.values(item.word_family).some(v => v) && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {Object.entries(item.word_family).map(([pos, form]) =>
                form ? (
                  <span key={pos} className="text-xs bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-lg">
                    {pos}: {form}
                  </span>
                ) : null
              )}
            </div>
          )}
          {!isCollocation && item.false_friend && (
            <details className="group/ff">
              <summary className="list-none cursor-pointer flex items-center justify-between py-1.5 px-2 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-xs font-bold text-amber-700">
                  ⚠️ Cần phân biệt{item.false_friend.word ? `: ${item.word} ≠ ${item.false_friend.word}` : ''}
                </span>
                <span className="text-amber-300 text-sm group-open/ff:rotate-180 transition-transform flex-shrink-0 ml-2">▾</span>
              </summary>
              <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-3 space-y-2.5">
                <p className="text-amber-800 text-sm leading-relaxed">{item.false_friend.explanation_vi}</p>
                {item.false_friend.example_en && (
                  <div>
                    <p className="text-amber-700 text-sm font-bold mb-0.5">{item.word}</p>
                    <p className="text-amber-800 text-sm italic">{item.false_friend.example_en}</p>
                    <p className="text-amber-600 text-sm italic">{item.false_friend.example_vi}</p>
                  </div>
                )}
                {item.false_friend.ff_example_en && (
                  <div>
                    <p className="text-amber-700 text-sm font-bold mb-0.5">{item.false_friend.word}</p>
                    <p className="text-amber-800 text-sm italic">{item.false_friend.ff_example_en}</p>
                    <p className="text-amber-600 text-sm italic">{item.false_friend.ff_example_vi}</p>
                  </div>
                )}
              </div>
            </details>
          )}
          {!isCollocation && item.word && (
            <details className="pt-1 group/explain">
              <summary className="list-none cursor-pointer flex items-center justify-between py-1.5 px-2 bg-indigo-50 border border-indigo-200 rounded-xl">
                <span className="text-sm font-bold text-indigo-600">✨ Giải nghĩa</span>
                <span className="text-indigo-300 text-sm group-open/explain:rotate-180 transition-transform">▾</span>
              </summary>
              <div className="mt-2">
                {(item.explanation_vi || explanation) ? (
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl px-3 py-3">
                    <p className="text-indigo-800 text-sm leading-relaxed whitespace-pre-line">{stripMarkdown(item.explanation_vi ?? explanation ?? '')}</p>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => onExplain()}
                      disabled={explaining}
                      className={cta('indigo')}
                    >
                      {explaining ? '⏳ Đang giải thích...' : '✨ Giải nghĩa'}
                    </button>
                    {explainError && (
                      <p className="text-red-500 text-xs mt-1.5 text-center">{explainError}</p>
                    )}
                  </>
                )}
              </div>
            </details>
          )}
        </div>
      </details>
  )
}
