import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseServer'
import { getSession } from '@/lib/auth'
import { checkDailyCap } from '@/lib/rateLimit'
import {
  HONEYPOT_TOPICS, blockFamily,
  getFamilyProfile, detectSequential,
  checkImpossibleTravel, updateRequestMetadata,
} from '@/lib/security'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const topicId  = params.id
  const familyId = session.familyId
  const isAdmin  = familyId === 'superadmin'

  // E: Honeypot — never shown in UI; only scrapers request these IDs
  if (!isAdmin && HONEYPOT_TOPICS.has(topicId)) {
    console.error(`[SECURITY] Honeypot: family=${familyId} topic=${topicId}`)
    blockFamily(familyId).catch(() => {})
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (!/^b[123]-t\d{2,3}$/.test(topicId)) {
    return NextResponse.json({ error: 'Invalid topic ID' }, { status: 400 })
  }

  if (!isAdmin) {
    // Single DB query (Redis-cached 5 min) — replaces 4 separate queries
    const profile = await getFamilyProfile(familyId)
    if (!profile) return NextResponse.json({ error: 'Account not found' }, { status: 404 })

    // E: blocked check
    if (profile.is_blocked) {
      return NextResponse.json({ error: 'Account suspended.' }, { status: 403 })
    }

    // Plan check (inline from profile — no extra query)
    const now    = new Date()
    const active =
      (profile.bonus_pro_expires_at && new Date(profile.bonus_pro_expires_at) > now) ||
      (profile.plan === 'free'
        ? (profile.free_trial_expires_at ? new Date(profile.free_trial_expires_at) > now : false)
        : (profile.plan_end_date ? new Date(profile.plan_end_date) > now : false))
    if (!active) {
      return NextResponse.json({ error: 'Subscription required' }, { status: 403 })
    }

    // C: new-account cap (from profile — no extra query)
    const ageHrs = (Date.now() - new Date(profile.created_at).getTime()) / 3_600_000
    const cap    = ageHrs < 24 ? 5 : 20
    if (!(await checkDailyCap(familyId, cap))) {
      return NextResponse.json({ error: 'Daily request limit reached. Try again tomorrow.' }, { status: 429 })
    }

    // B: sequential scraping
    if (detectSequential(familyId, topicId)) {
      console.warn(`[SECURITY] Sequential: family=${familyId} topic=${topicId}`)
      return NextResponse.json({ error: 'Too many sequential requests. Please slow down.' }, { status: 429 })
    }

    // F: impossible travel (uses cached profile — no extra query)
    const ip        = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const cfCountry = req.headers.get('cf-ipcountry') ?? undefined
    if (checkImpossibleTravel(profile, ip, cfCountry)) {
      console.warn(`[SECURITY] Impossible travel: family=${familyId} ip=${ip} country=${cfCountry}`)
      return NextResponse.json({ error: 'Access denied.' }, { status: 429 })
    }
    updateRequestMetadata(familyId, ip, cfCountry)
  }

  // Run both queries in parallel
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
