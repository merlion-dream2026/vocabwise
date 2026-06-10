/**
 * Phase 1: Update Scholar words.json
 * - 17 dup replacements + 4 word trims
 * - Total: 404 → 400 words, 387 → 400 unique
 */

const fs = require('fs');
const path = require('path');

const wordsPath = path.join(__dirname, '../data/words.json');
const data = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
const scholar = data['scholar'];

// ─── New word objects ────────────────────────────────────────────────────────

const NEW_WORDS = {
  composition: {
    word: 'composition',
    meaning: 'bố cục / cách sắp xếp',
    emoji: '🎨',
    class: 'n',
    examples: [
      { en: "The painting's composition draws the viewer's eye towards the centre.", vi: 'Bố cục của bức tranh thu hút ánh nhìn của người xem về phía trung tâm.' },
      { en: 'Studying composition helps artists balance elements within a frame.', vi: 'Nghiên cứu bố cục giúp các nghệ sĩ cân bằng các yếu tố trong một khung hình.' }
    ]
  },
  endorsement: {
    word: 'endorsement',
    meaning: 'sự chứng thực / ủng hộ',
    emoji: '✅',
    class: 'n',
    examples: [
      { en: 'The brand secured a celebrity endorsement to boost its visibility.', vi: 'Thương hiệu đã có được sự chứng thực của người nổi tiếng để tăng khả năng hiển thị.' },
      { en: 'Political endorsements can significantly influence voter decisions.', vi: 'Sự ủng hộ chính trị có thể ảnh hưởng đáng kể đến quyết định của cử tri.' }
    ]
  },
  holistic: {
    word: 'holistic',
    meaning: 'toàn diện / tổng thể',
    emoji: '🌿',
    class: 'adj',
    examples: [
      { en: 'A holistic approach to wellness considers both mental and physical health.', vi: 'Cách tiếp cận toàn diện về sức khỏe xem xét cả sức khỏe tinh thần lẫn thể chất.' },
      { en: 'The school adopted a holistic curriculum that included arts and sport.', vi: 'Trường đã áp dụng chương trình giảng dạy toàn diện bao gồm cả nghệ thuật và thể thao.' }
    ]
  },
  deterrence: {
    word: 'deterrence',
    meaning: 'sự răn đe',
    emoji: '🚫',
    class: 'n',
    examples: [
      { en: 'Heavier sentences act as a deterrence against serious crime.', vi: 'Bản án nặng hơn có tác dụng răn đe tội phạm nghiêm trọng.' },
      { en: 'Nuclear deterrence shaped the foreign policy of the Cold War era.', vi: 'Sự răn đe hạt nhân đã định hình chính sách đối ngoại của thời kỳ Chiến tranh Lạnh.' }
    ]
  },
  conviction: {
    word: 'conviction',
    meaning: 'bản án kết tội',
    emoji: '⚖️',
    class: 'n',
    examples: [
      { en: 'His conviction for fraud led to a five-year prison sentence.', vi: 'Bản án kết tội gian lận của anh ta dẫn đến án tù năm năm.' },
      { en: 'A wrongful conviction can have devastating consequences for the accused.', vi: 'Một bản án kết tội sai có thể gây hậu quả thảm khốc cho bị cáo.' }
    ]
  },
  ideation: {
    word: 'ideation',
    meaning: 'quá trình nảy sinh ý tưởng',
    emoji: '💡',
    class: 'n',
    examples: [
      { en: 'The ideation phase of a project involves generating as many ideas as possible.', vi: 'Giai đoạn nảy sinh ý tưởng của một dự án liên quan đến việc tạo ra càng nhiều ý tưởng càng tốt.' },
      { en: 'Effective ideation requires an open and non-judgmental environment.', vi: 'Quá trình nảy sinh ý tưởng hiệu quả đòi hỏi môi trường cởi mở và không phán xét.' }
    ]
  },
  pilgrimage: {
    word: 'pilgrimage',
    meaning: 'hành hương',
    emoji: '🕌',
    class: 'n',
    examples: [
      { en: 'Millions of Muslims make a pilgrimage to Mecca each year.', vi: 'Hàng triệu người Hồi giáo thực hiện hành hương đến Mecca mỗi năm.' },
      { en: 'Visiting the birthplace of their favourite author felt like a pilgrimage.', vi: 'Việc đến thăm nơi sinh của tác giả yêu thích của họ cảm giác như một cuộc hành hương.' }
    ]
  },
  benchmark: {
    word: 'benchmark',
    meaning: 'tiêu chuẩn đối sánh',
    emoji: '📊',
    class: 'n',
    examples: [
      { en: 'The company set industry benchmarks for customer satisfaction scores.', vi: 'Công ty đặt ra các tiêu chuẩn đối sánh của ngành về điểm hài lòng của khách hàng.' },
      { en: 'These test results serve as a benchmark for measuring student progress.', vi: 'Những kết quả kiểm tra này đóng vai trò là tiêu chuẩn để đo lường tiến bộ của học sinh.' }
    ]
  },
  empowerment: {
    word: 'empowerment',
    meaning: 'sự trao quyền',
    emoji: '💪',
    class: 'n',
    examples: [
      { en: 'Education is a powerful tool for the empowerment of women in society.', vi: 'Giáo dục là công cụ mạnh mẽ để trao quyền cho phụ nữ trong xã hội.' },
      { en: 'Community empowerment programmes help residents take control of local issues.', vi: 'Các chương trình trao quyền cộng đồng giúp cư dân kiểm soát các vấn đề địa phương.' }
    ]
  },
  kinship: {
    word: 'kinship',
    meaning: 'mối quan hệ thân tộc',
    emoji: '👨‍👩‍👧‍👦',
    class: 'n',
    examples: [
      { en: 'A strong sense of kinship binds the extended family together.', vi: 'Cảm giác gắn kết thân tộc mạnh mẽ kết nối đại gia đình lại với nhau.' },
      { en: 'Kinship bonds often provide emotional support during difficult times.', vi: 'Mối quan hệ thân tộc thường cung cấp hỗ trợ tinh thần trong những thời điểm khó khăn.' }
    ]
  },
  complicity: {
    word: 'complicity',
    meaning: 'sự đồng lõa',
    emoji: '🤝',
    class: 'n',
    examples: [
      { en: 'Silence can sometimes be interpreted as complicity in wrongdoing.', vi: 'Sự im lặng đôi khi có thể được hiểu là đồng lõa với việc làm sai trái.' },
      { en: 'The company faced accusations of complicity in human rights violations.', vi: 'Công ty phải đối mặt với cáo buộc đồng lõa trong các vi phạm nhân quyền.' }
    ]
  },
  culpability: {
    word: 'culpability',
    meaning: 'trách nhiệm / lỗi lầm',
    emoji: '⚖️',
    class: 'n',
    examples: [
      { en: 'The investigation sought to determine each party\'s culpability in the accident.', vi: 'Cuộc điều tra nhằm xác định trách nhiệm của mỗi bên trong vụ tai nạn.' },
      { en: 'Moral culpability depends on whether the person acted with intent.', vi: 'Trách nhiệm đạo đức phụ thuộc vào việc người đó có hành động có chủ ý hay không.' }
    ]
  },
  emancipation: {
    word: 'emancipation',
    meaning: 'sự giải phóng',
    emoji: '🕊️',
    class: 'n',
    examples: [
      { en: 'The emancipation of enslaved people was a turning point in American history.', vi: 'Sự giải phóng người bị nô lệ là bước ngoặt trong lịch sử Mỹ.' },
      { en: 'Access to education can be a path to economic emancipation.', vi: 'Tiếp cận giáo dục có thể là con đường dẫn đến sự giải phóng kinh tế.' }
    ]
  },
  deliberation: {
    word: 'deliberation',
    meaning: 'sự cân nhắc kỹ lưỡng',
    emoji: '🤔',
    class: 'n',
    examples: [
      { en: 'After careful deliberation, the jury reached a unanimous verdict.', vi: 'Sau khi cân nhắc kỹ lưỡng, bồi thẩm đoàn đã đi đến phán quyết nhất trí.' },
      { en: 'Ethical decisions require deliberation rather than impulsive reactions.', vi: 'Các quyết định đạo đức đòi hỏi sự cân nhắc kỹ lưỡng hơn là phản ứng bốc đồng.' }
    ]
  },
  premiere: {
    word: 'premiere',
    meaning: 'buổi ra mắt đầu tiên',
    emoji: '🎬',
    class: 'n',
    examples: [
      { en: 'The film\'s premiere attracted celebrities and critics from around the world.', vi: 'Buổi ra mắt bộ phim đã thu hút các ngôi sao và nhà phê bình từ khắp nơi trên thế giới.' },
      { en: 'She was nervous before the premiere of her debut theatrical performance.', vi: 'Cô ấy lo lắng trước buổi ra mắt màn trình diễn sân khấu đầu tay.' }
    ]
  },
  documentary: {
    word: 'documentary',
    meaning: 'phim tài liệu',
    emoji: '🎥',
    class: 'n',
    examples: [
      { en: 'The documentary exposed the environmental damage caused by deforestation.', vi: 'Bộ phim tài liệu đã phơi bày những tác hại môi trường do phá rừng gây ra.' },
      { en: 'Streaming platforms have increased the popularity of nature documentaries.', vi: 'Các nền tảng phát trực tuyến đã làm tăng sự phổ biến của phim tài liệu thiên nhiên.' }
    ]
  },
  spectacle: {
    word: 'spectacle',
    meaning: 'cảnh tượng hoành tráng',
    emoji: '🎭',
    class: 'n',
    examples: [
      { en: 'The opening ceremony was a dazzling spectacle of light and sound.', vi: 'Lễ khai mạc là một cảnh tượng ánh sáng và âm thanh rực rỡ.' },
      { en: 'Critics argued the production had become more spectacle than substance.', vi: 'Các nhà phê bình cho rằng vở diễn đã trở nên hoành tráng hơn là có chiều sâu nội dung.' }
    ]
  }
};

// ─── Helper ──────────────────────────────────────────────────────────────────

function replaceWord(topic, oldWord, newWordObj) {
  const idx = topic.words.findIndex(w => w.word.toLowerCase() === oldWord.toLowerCase());
  if (idx === -1) throw new Error(`Word "${oldWord}" not found in topic "${topic.id}"`);
  topic.words[idx] = newWordObj;
  console.log(`  [${topic.id}] "${oldWord}" → "${newWordObj.word}"`);
}

function removeWord(topic, wordToRemove) {
  const idx = topic.words.findIndex(w => w.word.toLowerCase() === wordToRemove.toLowerCase());
  if (idx === -1) throw new Error(`Word "${wordToRemove}" not found in topic "${topic.id}"`);
  topic.words.splice(idx, 1);
  console.log(`  [${topic.id}] TRIM "${wordToRemove}"`);
}

function getTopic(id) {
  const t = scholar.topics.find(x => x.id === id);
  if (!t) throw new Error(`Topic "${id}" not found`);
  return t;
}

// ─── Apply changes ────────────────────────────────────────────────────────────

console.log('\n=== Phase 1: Scholar word changes ===\n');

// art-culture: TRIM canvas, REPLACE perception → composition
const artCulture = getTopic('art-culture');
removeWord(artCulture, 'canvas');
replaceWord(artCulture, 'perception', NEW_WORDS.composition);

// arts-entertainment: REPLACE exhibition → premiere, genre → documentary, performance → spectacle
const artsEnt = getTopic('arts-entertainment');
replaceWord(artsEnt, 'exhibition', NEW_WORDS.premiere);
replaceWord(artsEnt, 'genre', NEW_WORDS.documentary);
replaceWord(artsEnt, 'performance', NEW_WORDS.spectacle);

// advertising-consumer: REPLACE campaign → endorsement
const adsCon = getTopic('advertising-consumer');
replaceWord(adsCon, 'campaign', NEW_WORDS.endorsement);

// wellbeing-lifestyle: REPLACE sustainable → holistic
const wellbeing = getTopic('wellbeing-lifestyle');
replaceWord(wellbeing, 'sustainable', NEW_WORDS.holistic);

// crime-society: REPLACE prevention → deterrence, consequence → conviction
const crime = getTopic('crime-society');
replaceWord(crime, 'prevention', NEW_WORDS.deterrence);
replaceWord(crime, 'consequence', NEW_WORDS.conviction);

// creativity-innovation: REPLACE prototype → ideation
const creativity = getTopic('creativity-innovation');
replaceWord(creativity, 'prototype', NEW_WORDS.ideation);

// tourism-hospitality: REPLACE heritage → pilgrimage
const tourism = getTopic('tourism-hospitality');
replaceWord(tourism, 'heritage', NEW_WORDS.pilgrimage);

// business-management: REPLACE budget → benchmark
const biz = getTopic('business-management');
replaceWord(biz, 'budget', NEW_WORDS.benchmark);

// family-relationships: REPLACE equality → empowerment, identity → kinship
const family = getTopic('family-relationships');
replaceWord(family, 'equality', NEW_WORDS.empowerment);
replaceWord(family, 'identity', NEW_WORDS.kinship);

// ethical-issues: REPLACE privacy → complicity, responsibility → culpability,
//                          freedom → emancipation, balance → deliberation
const ethics = getTopic('ethical-issues');
replaceWord(ethics, 'privacy', NEW_WORDS.complicity);
replaceWord(ethics, 'responsibility', NEW_WORDS.culpability);
replaceWord(ethics, 'freedom', NEW_WORDS.emancipation);
replaceWord(ethics, 'balance', NEW_WORDS.deliberation);

// media-journalism: TRIM impartial
const media = getTopic('media-journalism');
removeWord(media, 'impartial');

// economics-trade: TRIM import
const econ = getTopic('economics-trade');
removeWord(econ, 'import');

// personal-finance: TRIM afford
const finance = getTopic('personal-finance');
removeWord(finance, 'afford');

// ─── Verify ───────────────────────────────────────────────────────────────────

console.log('\n=== Verification ===\n');
const allWords = scholar.topics.flatMap(t => t.words.map(w => w.word.toLowerCase()));
const uniqueSet = new Set(allWords);
console.log(`Total words: ${allWords.length} (expected: 400)`);
console.log(`Unique words: ${uniqueSet.size} (expected: 400)`);

if (allWords.length !== 400 || uniqueSet.size !== 400) {
  const seen = {};
  allWords.forEach(w => { seen[w] = (seen[w] || 0) + 1; });
  const dups = Object.entries(seen).filter(([w, c]) => c > 1);
  if (dups.length) console.log('Remaining dups:', dups);
  process.exit(1);
}

console.log('\n✅ Scholar words: 400 total, 400 unique\n');

// ─── Write ─────────────────────────────────────────────────────────────────────

fs.writeFileSync(wordsPath, JSON.stringify(data, null, 2));
console.log('✅ data/words.json updated');
