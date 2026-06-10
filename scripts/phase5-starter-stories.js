/**
 * Phase 5: Update Starter stories for 15 changed topics
 */

const fs = require('fs');
const path = require('path');

const wordsPath = path.join(__dirname, '../data/words.json');
const storiesPath = path.join(__dirname, '../data/stories.json');

const data = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
const stories = JSON.parse(fs.readFileSync(storiesPath, 'utf8'));
const starter = data['starter'];

// ─── Updated stories ──────────────────────────────────────────────────────────

const UPDATES = {

  'animals': {
    emojis: ['🐶', '🐰', '🦎'],
    en: "Tom has a **cat** and a **dog** at home. He also has a **rabbit** in a cage and a **frog** in a fish tank. A small yellow **bird** sings on the window. At the farm, he sees a big **horse**, a white **duck**, and a grey **elephant**. A funny **monkey** climbs the tree. In the garden, Tom finds a small green **lizard** sitting on a rock. He loves all animals!",
    vi: "Tom có một con **mèo** và một con **chó** ở nhà. Cậu bé cũng có một con **thỏ** trong lồng và một con **ếch** trong bể cá. Một con **chim** vàng nhỏ hót trên cửa sổ. Ở trang trại, cậu thấy một con **ngựa** lớn, một con **vịt** trắng và một con **voi** xám. Một con **khỉ** vui nhộn leo trên cây. Trong vườn, Tom tìm thấy một con **thằn lằn** xanh nhỏ đang ngồi trên tảng đá. Cậu yêu tất cả các loài động vật!"
  },

  'food': {
    emojis: ['🍜', '🧈', '🍲'],
    en: "For breakfast, I drink a glass of **milk** and eat **bread** with **butter**. I boil an **egg** too. For lunch, Mum makes **noodle** **soup** with vegetables. We have **rice** for dinner. I like **juice** and **ice cream** as a snack. **Cheese** on toast is my favourite evening treat!",
    vi: "Vào bữa sáng, tôi uống một ly **sữa** và ăn **bánh mì** với **bơ**. Tôi cũng luộc một quả **trứng**. Vào bữa trưa, mẹ nấu **mì** **súp** với rau. Chúng tôi ăn **cơm** vào bữa tối. Tôi thích **nước ép** và **kem** như một bữa ăn nhẹ. **Phô mai** trên bánh mì nướng là món ăn tối yêu thích của tôi!"
  },

  'toys': {
    emojis: ['🎭', '🎨', '🤹'],
    en: "I have a **doll**, a **ball**, and a colourful **kite** in my room. My new toy is a hand **puppet** — I love putting on little shows! After school, I **draw** pictures and **paint** with bright colours. Sometimes I try to **juggle** three balls in the air. I **swim** at the pool on weekends and **bounce** on the trampoline in the garden. My **swing** is under the big tree.",
    vi: "Tôi có một con **búp bê**, một quả **bóng** và một chiếc **diều** đầy màu sắc trong phòng. Đồ chơi mới của tôi là một con **rối tay** — tôi thích diễn những tiết mục nhỏ! Sau giờ học, tôi **vẽ** tranh và **tô màu** với những màu sắc rực rỡ. Đôi khi tôi cố gắng **tung hứng** ba quả bóng trên không trung. Tôi **bơi** ở bể bơi vào cuối tuần và **nảy** trên tấm bạt nhún trong vườn. **Xích đu** của tôi ở dưới cây lớn."
  },

  'school': {
    emojis: ['📚', '✏️', '👦'],
    en: "Every morning I put my **book**, **pen**, **pencil**, and **bag** in my **bag**. In class, I sit at my **desk** and write on the **board**. I use an **eraser** when I make a mistake and a **ruler** to draw straight lines. My **classmate** sits next to me and helps me when I do not understand. Today we have a short **quiz** about numbers. I hope I get all the answers right!",
    vi: "Mỗi buổi sáng tôi bỏ **sách**, **bút mực**, **bút chì** vào **cặp** của mình. Trong lớp, tôi ngồi ở **bàn học** và viết lên **bảng**. Tôi dùng **cục tẩy** khi mắc lỗi và **thước kẻ** để vẽ đường thẳng. **Bạn cùng lớp** của tôi ngồi cạnh tôi và giúp đỡ tôi khi tôi không hiểu. Hôm nay chúng tôi có một bài **kiểm tra** ngắn về các con số. Tôi hy vọng trả lời đúng hết!"
  },

  'fruits-vegetables': {
    emojis: ['🍎', '🍋', '🥦'],
    en: "I love fruit! I eat an **apple** and a **banana** every day. My favourite citrus fruit is a **lemon** — it is very sour but good in tea. I also like sweet **grape**s, red **strawberry**, and juicy **mango**. For vegetables, I eat **carrot**, **tomato**, **potato**, **cucumber**, **corn**, and **onion**. Mum makes smoothies with **pineapple** and **watermelon**. I am still learning to like **broccoli**!",
    vi: "Tôi thích hoa quả! Tôi ăn một quả **táo** và một quả **chuối** mỗi ngày. Loại quả họ cam quýt yêu thích của tôi là **chanh vàng** — nó rất chua nhưng ngon khi pha trà. Tôi cũng thích **nho** ngọt, **dâu tây** đỏ và **xoài** mọng nước. Về rau củ, tôi ăn **cà rốt**, **cà chua**, **khoai tây**, **dưa chuột**, **ngô** và **hành tây**. Mẹ làm sinh tố với **dứa** và **dưa hấu**. Tôi vẫn đang học cách thích **bông cải xanh**!"
  },

  'daily-routine': {
    emojis: ['☀️', '🏃', '🌙'],
    en: "Every morning I **wake up** at seven o'clock. I **brush** my teeth, **wash** my face, and do some **exercise** in the garden. Then I have **breakfast** and **walk** to school with my friend. At noon I eat **lunch** with my classmates. Young children often take a short **nap** after lunch. After school, I do my **homework**, eat **dinner** with my family, and have a **bath**. Before **bedtime** I **tidy** my room, **play** for a little while, and **read** a short story. Then I sleep and dream!",
    vi: "Mỗi buổi sáng tôi **thức dậy** lúc bảy giờ. Tôi **đánh răng**, **rửa mặt** và **tập thể dục** trong vườn. Sau đó tôi ăn **bữa sáng** và **đi bộ** đến trường cùng bạn. Vào buổi trưa tôi ăn **bữa trưa** với các bạn cùng lớp. Sau giờ học, tôi làm **bài tập về nhà**, ăn **bữa tối** với gia đình và **tắm**. Trước **giờ đi ngủ** tôi **dọn dẹp** phòng, **chơi** một lúc và **đọc** một câu chuyện ngắn. Rồi tôi ngủ và mơ!"
  },

  'parties-celebrations': {
    emojis: ['🎂', '🎊', '🎉'],
    en: "It is my **birthday** today! We have a big **cake** with ten **candle**s on top. Everyone brings a **gift** and we hang **balloon**s around the room. At the **party**, we **sing** and **dance** and **clap** our hands. Mum throws **confetti** in the air and it falls like coloured snow. We **invite** ten friends and they help us **decorate** the house. My best **friend** gives me a wonderful **surprise** and we all **celebrate** together. It is a perfect day!",
    vi: "Hôm nay là **sinh nhật** của tôi! Chúng tôi có một chiếc **bánh** lớn với mười **nến** trên đó. Mọi người đem theo một món **quà** và chúng tôi treo **bóng bay** quanh phòng. Tại bữa **tiệc**, chúng tôi **hát** và **nhảy** và vỗ **tay**. Mẹ tung **hoa giấy** lên không trung và nó rơi xuống như tuyết có màu sắc. Chúng tôi **mời** mười người bạn và họ giúp chúng tôi **trang trí** nhà. Bạn thân nhất của tôi tặng cho tôi một **bất ngờ** tuyệt vời và tất cả chúng tôi cùng nhau **ăn mừng**. Đó là một ngày hoàn hảo!"
  },

  'outdoor-nature': {
    emojis: ['🌻', '✨', '🌾'],
    en: "I love playing outside! In the garden, there are **flower**s, tall **tree**s, and soft **grass**. A small **river** runs past the **mountain** in the distance. We play near the **lake** and build sandcastles on the **sand**. I find smooth **stone**s by the water and pick up a red **leaf** from the ground. **Butterfly**s and **bee**s fly over the **mushroom**s. At night, **firefly**s glow in the dark. In the field, golden **meadow** stretches as far as I can see. The warm **sunshine** makes everything bright and beautiful.",
    vi: "Tôi thích chơi ngoài trời! Trong vườn, có những bông **hoa**, những cây **cây** cao và **cỏ** mềm. Một con **sông** nhỏ chạy qua **núi** ở phía xa. Chúng tôi chơi gần **hồ** và xây lâu đài cát trên **cát**. Tôi tìm thấy những viên **đá** nhẵn bên bờ nước và nhặt một chiếc **lá** đỏ từ mặt đất. **Bướm** và **ong** bay qua những cây **nấm**. Vào ban đêm, **đom đóm** phát sáng trong bóng tối. Trên cánh đồng, **đồng cỏ** vàng trải dài đến tận nơi tôi có thể nhìn thấy. Ánh **nắng** ấm áp làm cho mọi thứ sáng đẹp."
  },

  'sea': {
    emojis: ['⚓', '🚢', '🧭'],
    en: "The **ocean** is wide and deep and full of wonder. Sailors leave from the **harbour** and sail out to sea. They use a **compass** to find their way when there is no land to see. Ships stop at a **pier** when they reach the shore. The **coast** is rocky and the waves are strong. A brave **sailor** guides the ship through the **current**. Under the water, a **submarine** dives deep. After a long **voyage**, the crew is happy to return. On the beach, we find a **seashell** and watch the **lighthouse** flashing in the dark. The **island** in the distance looks like a dream, and the **tide** brings the sea closer at night. The **anchor** holds the boat safe while everyone rests.",
    vi: "**Đại dương** rộng lớn và sâu thẳm, đầy kỳ diệu. Các thủy thủ khởi hành từ **bến cảng** và ra khơi. Họ dùng **la bàn** để tìm đường khi không có đất liền để nhìn. Các con tàu dừng lại tại **cầu tàu** khi đến bờ. **Bờ biển** đầy đá và sóng mạnh. Một **thủy thủ** dũng cảm lái tàu qua **dòng chảy**. Dưới nước, một chiếc **tàu ngầm** lặn sâu. Sau một chuyến **hành trình** dài, thủy thủ đoàn vui mừng trở về. Trên bãi biển, chúng tôi tìm thấy một chiếc **vỏ sò** và ngắm nhìn **ngọn hải đăng** nhấp nháy trong bóng tối. **Hòn đảo** ở phía xa trông như một giấc mơ, và **thủy triều** đưa biển đến gần hơn vào ban đêm. **Mỏ neo** giữ con thuyền an toàn trong khi mọi người nghỉ ngơi."
  },

  'music': {
    emojis: ['🎸', '🥁', '🎵'],
    en: "I love music! I play the **guitar** and my sister plays the **piano**. Dad plays the **drum** and Grandma plays the **violin**. We all sing a **song** together. My brother paints on the **stage** with an exciting **beat** — he loves **performing** at school concerts. We also play the **flute**, the **trumpet**, and listen to a beautiful **melody** at the school **concert**. We love to **record** our favourite **music** and listen to it later. Art and music make life happy!",
    vi: "Tôi yêu âm nhạc! Tôi chơi **đàn guitar** và chị gái tôi chơi **piano**. Bố chơi **trống** và bà ngoại chơi **đàn violin**. Chúng tôi cùng nhau hát một **bài hát**. Anh trai tôi vẽ tranh trên **sân khấu** với một **nhịp điệu** thú vị — cậu ấy thích **biểu diễn** tại các buổi hòa nhạc ở trường. Chúng tôi cũng chơi **sáo**, **kèn trumpet** và nghe một **giai điệu** đẹp tại **hòa nhạc** của trường. Chúng tôi thích **ghi âm** **âm nhạc** yêu thích và nghe lại sau. Nghệ thuật và âm nhạc làm cho cuộc sống vui!"
  },

  'nature': {
    emojis: ['🦇', '🏔️', '🌿'],
    en: "Nature is full of amazing places. A dark **cave** is home to bats and echoes. A tall **cliff** rises above the water. A quiet **pond** is where frogs and ducks live. Rich **soil** helps plants to grow. Soft **moss** covers old stones in the forest. A deep **canyon** was cut by a river over many years. There is a **waterfall** in the **jungle**, and a wide **desert** with golden sand. The **sky** changes colour at sunset. Seeds grow into trees on the **hill** and in the **valley**. In the **forest**, everything is green and alive. **Rock**s tell the story of the Earth.",
    vi: "Thiên nhiên đầy những nơi kỳ diệu. Một **hang động** tối là nơi ở của dơi và tiếng vang. Một **vách đá** cao sừng sững trên mặt nước. Một cái **ao** yên tĩnh là nơi ếch và vịt sinh sống. **Đất** màu mỡ giúp cây cối phát triển. **Rêu** mềm bao phủ những tảng đá cũ trong rừng. Một **hẻm núi** sâu được tạo ra bởi một con sông qua nhiều năm. Có một **thác nước** trong **rừng rậm**, và một **sa mạc** rộng lớn với cát vàng. Bầu **trời** thay đổi màu sắc lúc hoàng hôn. Những hạt **giống** mọc thành cây trên **đồi** và trong **thung lũng**. Trong **rừng**, mọi thứ đều xanh và sống động. Những tảng **đá** kể câu chuyện về Trái Đất."
  },

  'princess-magic': {
    emojis: ['👸', '🦄', '🏰'],
    en: "Once upon a time, a **princess** lived in a big **castle**. She had a magic **wand** and a golden **crown**. A brave **knight** guarded the castle gates. One day, a fire-breathing **dragon** flew over the kingdom! The princess used a magic **spell** and a **potion** to send it away. She found hidden **treasure** in the old tower and used it to help the people of her land. A magical **unicorn** arrived with a rainbow tail and granted her a **wish**. A kind **fairy** flew in to help too. The princess waved her wand and **enchant**ed the whole kingdom with joy. The people called her a true **hero**.",
    vi: "Ngày xửa ngày xưa, có một nàng **công chúa** sống trong một lâu **đài** lớn. Cô có một chiếc **đũa phép** và một chiếc **vương miện** bằng vàng. Một **hiệp sĩ** dũng cảm canh gác cổng lâu đài. Một ngày, một con **rồng** phun lửa bay qua vương quốc! Công chúa dùng **phép thuật** và một lọ **thuốc tiên** để xua đuổi nó. Cô tìm thấy **kho báu** ẩn trong tháp cũ và dùng nó để giúp đỡ người dân của đất nước mình. Một con **kỳ lân** kỳ diệu xuất hiện với chiếc đuôi cầu vồng và thực hiện một điều **ước** cho cô. Một **nàng tiên** tốt bụng bay đến để giúp đỡ. Công chúa vẫy chiếc đũa phép và **quyến rũ** cả vương quốc bằng niềm vui. Người dân gọi cô là một **anh hùng** thực sự."
  },

  'describing-things': {
    emojis: ['🔍', '🏋️', '✨'],
    en: "Let me describe things around me! The elephant is **big** and the mouse is **small**. The tree is **tall** but the flower is **short**. The ball is **round** and the stone is **smooth** and flat. Cotton is **soft** and rock is **hard**. A bag of books is **heavy** but a balloon is **light**. The drum is **loud** but the library is **quiet**. The new shoes are **clean** and the muddy boots are **dirty**. The star is **shiny** in the night sky. Words help us see the world more clearly.",
    vi: "Hãy để tôi mô tả những thứ xung quanh tôi! Con voi thì **to** và con chuột thì **nhỏ**. Cây thì **cao** nhưng bông hoa thì **thấp**. Quả bóng thì **tròn** và tảng đá thì **nhẵn** và phẳng. Bông thì **mềm** và đá thì **cứng**. Một túi sách thì **nặng** nhưng quả bóng bay thì **nhẹ**. Tiếng trống thì **to** nhưng thư viện thì **yên tĩnh**. Đôi giày mới thì **sạch** và đôi ủng lấm bùn thì **bẩn**. Ngôi sao thì **sáng lấp lánh** trên bầu trời đêm. Từ ngữ giúp chúng ta nhìn thế giới rõ ràng hơn."
  },

  'city-places': {
    emojis: ['🏙️', '🏟️', '🏥'],
    en: "Our city has many places to visit! We play in the **park** and learn at the **library**. When we are sick, we go to the **hospital**. We eat at the **restaurant** and save money at the **bank**. On weekends, the family goes to the big **stadium** to watch football. We walk down the **street** and cross the **bridge** over the river. We visit the **market** for fresh vegetables. Children love the **zoo** and the **museum**. We study at **school**, watch films at the **cinema**, and stay at a **hotel** when we travel. Aeroplanes fly in and out of the **airport** every day.",
    vi: "Thành phố của chúng tôi có nhiều nơi để tham quan! Chúng tôi chơi trong **công viên** và học tập tại **thư viện**. Khi bị bệnh, chúng tôi đến **bệnh viện**. Chúng tôi ăn tại **nhà hàng** và tiết kiệm tiền ở **ngân hàng**. Vào cuối tuần, gia đình đến **sân vận động** lớn để xem bóng đá. Chúng tôi qua **cầu** trên sông và thăm **chợ** để mua rau tươi. Trẻ em yêu thích **sở thú** và **bảo tàng**. Chúng tôi học tập ở **trường**, xem phim tại **rạp chiếu phim** và ở tại **khách sạn** khi đi du lịch. Máy bay bay vào và ra khỏi **sân bay** mỗi ngày."
  },

  'cooking': {
    emojis: ['👩‍🍳', '🍞', '🥞'],
    en: "Learning to cook is so much fun! First, I **prepare** all the vegetables. Mum shows me how to **slice** the bread and **roast** the chicken. We **knead** the **dough** for ten minutes, then let it rise. I mix the cake **batter** and **whisk** the eggs until they are fluffy. Dad shows me how to **simmer** the **sauce** slowly. We follow the **recipe** step by step. Sometimes I **wrap** sandwiches for lunch and **blend** fruit for smoothies. We also **melt** chocolate and **heat** the oven. **Cook**ing a meal for the family makes me feel very proud!",
    vi: "Học nấu ăn thật vui! Đầu tiên, tôi **chuẩn bị** tất cả rau củ. Mẹ chỉ cho tôi cách **thái** bánh mì và **nướng** gà. Chúng tôi **nhào** **bột** trong mười phút, rồi để nó nở ra. Tôi trộn **hỗn hợp bột** bánh và **đánh trứng** cho đến khi bông. Bố chỉ cho tôi cách **đun nhỏ lửa** **nước sốt** từ từ. Chúng tôi làm theo **công thức** từng bước một. Đôi khi tôi **gói** bánh sandwich cho bữa trưa và **xay nhuyễn** trái cây để làm sinh tố. Chúng tôi cũng **làm tan chảy** chocolate và **làm nóng** lò nướng. **Nấu** một bữa ăn cho gia đình khiến tôi cảm thấy rất tự hào!"
  }

};

// ─── Verify + apply ───────────────────────────────────────────────────────────

function stripBold(text) { return text.replace(/\*\*/g, '').toLowerCase(); }

function wordInStory(word, storyText) {
  const clean = stripBold(storyText);
  const w = word.toLowerCase();
  if (clean.includes(w)) return true;
  if (w.length >= 5 && clean.includes(w.slice(0, 5))) return true;
  return false;
}

console.log('\n=== Phase 5: Starter story updates ===\n');

let allOk = true;

Object.entries(UPDATES).forEach(([topicId, storyData]) => {
  const key = `starter.${topicId}`;
  const topic = starter.topics.find(t => t.id === topicId);
  if (!topic) { console.error(`Topic ${topicId} not found`); allOk = false; return; }

  const missing = topic.words.filter(w => !wordInStory(w.word, storyData.en));
  if (missing.length > 0) {
    console.error(`  ❌ [${topicId}] Missing: ${missing.map(w => w.word).join(', ')}`);
    allOk = false;
  } else {
    console.log(`  ✅ [${topicId}] all ${topic.words.length} words present`);
  }
  stories[key] = storyData;
});

if (!allOk) {
  console.error('\n❌ Verification failed — stories.json NOT updated');
  process.exit(1);
}

console.log('\n✅ All 15 Starter stories verified\n');

fs.writeFileSync(storiesPath, JSON.stringify(stories, null, 2));
console.log('✅ data/stories.json updated');
console.log('\n📢 Audio to regenerate (15 Starter topics):');
console.log('   animals, food, toys, school, fruits-vegetables, daily-routine,');
console.log('   parties-celebrations, outdoor-nature, sea, music, nature,');
console.log('   princess-magic, describing-things, city-places, cooking');
