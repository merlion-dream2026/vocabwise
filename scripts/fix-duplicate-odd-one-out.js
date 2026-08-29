// One-off: regenerate duplicate ex6_odd (EOddOneOut) items found by the mechanical
// word-set-duplicate scan. For each duplicate pair, keeps the lower id and regenerates
// the higher id with a genuinely distinct word-set, drawn from the topic's own glossary.
// Validates mechanically before writing: word-set not a duplicate of any other item in
// the same exercise, answer is one of the 4 words.
// Usage: node scripts/fix-duplicate-odd-one-out.js [--dry-run]

const { createClient } = require('@supabase/supabase-js')
try { require('dotenv').config({ path: '.env.local' }) } catch {}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const GROQ_API_KEY = process.env.GROQ_API_KEY
const dryRun = process.argv.includes('--dry-run')
const DELAY_MS = 6000 // gpt-oss-120b's hidden reasoning tokens push real usage to ~700/call; Groq TPM cap is 8000/min

// topicId -> list of item ids to regenerate (the later half of each duplicate pair found by the scan)
const TARGETS = {
  'b2-t22': [8],
  'b2-t24': [8],
  'b3-t30': [10],
  'b3-t33': [4],
  'b3-t36': [9],
  'b3-t39': [9, 10],
  'b3-t01': [5, 9],
  'b2-t44': [8],
  'b2-t56': [8, 9],
  'b3-t04': [7],
  'b3-t07': [9],
  'b3-t13': [9],
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }
function wordKey(words) { return (words || []).slice().sort().join('|').toLowerCase() }

async function generateItem(glossaryWords, existingWordSets) {
  const prompt = `You are writing one "Odd One Out" vocabulary item for IELTS Academic English (Vietnamese learners).

Vocabulary pool for this topic (pick 4 words ONLY from this list):
${glossaryWords.join(', ')}

Pick exactly 4 words: 3 that share a clear category/theme, 1 that is the "odd one out". The word-set must be DIFFERENT (as a set, ignoring order) from every one of these already-used sets:
${existingWordSets.map(s => `- ${s}`).join('\n')}

Return ONLY this JSON, no extra text:
{"words": ["w1","w2","w3","w4"], "answer": "the odd one out word (must be one of the 4)", "reason": "1 sentence in English explaining the grouping logic", "reason_vi": "same explanation in Vietnamese"}`

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800, temperature: 0.8,
      response_format: { type: 'json_object' },
    }),
  })
  if (res.status === 429) throw new Error('RATE_LIMIT')
  if (!res.ok) throw new Error(`HTTP_${res.status}`)
  const d = await res.json()
  return JSON.parse(d.choices?.[0]?.message?.content ?? '{}')
}

function validate(item, existingWordSets) {
  if (!Array.isArray(item.words) || item.words.length !== 4) return 'words must be array of 4'
  if (!item.answer || !item.words.includes(item.answer)) return 'answer not in words'
  if (!item.reason || !item.reason_vi) return 'missing reason/reason_vi'
  const key = wordKey(item.words)
  if (existingWordSets.includes(key)) return 'still duplicates an existing set'
  return null
}

async function fixTopic(topicId, targetIds) {
  const [{ data: glossary }, { data: exRow }] = await Promise.all([
    supabase.from('vw_glossary').select('word').eq('topic_id', topicId).eq('item_type', 'word'),
    supabase.from('vw_exercises').select('items').eq('topic_id', topicId).eq('ex_name', 'ex6_odd').single(),
  ])
  const glossaryWords = (glossary ?? []).map(g => g.word)
  const items = exRow.items
  let changed = false

  for (const id of targetIds) {
    const existingWordSets = items.filter(it => it.id !== id).map(it => wordKey(it.words))
    console.log(`  item ${id}: generating...`)
    let item = null, err = null
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const candidate = await generateItem(glossaryWords, existingWordSets)
        err = validate(candidate, existingWordSets)
        if (!err) { item = candidate; break }
        console.log(`    attempt ${attempt + 1} rejected: ${err}`)
      } catch (e) {
        err = e.message
        if (err === 'RATE_LIMIT') { console.log('    rate limited — waiting 30s...'); await sleep(30000); continue }
      }
      await sleep(DELAY_MS)
    }
    if (!item) { console.log(`  item ${id}: ✗ FAILED after 3 attempts (${err})`); continue }

    const idx = items.findIndex(it => it.id === id)
    items[idx] = { id, words: item.words, answer: item.answer, reason: item.reason, reason_vi: item.reason_vi }
    changed = true
    console.log(`  item ${id}: ✓ ${JSON.stringify(item.words)} -> ${item.answer}`)
    await sleep(DELAY_MS)
  }

  if (changed && !dryRun) {
    const { error } = await supabase.from('vw_exercises').update({ items }).eq('topic_id', topicId).eq('ex_name', 'ex6_odd')
    if (error) console.log(`  DB write ✗ ${error.message}`)
    else console.log(`  DB write ✓`)
  }
}

async function main() {
  const topics = Object.entries(TARGETS)
  console.log(`Topics to fix: ${topics.length}, total items: ${topics.reduce((n, [, ids]) => n + ids.length, 0)}`)
  if (dryRun) console.log('(dry-run — will generate+validate but not write)\n')

  for (const [topicId, ids] of topics) {
    console.log(`\n${topicId} (items: ${ids.join(', ')})`)
    await fixTopic(topicId, ids)
  }
}

main().catch(console.error)
