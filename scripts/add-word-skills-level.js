#!/usr/bin/env node
// Adds "word-skills" level (4 lessons) to phonicsLevels.json
// and 4 knowledge entries to phonicsKnowledge.json
// Position: after viet-challenges, before rules
// Run: node scripts/add-word-skills-level.js

const fs = require('fs')
const path = require('path')

const LEVELS_PATH  = path.join(__dirname, '../data/phonicsLevels.json')
const KNOW_PATH    = path.join(__dirname, '../data/phonicsKnowledge.json')

// ── New level definition ──────────────────────────────────────────────────────

const newLevel = {
  "id": "word-skills",
  "titleVi": "Đọc từ thông minh",
  "emoji": "📖",
  "bg": "bg-violet-50",
  "gradient": "from-violet-500 to-indigo-600",
  "border": "border-violet-300",
  "text": "text-violet-700",
  "btn": "bg-violet-600",
  "bar": "from-violet-400 to-indigo-500",
  "lessons": [
    {
      "id": "ipa-dictionary",
      "type": "rule",
      "title": "Đọc từ điển IPA",
      "subtitle": "Hiểu ký hiệu phát âm — tự tra được mọi từ",
      "emoji": "📖",
      "games": ["sort-rule"],
      "masteryGames": ["sort-rule"],
      "buckets": [
        {
          "label": "Nhấn âm tiết 1",
          "condition": "ˈ xuất hiện ngay ĐẦU phiên âm → đọc to âm tiết ĐẦU TIÊN. VD: /ˈtiːtʃə/ = TEA-cher",
          "tip": "teacher /ˈtiːtʃə/ · water /ˈwɔːtə/ · happy /ˈhæpi/ · window /ˈwɪndəʊ/ · summer /ˈsʌmə/",
          "words": ["teacher", "water", "happy", "window", "garden", "summer", "doctor", "people", "table", "bottle", "money", "sister", "better", "letter", "basket"]
        },
        {
          "label": "Nhấn âm tiết 2",
          "condition": "ˈ xuất hiện GIỮa phiên âm → đọc to âm tiết THỨ HAI. VD: /əˈɡen/ = a-GAIN",
          "tip": "again /əˈɡen/ · before /bɪˈfɔː/ · today /təˈdeɪ/ · success /səkˈses/ · decide /dɪˈsaɪd/",
          "words": ["again", "before", "today", "success", "decide", "return", "enjoy", "police", "hotel", "mistake", "agree", "prefer", "begin", "apart", "because"]
        },
        {
          "label": "Nhấn âm tiết 3+",
          "condition": "ˈ xuất hiện gần CUỐI phiên âm → nhấn âm tiết THỨ BA hoặc sau. VD: /ˌʌndəˈstænd/ = un-der-STAND",
          "tip": "understand /ˌʌndəˈstænd/ · afternoon /ˌɑːftəˈnuːn/ · entertain /ˌentəˈteɪn/ · seventeen /ˌsevnˈtiːn/",
          "words": ["understand", "entertain", "afternoon", "seventeen", "engineer", "volunteer", "recommend", "introduce", "overcome", "represent", "disappoint", "interrupt", "guarantee", "contradict", "comprehend"]
        }
      ]
    },
    {
      "id": "sounds-vs-syllables",
      "type": "rule",
      "title": "Âm & Âm tiết",
      "subtitle": "Đếm đúng số âm và số âm tiết trong từ",
      "emoji": "🔢",
      "games": ["sort-rule"],
      "masteryGames": ["sort-rule"],
      "buckets": [
        {
          "label": "1 âm tiết",
          "condition": "Chỉ có 1 nguyên âm ÂM (vowel sound) → 1 nhịp đập. Nhiều chữ cái ≠ nhiều âm tiết!",
          "tip": "strengths /strɛŋkθs/ = 8 âm, 1 âm tiết · knight /naɪt/ = 3 âm · clothes /kləʊðz/ = 4 âm",
          "words": ["strengths", "through", "knight", "thought", "bright", "friends", "world", "scream", "straight", "clothes", "glimpsed", "drenched", "splashed", "squirmed", "thrilled"]
        },
        {
          "label": "2 âm tiết",
          "condition": "Có 2 nguyên âm âm vị → 2 nhịp. Đếm bằng cách đặt tay dưới cằm: cằm chạm tay mỗi âm tiết.",
          "tip": "water /ˈwɔː·tə/ · table /ˈteɪ·bl/ · garden /ˈɡɑː·dn/ · perfect /ˈpɜː·fɪkt/",
          "words": ["water", "table", "garden", "carpet", "finger", "orange", "fashion", "magic", "number", "perfect", "paper", "thunder", "seven", "summer", "sister"]
        },
        {
          "label": "3 âm tiết",
          "condition": "Có 3 nguyên âm âm vị → 3 nhịp. Chú ý: nhiều từ NGẮN hơn bạn nghĩ khi nói tự nhiên!",
          "tip": "tomorrow /tə·ˈmɒ·rəʊ/ · beautiful /ˈbjuː·tɪ·fl/ · umbrella /ʌm·ˈbrel·ə/ · hospital /ˈhɒs·pɪ·tl/",
          "words": ["tomorrow", "beautiful", "umbrella", "remember", "hospital", "telephone", "however", "Saturday", "adventure", "together", "another", "amazing", "important", "banana", "example"]
        }
      ]
    },
    {
      "id": "silent-letters-extra",
      "type": "rule",
      "title": "Silent Letters — H · G · N/P",
      "subtitle": "Các âm câm hay bị bỏ qua (ngoài K, B, W, GH, L, T)",
      "emoji": "🤐",
      "games": ["sort-rule"],
      "masteryGames": ["sort-rule"],
      "buckets": [
        {
          "label": "H câm",
          "condition": "H câm trong: honest/hour/heir/honour (đầu từ) · rh- (rhyme, rhythm) · wh- (khi theo sau là e/a/i: when, where, what)",
          "tip": "honest /ˈɒnɪst/ · hour /ˈaʊə/ · heir /eə/ · rhyme /raɪm/ · rhythm /ˈrɪðəm/ · when /wen/ · where /weə/",
          "words": ["honest", "honour", "hour", "heir", "rhyme", "rhythm", "rhetoric", "when", "where", "what", "which", "while", "wheat", "exhaust", "exhibition"]
        },
        {
          "label": "G câm",
          "condition": "G câm trong: gn- (đầu từ: gnome, gnat) · -ign · -gn · -eign (cuối/giữa: sign, foreign, reign, campaign)",
          "tip": "sign /saɪn/ · design /dɪˈzaɪn/ · foreign /ˈfɒrɪn/ · gnome /nəʊm/ · gnat /næt/ · reign /reɪn/ · campaign /kæmˈpeɪn/",
          "words": ["sign", "design", "foreign", "gnome", "gnat", "reign", "campaign", "align", "benign", "assign", "malign", "consign", "resign", "champagne", "cologne"]
        },
        {
          "label": "N câm / P câm",
          "condition": "N câm sau M trong -mn (autumn, column, condemn) · P câm trong ps- và pn- (psychology, pneumonia) và một số từ khác",
          "tip": "autumn /ˈɔːtəm/ · column /ˈkɒləm/ · condemn /kənˈdem/ · hymn /hɪm/ · psychology /saɪˈkɒlədʒi/ · receipt /rɪˈsiːt/",
          "words": ["autumn", "column", "condemn", "hymn", "solemn", "psychology", "receipt", "raspberry", "pneumonia", "damn", "psalm", "pseudo", "cupboard", "corps", "sapphire"]
        }
      ]
    },
    {
      "id": "mispronounced",
      "type": "rule",
      "title": "Từ hay phát âm sai",
      "subtitle": "Những từ quen mà IELTS candidates hay đọc sai",
      "emoji": "⚠️",
      "games": ["sort-rule"],
      "masteryGames": ["sort-rule"],
      "buckets": [
        {
          "label": "Ít âm tiết hơn nghĩ",
          "condition": "Những từ này NGẮN hơn cách viết gợi ý. Đọc tự nhiên = giảm 1 âm tiết (hoặc hơn)!",
          "tip": "chocolate /ˈtʃɒk·lɪt/ (3) · comfortable /ˈkʌmf·tə·bl/ (3) · vegetable /ˈvedʒ·tə·bl/ (3) · Wednesday /ˈwenz·deɪ/ (2) · different /ˈdɪf·rənt/ (2)",
          "words": ["chocolate", "comfortable", "vegetable", "Wednesday", "different", "interesting", "every", "temperature", "business", "government", "generally", "camera", "history", "library", "February"]
        },
        {
          "label": "Nhấn sai âm tiết",
          "condition": "Vị trí nhấn không theo trực giác — thường học sinh nhấn âm tiết đầu trong khi đúng phải nhấn âm tiết thứ 2 hoặc 3.",
          "tip": "pho·TOG·ra·phy (2nd) ≠ PHO·to·graph (1st) · e·CON·o·my (2nd) · pro·NUN·ci·a·tion (3rd) · cer·TIF·i·cate (2nd)",
          "words": ["photography", "economy", "pronunciation", "environment", "certificate", "ability", "community", "discovery", "relationship", "electricity", "technology", "communication", "opportunity", "development", "possibility"]
        },
        {
          "label": "Nguyên âm đọc sai",
          "condition": "Nguyên âm phát âm hoàn toàn khác với cách viết. Không thể đoán được — phải tra từ điển!",
          "tip": "colonel /ˈkɜːnl/ · women /ˈwɪmɪn/ · said /sed/ · friend /frend/ · blood /blʌd/ · busy /ˈbɪzi/ · tough /tʌf/",
          "words": ["colonel", "women", "said", "friend", "blood", "busy", "tough", "cough", "though", "island", "people", "says", "debt", "doubt", "salmon"]
        }
      ]
    }
  ]
}

// ── New knowledge entries ─────────────────────────────────────────────────────

const newKnowledge = {
  "ipa-dictionary": {
    "why": "Cambridge và Oxford Dictionary đều dùng IPA để ghi phát âm chính xác. Biết đọc IPA = tự học phát âm bất kỳ từ nào không cần giáo viên hay audio. Đây là kỹ năng cốt lõi của học viên IELTS độc lập.",
    "how_to": [
      "Mở Cambridge Dictionary (dictionary.cambridge.org) → gõ từ → nhìn phần /.../ màu xanh bên dưới từ khóa. VD: 'teacher' → /ˈtiːtʃə/",
      "ˈ = dấu nhấn mạnh (PRIMARY STRESS). Đọc to âm tiết ngay SAU dấu ˈ. VD: /ˈtiːtʃə/ → TEA-cher (nhấn TEA)",
      "ˌ = nhấn phụ (SECONDARY STRESS). Nhấn nhẹ hơn. VD: /ˌʌndəˈstænd/ → un-der-STAND (nhấn chính STAND, nhấn phụ UN)",
      "ː = nguyên âm dài. /iː/ dài gấp đôi /ɪ/ · /uː/ dài gấp đôi /ʊ/ · /ɑː/ dài gấp đôi /ʌ/ · /ɔː/ dài gấp đôi /ɒ/",
      "ə = schwa — âm 'ơ' yếu, ngắn, xuất hiện trong âm tiết không nhấn. Đây là âm PHỔ BIẾN NHẤT trong tiếng Anh!",
      "BrE (cột 1) = British English — dùng cho IELTS. AmE (cột 2) = American English. Ưu tiên đọc BrE khi thi IELTS.",
      "(r) trong ngoặc = âm /r/ chỉ phát âm khi từ tiếp theo bắt đầu bằng nguyên âm. VD: 'mother of' → /ˈmʌðər əv/"
    ],
    "spelling": [
      {
        "pattern": "ˈ = nhấn chính",
        "examples": ["teacher", "water", "happy", "again", "today", "before", "understand"],
        "examples_ipa": ["/ˈtiːtʃə/", "/ˈwɔːtə/", "/ˈhæpi/", "/əˈɡen/", "/təˈdeɪ/", "/bɪˈfɔː/", "/ˌʌndəˈstænd/"]
      },
      {
        "pattern": "ː = âm dài vs ngắn",
        "examples": ["see≠sit", "food≠foot", "card≠cut", "caught≠cot", "barn≠ban"],
        "examples_ipa": ["/siː/≠/sɪt/", "/fuːd/≠/fʊt/", "/kɑːd/≠/kʌt/", "/kɔːt/≠/kɒt/", "/bɑːn/≠/bæn/"]
      },
      {
        "pattern": "ə = schwa (âm yếu)",
        "examples": ["banana", "together", "about", "problem", "garden", "second", "perhaps"],
        "examples_ipa": ["/bəˈnɑːnə/", "/təˈɡeðə/", "/əˈbaʊt/", "/ˈprɒbləm/", "/ˈɡɑːdn/", "/ˈsekənd/", "/pəˈhæps/"]
      },
      {
        "pattern": "BrE vs AmE khác nhau",
        "examples": ["hot", "dance", "path", "car", "schedule"],
        "examples_ipa": ["/hɒt/ vs /hɑːt/", "/dɑːns/ vs /dæns/", "/pɑːθ/ vs /pæθ/", "/kɑː/ vs /kɑːr/", "/ˈʃedjuːl/ vs /ˈskedʒuːl/"]
      }
    ],
    "mistakes": [
      "Đọc ˈ như dấu phẩy — sai! ˈ là ký hiệu nhấn âm tiết, không phải dấu câu",
      "Bỏ qua ə → phát âm sai: 'problem' /ˈprɒblem/ (sai) → phải là /ˈprɒbləm/ (schwa cuối)",
      "Nhầm độ dài nguyên âm: /iː/ và /ɪ/ là 2 ÂM KHÁC NHAU về chất, không chỉ dài/ngắn",
      "Dùng AmE trong IELTS: 'hot' nên là /hɒt/ (BrE), không phải /hɑːt/ (AmE)"
    ]
  },

  "sounds-vs-syllables": {
    "why": "Biết đếm âm tiết chính xác giúp phát âm đúng nhịp và không thêm/bớt âm tiết. Biết đếm âm (sounds) giúp hiểu IPA và nhận biết âm câm. Đây là 2 kỹ năng phân tích từ cơ bản không thể thiếu khi học IELTS.",
    "how_to": [
      "ÂM TIẾT (syllable) = nhịp đập. Test: đặt tay dưới cằm — mỗi lần cằm chạm tay = 1 âm tiết. 'wa·ter' = 2 · 'to·mor·row' = 3",
      "QUY TẮC: Mỗi âm tiết có đúng 1 NGUYÊN ÂM ÂM (không phải chữ cái). 'make' có 2 nguyên âm CHỮ (a, e) nhưng E cuối câm → chỉ 1 âm tiết",
      "ÂM (sound/phoneme) = đơn vị nhỏ nhất. 'cat' = 3 âm /k·æ·t/ · 'ship' = 3 âm /ʃ·ɪ·p/ (4 chữ) · 'through' = 3 âm /θ·r·uː/ (7 chữ)",
      "CÁCH ĐẾM ÂM: mở IPA trong từ điển, đếm các ký hiệu trong //. 'knight' /naɪt/ = 3 ký hiệu = 3 âm (dù có 6 chữ)",
      "DẤU NGĂN ÂM TIẾT trong IPA: dấu chấm (·) hoặc gạch đứng (|). VD: /ˈwɔː.tə/ = 2 âm tiết · /ˌʌn.də.ˈstænd/ = 3 âm tiết",
      "BẪY PHỔ BIẾN: comfortable (3 âm tiết, không phải 4) · interesting (3, không phải 4) · chocolate (3, không phải 4) · different (2, không phải 3)"
    ],
    "spelling": [
      {
        "pattern": "Chữ cái ≠ Âm",
        "examples": ["knight (6 chữ)", "phone (5 chữ)", "through (7 chữ)", "thought (7 chữ)", "straight (8 chữ)"],
        "examples_ipa": ["= 3 âm /naɪt/", "= 3 âm /fəʊn/", "= 3 âm /θruː/", "= 3 âm /θɔːt/", "= 5 âm /streɪt/"]
      },
      {
        "pattern": "Nhiều âm, 1 âm tiết",
        "examples": ["strengths", "glimpsed", "squirmed", "splashed", "drenched"],
        "examples_ipa": ["8 âm /strɛŋkθs/", "7 âm /ɡlɪmpst/", "6 âm /skwɜːmd/", "7 âm /splæʃt/", "6 âm /drentʃt/"]
      },
      {
        "pattern": "Từ bị rút gọn (tự nhiên)",
        "examples": ["comfortable", "interesting", "chocolate", "different", "every"],
        "examples_ipa": ["3 âm tiết /ˈkʌmf.tə.bl/", "3 âm tiết /ˈɪn.trɪs.tɪŋ/", "3 âm tiết /ˈtʃɒk.lɪt/", "2 âm tiết /ˈdɪf.rənt/", "2 âm tiết /ˈev.ri/"]
      }
    ],
    "mistakes": [
      "Đếm chữ cái thay vì âm tiết: 'clothes' (7 chữ) = chỉ 1 âm tiết /kləʊðz/, không phải 2!",
      "Thêm âm tiết vào từ: 'film' = 1 âm tiết /fɪlm/, không đọc thành 'fil-em' (2 âm tiết)",
      "Đọc E cuối câm như âm tiết: 'make' /meɪk/ = 1 âm tiết, không phải 'ma-ke' (2)",
      "Phát âm 'com-for-ta-ble' = 4 âm tiết — sai! Đúng là /ˈkʌmf.tə.bl/ = 3 âm tiết",
      "Phát âm 'in-ter-es-ting' = 4 âm tiết — sai! Đúng là /ˈɪn.trɪs.tɪŋ/ = 3 âm tiết"
    ]
  },

  "silent-letters-extra": {
    "why": "Tiếp nối bài K/B/W và GH/L/T, bài này cover các âm câm học thuật quan trọng còn lại. Silent H hay xuất hiện trong từ gốc Latin/Pháp (honest, hour). Silent G xuất hiện trong nhiều từ mượn tiếng Pháp (campaign, cologne). Silent N/P xuất hiện trong từ khoa học (psychology, pneumonia) và từ Latin (autumn, column).",
    "how_to": [
      "H câm đầu từ: honest /ˈɒnɪst/ · honour /ˈɒnə/ · hour /ˈaʊə/ · heir /eə/. LƯU Ý: hotel /həʊˈtel/ có H PHÁT ÂM! Học thuộc lòng từng từ.",
      "H câm trong rh-: rhyme /raɪm/ · rhythm /ˈrɪðəm/ · rhetoric /ˈretərɪk/ · rhapsody /ˈræpsədi/. Quy tắc: rh- → chỉ đọc /r/",
      "H câm trong wh- (most): when /wen/ · where /weə/ · what /wɒt/ · which /wɪtʃ/. NGOẠI LỆ: who /huː/ · whole /həʊl/ → H được phát âm!",
      "G câm trong gn-: gnome /nəʊm/ · gnat /næt/ · gnu /njuː/. G câm trong -gn, -ign: sign /saɪn/ · reign /reɪn/ · campaign /kæmˈpeɪn/ · foreign /ˈfɒrɪn/",
      "N câm trong -mn: autumn /ˈɔːtəm/ · column /ˈkɒləm/ · condemn /kənˈdem/ · hymn /hɪm/ · solemn /ˈsɒləm/ · damn /dæm/",
      "P câm trong ps-: psychology /saɪˈkɒlədʒi/ · psalm /sɑːm/ · pseudo /ˈsjuːdəʊ/. P câm trong pn-: pneumonia /njuːˈməʊniə/. P câm trong receipt /rɪˈsiːt/ · raspberry /ˈrɑːzbri/"
    ],
    "spelling": [
      {
        "pattern": "H câm (wh-)",
        "examples": ["when", "where", "what", "which", "while", "whether", "wheat", "whisper"],
        "examples_ipa": ["/wen/", "/weə/", "/wɒt/", "/wɪtʃ/", "/waɪl/", "/ˈweðə/", "/wiːt/", "/ˈwɪspə/"]
      },
      {
        "pattern": "H câm (honest, rh-)",
        "examples": ["honest", "honour", "hour", "heir", "rhyme", "rhythm", "rhetoric"],
        "examples_ipa": ["/ˈɒnɪst/", "/ˈɒnə/", "/ˈaʊə/", "/eə/", "/raɪm/", "/ˈrɪðəm/", "/ˈretərɪk/"]
      },
      {
        "pattern": "G câm (gn-, -gn, -ign, -eign)",
        "examples": ["sign", "design", "foreign", "gnome", "gnat", "reign", "campaign", "align"],
        "examples_ipa": ["/saɪn/", "/dɪˈzaɪn/", "/ˈfɒrɪn/", "/nəʊm/", "/næt/", "/reɪn/", "/kæmˈpeɪn/", "/əˈlaɪn/"]
      },
      {
        "pattern": "N câm (-mn) / P câm (ps-, pn-)",
        "examples": ["autumn", "column", "condemn", "hymn", "psychology", "receipt", "pneumonia", "psalm"],
        "examples_ipa": ["/ˈɔːtəm/", "/ˈkɒləm/", "/kənˈdem/", "/hɪm/", "/saɪˈkɒlədʒi/", "/rɪˈsiːt/", "/njuːˈməʊniə/", "/sɑːm/"]
      }
    ],
    "mistakes": [
      "Phát âm H trong 'honest' → /ˈɒnɪst/ không phải /ˈhɒnɪst/. Nhưng 'hotel' CÓ phát âm H: /həʊˈtel/",
      "Phát âm G trong 'sign' → /saɪn/ không phải /saɪɡn/. Tương tự: design, foreign, campaign",
      "Phát âm N cuối trong 'autumn' → /ˈɔːtəm/ không phải /ˈɔːtəmn/. Tương tự: column, condemn, hymn",
      "Phát âm P đầu trong 'psychology' → /saɪˈkɒlədʒi/ không phải /psaɪˈkɒlədʒi/",
      "Nhầm wh-: 'who' /huː/ và 'whole' /həʊl/ có H PHÁT ÂM — ngoại lệ của nhóm wh-câm"
    ]
  },

  "mispronounced": {
    "why": "Những từ này xuất hiện thường xuyên trong IELTS Listening, Speaking và Writing, nhưng hay bị phát âm sai dù đã biết nghĩa. Nguyên nhân: đọc theo mặt chữ, ảnh hưởng phiên âm tiếng Việt, hoặc chưa bao giờ kiểm tra lại với từ điển.",
    "how_to": [
      "Nguyên tắc vàng: KHÔNG đọc tiếng Anh theo cách bạn đọc chữ. Luôn tra IPA trong Cambridge Dictionary trước khi dùng từ mới",
      "Kiểm tra 3 điểm khi tra từ: (1) Có bao nhiêu âm tiết? (2) Nhấn ở âm tiết nào? (3) Các nguyên âm phát âm thế nào?",
      "Từ CÓ ÍT âm tiết hơn bạn nghĩ (hay bị thêm âm): comfortable→3 · vegetable→3 · chocolate→3 · different→2 · every→2 · Wednesday→2",
      "Từ bị NHẤN SAI VỊ TRÍ: phoˈtography (2nd) ≠ ˈphotograph (1st) · eˈconomy (2nd) · proˌnunciˈation (3rd) · cerˈtificate (2nd)",
      "Từ có NGUYÊN ÂM ĐỌC SAI HOÀN TOÀN: colonel /ˈkɜːnl/ · women /ˈwɪmɪn/ · said /sed/ · blood /blʌd/ · friend /frend/ · island /ˈaɪlənd/ (s câm!)",
      "Mẹo luyện tập: chép 10 từ hay dùng nhất, tra IPA, ghi phiên âm lên flashcard, đọc to mỗi ngày 5 lần"
    ],
    "spelling": [
      {
        "pattern": "Ít âm tiết hơn nghĩ",
        "examples": ["comfortable", "vegetable", "chocolate", "different", "interesting", "every", "Wednesday", "temperature"],
        "examples_ipa": ["/ˈkʌmf.tə.bl/ (3)", "/ˈvedʒ.tə.bl/ (3)", "/ˈtʃɒk.lɪt/ (3)", "/ˈdɪf.rənt/ (2)", "/ˈɪn.trɪs.tɪŋ/ (3)", "/ˈev.ri/ (2)", "/ˈwenz.deɪ/ (2)", "/ˈtem.prə.tʃə/ (3)"]
      },
      {
        "pattern": "Nhấn sai vị trí",
        "examples": ["photograph", "photography", "economy", "certificate", "environment", "pronunciation"],
        "examples_ipa": ["/ˈfəʊ.tə.ɡrɑːf/ (1st)", "/fəˈtɒɡ.rə.fi/ (2nd)", "/ɪˈkɒn.ə.mi/ (2nd)", "/səˈtɪf.ɪ.kət/ (2nd)", "/ɪnˈvaɪ.rən.mənt/ (2nd)", "/prəˌnʌn.siˈeɪ.ʃn/ (3rd)"]
      },
      {
        "pattern": "Nguyên âm đọc sai",
        "examples": ["colonel", "women", "said", "friend", "blood", "busy", "tough", "island"],
        "examples_ipa": ["/ˈkɜːnl/ (≠col-o-nel)", "/ˈwɪmɪn/ (≠wo-men)", "/sed/ (≠saɪd)", "/frend/ (≠freɪnd)", "/blʌd/ (≠bluːd)", "/ˈbɪzi/ (≠buːzi)", "/tʌf/ (≠tuːf)", "/ˈaɪlənd/ (s câm)"]
      }
    ],
    "mistakes": [
      "'February' /ˈfeb.rʊ.ər.i/ — KHÔNG phải 'Feb-ru-wa-ry'. Phụ âm /r/ đầu tiên thường bị bỏ, đọc nhanh: /ˈfeb.jʊ.ər.i/",
      "'Wednesday' /ˈwenz.deɪ/ — chỉ 2 âm tiết! KHÔNG đọc 'Wed-nes-day' (3 âm tiết)",
      "'Pronunciation' /prəˌnʌn.siˈeɪ.ʃn/ — KHÔNG phải 'pro-NOUN-ci-a-tion'. Chú ý: không có OU, chỉ có UN!",
      "'Colonel' /ˈkɜːnl/ — đọc như 'kernel'. KHÔNG phải 'col-o-nel'. Từ gốc Pháp mượn vào tiếng Anh qua tiếng Ý.",
      "'Island' /ˈaɪlənd/ — S câm! KHÔNG phải 'iz-land'. Từ này ghép is + land nhưng S không phát âm từ thế kỷ 16"
    ]
  }
}

// ── Inject into phonicsLevels.json ───────────────────────────────────────────

const levelsData = JSON.parse(fs.readFileSync(LEVELS_PATH, 'utf8'))

// Check if already added
if (levelsData.levels.some(l => l.id === 'word-skills')) {
  console.log('⚠️  word-skills level already exists — skipping phonicsLevels.json')
} else {
  const vietIdx = levelsData.levels.findIndex(l => l.id === 'viet-challenges')
  if (vietIdx === -1) {
    console.error('❌  Could not find viet-challenges level')
    process.exit(1)
  }
  levelsData.levels.splice(vietIdx + 1, 0, newLevel)
  fs.writeFileSync(LEVELS_PATH, JSON.stringify(levelsData, null, 2) + '\n', 'utf8')
  console.log(`✅  Added word-skills level at index ${vietIdx + 1} (after viet-challenges, before rules)`)
  console.log(`    ${newLevel.lessons.length} lessons: ${newLevel.lessons.map(l => l.id).join(', ')}`)
}

// ── Inject into phonicsKnowledge.json ────────────────────────────────────────

const knowData = JSON.parse(fs.readFileSync(KNOW_PATH, 'utf8'))
let addedCount = 0

for (const [key, value] of Object.entries(newKnowledge)) {
  if (knowData[key]) {
    console.log(`⚠️  Knowledge entry "${key}" already exists — skipping`)
  } else {
    knowData[key] = value
    addedCount++
    console.log(`✅  Added knowledge entry: ${key}`)
  }
}

if (addedCount > 0) {
  fs.writeFileSync(KNOW_PATH, JSON.stringify(knowData, null, 2) + '\n', 'utf8')
  console.log(`\n📝 Wrote ${addedCount} new entries to phonicsKnowledge.json`)
}

console.log('\nDone! Run: npx tsc --noEmit')
