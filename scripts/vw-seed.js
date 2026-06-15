// ═══════════════════════════════════════════════════════════════
// VocabWise Academic — JSON → Supabase Seed Script
// Usage: node scripts/vw-seed.js --book 1 --file data/vocabwise/book1/b1-t01.json
//    or: node scripts/vw-seed.js --book 1 --dir  data/vocabwise/book1/
// Requires: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env
// ═══════════════════════════════════════════════════════════════

const fs   = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const args   = process.argv.slice(2)
const getArg = (flag) => { const i = args.indexOf(flag); return i > -1 ? args[i + 1] : null }
const bookId     = parseInt(getArg('--book') || '1')
const singleFile = getArg('--file')
const dir        = getArg('--dir')

// Map JSON exercise keys → ex_number
const EX_KEY_MAP = {
  ex1_matching:    1, ex1_tfng: 1, ex1_odd_one_out: 1,
  ex2_mcq_context: 2,
  ex3_gap_fill:    3,
  ex4_word_forms:  4, ex4_reordering: 4,
  ex5_error_fix:   5, ex5_collocation: 5,
}

async function upsertTheme(bookId, themeNumber, themeTitle, themeTitleVi) {
  const { data, error } = await supabase
    .from('vw_themes')
    .upsert({ book_id: bookId, theme_number: themeNumber, theme_title: themeTitle, theme_title_vi: themeTitleVi || null },
             { onConflict: 'book_id,theme_number' })
    .select('id')
    .single()
  if (error) { console.error('Theme error:', error.message); return null }
  return data.id
}

async function seedTopic(filePath) {
  const raw  = fs.readFileSync(filePath, 'utf8')
  const data = JSON.parse(raw)
  const { meta, passage, glossary, exercises, answer_key } = data
  const topicId = meta.topic_id

  console.log(`\nSeeding ${topicId} — ${meta.topic_title}...`)

  // 1. Upsert theme
  const themeId = await upsertTheme(meta.book, meta.theme_number, meta.theme_title, meta.theme_title_vi)
  if (!themeId) return

  // 2. Upsert topic
  const { error: topicErr } = await supabase
    .from('vw_topics')
    .upsert({
      topic_id:       topicId,
      book_id:        meta.book,
      theme_id:       themeId,
      topic_number:   meta.topic_number,
      topic_title:    meta.topic_title,
      topic_title_vi: meta.topic_title_vi || null,
      emoji:          meta.emoji || null,
      cefr_level:     meta.cefr_level || null,
      status:         meta.status,
      combo:          meta.combo,
    }, { onConflict: 'topic_id' })
  if (topicErr) { console.error('Topic error:', topicErr.message); return }

  // 3. Upsert passages
  for (const para of passage.paragraphs) {
    const { error } = await supabase
      .from('vw_passages')
      .upsert({
        topic_id:   topicId,
        word_count: passage.word_count,
        para_index: para.index,
        text_en:    para.text_en,
        text_vi:    para.text_vi,
      }, { onConflict: 'topic_id,para_index' })
    if (error) console.error(`  Passage P${para.index} error:`, error.message)
  }
  console.log(`  ✅ Passages (${passage.paragraphs.length} paragraphs)`)

  // 4. Upsert glossary
  for (const item of glossary) {
    const { error } = await supabase
      .from('vw_glossary')
      .upsert({
        topic_id:             topicId,
        item_order:           item.id,
        word:                 item.word || item.collocation,
        ipa:                  item.ipa || null,
        pos:                  item.pos || (item.type === 'collocation' ? 'collocation' : null),
        meaning_vi:           item.meaning_vi,
        meaning_vi_inline:    item.meaning_vi_inline || item.meaning_vi,
        example_en:           item.example_en,
        example_vi:           item.example_vi,
        word_family:          item.word_family || null,
        false_friend:         item.false_friend || null,
        receptive_productive: item.receptive_productive || null,
        item_type:            item.type || 'word',
      }, { onConflict: 'topic_id,item_order' })
    if (error) console.error(`  Glossary item ${item.id} error:`, error.message)
  }
  console.log(`  ✅ Glossary (${glossary.length} items)`)

  // 5. Upsert exercises
  let exCount = 0
  for (const [key, exNum] of Object.entries(EX_KEY_MAP)) {
    if (!exercises[key]) continue
    const ex = exercises[key]
    const { error } = await supabase
      .from('vw_exercises')
      .upsert({
        topic_id:   topicId,
        ex_number:  exNum,
        ex_type:    ex.type,
        ex_name:    key,
        instruction: ex.instruction,
        items:      ex.items,
        word_bank:  ex.word_bank || ex.options || null,
        answer_key: answer_key[`ex${exNum}`],
      }, { onConflict: 'topic_id,ex_number' })
    if (error) console.error(`  Exercise ${exNum} (${key}) error:`, error.message)
    else exCount++
  }
  console.log(`  ✅ Exercises (${exCount})`)
  console.log(`  ✓ ${topicId} done`)
}

async function main() {
  if (singleFile) {
    await seedTopic(singleFile)
  } else if (dir) {
    const files = fs.readdirSync(dir)
      .filter(f => f.endsWith('.json') && f.startsWith(`b${bookId}`))
      .sort()
    console.log(`Found ${files.length} files in ${dir}`)
    for (const file of files) {
      await seedTopic(path.join(dir, file))
    }
  } else {
    console.error('Usage: node scripts/vw-seed.js --book 1 --file path/to/file.json')
    console.error('   or: node scripts/vw-seed.js --book 1 --dir  path/to/dir/')
    process.exit(1)
  }
  console.log('\n✅ Seed complete')
}

main().catch(console.error)
