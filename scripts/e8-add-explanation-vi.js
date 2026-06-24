// ═══════════════════════════════════════════════════════════════
// E8 Error Fix — Add explanation_vi to all items missing it
// Usage: node scripts/e8-add-explanation-vi.js
// Requires env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY
// ═══════════════════════════════════════════════════════════════

const { createClient } = require('@supabase/supabase-js')
const OpenAI = require('openai')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Use Groq llama-3.1-8b-instant (separate daily token pool from 70B model)
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
})

async function translateBatch(explanations) {
  // Number the inputs so the model returns numbered outputs — easier to parse than JSON
  const numbered = explanations.map((e, i) => `${i + 1}. ${e}`).join('\n')

  const response = await openai.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages: [{
      role: 'system',
      content: 'You are a Vietnamese translator. Translate English grammar/vocabulary exercise explanations to Vietnamese. Keep English grammar terms in English (noun, adjective, verb, singular, plural, past tense, past participle, present simple, third person singular, compound adjective, collocation, passive, etc.). Be concise. Output numbered lines only — no extra text.',
    }, {
      role: 'user',
      content: `Translate each numbered explanation to Vietnamese. Output ONLY numbered lines in the same order. Example format:\n1. Bản dịch một.\n2. Bản dịch hai.\n\nExplanations:\n${numbered}`,
    }],
    temperature: 0.1,
    max_tokens: 4000,
  })

  const content = response.choices[0].message.content.trim()

  // Parse numbered lines: "1. text\n2. text\n..."
  const results = []
  for (let i = 1; i <= explanations.length; i++) {
    const regex = new RegExp(`^${i}\\. (.+)$`, 'm')
    const match = content.match(regex)
    if (!match) throw new Error(`Missing line ${i} in response:\n${content.slice(0, 300)}`)
    results.push(match[1].trim())
  }
  return results
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.GROQ_API_KEY) {
    console.error('Missing env vars. Run with dotenv or source .env.local first.')
    process.exit(1)
  }

  console.log('Fetching all E8 exercises...')
  const { data: exercises, error } = await supabase
    .from('vw_exercises')
    .select('topic_id, items')
    .eq('ex_name', 'ex5_error_fix')
    .order('topic_id')

  if (error) throw error
  console.log(`Loaded ${exercises.length} topics`)

  // Collect items missing explanation_vi
  const toTranslate = []
  for (const ex of exercises) {
    for (const item of ex.items) {
      if (!item.explanation_vi && item.explanation) {
        toTranslate.push({ topic_id: ex.topic_id, id: item.id, explanation: item.explanation })
      }
    }
  }

  if (toTranslate.length === 0) {
    console.log('All items already have explanation_vi. Nothing to do.')
    return
  }

  console.log(`Found ${toTranslate.length} items to translate\n`)

  // Translate + save to DB per batch (auto-checkpoint: restart skips already-done items)
  const BATCH_SIZE = 20
  let totalSaved = 0

  for (let i = 0; i < toTranslate.length; i += BATCH_SIZE) {
    const batch = toTranslate.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const total = Math.ceil(toTranslate.length / BATCH_SIZE)
    process.stdout.write(`Batch ${batchNum}/${total} — translate... `)

    let translated
    let retries = 0
    while (retries < 3) {
      try {
        translated = await translateBatch(batch.map(b => b.explanation))
        if (translated.length !== batch.length) throw new Error(`Expected ${batch.length}, got ${translated.length}`)
        break
      } catch (e) {
        retries++
        if (retries === 3) throw e
        process.stdout.write(`\n  Retry ${retries}/3: ${e.message.slice(0, 80)}... `)
        await new Promise(r => setTimeout(r, 2000 * retries))
      }
    }

    // Group batch by topic_id and update DB immediately
    const topicsInBatch = [...new Set(batch.map(b => b.topic_id))]
    for (const topic_id of topicsInBatch) {
      const ex = exercises.find(e => e.topic_id === topic_id)
      const updatedItems = ex.items.map(item => {
        const batchIdx = batch.findIndex(b => b.topic_id === topic_id && b.id === item.id)
        return batchIdx !== -1 ? { ...item, explanation_vi: translated[batchIdx] } : item
      })
      const { error: updateErr } = await supabase
        .from('vw_exercises')
        .update({ items: updatedItems })
        .eq('topic_id', topic_id)
        .eq('ex_name', 'ex5_error_fix')
      if (updateErr) console.error(`\n  ✗ ${topic_id}: ${updateErr.message}`)
      else {
        // Update local cache so subsequent batches in same topic see fresh data
        ex.items = updatedItems
      }
    }

    totalSaved += batch.length
    console.log(`saved (${totalSaved}/${toTranslate.length} total)`)

    if (i + BATCH_SIZE < toTranslate.length) await new Promise(r => setTimeout(r, 200))
  }

  console.log(`\n✅ Done! ${totalSaved} explanations added.`)
}

main().catch(err => { console.error(err); process.exit(1) })
