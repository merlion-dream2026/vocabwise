'use strict'
// Generate ElevenLabs TTS audio for VocabWise Academic reading passages
//
// Usage:
//   node scripts/gen-audio-academic.js book3           → all topics in book3
//   node scripts/gen-audio-academic.js book3 t01       → single topic
//   node scripts/gen-audio-academic.js book3 t01 t10   → topics t01–t10
//   node scripts/gen-audio-academic.js all             → all 3 books
//   Add --dry-run to preview char counts without generating
//
// Output: public/audio/academic/[topic-id].mp3
// Requires: ELEVENLABS_API_KEY in .env.local

const fs   = require('fs')
const path = require('path')

// ── Config ────────────────────────────────────────────────────────────────────
const VOICE_ID  = process.env.ELEVENLABS_VOICE_ID || 'onwK4e9ZLuTAKqWW03F9' // Daniel (British, clear)
const MODEL_ID  = 'eleven_turbo_v2_5'
const AUDIO_DIR = path.join(__dirname, '../public/audio/academic')
const DATA_DIR  = path.join(__dirname, '../data/vocabwise')
const DELAY_MS  = 500  // cooldown between API calls

// ── Helpers ───────────────────────────────────────────────────────────────────
function stripMd(text) {
  return text.replace(/\*\*(.+?)\*\*/g, '$1')
}

function buildPassageText(json) {
  return json.passage.paragraphs
    .map(p => stripMd(p.text_en))
    .join('\n\n')
}

function topicPrefix(book) {
  return book === 'book1' ? 'b1-' : book === 'book2' ? 'b2-' : 'b3-'
}

function getTopicFiles(book, from, to) {
  const dir = path.join(DATA_DIR, book)
  if (!fs.existsSync(dir)) throw new Error(`Data dir not found: ${dir}`)

  const prefix = topicPrefix(book)
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json') && f.startsWith(prefix))
    .sort()
    .filter(f => {
      if (from === null) return true
      const num = parseInt(f.replace(prefix + 't', '').replace('.json', ''))
      return num >= from && num <= to
    })
    .map(f => path.join(dir, f))
}

async function callElevenLabs(text, apiKey) {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`ElevenLabs ${res.status}: ${err}`)
  }

  return Buffer.from(await res.arrayBuffer())
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  // Load .env.local
  const envFile = path.join(__dirname, '../.env.local')
  if (fs.existsSync(envFile)) {
    fs.readFileSync(envFile, 'utf8').split('\n').forEach(line => {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '')
    })
  }

  const args    = process.argv.slice(2)
  const dryRun  = args.includes('--dry-run')
  const cleaned = args.filter(a => a !== '--dry-run')

  const bookArg = cleaned[0]
  const fromArg = cleaned[1] ? parseInt(cleaned[1].replace('t', '')) : null
  const toArg   = cleaned[2] ? parseInt(cleaned[2].replace('t', '')) : fromArg

  if (!bookArg) {
    console.log('Usage: node scripts/gen-audio-academic.js <book1|book2|book3|all> [t01] [t10] [--dry-run]')
    process.exit(1)
  }

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey && !dryRun) {
    console.error('❌ ELEVENLABS_API_KEY not set in .env.local')
    process.exit(1)
  }

  if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true })

  const books = bookArg === 'all' ? ['book1', 'book2', 'book3'] : [bookArg]

  let totalChars = 0
  let generated  = 0
  let skipped    = 0
  let errors     = 0

  for (const book of books) {
    const files = getTopicFiles(book, fromArg, toArg)
    if (files.length === 0) {
      console.log(`⚠️  No JSON files found for ${book}${fromArg ? ` t${String(fromArg).padStart(2,'0')}–t${String(toArg).padStart(2,'0')}` : ''}`)
      continue
    }

    console.log(`\n📚 ${book} — ${files.length} topic(s)`)

    for (const file of files) {
      const json    = JSON.parse(fs.readFileSync(file, 'utf8'))
      const topicId = json.meta.topic_id
      const outPath = path.join(AUDIO_DIR, `${topicId}.mp3`)
      const text    = buildPassageText(json)
      const chars   = text.length

      if (fs.existsSync(outPath)) {
        const kb = (fs.statSync(outPath).size / 1024).toFixed(0)
        console.log(`  ⏭  ${topicId}  skipped (${kb} KB exists)`)
        skipped++
        continue
      }

      totalChars += chars

      if (dryRun) {
        console.log(`  📋 ${topicId}  ${chars.toLocaleString()} chars`)
        continue
      }

      process.stdout.write(`  ⏳ ${topicId}  ${chars.toLocaleString()} chars  → `)

      try {
        const audio = await callElevenLabs(text, apiKey)
        fs.writeFileSync(outPath, audio)
        console.log(`✅ ${(audio.length / 1024).toFixed(0)} KB`)
        generated++
        await sleep(DELAY_MS)
      } catch (err) {
        console.log(`❌ ${err.message}`)
        errors++
      }
    }
  }

  console.log('\n' + '─'.repeat(50))
  if (dryRun) {
    console.log(`📊 Dry run: ${totalChars.toLocaleString()} chars to generate across ${books.join(', ')}`)
  } else {
    console.log(`✅ Done: ${generated} generated · ${skipped} skipped · ${errors} errors`)
    if (totalChars > 0) console.log(`   ~${totalChars.toLocaleString()} chars used`)
  }
}

main().catch(err => { console.error(err.message); process.exit(1) })
