// Resumable full-Academic content audit via Gemini Flash (free tier — low RPD, so this
// is designed to run in daily batches and pick up where it left off, not all 180 topics
// in one go). Exports each topic fresh from DB (passage+glossary+exercises), sends it to
// Gemini with a strict mechanical-defects-only prompt, saves the raw findings for review.
//
// This produces AUDIT FINDINGS ONLY — it does not write anything back to vw_glossary/
// vw_exercises. Findings must be spot-checked against the DB before acting on them (see
// feedback_export_audit_import_workflow memory — Gemini, like GPT, produces false
// positives that need mechanical/manual verification, e.g. schema conventions it wasn't
// told about).
//
// Usage:
//   node scripts/gemini-audit-pipeline.js            → audit next batch of un-audited topics
//   node scripts/gemini-audit-pipeline.js --limit 5  → cap this run to 5 topics
//   node scripts/gemini-audit-pipeline.js --status   → show progress, no API calls

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
try { require('dotenv').config({ path: '.env.local' }) } catch {}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const MODEL = 'gemini-3.5-flash' // pinned — do not use a -latest alias (see project_ai_provider_stack memory)
const OUT_DIR = path.join(__dirname, '..', 'exports', 'gemini-audit-trial')
const STATE_PATH = path.join(OUT_DIR, 'STATE.json')
const PROMPT = fs.readFileSync(path.join(OUT_DIR, 'PROMPT.md'), 'utf8')

const args = process.argv.slice(2)
const limitArg = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1], 10) : Infinity
const statusOnly = args.includes('--status')

function loadState() {
  if (!fs.existsSync(STATE_PATH)) return { audited: {} }
  return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'))
}
function saveState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2))
}

async function exportTopicText(topicId) {
  const [topicRes, passagesRes, glossaryRes, exercisesRes] = await Promise.all([
    supabase.from('vw_topics').select('topic_title, cefr_level, vw_themes!inner(theme_title)').eq('topic_id', topicId).single(),
    supabase.from('vw_passages').select('para_index, text_en, text_vi').eq('topic_id', topicId).order('para_index'),
    supabase.from('vw_glossary').select('*').eq('topic_id', topicId).order('item_order'),
    supabase.from('vw_exercises').select('*').eq('topic_id', topicId).order('ex_number'),
  ])
  const topic = topicRes.data
  const lines = [`# TOPIC ${topicId} — ${topic.topic_title} (${topic.vw_themes.theme_title}, CEFR ${topic.cefr_level})`, '', '## PASSAGE']
  for (const p of passagesRes.data ?? []) { lines.push(`[para ${p.para_index}] EN: ${p.text_en}`); lines.push(`[para ${p.para_index}] VI: ${p.text_vi}`) }
  lines.push('', '## GLOSSARY')
  for (const g of glossaryRes.data ?? []) {
    lines.push(`[item ${g.item_order}] word=${g.word} | pos=${g.pos} | meaning_vi=${g.meaning_vi} | example_en=${g.example_en} | example_vi=${g.example_vi}`)
    if (g.word_family) lines.push(`  word_family: ${JSON.stringify(g.word_family)}`)
    if (g.false_friend) lines.push(`  false_friend: ${JSON.stringify(g.false_friend)}`)
    if (g.explanation_vi) lines.push(`  explanation_vi: ${g.explanation_vi}`)
  }
  lines.push('', '## EXERCISES')
  for (const ex of exercisesRes.data ?? []) {
    lines.push(`### ${ex.ex_name} (${ex.ex_type}) — instruction: ${ex.instruction}`)
    lines.push(`items: ${JSON.stringify(ex.items)}`)
    if (ex.word_bank) lines.push(`word_bank: ${JSON.stringify(ex.word_bank)}`)
    lines.push(`answer_key: ${JSON.stringify(ex.answer_key)}`, '')
  }
  return lines.join('\n')
}

async function auditTopic(topicId) {
  const data = await exportTopicText(topicId)
  const fullPrompt = PROMPT + '\n\n---\n\n' + data
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 8000 } }),
  })
  if (res.status === 429) throw new Error('RATE_LIMIT')
  if (!res.ok) throw new Error(`HTTP_${res.status}: ${await res.text()}`)
  const d = await res.json()
  const cand = d.candidates?.[0]
  if (cand?.finishReason === 'MAX_TOKENS') throw new Error('TRUNCATED — raise maxOutputTokens')
  return cand?.content?.parts?.map(p => p.text).join('') ?? ''
}

async function main() {
  const { data: allTopics } = await supabase.from('vw_topics').select('topic_id').order('topic_id')
  const state = loadState()
  const pending = allTopics.map(t => t.topic_id).filter(id => !state.audited[id])

  if (statusOnly) {
    console.log(`Audited: ${Object.keys(state.audited).length}/${allTopics.length}`)
    console.log(`Pending: ${pending.length}`)
    return
  }

  console.log(`${Object.keys(state.audited).length}/${allTopics.length} already audited. ${pending.length} pending.\n`)
  let done = 0
  for (const topicId of pending) {
    if (done >= limitArg) break
    process.stdout.write(`${topicId} `.padEnd(12))
    try {
      const findings = await auditTopic(topicId)
      fs.writeFileSync(path.join(OUT_DIR, `${topicId}.result.md`), findings)
      const hasIssues = !findings.includes('NO ISSUES FOUND')
      state.audited[topicId] = { date: new Date().toISOString().slice(0, 10), hasIssues }
      saveState(state)
      console.log(hasIssues ? '⚠ issues found' : '✓ clean')
      done++
    } catch (e) {
      if (e.message === 'RATE_LIMIT') {
        console.log('\n⏸ Rate limited — stopping for today. Run again later/tomorrow to resume.')
        break
      }
      console.log(`✗ ${e.message}`)
    }
  }
  console.log(`\nThis run: ${done} topics audited. Total progress: ${Object.keys(state.audited).length}/${allTopics.length}.`)
  const flagged = Object.entries(state.audited).filter(([, v]) => v.hasIssues).map(([id]) => id)
  if (flagged.length) console.log(`Topics with findings so far: ${flagged.join(', ')}`)
}

main().catch(console.error)
