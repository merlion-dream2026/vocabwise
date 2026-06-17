'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import phonemesData from '@/data/phonemes.json'
import { initPhonicsSync, isPairSeen, isPairMastered } from '@/lib/phonicsSync'
import { playPhoneme } from '@/lib/phonemeAudio'

type Sound = {
  symbol: string; keyword: string; emoji: string; vi: string
  wikiAudio?: string | null; learnAudio?: string | null
}
type SoundEntry = { sound: Sound; pairId: string; seen: boolean; mastered: boolean }

function buildSoundMap(): Record<string, SoundEntry> {
  const map: Record<string, SoundEntry> = {}
  for (const group of phonemesData.groups) {
    for (const pair of group.pairs) {
      const seen = isPairSeen(pair.id)
      const mastered = isPairMastered(pair.id)
      for (const s of pair.sounds) {
        map[s.symbol] = { sound: s as Sound, pairId: pair.id, seen, mastered }
      }
    }
  }
  return map
}

// Classic IPA chart layout
const MONOPHTHONGS: string[][] = [
  ['iː', 'ɪ', 'ʊ', 'uː'],
  ['e',  'ə', 'ɜː', 'ɔː'],
  ['æ',  'ʌ', 'ɑː', 'ɒ'],
]
const DIPHTHONGS: string[][] = [
  ['ɪə', 'eɪ', ''],
  ['ʊə', 'ɔɪ', 'əʊ'],
  ['eə', 'aɪ', 'aʊ'],
]
const CONSONANTS: string[][] = [
  ['p', 'f', 't', 'θ', 'tʃ', 's', 'ʃ', 'k'],
  ['b', 'v', 'd', 'ð', 'dʒ', 'z', 'ʒ', 'g'],
  ['h', 'm', 'n', 'ŋ', 'r',  'l', 'w', 'j'],
]

function PhonemeCell({
  sym, entry, isPlaying, onTap,
}: {
  sym: string
  entry: SoundEntry | undefined
  isPlaying: boolean
  onTap: () => void
}) {
  if (!sym) return <div />

  const isTwoPartCombo = sym === 'tʃ' || sym === 'dʒ'
  const isMultiChar = sym.length > 1
  const fontSizeCls = isTwoPartCombo ? 'text-[10px]' : isMultiChar ? 'text-[11px]' : 'text-sm'

  let containerCls = 'bg-gray-50 border-gray-200'
  let symCls = 'text-gray-500'
  let kwCls = 'text-gray-300'

  if (entry?.mastered) {
    containerCls = 'bg-amber-400 border-amber-500'
    symCls = 'text-white'
    kwCls = 'text-white/70'
  } else if (entry?.seen) {
    containerCls = 'bg-indigo-100 border-indigo-300'
    symCls = 'text-indigo-700'
    kwCls = 'text-indigo-400'
  }

  return (
    <button
      onClick={onTap}
      className={`border-2 rounded-lg flex flex-col items-center justify-center aspect-square w-full transition-all duration-100 active:scale-90 ${containerCls} ${isPlaying ? 'ring-2 ring-blue-400 ring-offset-1 scale-110 shadow-md z-10 relative' : ''}`}
    >
      <span className={`font-black font-mono leading-none ${symCls} ${fontSizeCls}`}>
        {sym}
      </span>
      {entry && (
        <span className={`text-[7px] font-semibold leading-none mt-0.5 truncate w-full text-center px-0.5 ${kwCls}`}>
          {entry.sound.keyword}
        </span>
      )}
    </button>
  )
}

export default function IPAChartPage() {
  const router = useRouter()
  const { childId } = useParams<{ childId: string }>()
  const [soundMap, setSoundMap] = useState<Record<string, SoundEntry>>({})
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/sync/${childId}?level=phonics`)
      .then(r => r.json()).catch(() => null)
      .then(data => {
        initPhonicsSync(childId, data)
        setSoundMap(buildSoundMap())
        setLoading(false)
      })
  }, [childId])

  const handleTap = useCallback((symbol: string) => {
    if (!symbol || playing) return
    const entry = soundMap[symbol]
    if (!entry) return
    setPlaying(symbol)
    playPhoneme(entry.sound, { thenKeyword: true, onDone: () => setPlaying(null) })
  }, [soundMap, playing])

  if (loading) return (
    <div className="min-h-screen bg-indigo-50 flex items-center justify-center">
      <div className="text-4xl animate-pulse">🔤</div>
    </div>
  )

  const masteredCount = Object.values(soundMap).filter(e => e.mastered).length
  const seenCount     = Object.values(soundMap).filter(e => e.seen).length
  const totalCount    = Object.keys(soundMap).length
  const playingEntry  = playing ? soundMap[playing] : null

  return (
    <div className="min-h-screen bg-indigo-50 pb-10">

      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white px-4 pt-12 pb-5">
        <button onClick={() => router.back()} className="text-white/70 font-bold text-sm mb-3 flex items-center gap-1">
          ← Phonics
        </button>
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-xl font-black">🔤 Bảng IPA</h1>
            <p className="text-white/70 text-xs mt-0.5">Bấm vào ô để nghe phát âm mẫu</p>
          </div>
          <div className="text-right text-xs text-white/60 space-y-0.5">
            <p>🏆 {masteredCount} thành thạo</p>
            <p>📖 {seenCount}/{totalCount} đã học</p>
          </div>
        </div>
      </div>

      <div className="px-3 pt-4 max-w-lg mx-auto space-y-3">

        {/* Legend */}
        <div className="flex gap-4 text-[11px] font-semibold text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-400 border border-amber-500 inline-block" />
            Thành thạo
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-indigo-100 border-2 border-indigo-300 inline-block" />
            Đã học
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-gray-50 border border-gray-200 inline-block" />
            Chưa học
          </span>
        </div>

        {/* VOWELS */}
        <div className="bg-white rounded-2xl overflow-hidden border border-indigo-100 shadow-sm">
          <div className="bg-indigo-600 px-3 py-2 text-center">
            <p className="text-white text-xs font-black uppercase tracking-wider">VOWELS · Nguyên âm</p>
          </div>

          {/* Sub-headers */}
          <div className="flex px-2 pt-2 pb-1 gap-2">
            <p className="flex-[4] text-center text-[9px] font-bold text-gray-400 uppercase tracking-wide">Monophthongs</p>
            <div className="w-px" />
            <p className="flex-[3] text-center text-[9px] font-bold text-gray-400 uppercase tracking-wide">Diphthongs</p>
          </div>

          {/* Grid rows */}
          <div className="px-2 pb-2 space-y-1">
            {[0, 1, 2].map(r => (
              <div key={r} className="flex gap-2 items-stretch">
                {/* Monophthongs */}
                <div className="flex-[4] grid grid-cols-4 gap-1">
                  {MONOPHTHONGS[r].map(sym => (
                    <PhonemeCell key={sym} sym={sym} entry={soundMap[sym]} isPlaying={playing === sym} onTap={() => handleTap(sym)} />
                  ))}
                </div>
                {/* Divider */}
                <div className="w-px bg-indigo-100" />
                {/* Diphthongs */}
                <div className="flex-[3] grid grid-cols-3 gap-1">
                  {DIPHTHONGS[r].map((sym, i) =>
                    sym
                      ? <PhonemeCell key={sym} sym={sym} entry={soundMap[sym]} isPlaying={playing === sym} onTap={() => handleTap(sym)} />
                      : <div key={i} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CONSONANTS */}
        <div className="bg-white rounded-2xl overflow-hidden border border-amber-100 shadow-sm">
          <div className="bg-amber-500 px-3 py-2 text-center">
            <p className="text-white text-xs font-black uppercase tracking-wider">CONSONANTS · Phụ âm</p>
          </div>
          <div className="px-2 py-2 space-y-1">
            {CONSONANTS.map((row, ri) => (
              <div key={ri} className="grid grid-cols-8 gap-1">
                {row.map(sym => (
                  <PhonemeCell key={sym} sym={sym} entry={soundMap[sym]} isPlaying={playing === sym} onTap={() => handleTap(sym)} />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Now playing card */}
        <div className={`bg-blue-50 rounded-2xl border-2 border-blue-200 px-4 py-3 flex items-center gap-3 transition-all duration-200 ${playingEntry ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <span className="text-2xl">{playingEntry?.sound.emoji ?? '🔊'}</span>
          <div className="flex-1 min-w-0">
            <p className="font-black text-blue-700 font-mono text-lg leading-none">/{playing}/</p>
            <p className="text-xs text-blue-500 font-semibold mt-0.5">
              {playingEntry?.sound.keyword} · {playingEntry?.sound.vi}
            </p>
          </div>
          <div className="flex items-end gap-0.5 h-6">
            {[4, 8, 12, 8, 4].map((h, i) => (
              <div key={i} className="w-1 rounded-full bg-blue-400 animate-bounce"
                style={{ height: `${h}px`, animationDelay: `${i * 80}ms` }} />
            ))}
          </div>
        </div>

        <p className="text-center text-[10px] text-gray-300 pb-2">
          Audio: Wikimedia Commons CC BY-SA · SpeechActive
        </p>
      </div>
    </div>
  )
}
