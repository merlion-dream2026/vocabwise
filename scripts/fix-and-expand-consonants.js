#!/usr/bin/env node
// Tasks:
// 1. Fix clusters lesson — replace 4 wrong words + fix spl-→spr- sound
// 2. Add clusters-pbl (pl-/bl-)
// 3. Add clusters-trdr (tr-/dr-)
// 4. Add final-voiced (-b/-d/-g) — to consonants-other, after final-stops
// 5. Add final-fricatives (-f/-v) — to consonants-other
// 6. Add final-l (-l/-n) — to viet-challenges
// 7. Add all knowledge entries
// Run: node scripts/fix-and-expand-consonants.js

const fs = require('fs')
const path = require('path')

const LEVELS_PATH = path.join(__dirname, '../data/phonicsLevels.json')
const KNOW_PATH   = path.join(__dirname, '../data/phonicsKnowledge.json')

// ── 1. Fix existing clusters lesson ──────────────────────────────────────────

function fixClustersLesson(levels) {
  const level = levels.find(l => l.id === 'consonants-other')
  const lesson = level.lessons.find(l => l.id === 'clusters')

  // Fix sound[1]: spl- → spr-
  lesson.sounds[1] = {
    symbol: 'spr-', keyword: 'spring', emoji: '🌱', vi: 'mùa xuân',
    wikiAudio: null, learnAudio: null
  }

  // Fix practice_words: replace idx 8-11 (find/best/think/hand) with real cluster words
  lesson.practice_words = [
    'street', 'spring',   // str / spr
    'strong', 'spread',   // str / spr
    'strike', 'spray',    // str / spr
    'stress', 'sprint',   // str / spr
    'stream', 'sprout',   // str / spr
    'straight', 'sprung', // str / spr
  ]

  // Update tip
  lesson.tip = 'Không chèn schwa: street ≠ /sə·triːt/ · spring ≠ /spə·rɪŋ/. Ba phụ âm liền nhau, không ngắt!'

  console.log('✅  Fixed clusters lesson: spl-→spr-, replaced 4 wrong words, updated tip')
}

// ── 2. New lesson: clusters-pbl (pl-/bl-) ────────────────────────────────────

const clustersPbl = {
  id: 'clusters-pbl',
  type: 'pair',
  title: 'Clusters: PL / BL',
  subtitle: 'Nhóm phụ âm đầu — lưỡi trượt thẳng, không có schwa!',
  emoji: '🔀',
  games: ['minimal-pairs', 'listen-pick', 'speak', 'sort-words', 'shadow'],
  masteryGames: ['minimal-pairs', 'listen-pick'],
  pairAudio: null,
  sounds: [
    { symbol: 'pl-', keyword: 'play', emoji: '▶️', vi: 'chơi', wikiAudio: null, learnAudio: null },
    { symbol: 'bl-', keyword: 'black', emoji: '⬛', vi: 'đen', wikiAudio: null, learnAudio: null }
  ],
  practice_words: [
    'play',  'black',   // pl / bl
    'plan',  'blue',    // pl / bl
    'plate', 'blood',   // pl / bl
    'plus',  'blow',    // pl / bl
    'plane', 'blank',   // pl / bl
    'place', 'blend',   // pl / bl
  ],
  tip: 'pl- vs bl- = chỉ khác voicing. Đặt tay lên cổ: bl- rung ngay từ đầu, pl- không rung.',
}

// ── 3. New lesson: clusters-trdr (tr-/dr-) ───────────────────────────────────

const clustersTrdr = {
  id: 'clusters-trdr',
  type: 'pair',
  title: 'Clusters: TR / DR',
  subtitle: 'Trong tiếng Anh nhanh: tr- nghe như /tʃr-/, dr- nghe như /dʒr-/!',
  emoji: '🌳',
  games: ['minimal-pairs', 'listen-pick', 'speak', 'sort-words', 'shadow'],
  masteryGames: ['minimal-pairs', 'listen-pick'],
  pairAudio: null,
  sounds: [
    { symbol: 'tr-', keyword: 'tree', emoji: '🌳', vi: 'cây', wikiAudio: null, learnAudio: null },
    { symbol: 'dr-', keyword: 'dream', emoji: '💭', vi: 'giấc mơ', wikiAudio: null, learnAudio: null }
  ],
  practice_words: [
    'tree',  'dream',  // tr / dr
    'train', 'drink',  // tr / dr
    'true',  'drive',  // tr / dr
    'trip',  'drop',   // tr / dr
    'track', 'draw',   // tr / dr
    'trust', 'dress',  // tr / dr
  ],
  tip: 'Native speaker: tree → /tʃriː/, dream → /dʒriːm/. Đây là đặc điểm thật của tiếng Anh tự nhiên!',
}

// ── 4. New lesson: final-voiced (-b/-d/-g) ───────────────────────────────────

const finalVoiced = {
  id: 'final-voiced',
  type: 'pair',
  title: 'Final Voiced: -B / -D / -G',
  subtitle: 'Phụ âm hữu thanh cuối từ — tiếng Việt không có!',
  emoji: '🔚',
  games: ['minimal-pairs', 'listen-pick', 'speak', 'shadow'],
  masteryGames: ['minimal-pairs', 'listen-pick'],
  pairAudio: null,
  sounds: [
    { symbol: '-b', keyword: 'cab', emoji: '🚕', vi: 'xe taxi', wikiAudio: null, learnAudio: null },
    { symbol: '-d', keyword: 'bed', emoji: '🛏️', vi: 'giường', wikiAudio: null, learnAudio: null },
    { symbol: '-g', keyword: 'bag', emoji: '👜', vi: 'túi xách', wikiAudio: null, learnAudio: null }
  ],
  // 3 sounds: cycle idx%3 → 0=b, 1=d, 2=g
  practice_words: [
    'cab', 'bed', 'bag',     // -b -d -g
    'club', 'bid', 'big',    // -b -d -g
    'rib', 'rod', 'dog',     // -b -d -g
    'tub', 'add', 'bug',     // -b -d -g
    'rob', 'head', 'leg',    // -b -d -g
  ],
  tip: 'Dấu hiệu nhận biết voiced final: VOWEL TRƯỚC NÓ DÀI HƠN. cap /kæp/ vs cab /kæːb/ — nguyên âm dài hơn trước -b!',
}

// ── 5. New lesson: final-fricatives (-f/-v) ──────────────────────────────────

const finalFricatives = {
  id: 'final-fricatives',
  type: 'pair',
  title: 'Final Fricatives: -F / -V',
  subtitle: 'Âm xát cuối từ — dễ bị nuốt mất nhất trong tiếng Anh!',
  emoji: '💨',
  games: ['minimal-pairs', 'listen-pick', 'speak', 'sort-words', 'shadow'],
  masteryGames: ['minimal-pairs', 'listen-pick'],
  pairAudio: null,
  sounds: [
    { symbol: '-f', keyword: 'beef', emoji: '🥩', vi: 'thịt bò', wikiAudio: null, learnAudio: null },
    { symbol: '-v', keyword: 'move', emoji: '🚚', vi: 'di chuyển', wikiAudio: null, learnAudio: null }
  ],
  practice_words: [
    'beef', 'move',   // -f -v
    'leaf', 'live',   // -f -v
    'half', 'have',   // -f -v
    'roof', 'love',   // -f -v
    'cliff', 'give',  // -f -v
    'loaf', 'prove',  // -f -v
  ],
  tip: 'Từ CHƯA XONGcho đến khi môi/răng tạo ra /f/ hoặc /v/ hoàn chỉnh. Kiểm tra: có luồng khí sau nguyên âm không?',
}

// ── 6. New lesson: final-l (-l/-n) in viet-challenges ────────────────────────

const finalL = {
  id: 'final-l',
  type: 'pair',
  title: 'Final -L vs -N',
  subtitle: 'Âm /l/ cuối từ — dễ bị nuốt hoặc nhầm với /n/!',
  emoji: '🔤',
  games: ['minimal-pairs', 'listen-pick', 'speak', 'sort-words', 'shadow'],
  masteryGames: ['minimal-pairs', 'listen-pick'],
  pairAudio: null,
  sounds: [
    { symbol: '-l', keyword: 'well', emoji: '✅', vi: 'tốt', wikiAudio: null, learnAudio: null },
    { symbol: '-n', keyword: 'when', emoji: '❓', vi: 'khi nào', wikiAudio: null, learnAudio: null }
  ],
  practice_words: [
    'well', 'when',  // -l -n
    'feel', 'fin',   // -l -n
    'tell', 'ten',   // -l -n
    'call', 'can',   // -l -n
    'fill', 'thin',  // -l -n
    'ball', 'ban',   // -l -n
    'fall', 'fan',   // -l -n
  ],
  tip: 'Final /l/ = Dark L — lưỡi chạm ngạc răng SAU nguyên âm. "feel" ≠ "fee". Lưỡi phải chạm, không bỏ!',
}

// ── 7. Knowledge entries ──────────────────────────────────────────────────────

const newKnowledge = {
  // Updated knowledge for clusters (now str-/spr-)
  'clusters': {
    how_to: [
      'Cluster = 2–3 phụ âm liền nhau ở đầu âm tiết, KHÔNG có nguyên âm ở giữa',
      'str-: /s/ → /t/ → /r/ liền nhau trong một hơi. street /striːt/ = 3 phụ âm trước nguyên âm',
      'spr-: /s/ → /p/ → /r/ liền nhau. spring /sprɪŋ/ — không phải /spə·rɪŋ/ hay /sə·prɪŋ/',
      'Luyện từng bước: s···tr···eet → s·tr·eet → street. Tốc độ tăng dần, không thêm nguyên âm giữa'
    ],
    vs_vietnamese: 'Tiếng Việt KHÔNG có initial clusters. Học sinh thường chèn schwa: "street" → /sə·triːt/ hoặc /stə·riːt/. Cần luyện tập đặc biệt để bỏ thói quen này.',
    mistakes: [
      'Chèn schwa: "strong" → /stəˈrɒŋ/ (sai) — phải là /strɒŋ/. Không có ə giữa str!',
      'Bỏ /r/: "street" → /stiːt/ (sai) — phải là /striːt/. Âm /r/ phải có mặt',
      'Bỏ /s/: "spray" → /preɪ/ (sai) — phải là /spreɪ/'
    ]
  },

  'clusters-pbl': {
    how_to: [
      'pl-: bắt đầu bằng /p/ (vô thanh, môi chạm nhau) → ngay lập tức trượt sang /l/. play /pleɪ/ — không có khoảng cách',
      'bl-: bắt đầu bằng /b/ (hữu thanh, môi chạm nhau) → ngay lập tức trượt sang /l/. black /blæk/',
      'Khác biệt pl- vs bl-: CHỈ là voicing. Đặt tay lên cổ: bl- rung ngay từ đầu, pl- không rung cho đến /l/',
      'Ngoài pl-/bl- còn có: fl- (fly, floor, flag) · gl- (glad, glass, globe) · cl- /kl-/ (class, clock, clean)'
    ],
    vs_vietnamese: 'Tiếng Việt không có pl- hay bl-. Học sinh chèn schwa: "play" → /pə·leɪ/, "blue" → /bə·luː/. Hoặc bỏ /l/ luôn: "plan" → /pæn/. Cả hai lỗi đều rất phổ biến.',
    spelling: [
      {
        pattern: 'pl- (vô thanh)',
        examples: ['play', 'plan', 'plate', 'plus', 'plane', 'place', 'plastic', 'planet', 'plug', 'plumber'],
        examples_ipa: ['/pleɪ/', '/plæn/', '/pleɪt/', '/plʌs/', '/pleɪn/', '/pleɪs/', '/ˈplæstɪk/', '/ˈplænɪt/', '/plʌɡ/', '/ˈplʌmə/']
      },
      {
        pattern: 'bl- (hữu thanh)',
        examples: ['black', 'blue', 'blood', 'blow', 'blank', 'blend', 'block', 'blade', 'blame', 'bloom'],
        examples_ipa: ['/blæk/', '/bluː/', '/blʌd/', '/bləʊ/', '/blæŋk/', '/blend/', '/blɒk/', '/bleɪd/', '/bleɪm/', '/bluːm/']
      }
    ],
    mistakes: [
      'Chèn schwa: "plan" → /pə·læn/ (sai) — phải là /plæn/, không có ə giữa!',
      'Bỏ /l/: "blue" → /buː/ (sai) — phải là /bluː/. Âm /l/ sau /b/ phải được tạo ra',
      'Nhầm vị trí lưỡi: /l/ trong pl-/bl- là Clear L — lưỡi chạm ngạc răng ngay sau phụ âm đầu'
    ]
  },

  'clusters-trdr': {
    how_to: [
      'tr-: lưỡi tạo /t/ ở ngạc răng → cuộn ngay sang /r/. Trong tiếng Anh tự nhiên: /tr-/ → /tʃr-/! tree → /tʃriː/',
      'dr-: tương tự nhưng hữu thanh. /dr-/ trong tiếng Anh tự nhiên → /dʒr-/! dream → /dʒriːm/',
      'Đây là đặc điểm THẬT của native English, không phải lỗi phát âm. Hãy nghe kỹ: train /tʃreɪn/, drink /dʒrɪŋk/',
      'Ngoài tr-/dr- còn có: fr- (free, from, friend) · gr- /ɡr-/ (great, green, grow) · cr- /kr-/ (cry, cream, cross)'
    ],
    vs_vietnamese: 'Tiếng Việt dùng /tr-/ khác: miền Nam đọc như /tʃ/, miền Bắc như /ch/ riêng. Âm /tr-/ tiếng Anh hoàn toàn khác — phải học lại từ đầu cách kết hợp /t/+/r/ và /d/+/r/.',
    spelling: [
      {
        pattern: 'tr- → /tʃr-/ (tự nhiên)',
        examples: ['tree', 'train', 'true', 'trip', 'track', 'trust', 'travel', 'trouble'],
        examples_ipa: ['/tʃriː/', '/tʃreɪn/', '/tʃruː/', '/tʃrɪp/', '/tʃræk/', '/tʃrʌst/', '/ˈtʃrævl/', '/ˈtʃrʌbl/']
      },
      {
        pattern: 'dr- → /dʒr-/ (tự nhiên)',
        examples: ['dream', 'drink', 'drive', 'drop', 'draw', 'dress', 'drama', 'dragon'],
        examples_ipa: ['/dʒriːm/', '/dʒrɪŋk/', '/dʒraɪv/', '/dʒrɒp/', '/dʒrɔː/', '/dʒres/', '/ˈdʒrɑːmə/', '/ˈdʒræɡən/']
      }
    ],
    mistakes: [
      'Chèn schwa: "train" → /tə·reɪn/ (sai) — phải là /treɪn/ hoặc /tʃreɪn/',
      'Bỏ /r/: "dream" → /diːm/ (sai) — phải là /driːm/ hoặc /dʒriːm/. /r/ PHẢI có mặt',
      'Dùng /tr-/ kiểu Việt: âm này không giống /tr/ tiếng Anh — không chuyển thói quen cũ sang'
    ]
  },

  'final-voiced': {
    how_to: [
      'Tiếng Anh CÓ voiced final stops: -b, -d, -g. Tiếng Việt chỉ có -p/-t/-k vô thanh ở cuối từ — không có voiced!',
      'DẤU HIỆU NHẬN BIẾT quan trọng nhất: VOWEL TRƯỚC VOICED FINAL DÀI HƠN. cap /kæp/ vs cab /kæːb/ — nguyên âm trong "cab" dài hơn',
      'Cách tạo -b: môi chạm nhau + rung thanh quản đến cuối → giữ khép, ít hoặc không burst',
      'Cách tạo -d: lưỡi chạm ngạc răng + rung thanh quản đến cuối → giữ, ít burst',
      'Cách tạo -g: lưỡi cuộn chạm vòm mềm + rung thanh quản đến cuối → giữ, ít burst',
      'Trong natural speech voiced finals thường không burst mạnh — nhưng vẫn PHẢI rung thanh quản và giữ đúng vị trí'
    ],
    vs_vietnamese: 'Tiếng Việt có -p/-t/-k (vô thanh, không bật hơi) nhưng tuyệt đối không có -b/-d/-g. Học sinh thường: (1) bỏ âm cuối hoàn toàn "bag" → /bæ/, hoặc (2) dùng voiceless thay "bag" → /bæk/. Cả hai đều sai.',
    spelling: [
      {
        pattern: '-b cuối từ',
        examples: ['cab', 'club', 'rib', 'tub', 'rob', 'grab', 'pub', 'sob'],
        examples_ipa: ['/kæb/', '/klʌb/', '/rɪb/', '/tʌb/', '/rɒb/', '/ɡræb/', '/pʌb/', '/sɒb/']
      },
      {
        pattern: '-d cuối từ',
        examples: ['bad', 'bed', 'bid', 'rod', 'add', 'head', 'food', 'said'],
        examples_ipa: ['/bæd/', '/bed/', '/bɪd/', '/rɒd/', '/æd/', '/hed/', '/fuːd/', '/sed/']
      },
      {
        pattern: '-g cuối từ',
        examples: ['bag', 'big', 'dog', 'bug', 'leg', 'fig', 'hug', 'drug'],
        examples_ipa: ['/bæɡ/', '/bɪɡ/', '/dɒɡ/', '/bʌɡ/', '/leɡ/', '/fɪɡ/', '/hʌɡ/', '/drʌɡ/']
      },
      {
        pattern: 'Voicing pairs — vowel dài hơn trước voiced',
        examples: ['cap≠cab', 'bat≠bad', 'back≠bag', 'lock≠log', 'pick≠pig'],
        examples_ipa: ['/kæp/≠/kæːb/', '/bæt/≠/bæːd/', '/bæk/≠/bæːɡ/', '/lɒk/≠/lɒːɡ/', '/pɪk/≠/pɪːɡ/']
      }
    ],
    mistakes: [
      'Voiceless thay voiced: "bag" → /bæk/ (sai) — phải /bæɡ/, thanh quản vẫn rung đến cuối',
      'Bỏ âm cuối: "bed" → /be/ (sai) — lưỡi PHẢI chạm ngạc răng, dù không burst',
      'Không nghe được vowel length cue: "bad" vs "bat" — vowel trong "bad" dài hơn đây là cách native speakers phân biệt'
    ]
  },

  'final-fricatives': {
    how_to: [
      'Tiếng Việt KHÔNG có fricatives (âm xát) ở cuối từ — đây là lỗi phổ biến nhất của học sinh Việt',
      'Final /f/: môi dưới chạm nhẹ răng trên, luồng khí tiếp tục sau nguyên âm. "beef" /biːf/ — cảm nhận hơi thở ra sau nguyên âm',
      'Final /v/: tương tự /f/ nhưng rung thanh quản. "move" /muːv/ — đặt tay lên cổ, cảm nhận rung đến cuối từ',
      'Kiểm tra: sau khi nói "beef", đặt tay trước miệng — có luồng khí /f/ không? Nếu không = bạn bỏ âm cuối!',
      'Ngoài -f/-v, tiếng Anh còn có: final -s /z/ · final -θ (breathe) · final -ʃ (wash, push) — tất cả đều cần luồng khí sau nguyên âm'
    ],
    vs_vietnamese: 'Tiếng Việt không có âm xát cuối từ. Phản xạ tự nhiên của học sinh: "beef" → /biː/ (bỏ /f/), "move" → /muː/ (bỏ /v/). Cảm giác giữ fricative cuối từ sẽ rất lạ lúc đầu — hoàn toàn bình thường.',
    spelling: [
      {
        pattern: '-f cuối từ',
        examples: ['beef', 'leaf', 'half', 'roof', 'cliff', 'loaf', 'cough', 'laugh'],
        examples_ipa: ['/biːf/', '/liːf/', '/hɑːf/', '/ruːf/', '/klɪf/', '/ləʊf/', '/kɒf/', '/lɑːf/']
      },
      {
        pattern: '-v cuối từ',
        examples: ['move', 'live', 'have', 'love', 'give', 'prove', 'shove', 'above'],
        examples_ipa: ['/muːv/', '/lɪv/', '/hæv/', '/lʌv/', '/ɡɪv/', '/pruːv/', '/ʃʌv/', '/əˈbʌv/']
      }
    ],
    mistakes: [
      'Bỏ âm cuối: "live" → /lɪ/ (sai) — phải là /lɪv/. Môi phải tạo ra /v/ trước khi kết thúc',
      '"cough" /kɒf/ có final /f/ dù viết là -gh — không đọc là /kəʊɡ/!',
      '"live" (verb) /lɪv/ ≠ "live" (adj) /laɪv/ — cùng chữ nhưng khác nghĩa và khác nguyên âm'
    ]
  },

  'final-l': {
    how_to: [
      'Final /l/ trong tiếng Anh là "Dark L" /ɫ/ — lưỡi chạm ngạc răng SAU nguyên âm. Nghe khác "Clear L" đầu từ (lake, live)',
      'Cách tạo: phát nguyên âm → lưỡi từ từ nâng lên → chạm ngạc răng → giữ chạm → thả. "well" = /w/ + /e/ + /ɫ/',
      'Lỗi 1: BỎ /l/ → "feel" → /fiː/ (sai). Nguyên âm ngắn và không đủ — thiếu chuyển động lưỡi cuối',
      'Lỗi 2: THAY BẰNG /n/ → "well" → /wen/ (sai). /l/ = khí thoát hai bên lưỡi; /n/ = khí thoát qua mũi — khác hoàn toàn',
      'Test: nói "well" và "when" — cảm nhận lưỡi chạm ngạc (/l/) vs khí qua mũi (/n/)?'
    ],
    vs_vietnamese: 'Tiếng Việt có /l/ đầu từ ("la", "lên") nhưng KHÔNG có /l/ cuối từ. Cuối từ tiếng Việt chỉ có: -p/-t/-c/-ch/-m/-n/-ng/-nh. Final /l/ là âm hoàn toàn mới — cần luyện tập từ đầu.',
    spelling: [
      {
        pattern: '-l cuối từ (Dark L)',
        examples: ['well', 'feel', 'tell', 'call', 'fill', 'ball', 'fall', 'will', 'sell', 'pull', 'cool', 'hill'],
        examples_ipa: ['/wel/', '/fiːl/', '/tel/', '/kɔːl/', '/fɪl/', '/bɔːl/', '/fɔːl/', '/wɪl/', '/sel/', '/pʊl/', '/kuːl/', '/hɪl/']
      },
      {
        pattern: '-l vs -n (minimal pairs)',
        examples: ['well≠when', 'feel≠fin', 'tell≠ten', 'call≠can', 'fill≠thin', 'ball≠ban'],
        examples_ipa: ['/wel/≠/wen/', '/fiːl/≠/fɪn/', '/tel/≠/ten/', '/kɔːl/≠/kæn/', '/fɪl/≠/θɪn/', '/bɔːl/≠/bæn/']
      }
    ],
    mistakes: [
      'Bỏ final /l/: "well" → /we/ (sai) — phải là /wel/. Lưỡi PHẢI chạm ngạc răng cuối từ',
      'Thay /l/ bằng /n/: "feel" → /fiːn/ (sai) — /l/ thoát khí hai bên lưỡi, không qua mũi',
      '"Dark L" nghe mờ hơn /l/ đầu từ — đây là bình thường. "feel" /fiːl/ ≠ /fiːla/'
    ]
  }
}

// ── Main: apply all changes ───────────────────────────────────────────────────

const levelsData = JSON.parse(fs.readFileSync(LEVELS_PATH, 'utf8'))
const levels = levelsData.levels

// 1. Fix clusters
fixClustersLesson(levels)

// 2 & 3. Add clusters-pbl and clusters-trdr to consonants-other (after existing clusters lesson)
const consonantsOther = levels.find(l => l.id === 'consonants-other')

if (!consonantsOther.lessons.find(l => l.id === 'clusters-pbl')) {
  const clustersIdx = consonantsOther.lessons.findIndex(l => l.id === 'clusters')
  consonantsOther.lessons.splice(clustersIdx + 1, 0, clustersPbl)
  console.log('✅  Added clusters-pbl after clusters')
} else {
  console.log('⚠️   clusters-pbl already exists — skip')
}

if (!consonantsOther.lessons.find(l => l.id === 'clusters-trdr')) {
  const pblIdx = consonantsOther.lessons.findIndex(l => l.id === 'clusters-pbl')
  consonantsOther.lessons.splice(pblIdx + 1, 0, clustersTrdr)
  console.log('✅  Added clusters-trdr after clusters-pbl')
} else {
  console.log('⚠️   clusters-trdr already exists — skip')
}

// 4 & 5. Add final-voiced and final-fricatives after final-stops
if (!consonantsOther.lessons.find(l => l.id === 'final-voiced')) {
  const finalStopsIdx = consonantsOther.lessons.findIndex(l => l.id === 'final-stops')
  consonantsOther.lessons.splice(finalStopsIdx + 1, 0, finalVoiced)
  console.log('✅  Added final-voiced after final-stops')
} else {
  console.log('⚠️   final-voiced already exists — skip')
}

if (!consonantsOther.lessons.find(l => l.id === 'final-fricatives')) {
  const finalVoicedIdx = consonantsOther.lessons.findIndex(l => l.id === 'final-voiced')
  consonantsOther.lessons.splice(finalVoicedIdx + 1, 0, finalFricatives)
  console.log('✅  Added final-fricatives after final-voiced')
} else {
  console.log('⚠️   final-fricatives already exists — skip')
}

// 6. Add final-l to viet-challenges
const vietChallenges = levels.find(l => l.id === 'viet-challenges')
if (!vietChallenges.lessons.find(l => l.id === 'final-l')) {
  vietChallenges.lessons.push(finalL)
  console.log('✅  Added final-l to viet-challenges')
} else {
  console.log('⚠️   final-l already exists — skip')
}

fs.writeFileSync(LEVELS_PATH, JSON.stringify(levelsData, null, 2) + '\n', 'utf8')
console.log('\n📝 Wrote phonicsLevels.json')

// 7. Knowledge entries
const knowData = JSON.parse(fs.readFileSync(KNOW_PATH, 'utf8'))
let addedCount = 0

for (const [key, value] of Object.entries(newKnowledge)) {
  if (key === 'clusters') {
    // Always overwrite clusters knowledge (updated to str-/spr-)
    knowData[key] = value
    console.log('✅  Updated knowledge: clusters (str-/spr-)')
    addedCount++
  } else if (!knowData[key]) {
    knowData[key] = value
    console.log('✅  Added knowledge:', key)
    addedCount++
  } else {
    console.log('⚠️   Knowledge "' + key + '" exists — skip')
  }
}

fs.writeFileSync(KNOW_PATH, JSON.stringify(knowData, null, 2) + '\n', 'utf8')
console.log('\n📝 Wrote', addedCount, 'knowledge entries to phonicsKnowledge.json')

// Verify final structure
console.log('\n── consonants-other lessons ──')
levels.find(l=>l.id==='consonants-other').lessons.forEach(l=>console.log(' ',l.id,'['+l.type+']','games:'+l.games.join(',')))
console.log('\n── viet-challenges lessons ──')
levels.find(l=>l.id==='viet-challenges').lessons.forEach(l=>console.log(' ',l.id))
