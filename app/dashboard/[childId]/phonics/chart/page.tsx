'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import phonemesData from '@/data/phonemes.json'
import { initPhonicsSync, isPairSeen, isPairMastered } from '@/lib/phonicsSync'
import { playPhoneme } from '@/lib/phonemeAudio'

type Sound = { symbol: string; keyword: string; emoji: string; vi: string; wikiAudio?: string | null; learnAudio?: string | null }

// Build a flat map: symbol → { sound, pairId, status }
function buildChartMap(mastery: Record<string, { flashcard: boolean; games: string[] }>) {
  const map: Record<string, { sound: Sound; pairId: string; seen: boolean; mastered: boolean }> = {}
  for (const group of phonemesData.groups) {
    for (const pair of group.pairs) {
      const seen     = isPairSeen(pair.id)
      const mastered = isPairMastered(pair.id)
      for (const s of pair.sounds) {
        map[s.symbol] = { sound: s as Sound, pairId: pair.id, seen, mastered }
      }
    }
  }
  return map
}

type ChartSection = { title: string; emoji: string; symbols: string[][] }

const CHART_SECTIONS: ChartSection[] = [
  {
    title: 'Nguyên âm ngắn',
    emoji: '🔵',
    symbols: [['ɪ', 'e', 'æ', 'ɒ', 'ʌ', 'ʊ', 'ə']],
  },
  {
    title: 'Nguyên âm dài',
    emoji: '🔴',
    symbols: [['iː', 'ɑː', 'ɔː', 'uː', 'ɜː']],
  },
  {
    title: 'Nguyên âm đôi (diphthongs)',
    emoji: '🟣',
    symbols: [['eɪ', 'aɪ', 'ɔɪ', 'əʊ', 'aʊ', 'ɪə', 'eə']],
  },
  {
    title: 'Phụ âm — plosives',
    emoji: '🟡',
    symbols: [['p', 'b'], ['t', 'd'], ['k', 'g']],
  },
  {
    title: 'Phụ âm — fricatives',
    emoji: '🟠',
    symbols: [['f', 'v'], ['θ', 'ð'], ['s', 'z'], ['ʃ', 'ʒ']],
  },
  {
    title: 'Phụ âm — affricates & nasals',
    emoji: '🟢',
    symbols: [['tʃ', 'dʒ'], ['m', 'n', 'ŋ']],
  },
  {
    title: 'Phụ âm — approximants',
    emoji: '🌸',
    symbols: [['l', 'r', 'h', 'w', 'j']],
  },
]

export default function IPAChartPage() {
  const router = useRouter()
  const { childId } = useParams<{ childId: string }>()
  const [chartMap, setChartMap] = useState<ReturnType<typeof buildChartMap>>({})
  const [loading, setLoading] = useState(true)
  const [playing, setPlaying] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/sync/${childId}?level=phonics`)
      .then(r => r.json()).catch(() => null)
      .then(data => {
        initPhonicsSync(childId, data)
        setChartMap(buildChartMap(data?.mastery ?? {}))
        setLoading(false)
      })
  }, [childId])

  const handleTap = (symbol: string) => {
    const entry = chartMap[symbol]
    if (!entry) return
    setPlaying(symbol)
    playPhoneme(entry.sound, {
      thenKeyword: true,
      onDone: () => setPlaying(null),
    })
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-4xl animate-pulse">🗺️</div>
    </div>
  )

  const totalSounds = Object.keys(chartMap).length
  const masteredSounds = Object.values(chartMap).filter(e => e.mastered).length
  const seenSounds = Object.values(chartMap).filter(e => e.seen).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 px-4 py-6">
      <div className="flex items-center gap-3 mb-5 max-w-lg mx-auto">
        <button onClick={() => router.back()} className="text-gray-400 text-2xl font-bold">←</button>
        <div className="text-3xl">🗺️</div>
        <div>
          <h1 className="text-lg font-black text-gray-800">Bản đồ IPA</h1>
          <p className="text-xs text-gray-400 font-semibold">Bấm vào ô để nghe âm</p>
        </div>
      </div>

      {/* Legend */}
      <div className="max-w-lg mx-auto mb-4 flex gap-3 bg-white/70 rounded-2xl px-4 py-2.5 border border-indigo-100">
        <span className="flex items-center gap-1 text-xs font-semibold text-gray-500"><span className="w-4 h-4 rounded bg-amber-400 inline-block" /> Thành thạo</span>
        <span className="flex items-center gap-1 text-xs font-semibold text-gray-500"><span className="w-4 h-4 rounded bg-amber-100 border border-amber-300 inline-block" /> Đã học</span>
        <span className="flex items-center gap-1 text-xs font-semibold text-gray-500"><span className="w-4 h-4 rounded bg-gray-100 border border-gray-200 inline-block" /> Chưa học</span>
        <span className="ml-auto text-xs text-indigo-600 font-bold">{masteredSounds}/{seenSounds}/{totalSounds}</span>
      </div>

      {/* Chart sections */}
      <div className="max-w-lg mx-auto space-y-4 mb-6">
        {CHART_SECTIONS.map(section => (
          <div key={section.title} className="bg-white/80 rounded-2xl border border-indigo-100 overflow-hidden">
            <div className="px-3 py-2 bg-indigo-50 border-b border-indigo-100">
              <p className="text-xs font-black text-indigo-700">{section.emoji} {section.title}</p>
            </div>
            <div className="p-3 space-y-2">
              {section.symbols.map((row, ri) => (
                <div key={ri} className="flex flex-wrap gap-2">
                  {row.map(sym => {
                    const entry = chartMap[sym]
                    const isPlaying = playing === sym
                    let bg = 'bg-gray-100 border-gray-200 text-gray-400'
                    if (entry?.mastered) bg = 'bg-amber-400 border-amber-500 text-white'
                    else if (entry?.seen) bg = 'bg-amber-100 border-amber-300 text-amber-700'
                    return (
                      <button
                        key={sym}
                        onClick={() => handleTap(sym)}
                        className={`${bg} border-2 rounded-xl px-2.5 py-2 text-center transition-all active:scale-90 ${isPlaying ? 'animate-pulse' : ''} min-w-[52px]`}
                      >
                        {entry ? (
                          <>
                            <div className="text-lg leading-none">{entry.sound.emoji}</div>
                            <div className="font-black text-xs font-mono mt-0.5">/{sym}/</div>
                            <div className="text-[10px] font-semibold mt-0.5 opacity-80">{entry.sound.keyword}</div>
                          </>
                        ) : (
                          <>
                            <div className="font-black text-sm font-mono">/{sym}/</div>
                            <div className="text-[10px] opacity-50">—</div>
                          </>
                        )}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-gray-300 pb-6 max-w-lg mx-auto">
        Phoneme audio: Wikimedia Commons (CC BY-SA) · SpeechActive
      </p>
    </div>
  )
}
