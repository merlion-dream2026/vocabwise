import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const topicId = params.id
  if (!/^b[123]-t\d{2,3}$/.test(topicId)) {
    return NextResponse.json({ error: 'Invalid topic ID' }, { status: 400 })
  }

  const [topicRes, exercisesRes] = await Promise.all([
    supabase
      .from('vw_topics')
      .select('topic_title, topic_title_vi, topic_number, cefr_level, combo')
      .eq('topic_id', topicId)
      .single(),
    supabase
      .from('vw_exercises')
      .select('ex_number, ex_type, ex_name, instruction, items, word_bank, answer_key')
      .eq('topic_id', topicId)
      .order('ex_number'),
  ])

  if (topicRes.error || !topicRes.data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const topic  = topicRes.data as any
  const exRows = exercisesRes.data ?? []

  // Build exercises object (same shape as TopicViewer)
  const exercisesData: Record<string, unknown> = { combo: topic.combo ?? 'B1' }
  const answerKey: Record<string, Record<string, string>> = {}
  for (const ex of exRows) {
    const exObj: Record<string, unknown> = { type: ex.ex_type, instruction: ex.instruction, items: ex.items }
    if (ex.ex_type === 'E1') {
      if (ex.word_bank) exObj.options = ex.word_bank
    } else if (ex.ex_type === 'E_CAT') {
      if (ex.word_bank) exObj.categories = ex.word_bank
    } else if (ex.word_bank) {
      exObj.word_bank = ex.word_bank
    }
    exercisesData[ex.ex_name] = exObj
    answerKey[`ex${ex.ex_number}`] = ex.answer_key
  }

  // ex_types for mastery scoring — ex1–ex5 only (matches getExerciseTypes in TopicViewer)
  const exTypes: string[] = []
  for (let n = 1; n <= 5; n++) {
    const row = exRows.find(ex => ex.ex_number === n)
    if (row) exTypes.push(row.ex_type)
  }

  return NextResponse.json({
    topicTitle:  topic.topic_title_vi ?? topic.topic_title,
    cefrLevel:   topic.cefr_level ?? '',
    topicNumber: topic.topic_number,
    exercises:   exercisesData,
    answerKey,
    exTypes,
  })
}
