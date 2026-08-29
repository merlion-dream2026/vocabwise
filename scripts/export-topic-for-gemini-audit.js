// One-off: export full topic content (passage + glossary + exercises + answer_key)
// to a single Markdown file per topic, for a Gemini Pro audit-quality trial vs the
// proven GPT Plus export→audit pattern (see feedback_export_audit_import_workflow memory).
// Usage: node scripts/export-topic-for-gemini-audit.js b1-t01 b2-t01 b3-t01

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

try { require('dotenv').config({ path: '.env.local' }) } catch {}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const OUT_DIR = path.join(__dirname, '..', 'exports', 'gemini-audit-trial')

async function exportTopic(topicId) {
  const [topicRes, passagesRes, glossaryRes, exercisesRes] = await Promise.all([
    supabase.from('vw_topics').select('topic_title, cefr_level, combo, vw_themes!inner(theme_title)').eq('topic_id', topicId).single(),
    supabase.from('vw_passages').select('para_index, text_en, text_vi, word_count').eq('topic_id', topicId).order('para_index'),
    supabase.from('vw_glossary').select('*').eq('topic_id', topicId).order('item_order'),
    supabase.from('vw_exercises').select('*').eq('topic_id', topicId).order('ex_number'),
  ])

  const topic = topicRes.data
  const lines = []
  lines.push(`# TOPIC ${topicId} — ${topic.topic_title} (${topic.vw_themes.theme_title}, CEFR ${topic.cefr_level})`)
  lines.push('')

  lines.push('## PASSAGE')
  for (const p of passagesRes.data ?? []) {
    lines.push(`[para ${p.para_index}] EN: ${p.text_en}`)
    lines.push(`[para ${p.para_index}] VI: ${p.text_vi}`)
  }
  lines.push('')

  lines.push('## GLOSSARY')
  for (const g of glossaryRes.data ?? []) {
    lines.push(`[item ${g.item_order}] word=${g.word} | pos=${g.pos} | meaning_vi=${g.meaning_vi} | example_en=${g.example_en} | example_vi=${g.example_vi}`)
    if (g.word_family) lines.push(`  word_family: ${JSON.stringify(g.word_family)}`)
    if (g.false_friend) lines.push(`  false_friend: ${JSON.stringify(g.false_friend)}`)
    if (g.explanation_vi) lines.push(`  explanation_vi: ${g.explanation_vi}`)
  }
  lines.push('')

  lines.push('## EXERCISES')
  for (const ex of exercisesRes.data ?? []) {
    lines.push(`### ${ex.ex_name} (${ex.ex_type}) — instruction: ${ex.instruction}`)
    lines.push(`items: ${JSON.stringify(ex.items)}`)
    if (ex.word_bank) lines.push(`word_bank: ${JSON.stringify(ex.word_bank)}`)
    lines.push(`answer_key: ${JSON.stringify(ex.answer_key)}`)
    lines.push('')
  }

  fs.mkdirSync(OUT_DIR, { recursive: true })
  const outPath = path.join(OUT_DIR, `${topicId}.md`)
  fs.writeFileSync(outPath, lines.join('\n'))
  console.log(`${topicId} -> ${outPath} (${lines.join('\n').length} chars)`)
}

;(async () => {
  const topicIds = process.argv.slice(2)
  for (const id of topicIds) await exportTopic(id)
})()
