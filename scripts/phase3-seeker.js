/**
 * Phase 3: Fix Seeker — replace "orange" in everyday-food with "soup"
 * Also rewrites the everyday-food story to include all 10 target words.
 */

const fs = require('fs');
const path = require('path');

const wordsPath = path.join(__dirname, '../data/words.json');
const storiesPath = path.join(__dirname, '../data/stories.json');

const data = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
const stories = JSON.parse(fs.readFileSync(storiesPath, 'utf8'));

const seeker = data['seeker'];

// ─── Word change ──────────────────────────────────────────────────────────────

const SOUP = {
  word: 'soup',
  meaning: 'súp',
  emoji: '🍲',
  class: 'n',
  examples: [
    { en: 'Mum makes hot soup for dinner.', vi: 'Mẹ nấu súp nóng cho bữa tối.' },
    { en: 'I like vegetable soup.', vi: 'Tôi thích súp rau củ.' }
  ]
};

function getTopic(id) {
  const t = seeker.topics.find(x => x.id === id);
  if (!t) throw new Error(`Topic "${id}" not found`);
  return t;
}

function replaceWord(topic, oldWord, newWordObj) {
  const idx = topic.words.findIndex(w => w.word.toLowerCase() === oldWord.toLowerCase());
  if (idx === -1) throw new Error(`Word "${oldWord}" not found in topic "${topic.id}"`);
  topic.words[idx] = newWordObj;
  console.log(`  [${topic.id}] "${oldWord}" → "${newWordObj.word}"`);
}

console.log('\n=== Phase 3: Seeker word changes ===\n');

// everyday-food: REPLACE orange → soup
const everydayFood = getTopic('everyday-food');
replaceWord(everydayFood, 'orange', SOUP);

// ─── Verify words ─────────────────────────────────────────────────────────────

const allWords = seeker.topics.flatMap(t => t.words.map(w => w.word.toLowerCase()));
const uniqueSet = new Set(allWords);
console.log(`\nTotal: ${allWords.length} (expected: 400)`);
console.log(`Unique: ${uniqueSet.size} (expected: 400)`);
if (allWords.length !== 400 || uniqueSet.size !== 400) {
  const seen = {};
  allWords.forEach(w => { seen[w] = (seen[w] || 0) + 1; });
  console.log('Dups:', Object.entries(seen).filter(([, c]) => c > 1));
  process.exit(1);
}
console.log('\n✅ Seeker words: 400 total, 400 unique\n');

// ─── Write words ──────────────────────────────────────────────────────────────

fs.writeFileSync(wordsPath, JSON.stringify(data, null, 2));
console.log('✅ data/words.json updated');

// ─── Story update ─────────────────────────────────────────────────────────────
// everyday-food new words: apple, banana, milk, bread, egg, rice, water, cake, juice, soup

stories['seeker.everyday-food'] = {
  emojis: ['🍎', '🍚', '🍲'],
  en: "Mia has an **apple** and a **banana** for breakfast, with a glass of **milk**. For lunch, she eats **rice** with a fried **egg** and drinks a cup of **water**. Her mum makes warm **soup** in the evening. On her birthday, there is a big **cake**, sweet **juice**, and slices of fresh **bread** for everyone!",
  vi: "Mia ăn một quả **táo** và một quả **chuối** vào bữa sáng, cùng với một ly **sữa**. Vào bữa trưa, cô ăn **cơm** với trứng **ốp la** và uống một ly **nước lọc**. Mẹ cô nấu **súp** ấm vào buổi tối. Vào ngày sinh nhật của cô, có một chiếc **bánh** to, **nước ép** ngọt ngào và những lát **bánh mì** tươi cho tất cả mọi người!"
};

// Verify story contains all 10 words
const storyWords = ['apple', 'banana', 'milk', 'bread', 'egg', 'rice', 'water', 'cake', 'juice', 'soup'];
const storyText = stories['seeker.everyday-food'].en.replace(/\*\*/g, '').toLowerCase();
const missing = storyWords.filter(w => !storyText.includes(w));
if (missing.length > 0) {
  console.error('Story missing words:', missing);
  process.exit(1);
}

fs.writeFileSync(storiesPath, JSON.stringify(stories, null, 2));
console.log('✅ data/stories.json updated');
console.log('\n📢 Audio to regenerate: public/audio/stories/seeker.everyday-food.mp3');
