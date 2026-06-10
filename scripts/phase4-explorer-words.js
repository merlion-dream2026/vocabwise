/**
 * Phase 4: Fix Explorer — 32 dup replacements across 16 topics
 * All replacements verified unique within Explorer level.
 */

const fs = require('fs');
const path = require('path');

const wordsPath = path.join(__dirname, '../data/words.json');
const data = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
const explorer = data['explorer'];

// ─── New word objects ─────────────────────────────────────────────────────────

const W = {
  // science (loses: extinct, fossil, habitat, species)
  microscope: {
    word: 'microscope', meaning: 'kính hiển vi', emoji: '🔬', class: 'n',
    examples: [
      { en: 'We used a microscope to see the tiny cells.', vi: 'Chúng tôi dùng kính hiển vi để quan sát các tế bào nhỏ bé.' },
      { en: 'A microscope magnifies objects hundreds of times.', vi: 'Kính hiển vi phóng đại các vật thể lên hàng trăm lần.' }
    ]
  },
  photosynthesis: {
    word: 'photosynthesis', meaning: 'quang hợp', emoji: '🌿', class: 'n',
    examples: [
      { en: 'Plants use photosynthesis to make food from sunlight.', vi: 'Thực vật sử dụng quang hợp để tạo ra thức ăn từ ánh sáng mặt trời.' },
      { en: 'Photosynthesis releases oxygen into the air.', vi: 'Quang hợp giải phóng oxy vào không khí.' }
    ]
  },
  evolve: {
    word: 'evolve', meaning: 'tiến hóa', emoji: '🧬', class: 'v',
    examples: [
      { en: 'Birds evolved from dinosaurs millions of years ago.', vi: 'Chim tiến hóa từ khủng long hàng triệu năm trước.' },
      { en: 'Species evolve to survive in changing environments.', vi: 'Các loài tiến hóa để tồn tại trong môi trường thay đổi.' }
    ]
  },
  element: {
    word: 'element', meaning: 'nguyên tố hóa học', emoji: '⚗️', class: 'n',
    examples: [
      { en: 'Oxygen is an element essential for life.', vi: 'Oxy là nguyên tố thiết yếu cho sự sống.' },
      { en: 'The periodic table lists all known chemical elements.', vi: 'Bảng tuần hoàn liệt kê tất cả các nguyên tố hóa học đã biết.' }
    ]
  },

  // sports-competition (loses: defeat)
  match: {
    word: 'match', meaning: 'trận đấu', emoji: '⚽', class: 'n',
    examples: [
      { en: 'The football match lasted ninety minutes.', vi: 'Trận bóng đá kéo dài chín mươi phút.' },
      { en: 'Our team won the match by two goals.', vi: 'Đội chúng tôi thắng trận đấu với hai bàn thắng.' }
    ]
  },

  // achievement (loses: qualify)
  milestone: {
    word: 'milestone', meaning: 'cột mốc quan trọng', emoji: '🏁', class: 'n',
    examples: [
      { en: 'Winning the regional championship was a major milestone.', vi: 'Giành chiến thắng tại giải vô địch khu vực là một cột mốc quan trọng.' },
      { en: 'Every milestone motivates us to keep working hard.', vi: 'Mỗi cột mốc tiếp thêm động lực để chúng ta tiếp tục làm việc chăm chỉ.' }
    ]
  },

  // laboratory (loses: analyze)
  hypothesis: {
    word: 'hypothesis', meaning: 'giả thuyết', emoji: '💡', class: 'n',
    examples: [
      { en: 'The scientist formed a hypothesis before the experiment.', vi: 'Nhà khoa học đặt ra giả thuyết trước khi tiến hành thí nghiệm.' },
      { en: 'A good hypothesis must be testable.', vi: 'Một giả thuyết tốt phải có thể kiểm chứng được.' }
    ]
  },

  // critical-thinking (loses: evidence)
  claim: {
    word: 'claim', meaning: 'tuyên bố / khẳng định', emoji: '💬', class: 'n',
    examples: [
      { en: 'You must support every claim with clear evidence.', vi: 'Bạn phải hỗ trợ mỗi tuyên bố bằng bằng chứng rõ ràng.' },
      { en: 'His claim turned out to be false.', vi: 'Tuyên bố của anh ấy hóa ra là sai.' }
    ]
  },

  // engineering (loses: design)
  prototype: {
    word: 'prototype', meaning: 'bản thử nghiệm / nguyên mẫu', emoji: '🛠️', class: 'n',
    examples: [
      { en: 'The team built a prototype to test the new engine.', vi: 'Nhóm đã chế tạo một nguyên mẫu để thử nghiệm động cơ mới.' },
      { en: 'A prototype reveals design flaws before mass production.', vi: 'Một nguyên mẫu tiết lộ các lỗi thiết kế trước khi sản xuất hàng loạt.' }
    ]
  },

  // architecture (loses: structure)
  entrance: {
    word: 'entrance', meaning: 'lối vào', emoji: '🚪', class: 'n',
    examples: [
      { en: 'The grand entrance was decorated with marble columns.', vi: 'Lối vào hoành tráng được trang trí bằng các cột đá cẩm thạch.' },
      { en: 'Visitors gather at the museum entrance before opening.', vi: 'Du khách tập trung ở lối vào bảo tàng trước giờ mở cửa.' }
    ]
  },

  // mission (loses: strategy)
  quest: {
    word: 'quest', meaning: 'cuộc tìm kiếm / hành trình', emoji: '⚔️', class: 'n',
    examples: [
      { en: 'The knight set off on a quest to find the lost treasure.', vi: 'Hiệp sĩ lên đường trong một hành trình để tìm kho báu bị mất.' },
      { en: 'Her quest for knowledge led her around the world.', vi: 'Hành trình tìm kiếm kiến thức của cô đã đưa cô đi khắp thế giới.' }
    ]
  },

  // environment (loses: glacier)
  atmosphere: {
    word: 'atmosphere', meaning: 'khí quyển / bầu không khí', emoji: '🌫️', class: 'n',
    examples: [
      { en: 'The atmosphere protects Earth from harmful radiation.', vi: 'Khí quyển bảo vệ Trái Đất khỏi bức xạ có hại.' },
      { en: 'Greenhouse gases are warming the atmosphere rapidly.', vi: 'Khí nhà kính đang làm ấm khí quyển một cách nhanh chóng.' }
    ]
  },

  // climate-change (loses: conservation, sustainable, renewable, deforestation, pollution, emission)
  heatwave: {
    word: 'heatwave', meaning: 'đợt nắng nóng', emoji: '🌡️', class: 'n',
    examples: [
      { en: 'A severe heatwave struck Europe last summer.', vi: 'Một đợt nắng nóng khắc nghiệt đã tấn công châu Âu vào mùa hè năm ngoái.' },
      { en: 'Heatwaves are becoming longer and more intense.', vi: 'Các đợt nắng nóng đang ngày càng kéo dài và dữ dội hơn.' }
    ]
  },
  wildfire: {
    word: 'wildfire', meaning: 'cháy rừng', emoji: '🔥', class: 'n',
    examples: [
      { en: 'Wildfires destroyed thousands of hectares of forest.', vi: 'Cháy rừng đã phá hủy hàng nghìn héc-ta rừng.' },
      { en: 'Climate change is making wildfires more frequent.', vi: 'Biến đổi khí hậu đang làm cho cháy rừng xảy ra thường xuyên hơn.' }
    ]
  },
  iceberg: {
    word: 'iceberg', meaning: 'tảng băng trôi', emoji: '🧊', class: 'n',
    examples: [
      { en: 'Most of an iceberg is hidden below the water.', vi: 'Phần lớn của tảng băng trôi ẩn dưới mặt nước.' },
      { en: 'Melting icebergs contribute to rising sea levels.', vi: 'Tảng băng trôi tan chảy góp phần làm tăng mực nước biển.' }
    ]
  },
  'sea level': {
    word: 'sea level', meaning: 'mực nước biển', emoji: '🌊', class: 'n',
    examples: [
      { en: 'Rising sea levels threaten low-lying coastal cities.', vi: 'Mực nước biển dâng cao đe dọa các thành phố ven biển nằm ở vùng thấp.' },
      { en: 'Scientists measure sea level changes using satellites.', vi: 'Các nhà khoa học đo lường sự thay đổi mực nước biển bằng vệ tinh.' }
    ]
  },
  coral: {
    word: 'coral', meaning: 'san hô', emoji: '🪸', class: 'n',
    examples: [
      { en: 'Coral reefs support a quarter of all marine species.', vi: 'Rạn san hô hỗ trợ một phần tư tất cả các loài biển.' },
      { en: 'Rising temperatures are causing coral bleaching worldwide.', vi: 'Nhiệt độ tăng cao đang gây ra hiện tượng tẩy trắng san hô trên toàn thế giới.' }
    ]
  },
  permafrost: {
    word: 'permafrost', meaning: 'tầng đất đóng băng vĩnh cửu', emoji: '❄️', class: 'n',
    examples: [
      { en: 'Permafrost covers about a quarter of the northern hemisphere.', vi: 'Tầng đất đóng băng vĩnh cửu bao phủ khoảng một phần tư bán cầu bắc.' },
      { en: 'Melting permafrost releases methane, a powerful greenhouse gas.', vi: 'Tầng đất đóng băng tan chảy giải phóng mê-tan, một loại khí nhà kính mạnh.' }
    ]
  },

  // communication (loses: debate, bias, perspective)
  tone: {
    word: 'tone', meaning: 'giọng điệu / ngữ điệu', emoji: '🗣️', class: 'n',
    examples: [
      { en: 'The teacher used a calm tone when explaining the rules.', vi: 'Giáo viên sử dụng giọng điệu bình tĩnh khi giải thích các quy tắc.' },
      { en: 'Your tone of voice can change the meaning of a message.', vi: 'Giọng điệu của bạn có thể thay đổi ý nghĩa của một thông điệp.' }
    ]
  },
  clarify: {
    word: 'clarify', meaning: 'làm rõ / giải thích', emoji: '💡', class: 'v',
    examples: [
      { en: 'Could you clarify what you mean by that?', vi: 'Bạn có thể làm rõ ý bạn muốn nói không?' },
      { en: 'The teacher clarified the instructions before the test.', vi: 'Giáo viên đã làm rõ các hướng dẫn trước bài kiểm tra.' }
    ]
  },
  feedback: {
    word: 'feedback', meaning: 'phản hồi', emoji: '📝', class: 'n',
    examples: [
      { en: 'She asked for feedback on her presentation.', vi: 'Cô ấy đã xin phản hồi về bài thuyết trình của mình.' },
      { en: 'Positive feedback encourages students to improve.', vi: 'Phản hồi tích cực khuyến khích học sinh cải thiện bản thân.' }
    ]
  },

  // music-performance (loses: audience, genre)
  encore: {
    word: 'encore', meaning: 'màn trình diễn thêm', emoji: '🎵', class: 'n',
    examples: [
      { en: 'The crowd cheered for an encore after the concert.', vi: 'Khán giả cổ vũ để có màn trình diễn thêm sau buổi hòa nhạc.' },
      { en: 'The band performed two encore songs at the end.', vi: 'Ban nhạc đã biểu diễn thêm hai bài hát ở phần cuối.' }
    ]
  },
  verse: {
    word: 'verse', meaning: 'lời bài hát / khổ thơ', emoji: '🎤', class: 'n',
    examples: [
      { en: 'She memorised every verse of the song.', vi: 'Cô ấy đã thuộc lòng từng lời của bài hát.' },
      { en: 'The first verse sets the mood of the story.', vi: 'Khổ thơ đầu tiên tạo nên không khí của câu chuyện.' }
    ]
  },

  // digital-life (loses: algorithm, data, cloud, virtual, misinformation)
  'social media': {
    word: 'social media', meaning: 'mạng xã hội', emoji: '📱', class: 'n',
    examples: [
      { en: 'She spends two hours a day on social media.', vi: 'Cô ấy dành hai tiếng mỗi ngày trên mạng xã hội.' },
      { en: 'Social media can spread news very quickly.', vi: 'Mạng xã hội có thể lan truyền tin tức rất nhanh chóng.' }
    ]
  },
  download: {
    word: 'download', meaning: 'tải xuống', emoji: '⬇️', class: 'v',
    examples: [
      { en: 'I need to download the app before I can use it.', vi: 'Tôi cần tải ứng dụng xuống trước khi sử dụng.' },
      { en: 'The file took ten minutes to download.', vi: 'Tập tin mất mười phút để tải xuống.' }
    ]
  },
  password: {
    word: 'password', meaning: 'mật khẩu', emoji: '🔑', class: 'n',
    examples: [
      { en: 'Use a strong password to protect your account.', vi: 'Hãy sử dụng mật khẩu mạnh để bảo vệ tài khoản của bạn.' },
      { en: 'Never share your password with anyone.', vi: 'Không bao giờ chia sẻ mật khẩu của bạn với bất kỳ ai.' }
    ]
  },
  notification: {
    word: 'notification', meaning: 'thông báo', emoji: '🔔', class: 'n',
    examples: [
      { en: 'She turned off notifications to focus on studying.', vi: 'Cô ấy tắt thông báo để tập trung học bài.' },
      { en: 'I got a notification that my parcel had arrived.', vi: 'Tôi nhận được thông báo rằng gói hàng của tôi đã đến.' }
    ]
  },
  virus: {
    word: 'virus', meaning: 'vi-rút máy tính / vi-rút', emoji: '🦠', class: 'n',
    examples: [
      { en: 'A computer virus can damage your files and steal data.', vi: 'Một vi-rút máy tính có thể làm hỏng các tệp của bạn và đánh cắp dữ liệu.' },
      { en: 'Install antivirus software to protect your device.', vi: 'Cài đặt phần mềm diệt vi-rút để bảo vệ thiết bị của bạn.' }
    ]
  },

  // history (loses: democracy, treaty)
  siege: {
    word: 'siege', meaning: 'cuộc vây hãm', emoji: '🏰', class: 'n',
    examples: [
      { en: 'The city fell after a three-month siege.', vi: 'Thành phố thất thủ sau một cuộc vây hãm kéo dài ba tháng.' },
      { en: 'Soldiers laid siege to the castle for weeks.', vi: 'Binh lính vây hãm lâu đài trong nhiều tuần.' }
    ]
  },
  exile: {
    word: 'exile', meaning: 'lưu đày / sống lưu vong', emoji: '🌍', class: 'n',
    examples: [
      { en: 'The king was sent into exile after losing the war.', vi: 'Nhà vua bị đày đi lưu vong sau khi thua trận.' },
      { en: 'She spent ten years in exile before returning home.', vi: 'Cô ấy đã sống lưu vong mười năm trước khi trở về nhà.' }
    ]
  },

  // business-startup (loses: profit)
  partnership: {
    word: 'partnership', meaning: 'hợp tác / quan hệ đối tác', emoji: '🤝', class: 'n',
    examples: [
      { en: 'The two companies formed a partnership to develop the app.', vi: 'Hai công ty đã hình thành quan hệ đối tác để phát triển ứng dụng.' },
      { en: 'A strong partnership requires trust and clear communication.', vi: 'Một mối quan hệ đối tác vững chắc đòi hỏi sự tin tưởng và giao tiếp rõ ràng.' }
    ]
  },

  // global-issues (loses: poverty)
  humanitarian: {
    word: 'humanitarian', meaning: 'nhân đạo', emoji: '❤️', class: 'adj',
    examples: [
      { en: 'Aid workers provided humanitarian assistance to flood victims.', vi: 'Các nhân viên cứu trợ đã cung cấp hỗ trợ nhân đạo cho các nạn nhân lũ lụt.' },
      { en: 'The crisis demands an urgent humanitarian response.', vi: 'Cuộc khủng hoảng đòi hỏi phản ứng nhân đạo khẩn cấp.' }
    ]
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTopic(id) {
  const t = explorer.topics.find(x => x.id === id);
  if (!t) throw new Error(`Topic "${id}" not found`);
  return t;
}

function replaceWord(topic, oldWord, newWordObj) {
  const idx = topic.words.findIndex(w => w.word.toLowerCase() === oldWord.toLowerCase());
  if (idx === -1) throw new Error(`"${oldWord}" not found in "${topic.id}"`);
  topic.words[idx] = newWordObj;
  console.log(`  [${topic.id}] "${oldWord}" → "${newWordObj.word}"`);
}

// ─── Apply changes ────────────────────────────────────────────────────────────

console.log('\n=== Phase 4: Explorer word changes ===\n');

// science: extinct→microscope, fossil→photosynthesis, habitat→evolve, species→element
const sci = getTopic('science');
replaceWord(sci, 'extinct', W.microscope);
replaceWord(sci, 'fossil', W.photosynthesis);
replaceWord(sci, 'habitat', W.evolve);
replaceWord(sci, 'species', W.element);

// sports-competition: defeat→match
replaceWord(getTopic('sports-competition'), 'defeat', W.match);

// achievement: qualify→milestone
replaceWord(getTopic('achievement'), 'qualify', W.milestone);

// laboratory: analyze→hypothesis
replaceWord(getTopic('laboratory'), 'analyze', W.hypothesis);

// critical-thinking: evidence→claim
replaceWord(getTopic('critical-thinking'), 'evidence', W.claim);

// engineering: design→prototype
replaceWord(getTopic('engineering'), 'design', W.prototype);

// architecture: structure→entrance
replaceWord(getTopic('architecture'), 'structure', W.entrance);

// mission: strategy→quest
replaceWord(getTopic('mission'), 'strategy', W.quest);

// environment: glacier→atmosphere
replaceWord(getTopic('environment'), 'glacier', W.atmosphere);

// climate-change: 6 replacements
const cc = getTopic('climate-change');
replaceWord(cc, 'conservation', W.heatwave);
replaceWord(cc, 'sustainable', W.wildfire);
replaceWord(cc, 'renewable', W.iceberg);
replaceWord(cc, 'deforestation', W['sea level']);
replaceWord(cc, 'pollution', W.coral);
replaceWord(cc, 'emission', W.permafrost);

// communication: debate→tone, bias→clarify, perspective→feedback
const comm = getTopic('communication');
replaceWord(comm, 'debate', W.tone);
replaceWord(comm, 'bias', W.clarify);
replaceWord(comm, 'perspective', W.feedback);

// music-performance: audience→encore, genre→verse
const music = getTopic('music-performance');
replaceWord(music, 'audience', W.encore);
replaceWord(music, 'genre', W.verse);

// digital-life: algorithm→social media, data→download, cloud→password, virtual→notification, misinformation→virus
const dl = getTopic('digital-life');
replaceWord(dl, 'algorithm', W['social media']);
replaceWord(dl, 'data', W.download);
replaceWord(dl, 'cloud', W.password);
replaceWord(dl, 'virtual', W.notification);
replaceWord(dl, 'misinformation', W.virus);

// history: democracy→siege, treaty→exile
const hist = getTopic('history');
replaceWord(hist, 'democracy', W.siege);
replaceWord(hist, 'treaty', W.exile);

// business-startup: profit→partnership
replaceWord(getTopic('business-startup'), 'profit', W.partnership);

// global-issues: poverty→humanitarian
replaceWord(getTopic('global-issues'), 'poverty', W.humanitarian);

// ─── Verify ───────────────────────────────────────────────────────────────────

console.log('\n=== Verification ===\n');
const allWords = explorer.topics.flatMap(t => t.words.map(w => w.word.toLowerCase()));
const uniqueSet = new Set(allWords);
console.log(`Total: ${allWords.length} (expected: 400)`);
console.log(`Unique: ${uniqueSet.size} (expected: 400)`);

if (allWords.length !== 400 || uniqueSet.size !== 400) {
  const seen = {};
  allWords.forEach(w => { seen[w] = (seen[w] || 0) + 1; });
  const dups = Object.entries(seen).filter(([, c]) => c > 1);
  if (dups.length) console.log('Remaining dups:', dups);
  process.exit(1);
}

console.log('\n✅ Explorer words: 400 total, 400 unique\n');

fs.writeFileSync(wordsPath, JSON.stringify(data, null, 2));
console.log('✅ data/words.json updated');
