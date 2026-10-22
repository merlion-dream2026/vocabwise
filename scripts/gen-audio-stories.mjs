// Generate ElevenLabs narration for Daily Mini Stories → public/audio/stories/{level}.{NN}.{topicId}.mp3
// Usage: node --env-file=../axanh-global-english/.env.local scripts/gen-audio-stories.mjs --levels scholar,master [--only topicId,…] [--dry]
// Each level has a male + female voice: odd topic numbers = male, even = female.
// data/story-audio.json records sha1(text + voice) per file; a file is skipped while its hash is current,
// so re-running only regenerates stories whose text or voice changed (or that have no audio yet).
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const VOICES = {
  scholar: { male: 'TX3LPaxmHKxFdv7VOQHJ', female: 'cgSgspJ2msm6clMCkdW9' }, // Liam · Jessica (US)
  master: { male: 'Sq93GQT4X1lKDXsQcixO', female: 'ZF6FPAbjXT4488VcRRnw' },  // Felix · Amelia (UK)
}
const MODEL = 'eleven_multilingual_v2'
const AUDIO_DIR = 'public/audio/stories/'
const MANIFEST = 'data/story-audio.json'

const args = process.argv.slice(2)
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1].split(',') : null }
const levels = opt('--levels') ?? Object.keys(VOICES)
const only = opt('--only')
const dry = args.includes('--dry')

const words = JSON.parse(readFileSync('data/words.json', 'utf8'))
const stories = JSON.parse(readFileSync('data/stories.json', 'utf8'))
const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {}

let made = 0, skipped = 0, chars = 0
for (const level of levels) {
  if (!VOICES[level]) throw new Error(`no voices configured for level ${level}`)
  for (const [i, topic] of words[level].topics.entries()) {
    if (only && !only.includes(topic.id)) continue
    const story = stories[`${level}.${topic.id}`]
    if (!story) continue
    const num = i + 1
    const voice = VOICES[level][num % 2 ? 'male' : 'female']
    const text = story.en.replace(/\*\*/g, '')
    const file = `${level}.${String(num).padStart(2, '0')}.${topic.id}.mp3`
    const hash = createHash('sha1').update(text + voice).digest('hex')
    if (manifest[file]?.hash === hash && existsSync(AUDIO_DIR + file)) { skipped++; continue }
    if (dry) { console.log(`would generate ${file} (${text.length} chars)`); chars += text.length; continue }

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_64`, {
      method: 'POST',
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ text, model_id: MODEL }),
    })
    if (!res.ok) { console.error(`✗ ${file}: ElevenLabs ${res.status} ${await res.text()}`); continue }
    writeFileSync(AUDIO_DIR + file, Buffer.from(await res.arrayBuffer()))
    manifest[file] = { voice, hash }
    writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')
    made++; chars += text.length
    console.log(`✓ ${file}`)
  }
}
console.log(`${dry ? 'would generate' : 'generated'} ${dry ? '' : made + ' '}(~${chars} credits), already current ${skipped}`)
