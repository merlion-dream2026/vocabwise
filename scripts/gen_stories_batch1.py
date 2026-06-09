import json, os

stories = {
  # ── SEEKER (30 topics) ── 2-3 sentences, Pre-A1 ───────────────────────────

  "seeker.colors-basic": {
    "emojis": ["🔴", "🟡", "🟢"],
    "en": "Tom paints a **red** sun and a **blue** sky. He adds a **green** tree and **yellow** flowers in the garden. His favourite **colour** is **orange** — just like the setting sun!",
    "vi": "Tom vẽ một mặt trời **đỏ** và bầu trời **xanh dương**. Cậu thêm một cây **xanh lá** và những bông hoa **vàng** trong vườn. Màu **màu sắc** yêu thích của cậu là **cam** — giống hệt mặt trời lúc hoàng hôn!"
  },

  "seeker.numbers": {
    "emojis": ["🐱", "🔢", "🏠"],
    "en": "Lily has **five** cats and **three** dogs at home. She counts **one**, **two**, **three** cats sleeping on the sofa. There are **ten** animals in her house — she loves every single one!",
    "vi": "Lily có **năm** con mèo và **ba** con chó ở nhà. Cô đếm **một**, **hai**, **ba** con mèo đang ngủ trên sofa. Có tất cả **mười** con vật trong nhà cô — cô yêu từng con một!"
  },

  "seeker.family-basic": {
    "emojis": ["👨‍👩‍👧‍👦", "👵", "❤️"],
    "en": "My **mum**, **dad**, **grandma**, and **grandpa** all live together. My **sister** holds the **baby** and my **brother** plays nearby. We are a big, happy **family** and we **love** our **home**.",
    "vi": "**Mẹ**, **bố**, **bà** và **ông** của tôi đều sống cùng nhau. **Chị gái** tôi bế em **bé** còn **anh trai** tôi chơi gần đó. Chúng tôi là một **gia đình** đông vui và chúng tôi **yêu** ngôi **nhà** của mình."
  },

  "seeker.simple-feelings": {
    "emojis": ["😊", "😢", "😄"],
    "en": "Tom is **happy** because he got a new toy, but his friend is **sad** and **hungry** after the long walk. Tom tells a **funny** joke and gives his friend some food. Now everyone feels **good** and nobody is **angry** anymore!",
    "vi": "Tom rất **vui** vì cậu nhận được đồ chơi mới, nhưng bạn cậu thì **buồn** và **đói** sau chuyến đi dài. Tom kể một câu chuyện cười **hài hước** và đưa đồ ăn cho bạn. Bây giờ mọi người đều cảm thấy **tốt** và không ai còn **tức giận** nữa!"
  },

  "seeker.body-parts": {
    "emojis": ["🖐️", "👁️", "🦶"],
    "en": "The teacher says: Touch your **head**, **nose**, and **mouth**! Lisa waves her **hand** and stamps her **foot**. She wiggles her **arm**, bends her **leg**, and shakes her long **hair**.",
    "vi": "Cô giáo nói: Hãy chạm vào **đầu**, **mũi** và **miệng** của mình! Lisa vẫy **tay** và giậm **chân** xuống sàn. Cô lắc **cánh tay**, uốn cong **chân** và lắc mái **tóc** dài."
  },

  "seeker.pets": {
    "emojis": ["🐱", "🐇", "🐸"],
    "en": "Ben has a **cat** and a **dog** at home, and a little **rabbit** that loves to hop. His **bird** sings every morning outside the window. At the farm, he feeds a big **cow**, a pink **pig**, and a funny **duck**.",
    "vi": "Ben có một con **mèo** và một con **chó** ở nhà, cùng một chú **thỏ** nhỏ thích nhảy nhót. Con **chim** của cậu hót mỗi buổi sáng bên ngoài cửa sổ. Ở nông trại, cậu cho một con **bò** to, một con **lợn** hồng và một con **vịt** buồn cười ăn."
  },

  "seeker.everyday-food": {
    "emojis": ["🍎", "🍚", "🎂"],
    "en": "Mia eats an **apple** and drinks a glass of **milk** for breakfast. For lunch, she has **rice** and a fried **egg**. At her birthday party, there is a big **cake** and fresh **orange** **juice** for everyone!",
    "vi": "Mia ăn một quả **táo** và uống một ly **sữa** vào bữa sáng. Vào bữa trưa, cô ăn **cơm** với trứng **ốp la**. Tại bữa tiệc sinh nhật, có một cái **bánh** to và **nước cam** tươi cho tất cả mọi người!"
  },

  "seeker.basic-clothes": {
    "emojis": ["👕", "👟", "🎒"],
    "en": "Tom puts on a **blue** **shirt** and his **trousers** to get ready for school. He pulls on his **socks** and **shoes**, then grabs his **bag** by the door. Outside it is cold, so he quickly zips up his **jacket** and puts on his **hat**.",
    "vi": "Tom mặc một cái **áo sơ mi** **xanh** và **quần dài** để chuẩn bị đến trường. Cậu xỏ **tất** và **giày** rồi cầm **cặp** ở cửa. Bên ngoài trời lạnh nên cậu nhanh chóng kéo khóa **áo khoác** và đội **mũ** lên đầu."
  },

  "seeker.basic-transport": {
    "emojis": ["🚌", "✈️", "🚂"],
    "en": "Every morning, Tom and Lily take the **bus** to school together. Dad drives a **car** to work and Mum rides the **train** into the city. One day, the whole family wants to fly on a big **plane** to visit Grandma far away!",
    "vi": "Mỗi sáng, Tom và Lily đi **xe buýt** đến trường cùng nhau. Bố lái **xe hơi** đi làm còn mẹ đi **tàu hỏa** vào thành phố. Một ngày nào đó, cả nhà muốn bay trên một chiếc **máy bay** to để đến thăm bà ở xa!"
  },

  "seeker.classroom": {
    "emojis": ["📚", "✏️", "🖍️"],
    "en": "Lily sits at her **table** and opens her **book** to read. Her **teacher** writes today's lesson on the **board** with a **pen**. Lily uses a **crayon** to draw a picture and gives it to her best **friend**.",
    "vi": "Lily ngồi vào **bàn** của mình và mở **sách** ra đọc. Cô **giáo** viết bài học hôm nay lên **bảng** bằng **bút**. Lily dùng **bút màu** để vẽ một bức tranh và tặng nó cho người bạn thân nhất của mình."
  },

  "seeker.household-items": {
    "emojis": ["🏠", "🛋️", "🕐"],
    "en": "Mum opens the **door** and walks into the **kitchen** to cook dinner. Ben sits on the **sofa** next to the warm **lamp** and reads his book. He looks at the **clock**, sees it is bedtime, and runs up the **stairs** to his **bed**.",
    "vi": "Mẹ mở **cửa** và bước vào **bếp** để nấu cơm tối. Ben ngồi trên **ghế sofa** bên cạnh ngọn **đèn** ấm áp và đọc sách. Cậu nhìn vào **đồng hồ**, thấy đã đến giờ đi ngủ, và chạy lên **cầu thang** vào **giường** của mình."
  },

  "seeker.my-face": {
    "emojis": ["🩺", "😊", "🤲"],
    "en": "The nurse checks Sara's **forehead** and asks her to open her **mouth** and show her **tongue**. Sara points to her **knee** and **finger** where she fell and got hurt. The nurse puts a bandage on her **chin** and says she will be fine soon.",
    "vi": "Y tá kiểm tra **trán** của Sara và yêu cầu cô mở **miệng** ra và thè **lưỡi**. Sara chỉ vào **đầu gối** và **ngón tay** nơi cô bị ngã và bị thương. Y tá băng lại **cằm** cho cô và nói cô sẽ ổn thôi."
  },

  "seeker.weather-basic": {
    "emojis": ["☀️", "⛈️", "🌈"],
    "en": "In the morning the **sun** shines and it feels **warm** and **dry**. Then dark **clouds** roll in and a big **storm** brings heavy **rain** and **wind**. After the storm, a beautiful **rainbow** stretches across the **cool**, fresh sky!",
    "vi": "Vào buổi sáng, **mặt trời** tỏa sáng và trời cảm thấy **ấm áp** và **khô ráo**. Rồi những đám **mây** đen kéo đến và một cơn **bão** lớn mang theo **mưa** to và **gió** mạnh. Sau cơn bão, một cái **cầu vồng** đẹp trải dài trên bầu trời **mát mẻ** trong lành!"
  },

  "seeker.common-fruits": {
    "emojis": ["🥭", "🍓", "🍉"],
    "en": "Mia loves **mango** and **strawberry** ice cream in summer. Her mum cuts a big **watermelon** and a sweet **pineapple** for the whole family. They also squeeze a **lemon** into cold water and add some **grapes** on the side.",
    "vi": "Mia thích kem **xoài** và **dâu tây** vào mùa hè. Mẹ cô cắt một quả **dưa hấu** to và một quả **dứa** ngọt cho cả nhà. Họ còn vắt một quả **chanh** vào nước lạnh và thêm một chùm **nho** ở bên."
  },

  "seeker.basic-vegetables": {
    "emojis": ["🥕", "🍅", "🥣"],
    "en": "Dad puts **carrots**, **potatoes**, and **onions** into the big pot on the stove. Mum adds **tomatoes**, **mushrooms**, and a clove of **garlic** to the soup. The whole kitchen smells amazing and everyone can't wait to eat!",
    "vi": "Bố cho **cà rốt**, **khoai tây** và **hành tây** vào cái nồi to trên bếp. Mẹ thêm **cà chua**, **nấm** và một tép **tỏi** vào nồi súp. Cả căn bếp có mùi thơm tuyệt vời và mọi người không thể chờ được để ăn!"
  },

  "seeker.wild-animals": {
    "emojis": ["🦁", "🐘", "🐼"],
    "en": "At the zoo, a big **lion** roars and a striped **tiger** paces in its space. A tall **giraffe** stretches its neck to eat leaves high up in the trees. Near the water, a cute **panda** sleeps while a funny **penguin** waddles back and forth.",
    "vi": "Ở vườn thú, một con **sư tử** to rống lên và một con **hổ** có sọc bước đi trong không gian của nó. Một con **hươu cao cổ** vươn cổ lên để ăn lá cây cao. Gần mặt nước, một con **gấu trúc** đáng yêu ngủ trong khi một con **chim cánh cụt** buồn cười lạch bạch đi qua đi lại."
  },

  "seeker.sea-creatures": {
    "emojis": ["🐬", "🐳", "🐙"],
    "en": "Deep in the ocean, a **dolphin** leaps and swims next to a huge **whale**. A gentle **turtle** floats slowly past, and a colourful **starfish** rests on the rocks below. Further in the dark, a clever **octopus** hides in a cave and watches everything quietly.",
    "vi": "Sâu dưới đại dương, một con **cá heo** nhảy lên và bơi cạnh một con **cá voi** khổng lồ. Một con **rùa** hiền lành bơi chậm rãi, và một con **sao biển** đầy màu sắc đậu trên những tảng đá bên dưới. Xa hơn trong bóng tối, một con **bạch tuộc** thông minh ẩn trong hang và lặng lẽ quan sát mọi thứ."
  },

  "seeker.toys-games": {
    "emojis": ["🤖", "🪁", "🎨"],
    "en": "Ben plays with his favourite **robot** and stacks tall towers using coloured **blocks**. His little sister hugs her soft **teddy** and makes animals out of **clay**. Later, they go outside to fly a **kite** and kick a **ball** in the park.",
    "vi": "Ben chơi với con **rô-bốt** yêu thích của mình và xếp những tháp cao bằng những **khối** màu sắc. Em gái nhỏ của cậu ôm chú **gấu bông** mềm mại và nặn các con vật bằng **đất sét**. Sau đó, họ ra ngoài để thả **diều** và đá **bóng** trong công viên."
  },

  "seeker.basic-actions": {
    "emojis": ["🏃", "🎨", "😴"],
    "en": "In the morning, Tom **wakes up**, **eats** breakfast quickly, and **walks** to school. After school, he **plays** football with his friends, **kicks** the ball hard, and **runs** all around the field. At night, he **draws** a picture in his notebook, then **sleeps** peacefully.",
    "vi": "Vào buổi sáng, Tom **thức dậy**, **ăn** sáng nhanh rồi **đi bộ** đến trường. Sau giờ học, cậu **chơi** bóng đá với bạn bè, **đá** bóng thật mạnh và **chạy** khắp sân. Vào ban đêm, cậu **vẽ** một bức tranh trong cuốn sổ rồi **ngủ** ngon lành."
  },

  "seeker.greetings-manners": {
    "emojis": ["👋", "🤝", "😊"],
    "en": "Tom walks up to a new boy and says: **Hello**! My **name** is Tom. **Nice** to **meet** you! The new boy smiles and says: **Welcome** to our class! After school, Tom says **Thank** you, **bye**! and waves goodbye with a big smile.",
    "vi": "Tom bước đến chỗ một bạn trai mới và nói: **Xin chào**! **Tên** tôi là Tom. Rất vui được **gặp** bạn! Cậu bé mới mỉm cười và nói: **Chào mừng** đến lớp của chúng mình! Sau giờ học, Tom nói **Cảm ơn**, **tạm biệt**! và vẫy tay chào với nụ cười thật to."
  },

  "seeker.daily-routines": {
    "emojis": ["🌅", "🎒", "🛁"],
    "en": "Every **morning**, Sara **wakes** up, **washes** her face, and **brushes** her teeth. She **wears** her school uniform and **goes** to **school** on time. After **dinner**, she takes a warm **bath** and **rests** quietly before **night** falls.",
    "vi": "Mỗi **buổi sáng**, Sara **thức dậy**, **rửa** mặt và **đánh** răng. Cô mặc đồng phục và **đi** đến **trường** đúng giờ. Sau bữa **tối**, cô tắm **bồn** ấm và **nghỉ ngơi** yên lặng trước khi **đêm** đến."
  },

  "seeker.simple-adjectives": {
    "emojis": ["🐘", "🐭", "🍋"],
    "en": "The **big** elephant is **slow** but very **strong**, while the **small** mouse is **fast** and **clean**. The **new** cushion on the sofa is **soft** and **sweet** to sleep on. The lemon in the kitchen is **sour** and **yellow** — it looks **old** but tastes very fresh!",
    "vi": "Con **voi** to thì **chậm** nhưng rất **mạnh**, còn con **chuột** nhỏ thì **nhanh** và **sạch sẽ**. Chiếc gối **mới** trên sofa thì **mềm** mại và dễ chịu để ngủ. Quả chanh trong bếp thì **chua** và **vàng** — trông **cũ** nhưng thơm rất tươi!"
  },

  "seeker.jobs-basic": {
    "emojis": ["👨‍⚕️", "🚒", "✈️"],
    "en": "Emma's mum is a kind **doctor** who helps sick people every day. Her dad is a **chef** who cooks delicious food at a big restaurant. Emma's uncle is a brave **firefighter** and her dream is to become a **pilot** one day!",
    "vi": "Mẹ của Emma là một **bác sĩ** tốt bụng giúp đỡ người bệnh mỗi ngày. Bố cô là một **đầu bếp** nấu những món ăn ngon ở một nhà hàng lớn. Chú của Emma là một **lính cứu hỏa** dũng cảm và ước mơ của cô là trở thành **phi công** một ngày nào đó!"
  },

  "seeker.farm-basics": {
    "emojis": ["🐓", "🚜", "🌾"],
    "en": "On the farm, the **rooster** crows loudly at sunrise and wakes everyone up. The **chickens** peck at **seeds** and the fluffy **sheep** graze slowly in the green **field**. Dad hops on the **tractor**, drives to the **barn**, and loads up big bales of **hay**.",
    "vi": "Ở nông trại, con **gà trống** gáy to vào lúc mặt trời mọc và đánh thức mọi người dậy. Những con **gà mái** mổ **hạt** còn những con **cừu** bông xốp ăn cỏ chậm chạp trong **cánh đồng** xanh. Bố leo lên **máy kéo**, lái đến **chuồng trại** và chất những kiện **rơm** lớn lên xe."
  },

  "seeker.nature-basics": {
    "emojis": ["🌳", "🏔️", "🌊"],
    "en": "Ben walks along a narrow **path** through a quiet **forest** filled with tall **trees**. He finds a **river** and throws a smooth **rock** into the water with a big splash. From the top of the **hill**, he can see the snowy **mountain** far away under the clear blue **sky**.",
    "vi": "Ben đi dọc theo một **con đường** hẹp qua một khu **rừng** yên tĩnh đầy **cây** cao. Cậu tìm thấy một con **sông** và ném một hòn **đá** nhẵn xuống nước tạo thành tiếng tòm lớn. Từ đỉnh **ngọn đồi**, cậu có thể nhìn thấy dãy **núi** tuyết phủ ở xa dưới bầu trời xanh trong."
  },

  "seeker.simple-sports": {
    "emojis": ["⚽", "🏊", "🏸"],
    "en": "Tom loves playing **football** after school with all his friends on the big field. On weekends, the family goes **swimming** at the outdoor pool or takes a long **cycling** ride in the park. His sister prefers staying indoors to play **badminton** and **ping-pong** with her cousins.",
    "vi": "Tom thích chơi **bóng đá** sau giờ học với tất cả bạn bè trên sân rộng. Cuối tuần, cả nhà đi **bơi** ở bể bơi ngoài trời hoặc đi **đạp xe** dài trong công viên. Em gái cậu thích ở trong nhà hơn để chơi **cầu lông** và **bóng bàn** với các anh chị em họ."
  },

  "seeker.home-objects": {
    "emojis": ["🍲", "🧹", "🛏️"],
    "en": "Mum sets the table with a **plate**, a **bowl**, and a tall **glass** for each person. She stirs the hot soup with a **spoon** and keeps it warm in a big **pot** on the stove. After dinner, Dad sweeps the floor with the **broom** while Sara washes the dishes.",
    "vi": "Mẹ bày bàn với một cái **đĩa**, một cái **bát** và một cái **cốc** cao cho mỗi người. Bà khuấy nồi súp nóng bằng **thìa** và giữ ấm trong một cái **nồi** to trên bếp. Sau bữa tối, bố quét sàn bằng cái **chổi** trong khi Sara rửa bát."
  },

  "seeker.common-tech": {
    "emojis": ["📱", "💻", "📺"],
    "en": "Tom uses his **tablet** to watch funny **videos** and play **games** on the **internet**. His dad types on the **keyboard** and checks messages on his **phone**, then plugs it into the **charger** before bed. The whole family watches a film together on the big **TV** **screen** in the living room.",
    "vi": "Tom dùng **máy tính bảng** để xem những **video** hài hước và chơi **trò chơi** trên **mạng**. Bố cậu gõ trên **bàn phím** và kiểm tra tin nhắn trên **điện thoại** rồi cắm **sạc** trước khi đi ngủ. Cả nhà cùng xem một bộ phim trên **màn hình** **TV** lớn ở phòng khách."
  },

  "seeker.celebrations": {
    "emojis": ["🎂", "🎈", "🎆"],
    "en": "It is Lily's **birthday** and everyone is excited for the big **party**! They **decorate** the room with colourful **balloons** and place ten **candles** on the **cake**. Lily makes a secret **wish**, blows them all out, and then everyone **claps** and watches the bright **fireworks** light up the night sky.",
    "vi": "Hôm nay là **sinh nhật** của Lily và mọi người đều rất háo hức cho bữa **tiệc** lớn! Họ **trang trí** phòng bằng những quả **bóng bay** đầy màu sắc và đặt mười ngọn **nến** lên **bánh**. Lily thầm **ước**, thổi tắt tất cả nến rồi mọi người **vỗ tay** và cùng nhau xem những màn **pháo hoa** rực rỡ thắp sáng bầu trời đêm."
  },

  "seeker.outdoor-play": {
    "emojis": ["🛝", "⛲", "🏃"],
    "en": "The children run to the **park** after school and **climb** straight to the top of the big **slide**. They **swing** high on the swings and **splash** each other at the **fountain** until they are soaking wet. Then they play **hide** and **seek** among the trees before they **race** each other all the way home.",
    "vi": "Bọn trẻ chạy đến **công viên** sau giờ học và **leo** thẳng lên đỉnh cầu **trượt** to. Họ **đu** cao trên xích đu và **té nước** vào nhau ở **đài phun nước** cho đến khi ướt sũng. Sau đó họ chơi **trốn** tìm trong những tán cây trước khi **chạy đua** với nhau về nhà."
  },

  # ── STARTER (30 topics) ── 2-3 sentences, A1 ──────────────────────────────

  "starter.family-home": {
    "emojis": ["👨‍👩‍👧‍👦", "🍳", "🛏️"],
    "en": "My **mum** and **dad** are busy cooking together in the **kitchen**. My **sister** plays outside in the **garden** while my **baby** brother takes a nap in the **bedroom**. In the evening, we all sit together in the **living room**, watch TV, and talk about our day.",
    "vi": "**Mẹ** và **bố** tôi đang bận rộn nấu ăn cùng nhau trong **bếp**. **Chị gái** tôi chơi ngoài **vườn** trong khi em **bé** của tôi ngủ trưa trong **phòng ngủ**. Vào buổi tối, cả nhà ngồi cùng nhau trong **phòng khách**, xem TV và kể về ngày của mình."
  },

  "starter.animals": {
    "emojis": ["🐴", "🐇", "🐸"],
    "en": "At the farm, Tom feeds a beautiful **horse** and watches a white **duck** glide across the pond. His small brown **rabbit** hops through the tall grass and a green **frog** leaps onto a lily pad nearby. That evening, Tom's sleepy **cat** and wagging **dog** wait by the door to welcome him home.",
    "vi": "Ở nông trại, Tom cho một con **ngựa** đẹp ăn và xem một con **vịt** trắng lướt qua ao. Chú **thỏ** nâu nhỏ của cậu nhảy nhót qua đám cỏ cao và một con **ếch** xanh nhảy lên một chiếc lá súng gần đó. Tối hôm đó, con **mèo** buồn ngủ và con **chó** vẫy đuôi của Tom đợi ở cửa để chào đón cậu về nhà."
  },

  "starter.food": {
    "emojis": ["🍳", "🎂", "🧃"],
    "en": "Sara makes a quick breakfast with two **eggs**, some **bread**, and a cold glass of **milk**. Her brother wants an **apple** and a slice of **cheese** instead, but Mum says he must eat properly first. As a treat, Mum promises **ice cream** on a **banana** **cake** if everyone finishes their vegetables!",
    "vi": "Sara làm bữa sáng nhanh với hai quả **trứng**, một ít **bánh mì** và một ly **sữa** lạnh. Anh trai cô muốn một quả **táo** và một miếng **phô mai** thay thế, nhưng Mẹ nói anh phải ăn đúng bữa trước đã. Như một phần thưởng, Mẹ hứa sẽ có **kem** trên **bánh** **chuối** nếu mọi người ăn hết rau!"
  },

  "starter.toys": {
    "emojis": ["🪁", "🎶", "🎨"],
    "en": "Ben and his friend **play** at the park all afternoon — they fly a **kite**, kick a **ball**, and take turns on the **swing**. Later, they come home and Ben starts to **draw** pictures of their day in his sketchbook. His friend picks up a toy guitar and begins to **sing** a funny made-up song.",
    "vi": "Ben và bạn **chơi** ở công viên cả buổi chiều — họ thả **diều**, đá **bóng** và thay nhau ngồi **đu xích đu**. Sau đó, họ về nhà và Ben bắt đầu **vẽ** những bức tranh về ngày hôm đó trong cuốn sổ phác thảo. Bạn cậu nhặt một cây đàn guitar đồ chơi và bắt đầu **hát** một bài hát ngẫu hứng hài hước."
  },

  "starter.colours": {
    "emojis": ["🎨", "🖌️", "🌈"],
    "en": "Lily mixes **red** and **blue** paint to make a deep **purple**, then **yellow** and **red** to get a bright **orange**. She paints a tall **green** forest with a **brown** bear standing next to a **white** rabbit in the snow. At the top of the picture, she adds a **pink** and **black** sky for a magical night scene.",
    "vi": "Lily pha **đỏ** và **xanh dương** để ra **tím** đậm, rồi **vàng** và **đỏ** để ra **cam** rực rỡ. Cô vẽ một khu rừng **xanh lá** cao với một con gấu **nâu** đứng cạnh một con thỏ **trắng** trong tuyết. Trên đỉnh bức tranh, cô thêm bầu trời **hồng** và **đen** cho một cảnh đêm huyền ảo."
  },

  "starter.body": {
    "emojis": ["🩺", "💪", "😄"],
    "en": "The doctor asks Tom to open his **mouth** wide and then gently closes her **hand** around his **arm** to check his pulse. She shines a light in his **eyes** and **ears** before pressing softly on his **head**. She says with a smile: Move your **legs** and **feet** for me — you are perfectly healthy!",
    "vi": "Bác sĩ yêu cầu Tom mở **miệng** thật to rồi nhẹ nhàng đặt **tay** bà lên **cánh tay** cậu để kiểm tra mạch. Bà chiếu đèn vào **mắt** và **tai** cậu trước khi ấn nhẹ vào **đầu**. Bà nói với nụ cười: Hãy cử động **chân** và **bàn chân** của con cho cô xem — con hoàn toàn khỏe mạnh!"
  },

  "starter.school": {
    "emojis": ["🎒", "📏", "📋"],
    "en": "Lily takes out her sharp **pencil** and **ruler** from her **bag** and places them neatly on the **desk**. The **teacher** writes today's **homework** on the **board** and asks everyone to copy it into their notebooks. After class, Lily borrows a friend's **eraser** to fix a small mistake in her **book**.",
    "vi": "Lily lấy **bút chì** nhọn và **thước kẻ** ra khỏi **cặp** và đặt gọn gàng lên **bàn học**. **Giáo viên** viết **bài tập về nhà** hôm nay lên **bảng** và yêu cầu mọi người chép vào vở. Sau giờ học, Lily mượn **tẩy** của bạn để sửa một lỗi nhỏ trong **vở** của mình."
  },

  "starter.clothes": {
    "emojis": ["👗", "🕶️", "🧥"],
    "en": "Sara picks out a sunny yellow **dress** and her favourite denim **jacket** for the school trip. She looks everywhere for her **shoes** before finding them hidden under a pile of **trousers** on the floor. At school, she spots her best friend wearing a smart **shirt**, neat **shorts**, and a cool pair of **glasses**.",
    "vi": "Sara chọn một chiếc **váy** vàng rực và chiếc **áo khoác** denim yêu thích của mình cho chuyến đi thực tế. Cô tìm **giày** khắp nơi trước khi tìm thấy chúng bị giấu dưới đống **quần dài** trên sàn. Ở trường, cô nhìn thấy người bạn thân nhất đang mặc một chiếc **áo sơ mi** đẹp, **quần ngắn** gọn gàng và đeo một cặp **kính** thật cool."
  },

  "starter.sports": {
    "emojis": ["⚽", "🏊", "🏸"],
    "en": "Tom spends every afternoon playing **football** on the field — he can **kick** hard and **throw** the ball far across to his teammates. On hot days, the whole class goes to the pool for **swimming** lessons and they all **jump** in together with a big splash. His favourite indoor sport is **badminton** because he loves to **run** fast and **catch** the shuttlecock before it hits the ground.",
    "vi": "Tom dành mỗi buổi chiều chơi **bóng đá** trên sân — cậu có thể **đá** mạnh và **ném** bóng xa đến cho đồng đội. Những ngày nóng, cả lớp đi đến bể bơi để học **bơi** và mọi người cùng **nhảy** xuống tạo thành tiếng tòm lớn. Môn thể thao trong nhà yêu thích của cậu là **cầu lông** vì cậu thích **chạy** nhanh và **bắt** cầu trước khi nó chạm đất."
  },

  "starter.feelings": {
    "emojis": ["😊", "😰", "🥳"],
    "en": "On the first day of school, Mia feels both **excited** and a little **scared** at the same time. At lunch she is very **hungry**, so she eats every bite on her plate. By the end of the day she is **tired** but **happy**, because she has found a new friend and is no longer **bored** or **sad**.",
    "vi": "Vào ngày đầu tiên đến trường, Mia cảm thấy vừa **hào hứng** vừa hơi **sợ** cùng một lúc. Đến giờ ăn trưa cô rất **đói** nên ăn hết sạch đĩa cơm. Đến cuối ngày cô **mệt** nhưng **vui**, vì cô đã tìm được một người bạn mới và không còn **buồn chán** hay **buồn** nữa."
  },

  "starter.weather": {
    "emojis": ["🌤️", "⛈️", "🌈"],
    "en": "In the morning the **sun** shines bright and the air feels **warm** and **windy** — perfect for flying a kite. By afternoon, thick dark **clouds** gather and a **storm** brings heavy **rain**, loud **thunder**, and flashes of **lightning** across the sky. But after the storm, a stunning **rainbow** appears and the **warm** sunshine slowly comes back.",
    "vi": "Vào buổi sáng **mặt trời** chiếu sáng và không khí cảm thấy **ấm** và **có gió** — rất thích hợp để thả diều. Đến buổi chiều, những đám **mây** dày tối tụ lại và một cơn **bão** mang theo **mưa** to, **sấm** lớn và những tia **chớp** lóe sáng qua bầu trời. Nhưng sau cơn bão, một cái **cầu vồng** tuyệt đẹp xuất hiện và ánh **nắng ấm** từ từ quay trở lại."
  },

  "starter.transport": {
    "emojis": ["🚌", "⛴️", "✈️"],
    "en": "Every morning Tom rides the **bus** to school while his dad zooms past on a **motorcycle**. On weekends, the family takes a **train** to the seaside or a **ferry** across the wide river to visit relatives. One day, they dream of boarding a giant **plane** and flying far away to explore a new country together.",
    "vi": "Mỗi sáng Tom đi **xe buýt** đến trường trong khi bố phóng qua trên chiếc **xe máy**. Cuối tuần, cả nhà đi **tàu hỏa** ra biển hoặc đi **phà** qua con sông rộng để thăm họ hàng. Một ngày nào đó, họ mơ được lên một chiếc **máy bay** khổng lồ và bay thật xa để cùng nhau khám phá một đất nước mới."
  },

  "starter.sea": {
    "emojis": ["🐬", "⚓", "🐚"],
    "en": "At the **beach**, the children collect pretty **seashells** and watch the tall **waves** crash and foam on shore. A bright **lighthouse** flashes in the distance to guide fishing boats safely to the harbour. Under the surface of the water, colourful **coral**, a slow green **turtle**, and a playful **dolphin** make their home in the deep blue sea.",
    "vi": "Ở **bãi biển**, bọn trẻ nhặt những **vỏ sò** đẹp và xem những con **sóng** lớn đổ ập và bọt trắng trên bờ. Một **ngọn hải đăng** sáng nhấp nháy ở phía xa để dẫn đường cho các thuyền đánh cá về cảng an toàn. Dưới bề mặt nước, **san hô** đầy màu sắc, một con **rùa** xanh chậm chạp và một con **cá heo** tinh nghịch đang sống trong biển xanh sâu thẳm."
  },

  "starter.time": {
    "emojis": ["⏰", "📅", "🌙"],
    "en": "**Yesterday**, Sara woke up **early** and arrived at school on time with a big smile. **Today**, she slept **late** and missed the **morning** bus, which made her mum very worried. She hopes that **tomorrow** she will get up on time so she can have a calm **weekend** to look forward to next **week**.",
    "vi": "**Hôm qua**, Sara dậy **sớm** và đến trường đúng giờ với nụ cười rạng rỡ. **Hôm nay**, cô ngủ **muộn** và lỡ chuyến xe buýt **buổi sáng**, khiến mẹ rất lo lắng. Cô hy vọng **ngày mai** sẽ dậy đúng giờ để có thể thư thái trong **cuối tuần** đáng mong chờ vào **tuần** tới."
  },

  "starter.music": {
    "emojis": ["🎹", "🎻", "🎤"],
    "en": "Mia practises the **piano** every afternoon, working hard on a gentle **melody** she learned at school. On the **stage** at the end-of-year **concert**, she performs a beautiful **song** while her best friend plays the **violin** beside her. The audience erupts in applause, and the **music** teacher says it was the best **performance** of the year.",
    "vi": "Mia tập **đàn piano** mỗi buổi chiều, chăm chỉ luyện tập một bản **giai điệu** nhẹ nhàng mà cô học được ở trường. Trên **sân khấu** trong buổi **hòa nhạc** cuối năm, cô biểu diễn một bài **hát** hay trong khi người bạn thân nhất kéo **đàn violin** bên cạnh. Khán giả vỗ tay vang lên, và giáo viên **âm nhạc** nói đó là màn **biểu diễn** hay nhất trong năm."
  },

  "starter.farm-animals": {
    "emojis": ["🐔", "🐄", "🌅"],
    "en": "At dawn, the **rooster** crows loudly and wakes up every animal on Grandpa's farm. The **hen** waddles to the nest and lays three warm eggs while the **cow** and her **calf** graze slowly by the old fence. The friendly **goat** and stubborn **donkey** stand side by side, both busy chewing hay in the morning sunshine.",
    "vi": "Vào lúc bình minh, con **gà trống** gáy to và đánh thức mọi con vật trên trang trại của ông. Con **gà mái** lạch bạch đến ổ và đẻ ba quả trứng ấm trong khi con **bò** và **bê con** của nó từ từ gặm cỏ bên chiếc hàng rào cũ. Con **dê** thân thiện và con **lừa** bướng bỉnh đứng cạnh nhau, cả hai đều bận bịu nhai rơm trong ánh nắng ban mai."
  },

  "starter.nature": {
    "emojis": ["🏔️", "🌊", "🌲"],
    "en": "The family hikes through a cool **forest**, stepping over smooth **rocks** and crossing a shallow **river** by the stepping stones. They climb a long steep **hill** and are amazed to find a sparkling **waterfall** tumbling into a clear pool in the **valley** below. At the top, the endless blue **sky** and towering **mountains** stretch as far as they can see.",
    "vi": "Cả nhà đi bộ qua một khu **rừng** mát mẻ, bước qua những **tảng đá** nhẵn và băng qua con **sông** nông bằng những viên đá bước. Họ leo lên một **ngọn đồi** dốc dài và kinh ngạc khi tìm thấy một **thác nước** lấp lánh đổ xuống một hồ trong vắt ở **thung lũng** bên dưới. Ở đỉnh, bầu **trời** xanh vô tận và những ngọn **núi** cao sừng sững trải dài đến tận mắt nhìn."
  },

  "starter.shapes-numbers": {
    "emojis": ["⭐", "🔷", "🔢"],
    "en": "The teacher draws a **circle**, a **square**, and a **triangle** on the board and asks the class to name each shape. She then sticks golden **star** and red **heart** stickers next to the numbers from **one** to **ten**. Tom counts carefully and sticks **three** **stars** and **five** **hearts** neatly onto the front cover of his notebook.",
    "vi": "Giáo viên vẽ một **hình tròn**, một **hình vuông** và một **hình tam giác** lên bảng và yêu cầu cả lớp đặt tên cho từng hình. Sau đó bà dán những nhãn dán **ngôi sao** vàng và **trái tim** đỏ bên cạnh các số từ **một** đến **mười**. Tom đếm cẩn thận và dán **ba** **ngôi sao** và **năm** **trái tim** gọn gàng lên trang bìa cuốn vở của mình."
  },

  "starter.city-places": {
    "emojis": ["🌉", "🛍️", "🏛️"],
    "en": "Tom's family walks across the old stone **bridge** to reach the busy morning **market** by the river. They stop for a long lunch at a cosy **restaurant** near the **park**, watching people feed the ducks. In the afternoon, they explore the **museum**, buy some new books at the **library**, and finish the day with a film at the **cinema**.",
    "vi": "Gia đình Tom đi qua cây **cầu** đá cũ để đến **chợ** sáng nhộn nhịp bên con sông. Họ dừng lại ăn trưa dài tại một **nhà hàng** ấm cúng gần **công viên**, ngắm mọi người cho vịt ăn. Buổi chiều, họ khám phá **bảo tàng**, mua một số sách mới tại **thư viện** rồi kết thúc ngày bằng một bộ phim tại **rạp chiếu phim**."
  },

  "starter.cooking": {
    "emojis": ["🍲", "🔪", "👨‍🍳"],
    "en": "Mum **washes** the fresh vegetables under the tap and **cuts** them carefully into small pieces on the board. She **boils** a pot of water, adds the vegetables, and **stirs** in the soup paste with a long wooden spoon. When everything is ready, she **pours** the hot soup into bowls and they all **taste** it together at the table.",
    "vi": "Mẹ **rửa** rau tươi dưới vòi nước và **cắt** chúng cẩn thận thành những miếng nhỏ trên thớt. Bà **đun sôi** một nồi nước, cho rau vào và **khuấy** bột súp vào bằng cái thìa gỗ dài. Khi mọi thứ đã sẵn sàng, bà **rót** súp nóng vào bát và mọi người cùng nhau **nếm** tại bàn ăn."
  },

  "starter.princess-magic": {
    "emojis": ["🏰", "🧚", "⚔️"],
    "en": "Deep in a dark **forest**, a brave **knight** follows a glowing light and discovers a tall **castle** where a sleeping **princess** lies under an enchanted **spell**. A kind **fairy** appears, raises her sparkling **wand**, and breaks the **magic** curse with a burst of golden light. The **princess** opens her eyes, places a silver **crown** on her head, and thanks the knight for being her true **hero**.",
    "vi": "Sâu trong khu **rừng** tối, một **hiệp sĩ** dũng cảm đi theo ánh sáng le lói và khám phá ra một tòa **lâu đài** cao nơi một **công chúa** đang ngủ dưới lời nguyền **phép thuật**. Một **nàng tiên** tốt bụng xuất hiện, giơ chiếc **đũa phép** lấp lánh lên và phá vỡ lời nguyền **ma thuật** bằng một luồng ánh sáng vàng rực. **Công chúa** mở mắt ra, đặt chiếc **vương miện** bạc lên đầu và cảm ơn hiệp sĩ vì đã là **anh hùng** thực sự của cô.",
  },

  "starter.daily-routine": {
    "emojis": ["🌅", "🚶", "🛁"],
    "en": "Every day Sara **wakes up** at seven, **brushes** her teeth, and **washes** her face before getting **dressed** in her uniform. After a quick **breakfast**, she **walks** to school and works hard until **lunch**. In the evening she does her **homework**, has a warm **bath**, tidies her room, and reads a book at **bedtime**.",
    "vi": "Mỗi ngày Sara **thức dậy** lúc bảy giờ, **đánh** răng và **rửa** mặt trước khi **mặc** đồng phục. Sau bữa **sáng** nhanh, cô **đi bộ** đến trường và học chăm chỉ cho đến **bữa trưa**. Buổi tối cô làm **bài tập**, tắm **bồn** ấm, dọn dẹp phòng và đọc sách trước giờ **đi ngủ**."
  },

  "starter.fruits-vegetables": {
    "emojis": ["🛒", "🥭", "🥗"],
    "en": "At the market, Mum fills her basket with crisp **apples**, bright **oranges**, and a ripe yellow **mango**. She also picks up crunchy **carrots**, juicy **tomatoes**, and a giant round **watermelon** for dessert. That evening, she makes a colourful salad with **cucumber**, sweet **corn**, and fresh **strawberries** on the side.",
    "vi": "Tại chợ, Mẹ đầy giỏ với những quả **táo** giòn, **cam** tươi sáng và một quả **xoài** vàng chín. Bà còn mua thêm **cà rốt** giòn, **cà chua** mọng nước và một quả **dưa hấu** tròn khổng lồ để tráng miệng. Tối hôm đó, bà làm một đĩa salad đầy màu sắc với **dưa chuột**, **ngô** ngọt và **dâu tây** tươi ăn kèm."
  },

  "starter.parties-celebrations": {
    "emojis": ["🎂", "🎉", "💃"],
    "en": "Lily **invites** all her best **friends** to her **birthday** party and they spend the afternoon helping to **decorate** the house with colourful **balloons** and streamers. When the big **cake** comes out covered in ten shining **candles**, everyone **sings** together and **claps** loudly. Lily makes a secret **wish**, blows out every candle, and they all **dance** and **celebrate** late into the evening.",
    "vi": "Lily **mời** tất cả bạn thân đến bữa tiệc **sinh nhật** của mình và họ dành cả buổi chiều giúp nhau **trang trí** nhà bằng những quả **bóng bay** và dây giấy đầy màu sắc. Khi cái **bánh** to được mang ra với mười ngọn **nến** sáng lấp lánh, mọi người cùng nhau **hát** và **vỗ tay** thật to. Lily thầm **ước**, thổi tắt tất cả nến rồi tất cả cùng **nhảy** và **mừng** đến tận tối muộn."
  },

  "starter.jobs-people": {
    "emojis": ["🏥", "🚒", "🔬"],
    "en": "Ben has a very busy morning — first he visits the **dentist** for a check-up, then Mum takes their cat to the **vet** for a vaccination. On the way home, they stop to watch a **firefighter** and a **police** officer helping safely clear a road accident. Ben decides on the spot that he wants to be a **scientist** when he grows up!",
    "vi": "Ben có một buổi sáng rất bận rộn — đầu tiên cậu đến gặp **nha sĩ** để kiểm tra, sau đó Mẹ đưa con mèo đến **bác sĩ thú y** để tiêm phòng. Trên đường về, họ dừng lại xem một **lính cứu hỏa** và một **cảnh sát** đang giúp xử lý an toàn một vụ tai nạn giao thông. Ben quyết định ngay tại chỗ rằng cậu muốn trở thành **nhà khoa học** khi lớn lên!"
  },

  "starter.shopping": {
    "emojis": ["🛍️", "💳", "🏷️"],
    "en": "Sara and her mum go to the **shop** to **buy** a new pair of trainers for the school term. Sara **chooses** a pair in her **size**, but the **price** is too **expensive** so they look for something more **cheap** on the **sale** rack. They wait patiently in the **queue** and the **cashier** smiles and hands them a **receipt** when they pay.",
    "vi": "Sara và mẹ đi **cửa hàng** để **mua** một đôi giày thể thao mới cho học kỳ. Sara **chọn** một đôi đúng **cỡ** của mình, nhưng **giá** quá **đắt** nên họ tìm thứ gì đó **rẻ** hơn ở kệ hàng **giảm giá**. Họ kiên nhẫn đợi trong **hàng** và người thu ngân **cashier** mỉm cười đưa cho họ **hóa đơn** khi họ trả tiền."
  },

  "starter.describing-things": {
    "emojis": ["🎒", "🛋️", "✨"],
    "en": "Tom has two school bags — the **big** one is **heavy** and full of books, while the **small** one is **light** and easy to carry. His bedroom is **clean** and **quiet**, but his brother's room is always **loud**, **dirty**, and messy. The family's **new** dining table is perfectly **round**, wonderfully **smooth**, and so **shiny** you can almost see your face in it.",
    "vi": "Tom có hai cặp học — cái **lớn** thì **nặng** và đầy sách, còn cái **nhỏ** thì **nhẹ** và dễ mang. Phòng của cậu thì **sạch** và **yên tĩnh**, nhưng phòng anh trai cậu thì lúc nào cũng **ồn ào**, **bẩn** và lộn xộn. Cái bàn ăn **mới** của gia đình thì hoàn hảo hình **tròn**, cực kỳ **mượt mà** và **bóng loáng** đến mức bạn gần như nhìn thấy khuôn mặt mình trong đó."
  },

  "starter.ocean-animals": {
    "emojis": ["🦈", "🐠", "🌊"],
    "en": "At the aquarium, Ben presses his face against the glass and watches a huge **whale** and a sleek **shark** glide silently past. A graceful **turtle** drifts above a bright patch of **coral** while a tiny **seahorse** floats nearby, barely moving. Outside the building, gentle **waves** lap the shore where **crabs** and purple **starfish** bask in the afternoon sun.",
    "vi": "Tại thủy cung, Ben áp mặt vào tấm kính và xem một con **cá voi** khổng lồ và một con **cá mập** thon thả lướt qua trong im lặng. Một con **rùa** thanh lịch trôi dạt trên một vùng **san hô** rực rỡ trong khi một con **cá ngựa** nhỏ xíu lơ lửng gần đó, hầu như không nhúc nhích. Bên ngoài tòa nhà, những con **sóng** nhẹ nhàng vỗ vào bờ nơi những con **cua** và **sao biển** tím đang nằm phơi nắng buổi chiều."
  },

  "starter.cooking-actions": {
    "emojis": ["🥘", "🔪", "👨‍🍳"],
    "en": "Dad **chops** the onions finely and **peels** a whole head of garlic before making the sauce. He **fries** the vegetables in hot oil until golden, then carefully **stirs** in the **tomatoes** and lets everything **simmer** slowly. Mum **bakes** fresh crusty bread in the oven, and when everything is ready they **serve** it all together and **taste** the meal as a family.",
    "vi": "Bố **băm nhỏ** hành tây và **bóc vỏ** cả củ tỏi trước khi làm nước sốt. Bố **xào** rau trong dầu nóng đến khi vàng rồi cẩn thận **khuấy** **cà chua** vào và để mọi thứ **ninh** chậm. Mẹ **nướng** bánh mì giòn trong lò, và khi mọi thứ đã sẵn sàng họ cùng nhau **dọn** ra bàn và cả nhà cùng **nếm** bữa ăn."
  },

  "starter.outdoor-nature": {
    "emojis": ["🦋", "🌸", "☀️"],
    "en": "After the morning rain, Sara walks along the **river** bank and picks up a smooth flat **stone** to skip across the water. A **butterfly** lands softly on a bright pink **flower** near the old **tree** and a busy **bee** hums past her ear collecting nectar. In the distance, a perfect **rainbow** slowly fades as the warm **sunshine** finally breaks through the clouds.",
    "vi": "Sau cơn mưa sáng, Sara đi dọc bờ **sông** và nhặt một hòn **đá** nhẵn dẹt để ném lướt trên mặt nước. Một con **bướm** đáp nhẹ nhàng lên một bông **hoa** hồng tươi sáng gần cây **cây** cổ thụ và một con **ong** bận rộn vo ve qua tai cô đang thu mật. Ở phía xa, một cái **cầu vồng** hoàn hảo từ từ nhạt dần khi ánh **nắng** ấm cuối cùng cũng xuyên qua những đám mây."
  },
}

data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'stories.json')
with open(data_path) as f:
    existing = json.load(f)

existing.update(stories)

with open(data_path, 'w') as f:
    json.dump(existing, f, ensure_ascii=False, indent=2)

seeker_count = sum(1 for k in existing if k.startswith('seeker.'))
starter_count = sum(1 for k in existing if k.startswith('starter.'))
ranger_count = sum(1 for k in existing if k.startswith('ranger.'))
print(f"Done! stories.json now has {len(existing)} entries")
print(f"  seeker:  {seeker_count}/30")
print(f"  starter: {starter_count}/30")
print(f"  ranger:  {ranger_count}/30")
