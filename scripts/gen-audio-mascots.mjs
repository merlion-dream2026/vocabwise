// Generate ElevenLabs narration for the onboarding mascots → public/audio/mascots/{file}-{vi|en}.mp3
// Lines come from docs/mascots/onboarding-voice-script.md (keep both in sync).
// Usage: node --env-file=../axanh-global-english/.env.local scripts/gen-audio-mascots.mjs [--only rocky-hello,…] [--dry]
// data/mascot-audio.json records sha1(text + voice + settings) per file; re-running only regenerates changed lines.
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const VOICES = {
  rocky: { en: 'bIHbv24MWmeRgasZH58o', vi: 'M0rVwr32hdQ5UXpkI3ni', stability: 0.5 }, // Will · Hao — v3 "Natural"
  bubi: { en: 'FGY2WhTYpPnrIDTdsKH5', vi: 'qByVAGjXwGlkcRDJoiHg', stability: 0 },    // Laura · Kiều Linh — v3 "Creative"
}
const MODEL = 'eleven_v3'
const AUDIO_DIR = 'public/audio/mascots/'
const MANIFEST = 'data/mascot-audio.json'

const choose = { vi: 'Bạn muốn học gì trước nào? Chọn một phần nhé, đổi lúc nào cũng được!', en: 'What would you like to learn first? Pick one. You can change it anytime!' }
const ready = {
  daily: { vi: 'Sẵn sàng rồi! Bắt đầu với Flashcard, chơi ít nhất ba trò mỗi chủ đề để nhận cúp, và nhớ ôn từ cũ mỗi ngày nhé!', en: "You're all set! Start with Flashcards, play at least three games per topic to win a trophy, and review your old words every day!" },
  academic: { vi: 'Sẵn sàng rồi! Đọc bài, học từ mới, rồi làm bài tập. Đạt tám mươi phần trăm là chủ đề được đánh dấu thành thạo đó!', en: "You're all set! Read the passage, learn the key words, then do the exercises. Score eighty percent to master the topic!" },
  phonics: { vi: 'Sẵn sàng rồi! Học từng âm IPA, luyện nói với AI để được chấm điểm ngay, xong bài này là mở khóa bài tiếp theo!', en: "You're all set! Learn each IPA sound, practice speaking with AI for instant scores, and finish a lesson to unlock the next one!" },
}
const READY_TAG = { rocky: 'proudly', bubi: 'excited' }

const LINES = [
  { file: 'rocky-hello', who: 'rocky', tag: 'warmly', vi: 'Xin chào! Mình là Rocky, chú voi xanh nè!', en: "Hi there! I'm Rocky, the little blue elephant!" },
  { file: 'bubi-hello', who: 'bubi', tag: 'excited', vi: 'Còn mình là Bubi, cá heo xanh đây! Chào mừng bạn đến với VocabWise!', en: "And I'm Bubi, the blue dolphin! Welcome to VocabWise!" },
  { file: 'rocky-features', who: 'rocky', vi: 'Ở đây bạn được luyện phát âm IPA, học từ vựng mỗi ngày, học từ vựng IELTS và SAT, và còn luyện nói cùng AI nữa đó!', en: 'Here you can practice IPA sounds, learn new words every day, build IELTS and SAT vocabulary, and even practice speaking with AI!' },
  { file: 'bubi-next', who: 'bubi', tag: 'cheerfully', vi: 'Chỉ mất ba mươi giây thôi. Bấm Tiếp theo nha!', en: 'It only takes thirty seconds. Tap Next to start!' },
  ...['rocky', 'bubi'].map((who) => ({ file: `${who}-choose`, who, ...choose })),
  ...['rocky', 'bubi'].flatMap((who) => Object.entries(ready).map(([part, t]) => ({ file: `${who}-ready-${part}`, who, tag: READY_TAG[who], ...t }))),
  { file: 'rocky-pick', who: 'rocky', vi: 'Chọn mình đi! Rocky sẽ học cùng bạn mỗi ngày!', en: "Pick me! I'm Rocky, and I'll learn with you every day!" },
  { file: 'bubi-pick', who: 'bubi', vi: 'Chọn mình nha! Có Bubi, học vui hơn nhiều đó!', en: "Pick me! I'm Bubi, and I'll make learning super fun!" },
]

const args = process.argv.slice(2)
const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null
const dry = args.includes('--dry')
const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {}
mkdirSync(AUDIO_DIR, { recursive: true })

let made = 0, skipped = 0, failed = 0, chars = 0
for (const line of LINES) {
  if (only && !only.includes(line.file)) continue
  for (const lang of ['vi', 'en']) {
    const { stability, [lang]: voice } = VOICES[line.who]
    const text = (line.tag ? `[${line.tag}] ` : '') + line[lang]
    const file = `${line.file}-${lang}.mp3`
    const hash = createHash('sha1').update(text + voice + MODEL + stability).digest('hex')
    if (manifest[file]?.hash === hash && existsSync(AUDIO_DIR + file)) { skipped++; continue }
    if (dry) { console.log(`would generate ${file} (${text.length} chars)`); chars += text.length; continue }

    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_64`, {
      method: 'POST',
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ text, model_id: MODEL, voice_settings: { stability } }),
    })
    if (!res.ok) { console.error(`✗ ${file}: ElevenLabs ${res.status} ${await res.text()}`); failed++; continue }
    writeFileSync(AUDIO_DIR + file, Buffer.from(await res.arrayBuffer()))
    manifest[file] = { voice, hash }
    writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')
    made++; chars += text.length
    console.log(`✓ ${file}`)
  }
}
console.log(`${dry ? 'would generate' : `generated ${made}`} (~${chars} credits), already current ${skipped}${failed ? `, failed ${failed}` : ''}`)
