import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'
import { getSession } from '@/lib/auth'
import { checkDailyCap } from '@/lib/rateLimit'
import {
  HONEYPOT_TOPICS, blockFamily, isFamilyBlocked,
  detectSequential, getAgeCap, detectImpossibleTravel,
} from '@/lib/security'

async function hasActivePlan(familyId: string): Promise<boolean> {
  const { data } = await supabase
    .from('families')
    .select('plan, free_trial_expires_at, plan_end_date, bonus_pro_expires_at')
    .eq('id', familyId)
    .single()
  if (!data) return false
  const now = new Date()
  if (data.bonus_pro_expires_at && new Date(data.bonus_pro_expires_at) > now) return true
  if (data.plan === 'free') return data.free_trial_expires_at ? new Date(data.free_trial_expires_at) > now : false
  return data.plan_end_date ? new Date(data.plan_end_date) > now : false
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const topicId  = params.id
  const familyId = session.familyId
  const isAdmin  = familyId === 'superadmin'

  // E: Honeypot — these IDs never appear in the UI; only scrapers hit them
  if (!isAdmin && HONEYPOT_TOPICS.has(topicId)) {
    console.error(`[SECURITY] Honeypot triggered: family=${familyId} topic=${topicId}`)
    blockFamily(familyId).catch(() => {})
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (!/^b[123]-t\d{2,3}$/.test(topicId)) {
    return NextResponse.json({ error: 'Invalid topic ID' }, { status: 400 })
  }

  if (!isAdmin) {
    // E cont.: block families flagged by honeypot or previous violations
    if (await isFamilyBlocked(familyId)) {
      return NextResponse.json({ error: 'Account suspended.' }, { status: 403 })
    }

    if (!(await hasActivePlan(familyId))) {
      return NextResponse.json({ error: 'Subscription required' }, { status: 403 })
    }

    // C: tighter cap for accounts < 24h old
    const cap = await getAgeCap(familyId)
    if (!(await checkDailyCap(familyId, cap))) {
      return NextResponse.json({ error: 'Daily request limit reached. Try again tomorrow.' }, { status: 429 })
    }

    // B: sequential topic scraping
    if (detectSequential(familyId, topicId)) {
      console.warn(`[SECURITY] Sequential scraping: family=${familyId} topic=${topicId}`)
      return NextResponse.json({ error: 'Too many sequential requests. Please slow down.' }, { status: 429 })
    }

    // F: impossible travel (log only — VPNs are common, don't hard-block)
    const ip        = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const cfCountry = req.headers.get('cf-ipcountry') ?? undefined
    const travel    = await detectImpossibleTravel(familyId, ip, cfCountry)
    if (travel) {
      console.warn(`[SECURITY] Impossible travel: family=${familyId} ip=${ip} country=${cfCountry}`)
    }
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
  }, { headers: { 'Cache-Control': 'private, max-age=300, stale-while-revalidate=3600' } })
}
