import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabaseServer'
import { getSession } from '@/lib/session'
import TopicViewer from '@/components/vocabwise/TopicViewer'
import type { TopicData } from '@/components/vocabwise/TopicViewer'
import type { ExercisesData } from '@/components/vocabwise/types'

// ZWSP (U+200B)=0 · ZWNJ (U+200C)=1 — invisible to readers, survives copy-paste
function embedWatermark(text: string, seed: string): string {
  const mark = seed.replace(/-/g, '').slice(0, 8).split('')
    .map(c => c.charCodeAt(0) % 2 === 0 ? '​' : '‌').join('')
  return text.replace(/(\. )/, `$1${mark}`)
}

async function loadTopic(topicId: string): Promise<TopicData | null> {
  if (!/^b[123]-t\d{2,3}$/.test(topicId)) return null

  const [topicRes, passagesRes, glossaryRes, exercisesRes] = await Promise.all([
    supabase
      .from('vw_topics')
      .select('topic_title, topic_number, combo, cefr_level, vw_themes!inner(theme_title)')
      .eq('topic_id', topicId)
      .single(),
    supabase
      .from('vw_passages')
      .select('para_index, text_en, text_vi, word_count')
      .eq('topic_id', topicId)
      .order('para_index'),
    supabase
      .from('vw_glossary')
      .select('item_order, word, ipa, pos, meaning_vi, example_en, example_vi, word_family, false_friend, receptive_productive, item_type')
      .eq('topic_id', topicId)
      .order('item_order'),
    supabase
      .from('vw_exercises')
      .select('ex_number, ex_type, ex_name, instruction, items, word_bank, answer_key')
      .eq('topic_id', topicId)
      .order('ex_number'),
  ])

  if (topicRes.error || !topicRes.data) return null

  const topic     = topicRes.data as any
  const passages  = passagesRes.data  ?? []
  const glossary  = glossaryRes.data  ?? []
  const exercises = exercisesRes.data ?? []

  // Reconstruct exercises & answer_key from flat DB rows
  const exercisesData: ExercisesData = { combo: topic.combo ?? 'B1' }
  const answerKey: Record<string, Record<string, string>> = {}
  for (const ex of exercises) {
    const exObj: any = { type: ex.ex_type, instruction: ex.instruction, items: ex.items }
    if (ex.ex_type === 'E1') {
      if (ex.word_bank) exObj.options = ex.word_bank
    } else if (ex.ex_type === 'E_CAT') {
      if (ex.word_bank) exObj.categories = ex.word_bank
    } else if (ex.word_bank) {
      exObj.word_bank = ex.word_bank
    }
    ;(exercisesData as any)[ex.ex_name] = exObj
    answerKey[`ex${ex.ex_number}`] = ex.answer_key
  }

  return {
    meta: {
      topic_title:  topic.topic_title,
      theme_title:  (topic.vw_themes as any)?.theme_title ?? '',
      cefr_level:   topic.cefr_level ?? '',
      topic_number: topic.topic_number,
    },
    passage: {
      word_count: passages[0]?.word_count ?? 0,
      paragraphs: passages.map((p: any) => ({ index: p.para_index, text_en: p.text_en, text_vi: p.text_vi })),
    },
    glossary: glossary.map((g: any) => ({
      id:                   g.item_order,
      type:                 g.item_type ?? 'word',
      word:                 g.word,
      ipa:                  g.ipa,
      pos:                  g.pos,
      collocation:          g.item_type === 'collocation' ? g.word : undefined,
      meaning_vi:           g.meaning_vi ?? '',
      example_en:           g.example_en ?? '',
      example_vi:           g.example_vi ?? '',
      word_family:          g.word_family,
      false_friend:         g.false_friend,
      receptive_productive: g.receptive_productive,
    })),
    exercises: exercisesData,
    answer_key: answerKey,
  }
}

export default async function TopicPage({ params }: { params: Promise<{ book: string; topicId: string }> }) {
  const { book, topicId } = await params
  const [data, session] = await Promise.all([loadTopic(topicId), getSession()])
  if (!data) notFound()

  // Embed per-family invisible watermark in passage paragraphs for leak tracing
  const familyId = session?.familyId ?? ''
  if (familyId && familyId !== 'superadmin') {
    data.passage.paragraphs = data.passage.paragraphs.map(p => ({
      ...p,
      text_en: embedWatermark(p.text_en, familyId),
    }))
  }

  return <TopicViewer data={data} book={book} topicId={topicId} />
}
