/**
 * Phase 4: Update Explorer stories for 16 topics with changed words
 * Each story must contain ALL target words for its topic.
 */

const fs = require('fs');
const path = require('path');

const wordsPath = path.join(__dirname, '../data/words.json');
const storiesPath = path.join(__dirname, '../data/stories.json');

const data = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
const stories = JSON.parse(fs.readFileSync(storiesPath, 'utf8'));
const explorer = data['explorer'];

// ─── Updated stories ──────────────────────────────────────────────────────────

const UPDATES = {

  'science': {
    emojis: ['🔬', '🌿', '🦁'],
    en: "Scientists use a **microscope** to observe the tiny building blocks of life. Every living thing is made up of chemical **element**s arranged in complex ways. A **carnivore** hunts other animals for food, while a **herbivore** survives on plants alone. The **predator** uses speed and stealth to chase its **prey**. Some **creature**s have remarkable abilities that help them **survive** in extreme environments. **Photosynthesis** allows green plants to capture sunlight and produce energy. Over millions of years, living things **evolve**, developing new traits that help them thrive in a changing world.",
    vi: "Các nhà khoa học sử dụng **kính hiển vi** để quan sát các khối cấu tạo nhỏ bé của sự sống. Mọi sinh vật đều được tạo thành từ các **nguyên tố** hóa học được sắp xếp theo những cách phức tạp. **Động vật ăn thịt** săn các động vật khác để làm thức ăn, trong khi **động vật ăn thực vật** sống bằng thực vật. **Kẻ săn mồi** dùng tốc độ và sự nhanh nhẹn để đuổi theo **con mồi** của nó. Một số **sinh vật** có những khả năng đáng chú ý giúp chúng **sống sót** trong môi trường khắc nghiệt. **Quang hợp** cho phép thực vật xanh hấp thụ ánh sáng mặt trời và tạo ra năng lượng. Qua hàng triệu năm, các sinh vật **tiến hóa**, phát triển những đặc điểm mới giúp chúng phát triển mạnh trong thế giới thay đổi."
  },

  'sports-competition': {
    emojis: ['🏆', '⚽', '🥇'],
    en: "A great **athlete** trains every day to develop **technique**, **agility**, and **endurance**. In a **tournament**, every **match** is a new challenge. Your **rival** pushes you to improve, and smart **tactic**s can win even when physical strength is equal. A fair **referee** enforces the rules and awards a **penalty** when players break them. To **qualify** for the finals and lift the **trophy** is every competitor's dream. A final **sprint** can change everything in the closing seconds. True **sportsmanship** means respecting your opponents win or lose, while a **champion** leads by example both on and off the field.",
    vi: "Một **vận động viên** giỏi luyện tập mỗi ngày để phát triển **kỹ thuật**, **sự nhanh nhẹn** và **sức bền**. Trong một **giải đấu**, mỗi **trận đấu** là một thử thách mới. **Đối thủ** của bạn thúc đẩy bạn cải thiện, và các **chiến thuật** thông minh có thể chiến thắng ngay cả khi sức mạnh thể chất bằng nhau. Một **trọng tài** công bằng thực thi các quy tắc và trao **hình phạt** khi người chơi vi phạm. Được **vượt qua vòng loại** để vào chung kết và nâng **cúp vô địch** là giấc mơ của mọi tuyển thủ. Một **nước chạy nước rút** cuối cùng có thể thay đổi tất cả trong những giây cuối cùng. **Tinh thần thể thao** thực sự có nghĩa là tôn trọng đối thủ dù thắng hay thua, trong khi một **nhà vô địch** dẫn dắt bằng gương mẫu cả trong và ngoài sân."
  },

  'achievement': {
    emojis: ['🏅', '✨', '👑'],
    en: "Winning a **championship** is the result of **dedication** and **perseverance** through years of hard work. Natural **talent** gives a starting advantage, but consistent effort matters far more. Great **leadership** inspires a team to believe in a shared goal, and **teamwork** helps everyone **accomplish** what no individual could achieve alone. Every victory over a tough **opponent** becomes a personal **milestone** on the journey to greatness. The feeling of **triumph** after months of sacrifice is something that cannot be bought. Celebrate every step forward — each small win builds the confidence to reach the next level.",
    vi: "Giành chiến thắng trong một **giải vô địch** là kết quả của **sự cống hiến** và **kiên trì** qua nhiều năm làm việc chăm chỉ. **Tài năng** tự nhiên mang lại lợi thế ban đầu, nhưng nỗ lực nhất quán quan trọng hơn nhiều. **Sự lãnh đạo** tốt truyền cảm hứng cho nhóm tin vào mục tiêu chung, và **tinh thần đồng đội** giúp mọi người **hoàn thành** những gì không cá nhân nào có thể đạt được một mình. Mỗi chiến thắng trước **đối thủ** khó khăn trở thành một **cột mốc** cá nhân trên hành trình vươn tới vĩ đại. Cảm giác **chiến thắng** sau nhiều tháng hy sinh là điều không thể mua được. Hãy ăn mừng mỗi bước tiến — mỗi chiến thắng nhỏ xây dựng sự tự tin để đạt đến cấp độ tiếp theo."
  },

  'laboratory': {
    emojis: ['🧪', '🔭', '💡'],
    en: "Every great scientific **discover**y begins with a question. A researcher forms a **hypothesis** — a prediction about what will happen — and then designs an **experiment** to test it. Inside the **laboratory**, scientists **investigate** by carefully **observe**ing what happens under controlled conditions. They **measure** each result precisely, then **examine** and **classify** the data. Comparing findings against existing **theory** reveals whether the prediction was correct. When enough **evidence** supports the **hypothesis**, it may eventually become accepted as scientific truth. This cycle of questioning and testing drives human knowledge forward.",
    vi: "Mọi **khám phá** khoa học vĩ đại đều bắt đầu bằng một câu hỏi. Nhà nghiên cứu đặt ra một **giả thuyết** — dự đoán về điều sẽ xảy ra — rồi thiết kế một **thí nghiệm** để kiểm tra nó. Bên trong **phòng thí nghiệm**, các nhà khoa học **điều tra** bằng cách **quan sát** cẩn thận những gì xảy ra trong điều kiện kiểm soát. Họ **đo lường** mỗi kết quả một cách chính xác, rồi **xem xét** và **phân loại** dữ liệu. So sánh các phát hiện với **lý thuyết** hiện có cho thấy liệu dự đoán có đúng không. Khi đủ **bằng chứng** hỗ trợ giả thuyết, nó có thể dần được chấp nhận là sự thật khoa học. Chu trình đặt câu hỏi và kiểm tra này thúc đẩy kiến thức nhân loại tiến lên."
  },

  'critical-thinking': {
    emojis: ['🧠', '🔍', '💬'],
    en: "**Critical thinking** means learning to **question** ideas rather than accepting them without thought. Every **argument** must begin with a clear **claim** that is supported by a **reliable** **source**. We must **analyze** information carefully, **evaluate** its quality, and check for hidden **assumption**s or **bias**. A **fallacy** is a flaw in reasoning that makes an **argument** appear stronger than it really is. By considering different **perspective**s, we can **infer** a fair **conclusion**. In a **debate**, the goal is to use **logic** to persuade — not to attack the person, but to challenge the idea.",
    vi: "**Tư duy phê phán** có nghĩa là học cách **đặt câu hỏi** về các ý tưởng thay vì chấp nhận chúng mà không suy nghĩ. Mọi **lập luận** phải bắt đầu bằng một **tuyên bố** rõ ràng được hỗ trợ bởi **nguồn** **đáng tin cậy**. Chúng ta phải **phân tích** thông tin cẩn thận, **đánh giá** chất lượng của nó và kiểm tra các **giả định** ẩn hoặc **thiên kiến**. **Ngụy biện** là lỗi trong lập luận làm cho **lập luận** có vẻ mạnh hơn thực tế. Bằng cách xem xét các **quan điểm** khác nhau, chúng ta có thể **suy ra** một **kết luận** công bằng. Trong một **cuộc tranh luận**, mục tiêu là sử dụng **logic** để thuyết phục — không phải tấn công người, mà là thách thức ý tưởng."
  },

  'engineering': {
    emojis: ['⚙️', '🔩', '🏗️'],
    en: "Engineers first build a **prototype** to test their ideas before they **manufacture** the final product. They **assemble** each **component** carefully and check that every **mechanism** works as intended. The overall **structure** of a machine must be strong enough to handle the forces it faces. Using precise tools, engineers **measure**, **adjust**, and refine every detail. When the system is ready, operators learn how to **construct**, **control**, and safely **operate** it. From bridges to smartphones, engineering combines science and creativity to solve real problems — and each new solution opens the door to the next invention.",
    vi: "Các kỹ sư trước tiên xây dựng một **nguyên mẫu** để kiểm tra ý tưởng của họ trước khi **sản xuất** sản phẩm cuối cùng. Họ **lắp ráp** từng **bộ phận** cẩn thận và kiểm tra rằng mọi **cơ chế** hoạt động như dự định. **Cấu trúc** tổng thể của máy phải đủ mạnh để chịu đựng các lực tác động. Sử dụng các công cụ chính xác, các kỹ sư **đo lường**, **điều chỉnh** và tinh chỉnh từng chi tiết. Khi hệ thống sẵn sàng, người vận hành học cách **xây dựng**, **kiểm soát** và vận hành **an toàn**. Từ cây cầu đến điện thoại thông minh, kỹ thuật kết hợp khoa học và sáng tạo để giải quyết các vấn đề thực tế."
  },

  'architecture': {
    emojis: ['🏛️', '🏙️', '📐'],
    en: "Every great building starts with a **blueprint** that shows the **design**, **proportion**, and **symmetry** of each element. Architects choose the right **material** for every surface — from the grand **facade** to the soaring **dome** and the curved **arch**. A deep **foundation** supports the weight above, while tall **column**s create elegance and strength. The **entrance** sets the tone for the whole experience. In an **urban** setting, buildings must fit the surrounding **landscape** without losing their own identity. Many old buildings undergo careful **renovation** to preserve their **heritage** for future generations.",
    vi: "Mọi tòa nhà vĩ đại đều bắt đầu với một **bản vẽ kỹ thuật** cho thấy **thiết kế**, **tỷ lệ** và **sự đối xứng** của từng yếu tố. Kiến trúc sư chọn đúng **vật liệu** cho mỗi bề mặt — từ **mặt tiền** hoành tráng đến **mái vòm** vút cao và **vòm cung** cong. Một **nền móng** sâu đỡ trọng lượng bên trên, trong khi các **cột trụ** cao tạo nên sự thanh lịch và sức mạnh. **Lối vào** tạo ra tông cho toàn bộ trải nghiệm. Trong một môi trường **đô thị**, các tòa nhà phải phù hợp với **cảnh quan** xung quanh mà không mất đi bản sắc riêng. Nhiều tòa nhà cũ trải qua **cải tạo** cẩn thận để bảo tồn **di sản** cho các thế hệ tương lai."
  },

  'mission': {
    emojis: ['⚔️', '🛡️', '🌟'],
    en: "Every hero faces a great **challenge** that tests their courage and will. On their **quest**, they must **confront** powerful enemies and **overcome** seemingly impossible obstacles. An **alliance** with trusted companions provides support when the journey is hardest. To **endure** pain and hardship, the hero must draw on inner strength. Sometimes **cunning** matters more than raw power — outsmarting an enemy can achieve what brute force cannot. A **superpower** may help, but wisdom and **sacrifice** often decide the outcome. Through struggle and loss, a person can **transform** — emerging wiser, stronger, and ready for whatever comes next.",
    vi: "Mọi anh hùng đều phải đối mặt với một **thử thách** lớn kiểm tra lòng dũng cảm và ý chí của họ. Trong **hành trình** của mình, họ phải **đối mặt** với những kẻ thù mạnh mẽ và **vượt qua** những trở ngại dường như không thể. Một **liên minh** với những người bạn đồng hành đáng tin cậy cung cấp hỗ trợ khi hành trình khó khăn nhất. Để **chịu đựng** đau đớn và khó khăn, người anh hùng phải dựa vào sức mạnh nội tâm. Đôi khi **mưu trí** quan trọng hơn sức mạnh thô — đánh bại kẻ thù bằng trí thông minh có thể đạt được những gì sức mạnh thô bạo không thể. Một **siêu năng lực** có thể giúp ích, nhưng sự khôn ngoan và **hy sinh** thường quyết định kết quả. Qua đấu tranh và mất mát, một người có thể **biến đổi** — trở nên khôn ngoan hơn, mạnh mẽ hơn và sẵn sàng đón nhận bất cứ điều gì tiếp theo."
  },

  'environment': {
    emojis: ['🌍', '♻️', '🌿'],
    en: "The Earth's **ecosystem** depends on **biodiversity** — the wide variety of life that keeps nature in balance. **Deforestation** destroys habitats and drives many species toward becoming **endangered**. **Pollution** and **emission**s from factories and vehicles harm both land and water. Burning fossil fuels releases carbon into the **atmosphere**, warming the planet. Switching to **renewable** energy and practising **sustainable** habits can help reverse the damage. **Conservation** organisations work to protect wildlife and restore damaged landscapes. If we act now, future generations will still be able to experience the full richness of the natural world.",
    vi: "**Hệ sinh thái** của Trái Đất phụ thuộc vào **đa dạng sinh học** — sự đa dạng rộng lớn của sự sống giữ cho thiên nhiên cân bằng. **Phá rừng** phá hủy môi trường sống và đẩy nhiều loài đến nguy cơ **có nguy cơ tuyệt chủng**. **Ô nhiễm** và **khí thải** từ nhà máy và phương tiện giao thông gây hại cho cả đất và nước. Đốt nhiên liệu hóa thạch giải phóng carbon vào **bầu khí quyển**, làm ấm hành tinh. Chuyển sang năng lượng **tái tạo** và thực hành các thói quen **bền vững** có thể giúp đảo ngược thiệt hại. Các tổ chức **bảo tồn** làm việc để bảo vệ động vật hoang dã và khôi phục các cảnh quan bị hư hại."
  },

  'climate-change': {
    emojis: ['🌡️', '🌊', '🔥'],
    en: "Rising global **temperature**s are melting **glacier**s and **iceberg**s, causing **sea level**s to rise and threatening coastal **habitat**s. **Heatwave**s and **wildfire**s are becoming more frequent as **greenhouse** gases trap heat. In frozen regions, thawing **permafrost** releases stored **carbon**, accelerating warming. **Drought** and **flood**ing disrupt farming and force millions to leave their homes. **Coral** reefs are bleaching as oceans warm, endangering thousands of **species**. The root cause is the rise of **climate**-altering gases in the atmosphere. Scientists agree: limiting warming to 1.5 degrees Celsius requires urgent action to cut **carbon** emissions now.",
    vi: "Nhiệt độ toàn cầu tăng đang làm tan chảy **tảng băng trôi** và đẩy **mực nước biển** lên, đe dọa **môi trường sống** ven biển. **Đợt nắng nóng** và **cháy rừng** ngày càng thường xuyên hơn khi khí **nhà kính** giữ nhiệt. Ở các vùng đóng băng, **tầng đất đóng băng** tan chảy giải phóng **carbon** được lưu trữ, đẩy nhanh quá trình ấm lên. **Hạn hán** và lũ **lụt** làm gián đoạn nông nghiệp và buộc hàng triệu người phải rời bỏ nhà. Rạn **san hô** đang bạch hóa khi đại dương ấm lên, đe dọa hàng nghìn **loài**. Nguyên nhân gốc rễ là sự gia tăng khí thải làm thay đổi **khí hậu** trong khí quyển. Các nhà khoa học đồng ý: hạn chế sự ấm lên ở mức 1,5 độ C đòi hỏi hành động khẩn cấp để cắt giảm lượng khí thải **carbon** ngay bây giờ."
  },

  'communication': {
    emojis: ['🗣️', '📡', '📰'],
    en: "Effective communication is more than speaking clearly — it means choosing the right **tone** for your **audience** and using the right **feedback** to adjust your message. A skilled **journalist** uses facts to **persuade** and inform the public, while **propaganda** and **misinformation** distort reality to **influence** opinion. **Broadcast** media can reach millions instantly, making accuracy and responsibility more important than ever. Learning to **clarify** meaning when misunderstood is an essential skill. Being honest and respectful in every exchange — whether spoken or written — builds trust and helps people understand each other across all differences.",
    vi: "Giao tiếp hiệu quả không chỉ là nói rõ ràng — nó có nghĩa là chọn đúng **giọng điệu** cho **khán giả** của bạn và sử dụng **phản hồi** đúng cách để điều chỉnh thông điệp. Một **nhà báo** lành nghề sử dụng sự kiện để **thuyết phục** và thông tin cho công chúng, trong khi **tuyên truyền** và **thông tin sai lệch** bóp méo thực tế để **tác động** đến ý kiến. Các phương tiện truyền thông **phát sóng** có thể tiếp cận hàng triệu người ngay lập tức, làm cho tính chính xác và trách nhiệm ngày càng quan trọng hơn. Học cách **làm rõ** ý nghĩa khi bị hiểu nhầm là một kỹ năng thiết yếu. Thành thật và tôn trọng trong mọi trao đổi xây dựng sự tin tưởng."
  },

  'music-performance': {
    emojis: ['🎵', '🎻', '🎤'],
    en: "A musician who wants to **compose** original music must **rehearse** for weeks before they **perform** in public. The **conductor** guides the **orchestra**, keeping the **tempo** steady and the **harmony** balanced. A beautiful **melody** carries the emotion of a piece, while the **chord** progression gives it structure and depth. The **lyrics** of each **verse** tell a story that connects with listeners. Some performers choose an **acoustic** set — just a voice and an instrument — to reach the audience more directly. The **rhythm** of the music moves people to dance or reflect. When a moving **solo** earns a standing ovation, the crowd calls for an **encore**, and the performer returns for one final, magical moment.",
    vi: "Một nhạc sĩ phải **tập luyện** nhiều tuần trước khi **biểu diễn** trước công chúng. **Nhạc trưởng** dẫn dắt **dàn nhạc**, giữ **nhịp độ** ổn định và **hòa âm** cân bằng. Một **giai điệu** đẹp mang đến cảm xúc của một tác phẩm, trong khi tiến trình **hợp âm** mang lại cấu trúc và chiều sâu. **Lời bài hát** trong mỗi **khổ** kể một câu chuyện kết nối với người nghe. Một số người biểu diễn chọn màn trình diễn **nhạc cụ không khuếch đại** — chỉ có giọng hát và một nhạc cụ — để tiếp cận khán giả trực tiếp hơn. **Nhịp điệu** của âm nhạc khiến mọi người nhảy múa hoặc suy ngẫm. Khi một **độc tấu** lay động lòng người nhận được tràng pháo tay, khán giả gọi **biểu diễn thêm** và người biểu diễn trở lại một lần nữa."
  },

  'digital-life': {
    emojis: ['📱', '🔐', '💻'],
    en: "Living online means managing your **privacy** carefully. A strong **password** and a unique **username** help protect your accounts, and **encrypt**ing sensitive data adds another layer of security. A **hacker** or computer **virus** can steal personal information from unprotected devices. Your **digital footprint** — everything you post, like, or share on **social media** — shapes how others see you online. Excessive **screen time** can affect your wellbeing, so balance is important. **Streaming** and **download**ing content require good **bandwidth**. **Artificial intelligence** powers the **notification**s and recommendations that compete for your attention, while **cyberbullying** remains a serious risk in all online spaces.",
    vi: "Sống trực tuyến có nghĩa là quản lý **quyền riêng tư** cẩn thận. Một **mật khẩu** mạnh và **tên người dùng** độc đáo giúp bảo vệ tài khoản của bạn, và **mã hóa** dữ liệu nhạy cảm thêm một lớp bảo mật nữa. Một **hacker** hoặc **vi-rút** máy tính có thể đánh cắp thông tin cá nhân từ các thiết bị không được bảo vệ. **Dấu chân kỹ thuật số** của bạn — mọi thứ bạn đăng, thích hoặc chia sẻ trên **mạng xã hội** — định hình cách người khác nhìn nhận bạn trực tuyến. **Thời gian màn hình** quá nhiều có thể ảnh hưởng đến sức khỏe của bạn. **Phát trực tuyến** và **tải xuống** nội dung đòi hỏi **băng thông** tốt. **Trí tuệ nhân tạo** cung cấp năng lượng cho các **thông báo** và đề xuất cạnh tranh sự chú ý của bạn, trong khi **bắt nạt trực tuyến** vẫn là một rủi ro nghiêm trọng."
  },

  'history': {
    emojis: ['🏰', '⚔️', '📜'],
    en: "**Ancient** **civilisation**s built great cities and ruled vast **empire**s for thousands of years. A brave **warrior** class helped **monarch**s **conquer** new lands and defend against **invasion**. When an army surrounded a city in a deadly **siege**, the inhabitants faced starvation and defeat. Fallen rulers sometimes went into **exile**, stripped of their power and forced to live abroad. Over time, powerful **dynasty**s rose and fell, while new ideas sparked **revolution** and the formation of **republic**s. **Colony**s broke free to win **independence**, and **archaeology** continues to uncover the hidden stories of civilisations long forgotten.",
    vi: "Các **nền văn minh** **cổ đại** đã xây dựng các thành phố vĩ đại và cai trị các **đế chế** rộng lớn trong hàng nghìn năm. Một tầng lớp **chiến binh** dũng cảm đã giúp các **quân vương** **chinh phục** các vùng đất mới và bảo vệ trước **cuộc xâm lược**. Khi một đạo quân bao vây một thành phố trong một cuộc **vây hãm** chết chóc, dân cư phải đối mặt với nạn đói và thất bại. Những nhà cai trị bị lật đổ đôi khi bị đày **lưu vong**, bị tước mất quyền lực và buộc phải sống ở nước ngoài. Theo thời gian, các **triều đại** mạnh mẽ thăng trầm, trong khi các ý tưởng mới châm ngòi **cách mạng**. Các **thuộc địa** đã giành được **độc lập**, và **khảo cổ học** tiếp tục khám phá những câu chuyện ẩn của các nền văn minh đã lãng quên từ lâu."
  },

  'business-startup': {
    emojis: ['🚀', '💡', '📈'],
    en: "Every **startup** begins with an idea — but turning an idea into a business takes **strategy**, hard work, and smart **investment**. An **entrepreneur** must understand the **market**, identify the right **customer**, and build a strong **brand** identity. Forming a **partnership** with experienced mentors provides guidance and opens doors. A clear plan helps the team **compete** with established players, while **innovation** drives **revenue** and long-term growth. To **fund** expansion, founders **pitch** to investors and look for opportunities to **scale**. **Failure** is a normal part of the journey — most successful businesses have learned more from their mistakes than from their wins.",
    vi: "Mỗi **startup** bắt đầu bằng một ý tưởng — nhưng biến ý tưởng thành kinh doanh đòi hỏi **chiến lược**, làm việc chăm chỉ và **đầu tư** thông minh. Một **doanh nhân** phải hiểu **thị trường**, xác định đúng **khách hàng** và xây dựng bản sắc **thương hiệu** mạnh. Hình thành **quan hệ đối tác** với những người cố vấn giàu kinh nghiệm cung cấp sự hướng dẫn và mở ra cơ hội. Một kế hoạch rõ ràng giúp nhóm **cạnh tranh** với các đối thủ đã có chỗ đứng, trong khi **sáng tạo** thúc đẩy **doanh thu** và tăng trưởng dài hạn. Để **tài trợ** cho việc mở rộng, các nhà sáng lập **thuyết trình** với nhà đầu tư và tìm kiếm cơ hội **mở rộng quy mô**. **Thất bại** là một phần bình thường của hành trình."
  },

  'global-issues': {
    emojis: ['🌍', '✊', '❤️'],
    en: "The world faces many challenges that demand international **cooperation**. **Humanitarian** organisations provide **aid** to communities hit by **conflict** and **crisis**. Millions of people are displaced as **refugee**s due to war or natural disaster. **Migration** — both forced and voluntary — reshapes societies and tests national values. **Hunger** and lack of clean **sanitation** remain urgent problems that deepen **inequality** and threaten basic **human rights**. Low **literacy** rates limit opportunity for millions of children. A skilled **diplomat** can negotiate a **treaty** that ends a war, but lasting peace also requires functioning systems of **democracy** and justice.",
    vi: "Thế giới đối mặt với nhiều thách thức đòi hỏi **hợp tác** quốc tế. Các tổ chức **nhân đạo** cung cấp **viện trợ** cho các cộng đồng bị ảnh hưởng bởi **xung đột** và **khủng hoảng**. Hàng triệu người bị di dời như những **người tị nạn** do chiến tranh hoặc thiên tai. **Di cư** — cả bắt buộc lẫn tự nguyện — định hình lại xã hội và thử thách các giá trị quốc gia. **Đói nghèo** và thiếu **vệ sinh** sạch vẫn là những vấn đề cấp bách làm sâu sắc thêm **bất bình đẳng** và đe dọa các **quyền con người** cơ bản. Tỷ lệ **biết chữ** thấp hạn chế cơ hội cho hàng triệu trẻ em. Một **nhà ngoại giao** lành nghề có thể đàm phán một **hiệp ước** kết thúc chiến tranh, nhưng hòa bình lâu dài cũng đòi hỏi hệ thống **dân chủ** hoạt động tốt và công lý."
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

console.log('\n=== Phase 4: Explorer story updates ===\n');

let allOk = true;

Object.entries(UPDATES).forEach(([topicId, storyData]) => {
  const key = `explorer.${topicId}`;
  const topic = explorer.topics.find(t => t.id === topicId);
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

console.log('\n✅ All 16 Explorer stories verified\n');

fs.writeFileSync(storiesPath, JSON.stringify(stories, null, 2));
console.log('✅ data/stories.json updated');
console.log('\n📢 Audio impact:');
console.log('   Changed topics needing audio regeneration: science, sports-competition, achievement,');
console.log('   laboratory, critical-thinking, engineering, architecture, mission, environment,');
console.log('   climate-change, communication, music-performance, digital-life, history,');
console.log('   business-startup, global-issues (16 files)');
console.log('   Previously missing (still need creation): art-creativity (1 file)');
