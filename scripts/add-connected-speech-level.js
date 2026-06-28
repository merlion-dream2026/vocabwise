#!/usr/bin/env node
// Adds "connected-speech" level (6 lessons) to phonicsLevels.json + phonicsKnowledge.json

const fs   = require('fs')
const path = require('path')
const ROOT = path.join(__dirname, '..')

const levelsPath    = path.join(ROOT, 'data', 'phonicsLevels.json')
const knowledgePath = path.join(ROOT, 'data', 'phonicsKnowledge.json')

const levels    = JSON.parse(fs.readFileSync(levelsPath, 'utf8'))
const knowledge = JSON.parse(fs.readFileSync(knowledgePath, 'utf8'))

// ── Guard: skip if already added ─────────────────────────────────────────────
if (levels.levels.find(l => l.id === 'connected-speech')) {
  console.log('connected-speech level already exists — skipping')
  process.exit(0)
}

// ── New Level ─────────────────────────────────────────────────────────────────
const connectedSpeechLevel = {
  id:       'connected-speech',
  title:    'Connected Speech',
  titleVi:  'Nói liên tục',
  subtitle: '6 bài · Nhóm tư duy · Nói nhanh · IELTS',
  emoji:    '🗣️',
  gradient: 'from-teal-500 to-cyan-600',
  bg:       'bg-teal-50',
  border:   'border-teal-300',
  text:     'text-teal-700',
  btn:      'bg-teal-600',
  bar:      'from-teal-400 to-cyan-500',
  lessons: [

    // 1. Thought groups
    {
      id:          'thought-groups',
      type:        'rhythm',
      title:       'Nhóm tư duy',
      subtitle:    'Cách ngắt câu tự nhiên',
      emoji:       '🧩',
      games:       ['rhythm', 'shadow'],
      masteryGames:['rhythm'],
      sentences: [
        { en: 'I went to the market / yesterday morning / to buy some vegetables.', stressed: ['market', 'morning', 'vegetables'], vi: 'Tôi đi chợ / sáng hôm qua / để mua rau.' },
        { en: 'She studies very hard / because she wants / to get a good job.', stressed: ['studies', 'hard', 'wants', 'job'], vi: 'Cô ấy học rất chăm / vì cô muốn / có việc làm tốt.' },
        { en: 'The weather in Hanoi / is quite different / from the south.', stressed: ['weather', 'Hanoi', 'different', 'south'], vi: 'Thời tiết ở Hà Nội / khá khác / so với miền Nam.' },
        { en: 'In my opinion / the most important thing / is good health.', stressed: ['opinion', 'important', 'health'], vi: 'Theo tôi / điều quan trọng nhất / là sức khỏe tốt.' },
        { en: 'My family / usually has dinner together / at seven o\'clock.', stressed: ['family', 'dinner', 'together', 'seven'], vi: 'Gia đình tôi / thường ăn tối cùng nhau / lúc bảy giờ.' },
        { en: 'When I was young / I used to play outside / every afternoon.', stressed: ['young', 'play', 'outside', 'afternoon'], vi: 'Khi còn nhỏ / tôi hay chơi ngoài trời / mỗi buổi chiều.' },
      ]
    },

    // 2. Contractions
    {
      id:          'contractions',
      type:        'rule',
      title:       'Dạng co rút',
      subtitle:    'Spoken contractions',
      emoji:       '🔗',
      games:       ['sort-rule', 'shadow'],
      masteryGames:['sort-rule'],
      practice_sentences: [
        { en: "I'll see you tomorrow.", highlight: ["I'll"] },
        { en: "She doesn't like cold weather.", highlight: ["doesn't"] },
        { en: "They're going to be late.", highlight: ["They're"] },
        { en: "We can't hear you very well.", highlight: ["can't"] },
      ],
      buckets: [
        {
          label: 'Dạng am/is/are',
          condition: "I'm · you're · he's · she's · it's · we're · they're",
          tip: 'I am → /aɪm/ · she is → /ʃɪz/ · they are → /ðeər/',
          words: ["I'm ready", "She's here", "They're waiting", "We're busy", "It's cold", "You're right", "He's late"],
        },
        {
          label: 'Dạng not',
          condition: "don't · doesn't · didn't · can't · won't · isn't · aren't",
          tip: 'do not → /doʊnt/ · cannot → /kænt/ · will not → /woʊnt/',
          words: ["don't go", "doesn't work", "didn't know", "can't stop", "won't help", "isn't ready", "aren't sure"],
        },
        {
          label: 'Dạng will/would/have',
          condition: "I'll · he'd · she'd · they'll · I've · we've",
          tip: "I will → /aɪl/ · I would → /aɪd/ · I have → /aɪv/",
          words: ["I'll try", "he'd like", "she'd prefer", "they'll come", "I've been", "we've done", "you'd think"],
        },
      ]
    },

    // 3. Fast speech reductions
    {
      id:          'fast-speech',
      type:        'rule',
      title:       'Nói nhanh — giảm âm',
      subtitle:    'gonna · wanna · hafta',
      emoji:       '⚡',
      games:       ['sort-rule', 'shadow'],
      masteryGames:['sort-rule'],
      practice_sentences: [
        { en: "I'm gonna study harder.", highlight: ["gonna"] },
        { en: "Do you wanna come with us?", highlight: ["wanna"] },
        { en: "I hafta finish this first.", highlight: ["hafta"] },
        { en: "I dunno what to do.", highlight: ["dunno"] },
      ],
      buckets: [
        {
          label: 'gonna / wanna / hafta',
          condition: 'going to → gonna · want to → wanna · have to → hafta',
          tip: '/ˈɡɒnə/ · /ˈwɒnə/ · /ˈhæftə/',
          words: ['gonna study', 'gonna be late', 'wanna eat', 'wanna go', 'hafta work', 'hafta leave'],
        },
        {
          label: 'kinda / sorta / dunno',
          condition: 'kind of → kinda · sort of → sorta · do not know → dunno',
          tip: '/ˈkaɪndə/ · /ˈsɔːtə/ · /dəˈnoʊ/',
          words: ['kinda tired', 'kinda busy', 'sorta like', 'sorta want', 'dunno why', 'dunno how'],
        },
        {
          label: 'lemme / gimme / gotta',
          condition: 'let me → lemme · give me → gimme · got to → gotta',
          tip: '/ˈlɛmi/ · /ˈɡɪmi/ · /ˈɡɒtə/',
          words: ['lemme try', 'lemme know', 'gimme time', 'gimme that', 'gotta go', 'gotta hurry'],
        },
      ]
    },

    // 4. IELTS Part 2 flow
    {
      id:          'ielts-part2-flow',
      type:        'rhythm',
      title:       'IELTS Part 2 — Nói liên tục',
      subtitle:    '2 phút · nhịp tự nhiên',
      emoji:       '🎓',
      games:       ['rhythm', 'shadow'],
      masteryGames:['rhythm'],
      sentences: [
        { en: "I'd like to talk about a person / who has had a great influence on me.", stressed: ['talk', 'person', 'great', 'influence'], vi: 'Tôi muốn nói về một người / có ảnh hưởng lớn đến tôi.' },
        { en: "This person is my English teacher / who I met in secondary school.", stressed: ['person', 'English', 'teacher', 'secondary', 'school'], vi: 'Người này là giáo viên tiếng Anh / tôi gặp ở trường cấp 2.' },
        { en: "What I admire most about her / is her dedication and passion.", stressed: ['admire', 'dedication', 'passion'], vi: 'Điều tôi ngưỡng mộ nhất / là sự tận tâm và đam mê của cô.' },
        { en: "She always encouraged us / to speak without fear of making mistakes.", stressed: ['encouraged', 'speak', 'fear', 'mistakes'], vi: 'Cô luôn khuyến khích chúng tôi / nói mà không sợ mắc lỗi.' },
        { en: "Thanks to her guidance / my English improved dramatically.", stressed: ['guidance', 'English', 'improved', 'dramatically'], vi: 'Nhờ sự hướng dẫn của cô / tiếng Anh của tôi tiến bộ vượt bậc.' },
        { en: "In conclusion / she is someone / I will never forget.", stressed: ['conclusion', 'someone', 'never', 'forget'], vi: 'Tóm lại / cô ấy là người / tôi sẽ không bao giờ quên.' },
      ]
    },

    // 5. Question intonation types
    {
      id:          'question-types',
      type:        'rhythm',
      title:       'Ngữ điệu câu hỏi',
      subtitle:    'WH · Yes/No · Tag questions',
      emoji:       '❓',
      games:       ['rhythm', 'shadow'],
      masteryGames:['rhythm'],
      sentences: [
        { en: 'WHERE did you go last weekend? ↘', stressed: ['WHERE', 'go', 'weekend'], vi: 'WH-question → xuống cuối' },
        { en: 'WHAT do you think about that? ↘', stressed: ['WHAT', 'think'], vi: 'WH-question → giọng xuống' },
        { en: 'Did you enjoy the movie? ↗', stressed: ['enjoy', 'movie'], vi: 'Yes/No question → lên cuối' },
        { en: 'Are you coming to the party? ↗', stressed: ['coming', 'party'], vi: 'Yes/No question → giọng lên' },
        { en: "It's a beautiful day, ISN'T it? ↘↗", stressed: ["beautiful", "day", "ISN'T"], vi: 'Tag question → xuống (confirm) hoặc lên (unsure)' },
        { en: "You've been here before, HAVEN'T you? ↘", stressed: ['been', 'before', "HAVEN'T"], vi: 'Tag question xác nhận → giọng xuống' },
      ]
    },

    // 6. Contrastive / emphatic stress
    {
      id:          'contrastive-stress',
      type:        'rhythm',
      title:       'Nhấn tương phản',
      subtitle:    'Thay đổi ý nghĩa bằng nhấn',
      emoji:       '💡',
      games:       ['rhythm', 'shadow'],
      masteryGames:['rhythm'],
      sentences: [
        { en: "I didn't say HE stole it — I said SHE did.", stressed: ['HE', 'SHE'], vi: 'Nhấn HE / SHE → tương phản người' },
        { en: "I LOVE coffee but I HATE tea.", stressed: ['LOVE', 'HATE'], vi: 'Nhấn cảm xúc tương phản' },
        { en: "Not THIS book — THAT one!", stressed: ['THIS', 'THAT'], vi: 'Nhấn từ chỉ định tương phản' },
        { en: "She didn't WALK there — she RAN.", stressed: ['WALK', 'RAN'], vi: 'Nhấn hành động tương phản' },
        { en: "The EXAM was easy but the HOMEWORK was hard.", stressed: ['EXAM', 'HOMEWORK'], vi: 'Nhấn chủ đề tương phản' },
        { en: "I've been to PARIS but not to LONDON yet.", stressed: ['PARIS', 'LONDON'], vi: 'Nhấn địa điểm tương phản' },
      ]
    },
  ]
}

// ── Knowledge entries ─────────────────────────────────────────────────────────
const newKnowledge = {

  'thought-groups': {
    why: 'Người bản ngữ không nói từng từ riêng lẻ — họ nhóm các từ có nghĩa gần nhau thành "thought groups" và ngắt giữa các nhóm. Ngắt sai chỗ làm người nghe khó hiểu, thiếu tự nhiên.',
    how_to: [
      'Mỗi thought group thường có 3–7 từ, kết thúc ở chỗ có nghĩa hoàn chỉnh một phần.',
      'Ngắt nhẹ (micro-pause) giữa các nhóm — không phải khoảng trống dài.',
      'Từ cuối mỗi nhóm thường được nhấn nhẹ hơn (falling nucleus).',
      'Luyện: đọc câu dài → tìm chỗ ngắt tự nhiên → thực hành với dấu /.',
      'IELTS Band 7+: examiners đánh giá "appropriate chunking" — nhóm câu hợp lý.',
    ],
    vs_vietnamese: 'Tiếng Việt có âm tiết rõ ràng và ngắt tự nhiên hơn. Tiếng Anh nói liên tục hơn trong mỗi thought group — tránh ngắt ở giữa nhóm.',
    exceptions: [
      'Khi nói chậm hoặc nhấn mạnh, thought group có thể nhỏ hơn (1–2 từ).',
      'Trong văn nói thân mật, thought groups dài hơn và ít ngắt hơn.',
    ]
  },

  'contractions': {
    why: 'Người bản ngữ dùng contractions trong giao tiếp tự nhiên để nói nhanh hơn và nghe tự nhiên hơn. Không dùng contraction nghe có vẻ cứng nhắc, không tự nhiên.',
    how_to: [
      "Học từng cặp: dạng đầy đủ (formal/written) → dạng co rút (spoken).",
      "Luyện tới khi contraction nghe như MỘT từ, không phải hai từ ghép.",
      "Trong IELTS Speaking: contraction hoàn toàn được chấp nhận — thực ra giúp điểm fluency.",
      "Phân biệt: it's (it is) vs its (possessive) — âm giống nhau nhưng nghĩa khác.",
    ],
    vs_vietnamese: 'Tiếng Việt không có contractions. Người Việt hay phát âm đầy đủ (I am → "I am" thay vì "I\'m"), nghe thiếu tự nhiên.',
    exceptions: [
      "'am not' không có contraction chuẩn (ain't là informal/dialectal).",
      "Khi nhấn mạnh: 'I WILL not do it' (không dùng won't) để tăng sức mạnh.",
    ]
  },

  'fast-speech': {
    why: "Trong hội thoại tự nhiên, người nói nhanh 'compress' các từ nhỏ — đặc biệt function words. Đây là đặc điểm của bản ngữ, không phải lỗi. Nghe và nhận ra được giúp hiểu podcast, phim, IELTS Listening Band 7+.",
    how_to: [
      "Ghi nhớ các cặp: going to → gonna (/ˈɡɒnə/), want to → wanna (/ˈwɒnə/).",
      "Không nhất thiết phải TỰ NÓI theo — nhưng phải nghe hiểu được.",
      "IELTS Speaking: tránh dùng gonna/wanna trong formal context (exam); dùng trong informal Task 1 (nếu phù hợp).",
      "Luyện nghe: podcast, phim không phụ đề → pause → replay → identify reductions.",
    ],
    vs_vietnamese: 'Tiếng Việt nói nhanh cũng có giảm âm (tôi → tui, không → hông) — tương tự khái niệm nhưng khác từ cụ thể.',
    exceptions: [
      "Formal situations (presentations, interviews): tránh gonna/wanna, dùng going to/want to.",
      "Khi viết: KHÔNG dùng gonna/wanna — chỉ dùng trong dialogue hoặc chat không chính thức.",
    ]
  },

  'ielts-part2-flow': {
    why: "IELTS Speaking Part 2 yêu cầu nói liên tục 2 phút. Examiner đánh giá Fluency & Coherence (25%) — bao gồm: không có khoảng dừng không cần thiết, có cohesive devices, và speech đều đặn tự nhiên.",
    how_to: [
      "Dùng thought groups rõ ràng: nói từng chunk, ngắt nhẹ giữa các ý.",
      "Discourse markers để mua thời gian và kết nối: 'What I mean is...', 'The reason I say this is...'",
      "Tốc độ: không quá nhanh (mất control) cũng không quá chậm (nghe cứng). Aim for ~120 words/minute.",
      "Stress content words: nouns, verbs, adjectives, adverbs. De-stress function words (the, a, of, to).",
      "Luyện: record bản thân → nghe lại → chú ý chỗ dừng không tự nhiên → cải thiện.",
    ],
    vs_vietnamese: "Học sinh Việt hay nói quá nhanh (nervousness) hoặc quá chậm với nhiều 'uh... um...' Aim for natural English pace với pauses ở right places (thought group boundaries).",
    exceptions: [
      "IELTS Part 2: được phép dùng notes trong 1 phút chuẩn bị — nên ghi key phrases, không ghi câu đầy đủ.",
    ]
  },

  'question-types': {
    why: "Ba loại câu hỏi có intonation pattern khác nhau. Sai intonation → người nghe confused về loại câu hỏi. IELTS Speaking Part 3 thường dùng WH-questions; phân biệt đúng → điểm cao hơn.",
    how_to: [
      "WH-questions (what, where, when, who, why, how): giọng XUỐNG ↘ ở cuối — mang thông tin mới.",
      "Yes/No questions (do, does, did, is, are, will, can): giọng LÊN ↗ ở cuối — cần xác nhận.",
      "Tag questions: giọng XUỐNG ↘ nếu chắc chắn ('It's hot, isn't it?'); LÊN ↗ nếu không chắc.",
      "Ngoại lệ: WH-question đôi khi lên khi muốn hỏi lại (echoing) — 'You went WHERE?'",
    ],
    vs_vietnamese: "Tiếng Việt dùng từ hỏi (à, không, hả) thay vì intonation để phân biệt câu hỏi. Người Việt hay 'flatten' intonation câu hỏi tiếng Anh, nghe không tự nhiên.",
    exceptions: [
      "Khi hỏi lại (echo question): WH-question có thể lên ↗: 'He said WHAT?'",
      "Rhetorical questions: thường xuống ↘ ngay cả yes/no: 'Does it really matter? ↘'",
    ]
  },

  'contrastive-stress': {
    why: "Trong tiếng Anh, nhấn mạnh từ nào THAY ĐỔI ý nghĩa hoàn toàn. Đây là cách người bản ngữ dùng để tương phản, đính chính, hoặc nhấn mạnh thông tin. IELTS Band 7+ examiners chú ý đến 'use of stress for emphasis'.",
    how_to: [
      "Identify the CONTRASTING element — đó là từ cần nhấn.",
      "Nhấn mạnh bằng cách: to cao hơn + dài hơn + to hơn (louder, longer, higher pitch).",
      "Các từ không được nhấn sẽ nghe yếu và nhanh hơn (reduced).",
      "Luyện: đọc cùng câu với các từ nhấn khác nhau → note sự khác biệt nghĩa.",
    ],
    vs_vietnamese: "Tiếng Việt dùng thêm từ để nhấn ('chính anh ấy', 'mãi tôi mới...'). Tiếng Anh đơn giản hơn: chỉ cần nhấn từ cần tương phản.",
    exceptions: [
      "Khi viết, contrastive stress được thể hiện bằng CAPS, italic, hoặc bold — không có trong spoken.",
      "Đừng nhấn quá nhiều từ trong một câu — làm loãng hiệu quả. Thường chỉ 1–2 từ per contrast.",
    ]
  },
}

// ── Patch data ────────────────────────────────────────────────────────────────
levels.levels.push(connectedSpeechLevel)
Object.assign(knowledge, newKnowledge)

fs.writeFileSync(levelsPath,    JSON.stringify(levels,    null, 2), 'utf8')
fs.writeFileSync(knowledgePath, JSON.stringify(knowledge, null, 2), 'utf8')

console.log('✅ Added connected-speech level (6 lessons)')
console.log('✅ Added 6 knowledge entries')
connectedSpeechLevel.lessons.forEach(l => console.log(`   ${l.emoji} ${l.id} (${l.type})`))
