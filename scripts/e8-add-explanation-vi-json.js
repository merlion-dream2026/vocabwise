// ═══════════════════════════════════════════════════════════════
// E8 Error Fix — Add explanation_vi to items missing it, writing to
// local JSON (source of truth), NOT directly to Supabase.
// (scripts/e8-add-explanation-vi.js writes straight to the DB, which
// silently gets wiped the next time vw-seed.js reseeds from JSON —
// that drift is why topic b1-t05 lost its explanation_vi in prod.)
// Usage: node scripts/e8-add-explanation-vi-json.js [--dry-run]
// Requires env: CEREBRAS_API_KEY
// ═══════════════════════════════════════════════════════════════

const fs = require('fs')
const path = require('path')
const OpenAI = require('openai')

const DRY_RUN = process.argv.includes('--dry-run')
const DATA_DIR = path.join(__dirname, '..', 'data', 'vocabwise')

const openai = new OpenAI({
  apiKey: process.env.CEREBRAS_API_KEY,
  baseURL: 'https://api.cerebras.ai/v1',
})

async function translateBatch(explanations) {
  const numbered = explanations.map((e, i) => `${i + 1}. ${e}`).join('\n')
  const response = await openai.chat.completions.create({
    model: 'gpt-oss-120b',
    messages: [{
      role: 'system',
      content: `You are a Vietnamese translator for an English-learning app. Translate English grammar/vocabulary exercise explanations to natural, fully Vietnamese prose for Vietnamese students.

RULE 1 — do NOT translate single-quoted English words/phrases: these explanations frequently contrast two English words in single quotes (e.g. 'has' vs 'have', 'busy' vs 'busily', 'late' vs 'lately'). Leave every single-quoted English word or phrase EXACTLY as-is, verbatim, in English — never translate it. The pedagogical point is contrasting the English forms; translating a quoted word into Vietnamese destroys the explanation and can make it self-contradictory.

RULE 2 — the ONLY other English allowed is this closed whitelist of grammar/part-of-speech terminology: noun, verb, adjective, adverb, singular, plural, past tense, past participle, present simple, present continuous, present perfect, third person singular, compound adjective, collocation, passive, subject, object, infinitive, gerund, article, determiner, possessive, modifier, noun phrase, verb phrase. Nothing outside RULE 1 and this whitelist may stay in English.

RULE 3 — HARD REQUIREMENT: translate every other word into natural Vietnamese, with ZERO exceptions, even for advanced/academic vocabulary. This includes descriptive nouns, adjectives, and whole phrases that describe meaning — e.g. "occupational exhaustion" → "sự kiệt sức trong công việc", "a strong desire or ambition" → "một mong muốn hoặc tham vọng mạnh mẽ", "a calling or profession" → "một thiên chức hoặc nghề nghiệp", "moral sense of right and wrong" → "ý thức đạo đức về đúng sai". Do NOT leave a content word in English just because it is abstract, academic, or hard to translate — find the closest natural Vietnamese equivalent. Before finalizing each line, re-check it for any leftover English word that is not single-quoted (Rule 1) and not on the Rule 2 whitelist — if found, translate it.

Examples:
EN: With 'she' (third-person singular), the verb must be 'has', not 'have'.
VI (correct): Với chủ ngữ 'she' (ngôi thứ ba số ít), động từ phải là 'has', không phải 'have'.
VI (WRONG): Với 'cô ấy', động từ phải là 'có', không phải 'có'.

EN: 'Compulsory' means required by law — the opposite of optional.
VI (correct): 'Compulsory' nghĩa là bắt buộc theo luật — trái nghĩa với tùy chọn.
VI (WRONG — leaves meaning content untranslated): 'Compulsory' có nghĩa là required by law — ngược lại với optional.

EN: 'Aspiration' means a strong desire or ambition to achieve something specific; 'vocation' implies a calling or profession rather than a goal like becoming a CEO.
VI (correct): 'Aspiration' nghĩa là một mong muốn hoặc tham vọng mạnh mẽ để đạt được điều gì đó cụ thể; 'vocation' ngụ ý một thiên chức hoặc nghề nghiệp hơn là một mục tiêu như trở thành CEO.
VI (WRONG — leaves content words in English): 'Aspiration' nghĩa là một strong desire hoặc ambition để đạt được một điều cụ thể; 'vocation' ngụ ý một calling hoặc profession hơn là một goal như trở thành CEO.

Be concise. Output numbered lines only — no extra text.`,
    }, {
      role: 'user',
      content: `Translate each numbered explanation to Vietnamese, following the critical rule about not translating single-quoted English words. Output ONLY numbered lines in the same order. Example format:\n1. Bản dịch một.\n2. Bản dịch hai.\n\nExplanations:\n${numbered}`,
    }],
    temperature: 0.1,
    max_tokens: 6000,
  })

  if (!response.choices?.[0]?.message?.content) {
    throw new Error(`Bad API response (no content): ${JSON.stringify(response).slice(0, 300)}`)
  }
  const content = response.choices[0].message.content.trim()
  const results = []
  for (let i = 1; i <= explanations.length; i++) {
    const regex = new RegExp(`^${i}\\. (.+)$`, 'm')
    const match = content.match(regex)
    if (!match) throw new Error(`Missing line ${i} in response:\n${content.slice(0, 300)}`)
    results.push(match[1].trim())
  }
  return results
}

function loadFiles(bookFilter) {
  const files = []
  const books = bookFilter ? [`book${bookFilter}`] : ['book1', 'book2', 'book3']
  for (const book of books) {
    const dir = path.join(DATA_DIR, book)
    if (!fs.existsSync(dir)) continue
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort()) {
      files.push(path.join(dir, f))
    }
  }
  return files
}

async function main() {
  if (!process.env.CEREBRAS_API_KEY) {
    console.error('Missing CEREBRAS_API_KEY. Run with env sourced (e.g. `set -a && source .env.local && set +a`).')
    process.exit(1)
  }

  const limitArg = process.argv.indexOf('--limit')
  const LIMIT = limitArg > -1 ? parseInt(process.argv[limitArg + 1]) : null
  const bookArg = process.argv.indexOf('--book')
  const BOOK = bookArg > -1 ? process.argv[bookArg + 1] : null

  const files = loadFiles(BOOK)
  console.log(`Scanning ${files.length} topic files...`)

  // Collect all items missing explanation_vi, across all files
  const toTranslate = [] // { file, itemRef, explanation }
  const parsed = new Map() // file -> parsed JSON (mutated in place)

  for (const file of files) {
    const raw = fs.readFileSync(file, 'utf-8')
    const data = JSON.parse(raw)
    parsed.set(file, data)
    const ex = data.exercises?.ex5_error_fix
    if (!ex?.items) continue
    for (const item of ex.items) {
      if (item.explanation && !item.explanation_vi) {
        toTranslate.push({ file, id: item.id, item })
      }
    }
  }

  if (LIMIT) toTranslate.length = Math.min(toTranslate.length, LIMIT)

  if (toTranslate.length === 0) {
    console.log('All E8 items already have explanation_vi. Nothing to do.')
    return
  }
  console.log(`Found ${toTranslate.length} items to translate\n`)

  const BATCH_SIZE = 10
  const logLines = []
  let totalSaved = 0

  for (let i = 0; i < toTranslate.length; i += BATCH_SIZE) {
    const batch = toTranslate.slice(i, i + BATCH_SIZE)
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const total = Math.ceil(toTranslate.length / BATCH_SIZE)
    process.stdout.write(`Batch ${batchNum}/${total} — translate... `)

    let translated
    let retries = 0
    const MAX_RETRIES = 5
    while (retries < MAX_RETRIES) {
      try {
        translated = await translateBatch(batch.map(b => b.item.explanation))
        if (translated.length !== batch.length) throw new Error(`Expected ${batch.length}, got ${translated.length}`)
        break
      } catch (e) {
        retries++
        if (retries === MAX_RETRIES) throw e
        process.stdout.write(`\n  Retry ${retries}/${MAX_RETRIES}: ${e.message.slice(0, 120)}... `)
        await new Promise(r => setTimeout(r, 5000 * retries))
      }
    }

    batch.forEach((b, idx) => {
      b.item.explanation_vi = translated[idx]
      logLines.push(`[${path.basename(b.file)} #${b.id}]\nEN: ${b.item.explanation}\nVI: ${translated[idx]}\n`)
    })

    totalSaved += batch.length
    console.log(`done (${totalSaved}/${toTranslate.length} total)`)

    if (i + BATCH_SIZE < toTranslate.length) await new Promise(r => setTimeout(r, 1000))
  }

  // Validation: every item that was supposed to get explanation_vi actually has it,
  // and nothing else on the item was touched (same explanation, same answer/options).
  for (const { file, id, item } of toTranslate) {
    if (!item.explanation_vi || typeof item.explanation_vi !== 'string' || !item.explanation_vi.trim()) {
      throw new Error(`Validation failed: ${file} item ${id} has no valid explanation_vi after translation`)
    }
  }

  const logPath = path.join(__dirname, '..', 'e8-explanation-vi-translations.log')
  fs.writeFileSync(logPath, logLines.join('\n'))
  console.log(`\nWrote review log: ${logPath}`)

  if (DRY_RUN) {
    console.log('\n--dry-run: not writing JSON files.')
    return
  }

  // All-or-nothing per file: write back only files that were touched
  const touchedFiles = new Set(toTranslate.map(t => t.file))
  for (const file of touchedFiles) {
    const data = parsed.get(file)
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', 'utf-8')
  }
  console.log(`\n✅ Done! ${totalSaved} explanations added across ${touchedFiles.size} files.`)
  console.log('Next: reseed each touched book with `node scripts/vw-seed.js --book N --dir data/vocabwise/bookN/`')
}

main().catch(err => { console.error(err); process.exit(1) })
