// Pull explanation_vi from Supabase vw_glossary back into local topic JSON files.
//
// explanation_vi is generated + saved DIRECTLY to Supabase by
// scripts/gen-glossary-explanations.js (never touches local JSON — the only field
// that flows DB←generation instead of JSON→DB like everything else via vw-seed.js).
// gen-docx.js only reads local JSON, so it can't print explanation_vi without this
// one-time (or re-run-as-needed) sync.
//
// Usage:
//   node scripts/pull-glossary-explanations.js --book 1
//   node scripts/pull-glossary-explanations.js --book 1 --dry-run

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
try { require('dotenv').config({ path: '.env.local' }) } catch {}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const ROOT = path.join(__dirname, '..')
const args = process.argv.slice(2)
const bookArg = args.includes('--book') ? args[args.indexOf('--book') + 1] : null
const dryRun  = args.includes('--dry-run')

if (!bookArg) { console.error('Usage: node scripts/pull-glossary-explanations.js --book <1|2|3> [--dry-run]'); process.exit(1) }

async function main() {
  const { data: rows, error } = await supabase
    .from('vw_glossary')
    .select('topic_id, item_order, explanation_vi')
    .like('topic_id', `b${bookArg}-%`)
    .eq('item_type', 'word')
    .not('explanation_vi', 'is', null)

  if (error) { console.error('DB error:', error.message); process.exit(1) }
  console.log(`Fetched ${rows.length} explanation_vi rows from Supabase for book${bookArg}`)

  const byTopic = new Map()
  for (const row of rows) {
    if (!byTopic.has(row.topic_id)) byTopic.set(row.topic_id, new Map())
    byTopic.get(row.topic_id).set(row.item_order, row.explanation_vi)
  }

  const dir = path.join(ROOT, 'data', 'vocabwise', `book${bookArg}`)
  const files = fs.readdirSync(dir).filter(f => /^b\d-t\d+\.json$/.test(f))
  let filesChanged = 0, itemsChanged = 0

  for (const f of files) {
    const topicId = path.basename(f, '.json')
    const explMap = byTopic.get(topicId)
    if (!explMap) continue

    const filePath = path.join(dir, f)
    const d = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    let changed = false
    for (const item of d.glossary || []) {
      const expl = explMap.get(item.id)
      if (expl && item.explanation_vi !== expl) {
        item.explanation_vi = expl
        changed = true
        itemsChanged++
      }
    }
    if (changed) {
      filesChanged++
      if (!dryRun) fs.writeFileSync(filePath, JSON.stringify(d, null, 2), 'utf-8')
    }
  }

  console.log(`${dryRun ? '[dry-run] Would update' : 'Updated'} ${itemsChanged} item(s) across ${filesChanged} topic file(s).`)
}

main()
