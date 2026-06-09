'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import VWExerciseRunner from '@/components/vocabwise/VWExerciseRunner'
import type { ExercisesData } from '@/components/vocabwise/types'

type GlossaryItem = {
  id: number; word: string; ipa: string; pos: string
  meaning_vi: string; example_en: string; example_vi: string
  word_family: Record<string, string | null> | null
  false_friend: { word_vi: string; explanation_vi: string } | null
  receptive_productive: string | null
  item_type: string
}
type Paragraph = { index: number; text_en: string; text_vi: string }
type TopicData = {
  meta: { topic_title: string; theme_title: string; cefr_level: string; topic_number: number }
  passage: { word_count: number; paragraphs: Paragraph[] }
  glossary: GlossaryItem[]
  exercises: ExercisesData
  answer_key: Record<string, Record<string, string>>
}

type Tab = 'passage' | 'glossary' | 'exercises'

function renderPassage(text: string) {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong class="text-blue-700 font-black">$1</strong>')
}

export default function TopicPage() {
  const { book, topicId } = useParams<{ book: string; topicId: string }>()
  const router = useRouter()
  const [data, setData]       = useState<TopicData | null>(null)
  const [tab, setTab]         = useState<Tab>('passage')
  const [showVI, setShowVI]   = useState(false)
  const [exMode, setExMode]   = useState(false)

  useEffect(() => {
    fetch(`/api/vocabwise/topic?book=${book}&topicId=${topicId}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null))
  }, [book, topicId])

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-2 animate-bounce">📖</div>
          <p className="text-gray-400 font-bold text-sm">Đang tải...</p>
        </div>
      </div>
    )
  }

  const { meta, passage, glossary, exercises, answer_key } = data
  const backUrl = `/vocabwise/${book}`

  if (exMode) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-4 pt-8 pb-12">
          <VWExerciseRunner
            exercises={exercises}
            answerKey={answer_key}
            topicTitle={meta.topic_title}
            onBack={() => setExMode(false)}
            onComplete={scores => {
              console.log('Scores:', scores)
              setExMode(false)
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 pt-12 pb-4 text-white">
        <button onClick={() => router.push(backUrl)} className="text-blue-200 font-bold text-sm flex items-center gap-1 mb-3">← {meta.theme_title}</button>
        <h1 className="text-xl font-black leading-tight">{meta.topic_title}</h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs font-black bg-white/20 px-2 py-0.5 rounded-full">{meta.cefr_level}</span>
          <span className="text-xs text-blue-200">Topic {meta.topic_number} · {passage.word_count} words</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
        {(['passage', 'glossary', 'exercises'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-3 font-black text-sm capitalize transition-all ${
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
              <h2 className="font-black text-gray-700 text-sm">{meta.topic_title}</h2>
              <button onClick={() => setShowVI(v => !v)}
                className="text-xs font-black px-3 py-1.5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors">
                {showVI ? '🇬🇧 Ẩn dịch' : '🇻🇳 Xem dịch'}
              </button>
            </div>
            <div className="space-y-4">
              {passage.paragraphs.map(para => (
                <div key={para.index} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-gray-800 leading-relaxed text-sm"
                    dangerouslySetInnerHTML={{ __html: renderPassage(para.text_en) }} />
                  {showVI && (
                    <p className="text-gray-500 text-xs leading-relaxed mt-3 pt-3 border-t border-gray-200 italic"
                      dangerouslySetInnerHTML={{ __html: renderPassage(para.text_vi) }} />
                  )}
                </div>
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
            <p className="text-xs text-gray-400 text-center mb-4">{glossary.length} từ · Nhấn vào từ để xem chi tiết</p>
            <div className="space-y-3">
              {glossary.map(item => (
                <details key={item.id} className="bg-white border-2 border-gray-100 rounded-2xl overflow-hidden group">
                  <summary className="px-4 py-3 cursor-pointer list-none flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-blue-50 text-blue-500 font-black text-xs flex items-center justify-center flex-shrink-0">
                      {item.id}
                    </span>
                    <div className="flex-1">
                      <span className="font-black text-gray-800 text-sm">{item.word}</span>
                      <span className="text-gray-400 text-xs ml-2">{item.ipa}</span>
                      <span className="text-gray-400 text-xs ml-2 italic">{item.pos}</span>
                    </div>
                    <span className="text-blue-600 font-bold text-sm">{item.meaning_vi.split(';')[0]}</span>
                    <span className="text-gray-300 font-bold group-open:rotate-180 transition-transform">▾</span>
                  </summary>
                  <div className="px-4 pb-4 pt-1 border-t border-gray-50 space-y-2">
                    <p className="text-gray-600 text-xs"><span className="font-black text-gray-700">Nghĩa: </span>{item.meaning_vi}</p>
                    <p className="text-blue-700 text-xs font-bold italic">{item.example_en}</p>
                    <p className="text-gray-500 text-xs italic">{item.example_vi}</p>
                    {item.word_family && Object.values(item.word_family).some(v => v) && (
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
                    {item.false_friend && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                        <p className="text-amber-700 text-xs"><span className="font-black">⚠️ False friend: </span>{item.false_friend.explanation_vi}</p>
                      </div>
                    )}
                    {item.receptive_productive && (
                      <span className={`inline-block text-xs font-black px-2 py-0.5 rounded-full ${
                        item.receptive_productive === 'P' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {item.receptive_productive === 'P' ? 'P — Sản sinh' : 'R — Tiếp nhận'}
                      </span>
                    )}
                  </div>
                </details>
              ))}
            </div>
            <button onClick={() => setTab('exercises')}
              className="w-full mt-6 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-black py-3 rounded-2xl shadow active:scale-95 transition-all">
              ✏️ Làm bài tập →
            </button>
          </div>
        )}

        {/* EXERCISES TAB */}
        {tab === 'exercises' && (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">✏️</div>
            <h2 className="font-black text-gray-800 text-xl mb-2">5 bài tập</h2>
            <p className="text-gray-500 text-sm mb-1">25 câu hỏi · Tối đa 25 điểm</p>
            <p className="text-gray-400 text-xs mb-8">
              Matching · MCQ · Gap-fill · Word Forms · Error Fix
            </p>
            <button onClick={() => setExMode(true)}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all text-lg">
              🚀 Bắt đầu làm bài
            </button>
            <p className="text-xs text-gray-400 mt-3">Đọc bài đọc và từ vựng trước để đạt kết quả tốt nhất</p>
          </div>
        )}

      </div>
    </div>
  )
}
