/**
 * Phase A: Re-curate emoji for Seeker + Starter levels
 * Goal: maximize unique emoji per word within each level
 * Run: node scripts/patch-emojis.js
 */
const fs = require('fs')
const path = require('path')

const DATA_PATH = path.join(__dirname, '..', 'data', 'words.json')
const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'))

// Patches keyed by level → word (match all topics containing that word)
// Verified: new emoji NOT already in the target level's emoji set
const PATCHES = {
  seeker: [
    // Colors conflict: 🔴 red|lychee, 🟢 green|pea, 🟫 brown|floor
    { word: 'lychee',    emoji: '🌺' }, // tropical fruit
    { word: 'pea',       emoji: '🫛' }, // pea pod
    { word: 'floor',     emoji: '🪵' }, // wood plank
    // Family/adjectives: 👴 grandpa|old
    { word: 'old',       emoji: '🕰️' }, // old clock
    // Feelings/greetings: 😊 happy|nice
    { word: 'nice',      emoji: '😃' }, // bright smile
    // Feelings: 😴 tired|sleep
    { word: 'tired',     emoji: '🥱' }, // yawning
    // Body: 👍 good|thumb, 👁️ eye|eyelash, 🦶 foot|toe|kick, 🦵 leg|knee
    { word: 'thumb',     emoji: '🖐️' }, // open hand
    { word: 'eyelash',   emoji: '🎀' }, // decorative beauty
    { word: 'toe',       emoji: '👣' }, // footprints show toes
    { word: 'kick',      emoji: '🤸' }, // active movement
    { word: 'knee',      emoji: '🧎' }, // kneeling person
    // Farm: 🐴 horse|stable, 🌿 garden|feed|grass|bush, 🌾 hay|field
    { word: 'stable',    emoji: '🛖' }, // simple shelter
    { word: 'garden',    emoji: '🌻' }, // sunflower in garden
    { word: 'feed',      emoji: '🥜' }, // nuts/pellets = animal feed
    { word: 'bush',      emoji: '🪴' }, // potted plant/shrub
    { word: 'field',     emoji: '🌄' }, // countryside landscape
    { word: 'crop',      emoji: '🍠' }, // sweet potato = harvest crop
    // Pets: 🐸 frog|skip
    { word: 'skip',      emoji: '🪢' }, // jump rope
    // Food: 🥛 milk|glass, 🎂 birthday|cake, 🌽 corn|crop
    { word: 'glass',     emoji: '🥃' }, // drinking glass
    { word: 'cake',      emoji: '🍰' }, // cake slice (birthday keeps 🎂)
    // Clothes/transport: 👕 shirt|wear, 🚗 car|driver, 🚲 bike|cycling
    { word: 'wear',      emoji: '👘' }, // kimono/wearing clothes
    { word: 'driver',    emoji: '🛞' }, // steering wheel
    { word: 'cycling',   emoji: '🚴' }, // cyclist
    // Classroom: 📖 book|study, ✏️ pencil|draw
    { word: 'study',     emoji: '📓' }, // notebook = studying
    { word: 'draw',      emoji: '🖌️' }, // paintbrush
    // Household: 🛏️ bed|pillow, 🧱 wall|block, 🍳 kitchen|cook|pan, 🚿 bathroom|wash
    { word: 'pillow',    emoji: '🌜' }, // crescent moon = bedtime
    { word: 'block',     emoji: '🎲' }, // dice/cube shape
    { word: 'kitchen',   emoji: '🥘' }, // paella pot = kitchen
    { word: 'cook',      emoji: '🔥' }, // fire = cooking heat
    { word: 'wash',      emoji: '🫧' }, // soap bubbles
    // Weather: 💦 wet|splash, 🌤️ warm|sky
    { word: 'wet',       emoji: '🌂' }, // umbrella = wet weather
    { word: 'warm',      emoji: '🌞' }, // sun with face = warmth
    // Fruits/taste: 🍋 lemon|sour
    { word: 'sour',      emoji: '😝' }, // tongue face = sour expression
    // Animals/adjectives: 🐘 elephant|big, 🦒 giraffe|tall, 🐍 snake|eel|long, 🐢 turtle|short
    { word: 'big',       emoji: '🦣' }, // mammoth = massive/huge
    { word: 'tall',      emoji: '🗼' }, // Eiffel Tower = tall
    { word: 'eel',       emoji: '🪱' }, // worm-like body
    { word: 'long',      emoji: '📏' }, // ruler = length
    { word: 'short',     emoji: '🤏' }, // pinching = small/short
    // Toys/games: ⚽ ball|football, 🧸 teddy|soft, 🏷️ sticker|name
    { word: 'ball',      emoji: '🎱' }, // billiard ball = generic ball
    { word: 'soft',      emoji: '🪶' }, // feather = soft
    { word: 'name',      emoji: '📛' }, // name badge
    // Actions: 🏃 run|come|running|chase, 🚶 walk|go, 🍽️ eat|plate, 🎮 play|game
    { word: 'running',   emoji: '🏅' }, // race medal = running sport
    { word: 'come',      emoji: '↩️' }, // return arrow = come back
    { word: 'chase',     emoji: '🎯' }, // targeting = chasing
    { word: 'go',        emoji: '➡️' }, // arrow = going forward
    { word: 'eat',       emoji: '🥢' }, // chopsticks = eating
    { word: 'play',      emoji: '🎪' }, // circus = fun play
    // Jobs: 🎤 sing|singer
    { word: 'singer',    emoji: '🎙️' }, // studio mic = performer
    // Sports: 🏊 swim|swimming
    { word: 'swimming',  emoji: '🩱' }, // swimsuit = swimming sport
    // Greetings: 👋 hello|bye, 🙏 please|thank, 🎉 welcome|party
    { word: 'bye',       emoji: '✌️' }, // peace/bye sign
    { word: 'thank',     emoji: '🤗' }, // hugging = thankful
    { word: 'welcome',   emoji: '🫶' }, // heart hands = warm welcome
    // Celebrations: 🎁 give|gift, ✨ new|clean, 🎊 parade|celebrate
    { word: 'give',      emoji: '🫱' }, // extending hand = giving
    { word: 'new',       emoji: '🆕' }, // NEW sign
    // Adjectives: 🪨 rock|hard
    { word: 'hard',      emoji: '💎' }, // diamond = hardest
    // Nature: 🌳 tree|park, 🏖️ sand|sandbox
    { word: 'park',      emoji: '🏕️' }, // camping/outdoor park
    { word: 'sandbox',   emoji: '🏗️' }, // construction play
    // Tech: 📺 TV|remote, 📱 phone|tablet
    { word: 'remote',    emoji: '🎛️' }, // control knobs
    { word: 'tablet',    emoji: '📲' }, // mobile with arrow
    // Celebrations: 🎊 parade|celebrate
    { word: 'parade',    emoji: '🎺' }, // trumpet = parade music
  ],

  starter: [
    // Kitchen/cooking
    { word: 'kitchen',   emoji: '🥘' }, // 🍳→kitchen|fry
    { word: 'wash',      emoji: '🚰' }, // 🚿→bathroom|wash
    { word: 'garden',    emoji: '🌻' }, // 🌸→garden|flower
    { word: 'seahorse',  emoji: '🐠' }, // 🐴→horse|seahorse
    { word: 'peel',      emoji: '✂️' }, // 🍌→banana|peel
    { word: 'bake',      emoji: '🥐' }, // 🎂→cake|bake|birthday + 🍞→bread|bake
    { word: 'cake',      emoji: '🍰' }, // 🎂→birthday|cake
    { word: 'ball',      emoji: '🎱' }, // ⚽→ball|football
    { word: 'draw',      emoji: '🖍️' }, // ✏️→draw|pencil
    { word: 'music',     emoji: '🎼' }, // 🎵→sing|music|concert
    { word: 'concert',   emoji: '🪕' }, // 🎵→sing|music|concert
    { word: 'melody',    emoji: '🪗' }, // 🎶→song|melody
    { word: 'swimming',  emoji: '🏄' }, // 🏊→swim|swimming|lake
    { word: 'lake',      emoji: '🚣' }, // 🏊→swim|swimming|lake
    { word: 'kick',      emoji: '🤸' }, // 🦵→leg|kick
    { word: 'library',   emoji: '🗂️' }, // 📚→book|library
    { word: 'eraser',    emoji: '🧽' }, // 🧹→eraser|tidy
    { word: 'size',      emoji: '📐' }, // 📏→ruler|size
    { word: 'trainers',  emoji: '🧦' }, // 👟→shoes|trainers
    { word: 'tired',     emoji: '🥱' }, // 😴→tired|nap
    { word: 'surprise',  emoji: '🎊' }, // 😲→surprised|surprise
    { word: 'happy',     emoji: '😁' }, // 😄→funny|happy
    { word: 'sunshine',  emoji: '🌞' }, // ☀️→sun|sunshine
    { word: 'warm',      emoji: '🍵' }, // 🌡️→hot|warm
    { word: 'driver',    emoji: '🛞' }, // 🚌→bus|driver
    { word: 'airport',   emoji: '🛫' }, // ✈️→plane|airport|pilot
    { word: 'pilot',     emoji: '🧑‍✈️' }, // ✈️→plane|airport|pilot
    { word: 'short',     emoji: '🤏' }, // 🐢→turtle|short
    { word: 'tide',      emoji: '🌕' }, // 🌊→wave|tide|waterfall
    { word: 'waterfall', emoji: '⛲' }, // 🌊→wave|tide|waterfall
    { word: 'clam',      emoji: '🦪' }, // 🐚→seashell|clam
    { word: 'weekend',   emoji: '😎' }, // 🏖️→beach|weekend|sand
    { word: 'sand',      emoji: '⏳' }, // 🏖️→beach|weekend|sand
    { word: 'early',     emoji: '🌄' }, // 🌅→morning|early
    { word: 'sky',       emoji: '🔭' }, // 🌤️→afternoon|sky
    { word: 'late',      emoji: '🕰️' }, // 🌙→night|late|enchant|bedtime
    { word: 'enchant',   emoji: '🔮' }, // 🌙→night|late|enchant|bedtime (crystal ball)
    { word: 'bedtime',   emoji: '🛌' }, // 🌙→night|late|enchant|bedtime
    { word: 'month',     emoji: '🗒️' }, // 📆→today|month
    { word: 'year',      emoji: '🔄' }, // 📅→week|year
    { word: 'holiday',   emoji: '🩴' }, // 🎉→holiday|party
    { word: 'hour',      emoji: '⌚' }, // ⏰→hour|wake up
    { word: 'artist',    emoji: '🖼️' }, // 🎨→art|artist
    { word: 'perform',   emoji: '🎪' }, // 🌟→perform|wish
    { word: 'calf',      emoji: '🐮' }, // 🐄→cow|calf
    { word: 'hen',       emoji: '🍗' }, // 🐓→hen|rooster
    { word: 'mule',      emoji: '🐎' }, // 🫏→donkey|mule
    { word: 'grass',     emoji: '🌾' }, // 🌱→grass|seed
    { word: 'park',      emoji: '🏕️' }, // 🌳→tree|park
    { word: 'hill',      emoji: '🗻' }, // ⛰️→mountain|hill
    { word: 'hard',      emoji: '🔩' }, // 🪨→rock|hard|stone
    { word: 'stone',     emoji: '🗿' }, // 🪨→rock|hard|stone
    { word: 'round',     emoji: '🌍' }, // ⭕→circle|round
    { word: 'starfish',  emoji: '🌠' }, // ⭐→star|starfish
    { word: 'dinner',    emoji: '🍛' }, // 🍽️→restaurant|dinner|serve
    { word: 'serve',     emoji: '🤵' }, // 🍽️→restaurant|dinner|serve
    { word: 'cook',      emoji: '🍲' }, // 👨‍🍳→cook|chef (verb form)
    { word: 'slice',     emoji: '🍕' }, // 🔪→cut|slice
    { word: 'steam',     emoji: '🌥️' }, // ♨️→boil|steam
    { word: 'mix',       emoji: '🔀' }, // 🥄→stir|mix
    { word: 'grill',     emoji: '🥩' }, // 🔥→heat|grill
    { word: 'clean',     emoji: '🪣' }, // ✨→magic|clean
    { word: 'queue',     emoji: '👥' }, // 🚶→walk|queue
    { word: 'big',       emoji: '🦣' }, // 🐘→elephant|big
  ],
}

// Apply patches to data
let totalPatched = 0
let errors = []

for (const [level, patches] of Object.entries(PATCHES)) {
  const levelData = data[level]
  if (!levelData) { errors.push(`Level ${level} not found`); continue }

  for (const patch of patches) {
    let matched = 0
    for (const topic of levelData.topics) {
      for (const word of topic.words) {
        if (word.word === patch.word) {
          word.emoji = patch.emoji
          matched++
          totalPatched++
        }
      }
    }
    if (matched === 0) {
      errors.push(`[${level}] Word not found: "${patch.word}"`)
    }
  }
}

// Validate: check for new conflicts within each level
console.log('\n=== VALIDATION ===')
let totalConflicts = 0
for (const [level, levelData] of Object.entries(data)) {
  if (!['seeker', 'starter'].includes(level)) continue
  const emojiMap = {}
  for (const topic of levelData.topics) {
    for (const word of topic.words) {
      if (!emojiMap[word.emoji]) emojiMap[word.emoji] = []
      emojiMap[word.emoji].push(`${topic.id}/${word.word}`)
    }
  }
  const conflicts = Object.entries(emojiMap).filter(([e, words]) => {
    const uniqueWords = [...new Set(words.map(w => w.split('/')[1]))]
    return uniqueWords.length > 1
  })
  const uniqueTotal = Object.values(emojiMap).filter(ws => {
    return [...new Set(ws.map(w => w.split('/')[1]))].length === 1
  }).length
  console.log(`\n${level.toUpperCase()}: ${conflicts.length} conflicts remain | unique emoji: ${uniqueTotal}/${Object.keys(emojiMap).length}`)
  if (conflicts.length > 0 && conflicts.length <= 15) {
    conflicts.forEach(([e, words]) => {
      const unique = [...new Set(words.map(w => w.split('/')[1]))]
      console.log(`  ${e} → ${unique.join(', ')}`)
    })
  } else if (conflicts.length > 15) {
    console.log(`  (showing first 10)`)
    conflicts.slice(0, 10).forEach(([e, words]) => {
      const unique = [...new Set(words.map(w => w.split('/')[1]))]
      console.log(`  ${e} → ${unique.join(', ')}`)
    })
  }
  totalConflicts += conflicts.length
}

if (errors.length > 0) {
  console.log('\n=== ERRORS ===')
  errors.forEach(e => console.log(' ', e))
}

console.log(`\n=== SUMMARY ===`)
console.log(`Patched: ${totalPatched} words`)
console.log(`Remaining conflicts: ${totalConflicts}`)
console.log(`Errors: ${errors.length}`)

// Save if no critical errors
if (errors.filter(e => !e.includes('not found')).length === 0) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2))
  console.log('\n✓ Saved to data/words.json')
} else {
  console.log('\n✗ Not saved due to errors')
}
