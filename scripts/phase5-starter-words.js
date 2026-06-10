/**
 * Phase 5: Fix Starter — 44 dup replacements across 15 topics
 */

const fs = require('fs');
const path = require('path');

const wordsPath = path.join(__dirname, '../data/words.json');
const data = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
const starter = data['starter'];

// ─── New word objects (A1 level) ──────────────────────────────────────────────

const W = {
  // animals: fish → lizard
  lizard: {
    word: 'lizard', meaning: 'thằn lằn', emoji: '🦎', class: 'n',
    examples: [
      { en: 'A lizard sits on the warm rock.', vi: 'Một con thằn lằn ngồi trên tảng đá ấm.' },
      { en: 'The green lizard runs away quickly.', vi: 'Con thằn lằn xanh chạy đi nhanh chóng.' }
    ]
  },

  // food: apple→noodle, banana→butter, cake→soup, carrot→rice
  noodle: {
    word: 'noodle', meaning: 'mì / bún', emoji: '🍜', class: 'n',
    examples: [
      { en: 'I eat hot noodle soup for lunch.', vi: 'Tôi ăn mì nóng vào bữa trưa.' },
      { en: 'She puts noodle in the bowl.', vi: 'Cô ấy cho mì vào tô.' }
    ]
  },
  butter: {
    word: 'butter', meaning: 'bơ', emoji: '🧈', class: 'n',
    examples: [
      { en: 'I put butter on my bread.', vi: 'Tôi phết bơ lên bánh mì.' },
      { en: 'Butter makes the cake taste good.', vi: 'Bơ làm cho chiếc bánh ngon hơn.' }
    ]
  },
  soup: {
    word: 'soup', meaning: 'súp / canh', emoji: '🍲', class: 'n',
    examples: [
      { en: 'Mum makes hot soup for dinner.', vi: 'Mẹ nấu canh nóng cho bữa tối.' },
      { en: 'I like chicken soup.', vi: 'Tôi thích canh gà.' }
    ]
  },
  rice: {
    word: 'rice', meaning: 'cơm / gạo', emoji: '🍚', class: 'n',
    examples: [
      { en: 'We eat rice every day.', vi: 'Chúng tôi ăn cơm mỗi ngày.' },
      { en: 'The rice is hot and delicious.', vi: 'Cơm nóng và ngon lắm.' }
    ]
  },

  // toys: bike→puppet, sing→paint, dance→juggle, play→bounce
  puppet: {
    word: 'puppet', meaning: 'con rối', emoji: '🎭', class: 'n',
    examples: [
      { en: 'She plays with a hand puppet.', vi: 'Cô bé chơi với con rối tay.' },
      { en: 'The puppet show made us laugh.', vi: 'Chương trình rối khiến chúng tôi cười.' }
    ]
  },
  paint: {
    word: 'paint', meaning: 'vẽ màu / sơn', emoji: '🎨', class: 'v',
    examples: [
      { en: 'I paint a rainbow with bright colours.', vi: 'Tôi vẽ một cầu vồng với những màu sắc rực rỡ.' },
      { en: 'He likes to paint pictures of animals.', vi: 'Cậu bé thích vẽ tranh các loài động vật.' }
    ]
  },
  juggle: {
    word: 'juggle', meaning: 'tung hứng', emoji: '🤹', class: 'v',
    examples: [
      { en: 'The clown can juggle three balls at once.', vi: 'Chú hề có thể tung hứng ba quả bóng một lúc.' },
      { en: 'I want to learn how to juggle.', vi: 'Tôi muốn học cách tung hứng.' }
    ]
  },
  bounce: {
    word: 'bounce', meaning: 'nảy / bật nảy', emoji: '⚽', class: 'v',
    examples: [
      { en: 'The ball bounces on the ground.', vi: 'Quả bóng nảy trên mặt đất.' },
      { en: 'Children bounce on the trampoline.', vi: 'Các em nhỏ nhảy bật nảy trên tấm bạt.' }
    ]
  },

  // school: teacher→classmate, homework→quiz
  classmate: {
    word: 'classmate', meaning: 'bạn cùng lớp', emoji: '👦', class: 'n',
    examples: [
      { en: 'My classmate sits next to me.', vi: 'Bạn cùng lớp của tôi ngồi cạnh tôi.' },
      { en: 'We help each other with our work.', vi: 'Chúng tôi giúp nhau làm bài.' }
    ]
  },
  quiz: {
    word: 'quiz', meaning: 'bài kiểm tra ngắn', emoji: '✏️', class: 'n',
    examples: [
      { en: 'We have a maths quiz today.', vi: 'Hôm nay chúng tôi có bài kiểm tra toán ngắn.' },
      { en: 'The quiz has ten questions.', vi: 'Bài kiểm tra có mười câu hỏi.' }
    ]
  },

  // fruits-vegetables: orange → lemon
  lemon: {
    word: 'lemon', meaning: 'chanh vàng', emoji: '🍋', class: 'n',
    examples: [
      { en: 'A lemon is yellow and sour.', vi: 'Chanh vàng có màu vàng và chua.' },
      { en: 'I put lemon in my tea.', vi: 'Tôi bỏ chanh vào trà của tôi.' }
    ]
  },

  // daily-routine: dress → exercise
  exercise: {
    word: 'exercise', meaning: 'tập thể dục', emoji: '🏃', class: 'n',
    examples: [
      { en: 'I do exercise every morning.', vi: 'Tôi tập thể dục mỗi buổi sáng.' },
      { en: 'Running is a great exercise.', vi: 'Chạy bộ là bài tập thể dục tuyệt vời.' }
    ]
  },

  // parties-celebrations: happy → confetti
  confetti: {
    word: 'confetti', meaning: 'giấy vụn / hoa giấy', emoji: '🎊', class: 'n',
    examples: [
      { en: 'We throw confetti at the party.', vi: 'Chúng tôi tung hoa giấy tại bữa tiệc.' },
      { en: 'Colourful confetti fell from the sky.', vi: 'Những mảnh hoa giấy đầy màu sắc rơi xuống từ trên cao.' }
    ]
  },

  // outdoor-nature: bird→firefly, rainbow→meadow
  firefly: {
    word: 'firefly', meaning: 'đom đóm', emoji: '✨', class: 'n',
    examples: [
      { en: 'Fireflies glow in the dark at night.', vi: 'Đom đóm phát sáng trong bóng tối vào ban đêm.' },
      { en: 'We watched the fireflies in the garden.', vi: 'Chúng tôi ngắm những con đom đóm trong vườn.' }
    ]
  },
  meadow: {
    word: 'meadow', meaning: 'đồng cỏ', emoji: '🌾', class: 'n',
    examples: [
      { en: 'Flowers grow in the green meadow.', vi: 'Hoa mọc trên đồng cỏ xanh.' },
      { en: 'Cows eat grass in the meadow.', vi: 'Bò ăn cỏ trên đồng cỏ.' }
    ]
  },

  // sea: dolphin→ocean, shark→pier, turtle→sailor, crab→current, whale→voyage, jellyfish→harbour, octopus→coast, coral→submarine, wave→compass
  ocean: {
    word: 'ocean', meaning: 'đại dương', emoji: '🌊', class: 'n',
    examples: [
      { en: 'The ocean is deep and wide.', vi: 'Đại dương sâu và rộng.' },
      { en: 'Many fish live in the ocean.', vi: 'Nhiều loài cá sống trong đại dương.' }
    ]
  },
  pier: {
    word: 'pier', meaning: 'cầu tàu', emoji: '⛵', class: 'n',
    examples: [
      { en: 'We fish from the pier.', vi: 'Chúng tôi câu cá từ cầu tàu.' },
      { en: 'The boat is tied to the pier.', vi: 'Con thuyền được buộc vào cầu tàu.' }
    ]
  },
  sailor: {
    word: 'sailor', meaning: 'thủy thủ', emoji: '⚓', class: 'n',
    examples: [
      { en: 'The sailor steers the big ship.', vi: 'Người thủy thủ lái con tàu lớn.' },
      { en: 'Sailors work hard on the sea.', vi: 'Các thủy thủ làm việc chăm chỉ trên biển.' }
    ]
  },
  current: {
    word: 'current', meaning: 'dòng chảy / dòng nước', emoji: '🌀', class: 'n',
    examples: [
      { en: 'The current carries the boat downstream.', vi: 'Dòng chảy mang con thuyền xuôi dòng.' },
      { en: 'Swim away from the strong current.', vi: 'Bơi ra xa dòng chảy mạnh.' }
    ]
  },
  voyage: {
    word: 'voyage', meaning: 'chuyến đi biển', emoji: '🚢', class: 'n',
    examples: [
      { en: 'The sailors set off on a long voyage.', vi: 'Các thủy thủ lên đường cho một chuyến đi biển dài.' },
      { en: 'It was a voyage across the ocean.', vi: 'Đó là một chuyến đi vượt đại dương.' }
    ]
  },
  harbour: {
    word: 'harbour', meaning: 'bến cảng', emoji: '⚓', class: 'n',
    examples: [
      { en: 'The boats rest in the harbour.', vi: 'Các con thuyền nghỉ ngơi trong bến cảng.' },
      { en: 'We watched the ships from the harbour.', vi: 'Chúng tôi ngắm tàu từ bến cảng.' }
    ]
  },
  coast: {
    word: 'coast', meaning: 'bờ biển', emoji: '🏖️', class: 'n',
    examples: [
      { en: 'We walked along the rocky coast.', vi: 'Chúng tôi đi dọc theo bờ biển đầy đá.' },
      { en: 'The town is near the coast.', vi: 'Thị trấn nằm gần bờ biển.' }
    ]
  },
  submarine: {
    word: 'submarine', meaning: 'tàu ngầm', emoji: '🤿', class: 'n',
    examples: [
      { en: 'A submarine can travel deep under the sea.', vi: 'Tàu ngầm có thể đi sâu dưới đáy biển.' },
      { en: 'The submarine dives below the waves.', vi: 'Tàu ngầm lặn xuống dưới những con sóng.' }
    ]
  },
  compass: {
    word: 'compass', meaning: 'la bàn', emoji: '🧭', class: 'n',
    examples: [
      { en: 'A compass shows which way is north.', vi: 'La bàn chỉ hướng bắc.' },
      { en: 'The sailor uses a compass at sea.', vi: 'Thủy thủ sử dụng la bàn trên biển.' }
    ]
  },

  // music: brush → beat
  beat: {
    word: 'beat', meaning: 'nhịp / nhịp điệu', emoji: '🥁', class: 'n',
    examples: [
      { en: 'Tap your foot to the beat of the song.', vi: 'Gõ chân theo nhịp của bài hát.' },
      { en: 'The drummer keeps the beat steady.', vi: 'Tay trống giữ nhịp đều.' }
    ]
  },

  // nature: tree→cave, flower→cliff, leaf→pond, grass→soil, river→moss, mountain→canyon
  cave: {
    word: 'cave', meaning: 'hang động', emoji: '🕳️', class: 'n',
    examples: [
      { en: 'Bats live inside the dark cave.', vi: 'Dơi sống bên trong hang động tối tăm.' },
      { en: 'We explored a big cave in the hills.', vi: 'Chúng tôi khám phá một hang động lớn trên đồi.' }
    ]
  },
  cliff: {
    word: 'cliff', meaning: 'vách đá', emoji: '🏔️', class: 'n',
    examples: [
      { en: 'Birds nest on the rocky cliff.', vi: 'Chim làm tổ trên vách đá.' },
      { en: 'We stood at the top of the cliff.', vi: 'Chúng tôi đứng trên đỉnh vách đá.' }
    ]
  },
  pond: {
    word: 'pond', meaning: 'ao / hồ nhỏ', emoji: '🐸', class: 'n',
    examples: [
      { en: 'Frogs jump into the pond.', vi: 'Ếch nhảy vào ao.' },
      { en: 'There are ducks on the pond.', vi: 'Có những con vịt trên ao.' }
    ]
  },
  soil: {
    word: 'soil', meaning: 'đất / đất trồng', emoji: '🌱', class: 'n',
    examples: [
      { en: 'Plants grow in the dark soil.', vi: 'Cây mọc trong đất tối màu.' },
      { en: 'We dig in the soil to plant seeds.', vi: 'Chúng tôi đào đất để trồng hạt.' }
    ]
  },
  moss: {
    word: 'moss', meaning: 'rêu', emoji: '🌿', class: 'n',
    examples: [
      { en: 'Green moss covers the old stone.', vi: 'Rêu xanh bao phủ tảng đá cũ.' },
      { en: 'The forest floor is covered in soft moss.', vi: 'Sàn rừng được phủ đầy rêu mềm.' }
    ]
  },
  canyon: {
    word: 'canyon', meaning: 'hẻm núi / thung lũng sâu', emoji: '🏜️', class: 'n',
    examples: [
      { en: 'A river flows through the deep canyon.', vi: 'Một con sông chảy qua hẻm núi sâu.' },
      { en: 'The canyon walls are very tall.', vi: 'Những vách hẻm núi rất cao.' }
    ]
  },

  // princess-magic: forest → unicorn
  unicorn: {
    word: 'unicorn', meaning: 'kỳ lân', emoji: '🦄', class: 'n',
    examples: [
      { en: 'The unicorn has a golden horn.', vi: 'Con kỳ lân có chiếc sừng vàng.' },
      { en: 'A unicorn runs through the magic forest.', vi: 'Một con kỳ lân chạy qua khu rừng ma thuật.' }
    ]
  },

  // describing-things: square → smooth
  smooth: {
    word: 'smooth', meaning: 'mịn / nhẵn', emoji: '🪨', class: 'adj',
    examples: [
      { en: 'The stone is smooth and flat.', vi: 'Hòn đá nhẵn và phẳng.' },
      { en: 'Her hair is long and smooth.', vi: 'Tóc cô ấy dài và mượt mà.' }
    ]
  },

  // city-places: shop → stadium
  stadium: {
    word: 'stadium', meaning: 'sân vận động', emoji: '🏟️', class: 'n',
    examples: [
      { en: 'We watch football at the big stadium.', vi: 'Chúng tôi xem bóng đá ở sân vận động lớn.' },
      { en: 'The stadium is full of fans.', vi: 'Sân vận động đầy những người hâm mộ.' }
    ]
  },

  // cooking: cut→prepare, mix→simmer, boil→sauce, fry→recipe, bake→dough, stir→knead, pour→batter, taste→wrap, wash→whisk
  prepare: {
    word: 'prepare', meaning: 'chuẩn bị', emoji: '🍳', class: 'v',
    examples: [
      { en: 'Mum prepares lunch for the family.', vi: 'Mẹ chuẩn bị bữa trưa cho gia đình.' },
      { en: 'We prepare the vegetables before cooking.', vi: 'Chúng tôi chuẩn bị rau trước khi nấu.' }
    ]
  },
  simmer: {
    word: 'simmer', meaning: 'đun nhỏ lửa', emoji: '♨️', class: 'v',
    examples: [
      { en: 'Let the soup simmer for twenty minutes.', vi: 'Để súp đun nhỏ lửa trong hai mươi phút.' },
      { en: 'Simmer the sauce until it thickens.', vi: 'Đun nhỏ lửa nước sốt cho đến khi nó đặc lại.' }
    ]
  },
  sauce: {
    word: 'sauce', meaning: 'nước sốt / nước chấm', emoji: '🍅', class: 'n',
    examples: [
      { en: 'She pours tomato sauce on the pasta.', vi: 'Cô ấy rưới nước sốt cà chua lên mì ống.' },
      { en: 'The sauce is sweet and spicy.', vi: 'Nước sốt có vị ngọt và cay.' }
    ]
  },
  recipe: {
    word: 'recipe', meaning: 'công thức nấu ăn', emoji: '📖', class: 'n',
    examples: [
      { en: 'Follow the recipe to make the cake.', vi: 'Làm theo công thức để làm bánh.' },
      { en: 'Grandma has a secret recipe.', vi: 'Bà ngoại có công thức bí mật.' }
    ]
  },
  dough: {
    word: 'dough', meaning: 'bột nhào', emoji: '🫓', class: 'n',
    examples: [
      { en: 'We roll the dough flat to make bread.', vi: 'Chúng tôi cán bột mỏng để làm bánh mì.' },
      { en: 'The dough needs to rise for one hour.', vi: 'Bột nhào cần ủ trong một giờ.' }
    ]
  },
  knead: {
    word: 'knead', meaning: 'nhào bột', emoji: '👐', class: 'v',
    examples: [
      { en: 'Knead the dough for ten minutes.', vi: 'Nhào bột trong mười phút.' },
      { en: 'She kneads the bread dough by hand.', vi: 'Cô ấy nhào bột bánh mì bằng tay.' }
    ]
  },
  batter: {
    word: 'batter', meaning: 'hỗn hợp bột lỏng', emoji: '🥞', class: 'n',
    examples: [
      { en: 'Pour the batter into the pan.', vi: 'Đổ hỗn hợp bột vào chảo.' },
      { en: 'Mix the batter until it is smooth.', vi: 'Trộn hỗn hợp bột cho đến khi mịn.' }
    ]
  },
  wrap: {
    word: 'wrap', meaning: 'gói / quấn', emoji: '🌯', class: 'v',
    examples: [
      { en: 'Wrap the sandwich in paper.', vi: 'Gói bánh sandwich trong giấy.' },
      { en: 'She wraps the food to keep it fresh.', vi: 'Cô ấy gói thức ăn để giữ tươi.' }
    ]
  },
  whisk: {
    word: 'whisk', meaning: 'đánh trứng / khuấy nhanh', emoji: '🥄', class: 'v',
    examples: [
      { en: 'Whisk the eggs until fluffy.', vi: 'Đánh trứng cho đến khi bông lên.' },
      { en: 'She whisks the cream in a bowl.', vi: 'Cô ấy đánh kem trong một cái tô.' }
    ]
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTopic(id) {
  const t = starter.topics.find(x => x.id === id);
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

console.log('\n=== Phase 5: Starter word changes ===\n');

// animals: fish → lizard
replaceWord(getTopic('animals'), 'fish', W.lizard);

// food: apple→noodle, banana→butter, cake→soup, carrot→rice
const food = getTopic('food');
replaceWord(food, 'apple', W.noodle);
replaceWord(food, 'banana', W.butter);
replaceWord(food, 'cake', W.soup);
replaceWord(food, 'carrot', W.rice);

// toys: bike→puppet, sing→paint, dance→juggle, play→bounce
const toys = getTopic('toys');
replaceWord(toys, 'bike', W.puppet);
replaceWord(toys, 'sing', W.paint);
replaceWord(toys, 'dance', W.juggle);
replaceWord(toys, 'play', W.bounce);

// school: teacher→classmate, homework→quiz
const school = getTopic('school');
replaceWord(school, 'teacher', W.classmate);
replaceWord(school, 'homework', W.quiz);

// fruits-vegetables: orange → lemon
replaceWord(getTopic('fruits-vegetables'), 'orange', W.lemon);

// daily-routine: dress → exercise
replaceWord(getTopic('daily-routine'), 'dress', W.exercise);

// parties-celebrations: happy → confetti
replaceWord(getTopic('parties-celebrations'), 'happy', W.confetti);

// outdoor-nature: bird→firefly, rainbow→meadow
const outdoor = getTopic('outdoor-nature');
replaceWord(outdoor, 'bird', W.firefly);
replaceWord(outdoor, 'rainbow', W.meadow);

// sea: 9 replacements
const sea = getTopic('sea');
replaceWord(sea, 'dolphin', W.ocean);
replaceWord(sea, 'shark', W.pier);
replaceWord(sea, 'turtle', W.sailor);
replaceWord(sea, 'crab', W.current);
replaceWord(sea, 'whale', W.voyage);
replaceWord(sea, 'jellyfish', W.harbour);
replaceWord(sea, 'octopus', W.coast);
replaceWord(sea, 'coral', W.submarine);
replaceWord(sea, 'wave', W.compass);

// music: brush → beat
replaceWord(getTopic('music'), 'brush', W.beat);

// nature: tree→cave, flower→cliff, leaf→pond, grass→soil, river→moss, mountain→canyon
const nature = getTopic('nature');
replaceWord(nature, 'tree', W.cave);
replaceWord(nature, 'flower', W.cliff);
replaceWord(nature, 'leaf', W.pond);
replaceWord(nature, 'grass', W.soil);
replaceWord(nature, 'river', W.moss);
replaceWord(nature, 'mountain', W.canyon);

// princess-magic: forest → unicorn
replaceWord(getTopic('princess-magic'), 'forest', W.unicorn);

// describing-things: square → smooth
replaceWord(getTopic('describing-things'), 'square', W.smooth);

// city-places: shop → stadium
replaceWord(getTopic('city-places'), 'shop', W.stadium);

// cooking: cut→prepare, mix→simmer, boil→sauce, fry→recipe, bake→dough, stir→knead, pour→batter, taste→wrap, wash→whisk
const cooking = getTopic('cooking');
replaceWord(cooking, 'cut', W.prepare);
replaceWord(cooking, 'mix', W.simmer);
replaceWord(cooking, 'boil', W.sauce);
replaceWord(cooking, 'fry', W.recipe);
replaceWord(cooking, 'bake', W.dough);
replaceWord(cooking, 'stir', W.knead);
replaceWord(cooking, 'pour', W.batter);
replaceWord(cooking, 'taste', W.wrap);
replaceWord(cooking, 'wash', W.whisk);

// ─── Verify ───────────────────────────────────────────────────────────────────

console.log('\n=== Verification ===\n');
const allWords = starter.topics.flatMap(t => t.words.map(w => w.word.toLowerCase()));
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

console.log('\n✅ Starter words: 400 total, 400 unique\n');

fs.writeFileSync(wordsPath, JSON.stringify(data, null, 2));
console.log('✅ data/words.json updated');
