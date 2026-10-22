'use client'

import WordIcon from '@/components/WordIcon'

type Props = {
  word: { word: string; meaning: string; emoji: string }
  isLast: boolean
  onHear: () => void
  onNext: () => void
}

export default function SuccessModal({ word, isLast, onHear, onNext }: Props) {
  return (
    <div className="fixed inset-0 z-40 bg-[#3b2a8a]/60 flex items-center justify-center px-6" role="dialog" aria-modal="true">
      <div className="w-full max-w-xs bg-[#fdf6e6] rounded-[26px] px-5 py-6 text-center shadow-2xl">
        <h2 className="text-2xl font-black text-[#3b2a8a]">Giỏi quá! 🎉</h2>
        <div className="w-32 h-32 mx-auto mt-4 mb-2 bg-white border-[6px] border-[#ecb94f] rounded-3xl flex items-center justify-center">
          <WordIcon word={word.word} emoji={word.emoji} emojiClass="text-7xl leading-none select-none" iconSize={72} />
        </div>
        <p className="text-5xl font-black text-[#3b2a8a] leading-tight break-words">{word.word}</p>
        <p className="font-extrabold text-[#6b5fa0] mb-4">{word.meaning}</p>
        <div className="flex gap-2.5">
          <button onClick={onHear} className="flex-1 whitespace-nowrap rounded-2xl bg-white text-[#3b2a8a] font-black py-3 border-b-[5px] border-[#c9a23a] active:translate-y-0.5">
            🔊 Nghe lại
          </button>
          <button onClick={onNext} autoFocus className="flex-1 whitespace-nowrap rounded-2xl bg-[#ecb94f] text-[#2b1d0e] font-black py-3 border-b-[5px] border-black/15 active:translate-y-0.5">
            {isLast ? 'Kết quả ▶' : 'Tiếp ▶'}
          </button>
        </div>
      </div>
    </div>
  )
}
