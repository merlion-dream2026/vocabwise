import json, os

stories = {
  "explorer.science": {
    "emojis": ["🦕", "🔬", "🌿"],
    "en": "Scientists found a **fossil** of a large **creature** that lived millions of years ago. This animal was a **carnivore** — a **predator** that hunted smaller **prey** every day. It lived in a warm, wet **habitat** where many different **species** of plants grew. Sadly, when the environment changed, this animal could not **survive** and became **extinct**.",
    "vi": "Các nhà khoa học tìm thấy một **hóa thạch** của sinh vật lớn sống cách đây hàng triệu năm. Loài động vật này là **động vật ăn thịt** — một **kẻ săn mồi** săn đuổi những con **con mồi** nhỏ hơn mỗi ngày. Nó sống trong một **môi trường sống** ấm áp, ẩm ướt nơi có nhiều **loài** thực vật khác nhau. Đáng buồn thay, khi môi trường thay đổi, loài này không thể **sống sót** và đã **tuyệt chủng**."
  },
  "explorer.technology": {
    "emojis": ["🤖", "⚙️", "💻"],
    "en": "A young **engineer** spent years designing a new **robot** to help in hospitals. She wrote special **software** to **program** it and added tiny **sensors** so it could feel its surroundings. The **circuit** inside used **artificial** intelligence to learn from every task. Her amazing **invention** showed the world how **digital** technology can save lives.",
    "vi": "Một **kỹ sư** trẻ dành nhiều năm thiết kế một **robot** mới để hỗ trợ trong bệnh viện. Cô viết **phần mềm** đặc biệt để **lập trình** nó và thêm các **cảm biến** nhỏ để nó cảm nhận môi trường xung quanh. **Mạch điện** bên trong sử dụng trí tuệ **nhân tạo** để học từ mỗi nhiệm vụ. **Phát minh** tuyệt vời của cô cho thấy công nghệ **kỹ thuật số** có thể cứu sống người."
  },
  "explorer.heroes": {
    "emojis": ["🦸", "⚔️", "🛡️"],
    "en": "The young hero was **determined** and **loyal** to her team, never giving up no matter how hard the **mission** became. When the **villain** threatened the city, she stayed **confident** and led the plan to **rescue** the trapped citizens. Her goal was to **protect** everyone who could not fight for themselves. In the end, her **brave** and **ambitious** spirit helped them **defeat** the danger together.",
    "vi": "Vị anh hùng trẻ tuổi rất **quyết tâm** và **trung thành** với đội của mình, không bao giờ bỏ cuộc dù **nhiệm vụ** có khó đến đâu. Khi **kẻ phản diện** đe dọa thành phố, cô vẫn **tự tin** và dẫn đầu kế hoạch **giải cứu** những người dân bị mắc kẹt. Mục tiêu của cô là **bảo vệ** tất cả những người không thể tự chiến đấu. Cuối cùng, tinh thần **dũng cảm** và **tham vọng** của cô giúp họ cùng **đánh bại** nguy hiểm."
  },
  "explorer.laboratory": {
    "emojis": ["🔬", "🧪", "🔭"],
    "en": "The scientists gathered in the lab to **investigate** a strange new plant they had found. They began to **observe** and **examine** its leaves carefully under a microscope. After they **measured** each part and **analyzed** the chemicals, the **evidence** pointed to an exciting **discovery**. They could now **classify** it as a new species and update their **theory** about how plants grow.",
    "vi": "Các nhà khoa học tập hợp trong phòng thí nghiệm để **điều tra** một loài thực vật lạ vừa tìm thấy. Họ bắt đầu **quan sát** và **kiểm tra** kỹ những chiếc lá dưới kính hiển vi. Sau khi **đo lường** từng bộ phận và **phân tích** các chất hóa học, **bằng chứng** chỉ ra một **khám phá** thú vị. Giờ đây họ có thể **phân loại** nó như một loài mới và cập nhật **lý thuyết** về cách thực vật phát triển."
  },
  "explorer.engineering": {
    "emojis": ["🏗️", "⚙️", "🔧"],
    "en": "The team had to **design** a bridge strong enough to hold heavy trucks. They carefully chose every **component** and planned how the inner **mechanism** would hold the **structure** together. Workers began to **manufacture** the parts in the factory and then **assemble** them on site. The engineer could **operate** the crane and **adjust** each piece to **construct** the perfect bridge.",
    "vi": "Đội nhóm phải **thiết kế** một cây cầu đủ chắc để chịu những chiếc xe tải nặng. Họ cẩn thận chọn từng **linh kiện** và lên kế hoạch cách **cơ chế** bên trong sẽ giữ **kết cấu** lại với nhau. Công nhân bắt đầu **sản xuất** các bộ phận tại nhà máy rồi **lắp ráp** chúng tại công trường. Kỹ sư có thể **vận hành** cần cẩu và **điều chỉnh** từng mảnh để **xây dựng** cây cầu hoàn hảo."
  },
  "explorer.mission": {
    "emojis": ["🦸‍♂️", "⚡", "🗝️"],
    "en": "The two rivals had to form an **alliance** to face the greatest **challenge** they had ever seen. Each hero brought a different **superpower**, and together they built a clever **strategy** to **confront** the enemy. They had to **endure** many hardships and were willing to **sacrifice** their comfort for the mission. With **cunning** moves, they were able to **overcome** every obstacle and **transform** the dark kingdom into a place of peace.",
    "vi": "Hai đối thủ phải hình thành một **liên minh** để đối mặt với **thử thách** lớn nhất mà họ từng thấy. Mỗi anh hùng mang đến một **siêu năng lực** khác nhau, và cùng nhau họ xây dựng một **chiến lược** khôn ngoan để **đối đầu** với kẻ thù. Họ phải **chịu đựng** nhiều gian khổ và sẵn sàng **hi sinh** sự thoải mái vì nhiệm vụ. Với những nước đi **xảo quyệt**, họ **vượt qua** mọi chướng ngại và **biến đổi** vương quốc tối tăm thành nơi hòa bình."
  },
  "explorer.environment": {
    "emojis": ["🌿", "🌊", "🌍"],
    "en": "In the mountain forest, scientists studied an **ecosystem** full of rich **biodiversity**. But **deforestation** and air **pollution** were raising **emissions** and melting the distant **glacier**. Many animals were becoming **endangered** because their homes were being destroyed. The team called for **conservation** laws and **sustainable** farming using **renewable** energy to protect this precious land.",
    "vi": "Trong khu rừng núi, các nhà khoa học nghiên cứu một **hệ sinh thái** giàu **đa dạng sinh học**. Nhưng **phá rừng** và ô nhiễm không khí đang làm tăng **khí thải** và tan chảy **sông băng** ở xa. Nhiều loài động vật đang trở nên **có nguy cơ tuyệt chủng** vì nhà của chúng bị phá hủy. Đội nhóm kêu gọi các luật **bảo tồn** và canh tác **bền vững** sử dụng năng lượng **tái tạo** để bảo vệ vùng đất quý giá này."
  },
  "explorer.space": {
    "emojis": ["🚀", "🌌", "⭐"],
    "en": "The **astronaut** floated inside the **spacecraft** as it began to **launch** away from Earth. She looked through the **telescope** and watched a bright **meteor** streak across the dark sky. Their mission was to **orbit** around a distant moon and study how **gravity** behaves out there. In the distance, she could see a swirling **galaxy** and a spinning **asteroid** moving silently through space.",
    "vi": "**Phi hành gia** trôi nổi bên trong **tàu vũ trụ** khi nó bắt đầu **phóng** rời khỏi Trái Đất. Cô nhìn qua **kính thiên văn** và quan sát một **thiên thạch** sáng vọt ngang bầu trời tối. Nhiệm vụ của họ là **quay quanh** mặt trăng xa xôi và nghiên cứu cách **trọng lực** hoạt động ở đó. Trong khoảng cách xa, cô thấy một **thiên hà** xoáy tròn và một **tiểu hành tinh** quay trong không gian yên tĩnh."
  },
  "explorer.communication": {
    "emojis": ["📰", "🎙️", "🌐"],
    "en": "A young **journalist** prepared for the live **broadcast** about a new city law. She knew that **misinformation** could **influence** people in harmful ways, so she checked every fact twice. During the town meeting, she helped the **audience** understand different points of **perspective** and tried to **persuade** them to think carefully. She warned that **propaganda** and **bias** can make people believe false things, and that a good **debate** always uses true evidence.",
    "vi": "Một **nhà báo** trẻ chuẩn bị cho buổi **phát sóng** trực tiếp về một luật mới của thành phố. Cô biết rằng **thông tin sai lệch** có thể **ảnh hưởng** đến mọi người theo hướng có hại, nên cô kiểm tra mọi sự kiện hai lần. Trong cuộc họp thị trấn, cô giúp **khán giả** hiểu những **quan điểm** khác nhau và cố gắng **thuyết phục** họ suy nghĩ cẩn thận. Cô cảnh báo rằng **tuyên truyền** và **thiên kiến** có thể khiến mọi người tin vào điều sai, và một cuộc **tranh luận** tốt luôn dùng bằng chứng thật."
  },
  "explorer.achievement": {
    "emojis": ["🏆", "🥇", "🎯"],
    "en": "The school team worked hard all year, showing true **dedication** and **perseverance** through every tough practice. Their captain showed strong **leadership**, making sure everyone felt included and valued. When they finally **qualified** for the national **championship**, excitement filled the whole school. In the final match, they faced a skilled **opponent** but relied on **teamwork** and raw **talent** to **accomplish** their greatest **triumph** yet.",
    "vi": "Đội trường học làm việc chăm chỉ suốt cả năm, thể hiện sự **cống hiến** và **kiên trì** thật sự qua mỗi buổi tập khó khăn. Đội trưởng thể hiện **sự lãnh đạo** mạnh mẽ, đảm bảo mọi người đều cảm thấy được tham gia và trân trọng. Khi cuối cùng họ **giành quyền** vào **giải vô địch** quốc gia, cả trường tràn ngập hứng khởi. Trong trận chung kết, họ đối mặt với **đối thủ** tài năng nhưng dựa vào **tinh thần đồng đội** và **tài năng** để **hoàn thành** **chiến thắng** vĩ đại nhất của mình."
  },
  "explorer.biology": {
    "emojis": ["🧬", "🫀", "🦠"],
    "en": "Every part of the human body works together like a perfect team. **Muscles** pull bones in the **skeleton** to create movement, while **veins** carry blood and **oxygen** to every **organ**. Tiny **enzymes** help us **digest** food and turn it into **protein** for energy. When harmful **bacteria** enter the body, the **immune** system sends special **cells** through our **tissue** to fight the infection.",
    "vi": "Mỗi bộ phận cơ thể người hoạt động cùng nhau như một đội hoàn hảo. **Cơ bắp** kéo xương trong **bộ xương** tạo ra chuyển động, trong khi **tĩnh mạch** mang máu và **oxy** đến mọi **cơ quan**. Những **enzyme** nhỏ giúp chúng ta **tiêu hóa** thức ăn và biến nó thành **protein** để có năng lượng. Khi **vi khuẩn** có hại xâm nhập, hệ thống **miễn dịch** gửi các **tế bào** đặc biệt qua **mô** của chúng ta để chống lại nhiễm trùng."
  },
  "explorer.history": {
    "emojis": ["🏛️", "⚔️", "👑"],
    "en": "In the **ancient** world, powerful **empires** rose and fell as **warriors** fought to **conquer** new lands. Many civilisations kept a **dynasty** of rulers, passing power from one **monarch** to the next. When a great **invasion** threatened a city, some people fought for **independence** and built the first idea of **democracy**. Today, **archaeology** uncovers the remains of these lost civilisations and helps us understand the **treaties** that shaped our world.",
    "vi": "Trong thế giới **cổ đại**, những **đế quốc** hùng mạnh nổi lên và sụp đổ khi các **chiến binh** chiến đấu để **chinh phục** vùng đất mới. Nhiều nền văn minh duy trì một **triều đại** của những nhà cai trị, truyền quyền lực từ **quốc vương** này sang người khác. Khi một cuộc **xâm lược** lớn đe dọa thành phố, một số người chiến đấu cho **độc lập** và xây dựng ý tưởng đầu tiên về **dân chủ**. Ngày nay, **khảo cổ học** khai quật tàn tích của các nền văn minh đã mất và giúp chúng ta hiểu những **hiệp ước** đã định hình thế giới."
  },
  "explorer.economy": {
    "emojis": ["💰", "📈", "🏦"],
    "en": "A small business owner needed to manage her money carefully to keep her shop running. She set a monthly **budget** and tried to **invest** extra **capital** into better products. When the country's **inflation** rose, the cost of goods she would **import** went up too, and her **profit** began to fall. She paid a fair **wage** to her workers and hoped the **economy** would improve so that fewer families would face **poverty**.",
    "vi": "Một chủ doanh nghiệp nhỏ cần quản lý tiền bạc cẩn thận để duy trì cửa hàng. Cô đặt ra **ngân sách** hàng tháng và cố gắng **đầu tư** thêm **vốn** vào những sản phẩm tốt hơn. Khi **lạm phát** của đất nước tăng lên, chi phí hàng hóa mà cô **nhập khẩu** cũng tăng theo, và **lợi nhuận** của cô bắt đầu giảm. Cô trả **lương** công bằng cho công nhân và hy vọng **nền kinh tế** sẽ cải thiện để ít gia đình hơn phải đối mặt với **nghèo đói**."
  },
  "explorer.literature": {
    "emojis": ["📚", "✍️", "📖"],
    "en": "The students sat quietly as their teacher began to read from a classic **fiction** novel. The **protagonist** faced impossible choices, and the story's **narrative** moved quickly toward the exciting **climax**. The teacher pointed out how the author used **symbolism** — the stormy **setting** was a **metaphor** for the hero's troubled mind. After reading, the class wrote their own **dialogue** and explored the **theme** of courage through **poetry** in their favorite **genre**.",
    "vi": "Học sinh ngồi yên lặng khi giáo viên bắt đầu đọc từ một cuốn tiểu thuyết **hư cấu** kinh điển. **Nhân vật chính** đối mặt với những lựa chọn bất khả thi, và **cốt truyện** di chuyển nhanh đến **đỉnh điểm** thú vị. Giáo viên chỉ ra cách tác giả dùng **biểu tượng** — **bối cảnh** đầy bão tố là **ẩn dụ** cho tâm trí rối loạn của người anh hùng. Sau khi đọc, lớp viết **đối thoại** của riêng họ và khám phá **chủ đề** lòng dũng cảm qua **thơ ca** trong **thể loại** yêu thích."
  },
  "explorer.ai": {
    "emojis": ["🤖", "💻", "🧠"],
    "en": "The tech company launched a new **platform** that uses machine **intelligence** to help students learn. When a student types a question into the **interface**, an **algorithm** searches a huge **database** stored in the **cloud**. The **machine** processes every **input** and delivers a helpful **output** in seconds. This kind of **automation** in learning is powered by millions of lines of **code** and a complex **network** that the **chatbot** relies on to answer well.",
    "vi": "Công ty công nghệ ra mắt một **nền tảng** mới sử dụng **trí tuệ** máy để giúp học sinh học tập. Khi học sinh gõ câu hỏi vào **giao diện**, một **thuật toán** tìm kiếm trong **cơ sở dữ liệu** khổng lồ được lưu trên **đám mây**. **Máy** xử lý mọi **dữ liệu đầu vào** và cung cấp **kết quả đầu ra** hữu ích trong vài giây. Loại **tự động hóa** này được vận hành bởi hàng triệu dòng **mã** và một **mạng** phức tạp mà **chatbot** dựa vào để trả lời tốt."
  },
  "explorer.law-justice": {
    "emojis": ["⚖️", "🏛️", "👨‍⚖️"],
    "en": "The young **lawyer** entered the **court** prepared to defend her client's **rights**. A **witness** stood up and gave important details during the **trial**, and the **judge** listened carefully to both sides. After hours of debate, the **jury** came to a **verdict**: the **defendant** was not **guilty** of the **crime**. The decision upheld the principles of the **constitution** and reminded everyone why fair **justice** matters.",
    "vi": "Vị **luật sư** trẻ bước vào **tòa án** với sự chuẩn bị để bảo vệ **quyền** của thân chủ mình. Một **nhân chứng** đứng dậy và cung cấp những chi tiết quan trọng trong **phiên tòa**, và **thẩm phán** lắng nghe cẩn thận cả hai bên. Sau nhiều giờ tranh luận, **bồi thẩm đoàn** đưa ra **phán quyết**: **bị cáo** không **có tội** về **tội phạm** đó. Quyết định này duy trì các nguyên tắc của **hiến pháp** và nhắc nhở mọi người tại sao **công lý** công bằng là quan trọng."
  },
  "explorer.psychology": {
    "emojis": ["🧠", "💭", "🔍"],
    "en": "After months of high **stress**, the student felt her **anxiety** growing and her **self-esteem** falling. She talked to her school counselor, who helped her understand how her **perception** of failure was changing her **behavior**. They worked on building a positive **mindset** and replacing unhealthy **habits** with better ones. Over time, she showed great **resilience**, found her **motivation** again, and began to feel proud of who she was becoming.",
    "vi": "Sau nhiều tháng **căng thẳng** cao độ, học sinh cảm thấy **lo lắng** ngày càng tăng và **lòng tự trọng** giảm sút. Cô nói chuyện với cố vấn học đường, người giúp cô hiểu cách **nhận thức** về thất bại đang thay đổi **hành vi** của mình. Họ cùng nhau xây dựng **tư duy** tích cực và thay thế những **thói quen** không lành mạnh bằng những thói quen tốt hơn. Theo thời gian, cô thể hiện **khả năng phục hồi** tuyệt vời, tìm lại **động lực** và bắt đầu tự hào về con người mình đang trở thành."
  },
  "explorer.medicine": {
    "emojis": ["💊", "🏥", "🩺"],
    "en": "The doctor examined a **patient** who had been coughing for two weeks and felt tired every day. After running tests to **diagnose** the problem, she discovered a bacterial **infection** and wrote a **prescription** for an **antibiotic**. She also explained how good nutrition and rest support **recovery** after **treatment**. With the right **prevention** steps — including a new **vaccine** — the town was able to stop the **epidemic** before it spread further.",
    "vi": "Bác sĩ khám cho một **bệnh nhân** đã ho trong hai tuần và cảm thấy mệt mỏi mỗi ngày. Sau khi xét nghiệm để **chẩn đoán** vấn đề, cô phát hiện ra **nhiễm trùng** vi khuẩn và viết **đơn thuốc** cho **kháng sinh**. Cô cũng giải thích cách dinh dưỡng tốt và nghỉ ngơi hỗ trợ **phục hồi** sau **điều trị**. Với các bước **phòng ngừa** đúng đắn — bao gồm một loại **vắc xin** mới — thị trấn có thể ngăn chặn **dịch bệnh** trước khi nó lan rộng."
  },
  "explorer.geography": {
    "emojis": ["🌍", "🗺️", "🏔️"],
    "en": "The geography students spread out a large map and began to trace the world's most dramatic landscapes. They found that the **plateau** in the south was surrounded by a deep **canyon** carved by ancient rivers. Near the **equator**, the hot **savanna** stretched for miles, while frozen **tundra** covered the far northern **hemisphere**. The class learned how to use **longitude** and **latitude** to locate every **continent**, **peninsula**, and **coastline** on the globe.",
    "vi": "Các học sinh địa lý trải ra một tấm bản đồ lớn và bắt đầu truy tìm những cảnh quan ấn tượng nhất thế giới. Họ phát hiện ra rằng **cao nguyên** ở phía nam được bao quanh bởi một **hẻm núi** sâu được tạo ra bởi những con sông cổ đại. Gần **xích đạo**, **xavan** nóng bức trải dài hàng dặm, trong khi **lãnh nguyên** đóng băng bao phủ **bán cầu** bắc xa xôi. Lớp học học cách dùng **kinh độ** và **vĩ độ** để xác định vị trí mỗi **lục địa**, **bán đảo** và **đường bờ biển** trên quả địa cầu."
  },
  "explorer.nutrition": {
    "emojis": ["🥗", "🍎", "💪"],
    "en": "The school launched a healthy eating program to teach students about **nutrition**. The teacher explained that **carbohydrates** give us energy, while **vitamins** and **minerals** keep our bones and skin strong. Too much **sugar** and **fat** can harm the body, so choosing the right **portion** of each **ingredient** matters. Students were excited to cook simple **cuisine** using fresh, **organic** vegetables and to reduce their need for any **supplement**.",
    "vi": "Trường học ra mắt chương trình ăn uống lành mạnh để dạy học sinh về **dinh dưỡng**. Giáo viên giải thích rằng **carbohydrate** cung cấp năng lượng, trong khi **vitamin** và **khoáng chất** giữ xương và da chúng ta chắc khỏe. Quá nhiều **đường** và **chất béo** có thể gây hại, vì vậy việc chọn **khẩu phần** phù hợp của mỗi **thành phần** rất quan trọng. Học sinh hứng thú nấu những món **ẩm thực** đơn giản bằng rau **hữu cơ** tươi và giảm nhu cầu dùng **thực phẩm bổ sung**."
  },
  "explorer.climate-change": {
    "emojis": ["🌡️", "🌊", "🌿"],
    "en": "Scientists reported that rising **temperatures** were melting the polar **glaciers** at an alarming rate. High **carbon** **emissions** and **greenhouse** gases from factories were changing the global **climate** faster than ever before. In some regions, **drought** destroyed farmland, while others faced terrible **floods** that ruined homes. The answer, experts said, was to stop **deforestation**, reduce **pollution**, and switch to **renewable** energy through strong **conservation** and **sustainable** planning.",
    "vi": "Các nhà khoa học báo cáo rằng nhiệt độ tăng đang làm tan chảy **sông băng** vùng cực với tốc độ đáng báo động. **Khí thải** **carbon** cao và khí **nhà kính** từ các nhà máy đang thay đổi **khí hậu** toàn cầu nhanh hơn bao giờ hết. Ở một số vùng, **hạn hán** phá hủy đất canh tác, trong khi những nơi khác phải đối mặt với **lũ lụt** kinh khủng tàn phá nhà cửa. Câu trả lời là ngăn chặn **phá rừng**, giảm **ô nhiễm** và chuyển sang năng lượng **tái tạo** thông qua kế hoạch **bảo tồn** và **bền vững** mạnh mẽ."
  },
  "explorer.digital-life": {
    "emojis": ["📱", "💻", "🔒"],
    "en": "Maya enjoyed **streaming** her favorite shows online, but her older sister warned her to be careful. Every click she made left a **digital footprint** and fed **data** to an **algorithm** tracking her habits. A **hacker** could misuse this information if her account was not properly **encrypted** and protected from threats to her **privacy**. She learned to limit her **screen time**, use a strong **username**, and think critically before sharing anything that could spread **misinformation**.",
    "vi": "Maya thích **xem trực tuyến** những bộ phim yêu thích, nhưng chị gái cảnh báo cô phải cẩn thận. Mỗi lần nhấp chuột để lại một **dấu chân số** và cung cấp **dữ liệu** cho một **thuật toán** theo dõi thói quen của cô. Một **tin tặc** có thể lạm dụng thông tin này nếu tài khoản không được **mã hóa** đúng cách để bảo vệ **quyền riêng tư**. Cô học cách giới hạn **thời gian màn hình**, dùng **tên người dùng** mạnh và suy nghĩ cẩn thận trước khi chia sẻ bất cứ điều gì có thể lan truyền **thông tin sai lệch**."
  },
  "explorer.architecture": {
    "emojis": ["🏛️", "🏙️", "📐"],
    "en": "The old museum was chosen for **renovation** because it was a **heritage** building that the city wanted to preserve. Architects studied the original **blueprint** to understand the building's **foundation** and the purpose of every **column** and graceful **arch**. They chose new **material** that matched the **proportion** and **symmetry** of the original **facade**, including its beautiful **dome**. The finished **design** blended into the **urban** landscape as if the building had never changed.",
    "vi": "Bảo tàng cũ được chọn để **cải tạo** vì nó là tòa nhà **di sản** mà thành phố muốn bảo tồn. Các kiến trúc sư nghiên cứu **bản thiết kế** gốc để hiểu **nền móng** của tòa nhà và mục đích của mỗi **cột trụ** và **vòm** thanh lịch. Họ chọn **vật liệu** mới phù hợp với **tỷ lệ** và **đối xứng** của **mặt tiền** gốc, bao gồm cả **mái vòm** đẹp. **Thiết kế** hoàn chỉnh hòa vào cảnh quan **đô thị** như thể tòa nhà chưa bao giờ thay đổi."
  },
  "explorer.business-startup": {
    "emojis": ["💡", "🚀", "📊"],
    "en": "A teenage **entrepreneur** had a clever idea for a new app and decided to turn it into a real **startup**. She spent weeks building her **brand** and crafting a strong **pitch** to attract **investment** from local businesses. Her first **strategy** was to target a small **market** and prove the app could generate **revenue** before trying to **scale**. After one early **failure**, she learned fast and found a way to **innovate** and **compete** with bigger companies.",
    "vi": "Một **doanh nhân** tuổi teen có ý tưởng thông minh cho một ứng dụng mới và quyết định biến nó thành một **startup** thực sự. Cô dành nhiều tuần xây dựng **thương hiệu** và soạn một **bài thuyết trình** mạnh mẽ để thu hút **đầu tư** từ các doanh nghiệp địa phương. **Chiến lược** đầu tiên là nhắm vào một **thị trường** nhỏ và chứng minh ứng dụng có thể tạo ra **doanh thu** trước khi cố gắng **mở rộng quy mô**. Sau một **thất bại** ban đầu, cô học hỏi nhanh và tìm cách **đổi mới** để **cạnh tranh** với các công ty lớn hơn."
  },
  "explorer.music-performance": {
    "emojis": ["🎵", "🎸", "🎻"],
    "en": "The young musician practiced for weeks so she could **perform** a beautiful **solo** in front of the school **orchestra**. She worked hard to get the **rhythm** and **tempo** exactly right and to blend her part smoothly into the **harmony**. The **conductor** helped her understand that even one wrong **chord** could break the mood of the piece. On the night of the concert, the hall was quiet as she played, and the **audience** held their breath, moved by every **melody**.",
    "vi": "Nhạc sĩ trẻ luyện tập nhiều tuần để có thể **biểu diễn** một bản **độc tấu** đẹp trước **dàn nhạc** của trường. Cô làm việc chăm chỉ để đảm bảo **nhịp điệu** và **tốc độ** hoàn toàn chính xác và hòa phần của mình vào **hòa âm** một cách mượt mà. **Nhạc trưởng** giúp cô hiểu rằng ngay cả một **hợp âm** sai cũng có thể phá vỡ tâm trạng của bản nhạc. Vào tối buổi hòa nhạc, khán phòng yên lặng khi cô chơi, và **khán giả** nín thở, xúc động trước mỗi **giai điệu**."
  },
  "explorer.sports-competition": {
    "emojis": ["🏅", "🏆", "⚽"],
    "en": "The young **athlete** trained every morning, building both **endurance** and **agility** for the national **tournament**. His coach taught him new **techniques** and the best **tactic** to use against his strongest **rival**. During the final match, a **referee** called a **penalty**, but he stayed calm and showed true **sportsmanship**. He crossed the finish line first, lifted the **trophy**, and knew his hard work had helped him become **champion**.",
    "vi": "**Vận động viên** trẻ tập luyện mỗi buổi sáng, rèn luyện cả **sức bền** và **sự nhanh nhẹn** cho **giải đấu** quốc gia. Huấn luyện viên dạy anh những **kỹ thuật** mới và **chiến thuật** tốt nhất để dùng chống lại **đối thủ** mạnh nhất. Trong trận chung kết, một **trọng tài** gọi một **phạt đền**, nhưng anh vẫn bình tĩnh và thể hiện **tinh thần thể thao** thật sự. Anh vượt qua vạch đích đầu tiên, nâng **cúp vô địch**, và biết rằng sự chăm chỉ đã giúp anh trở thành **nhà vô địch**."
  },
  "explorer.critical-thinking": {
    "emojis": ["🧠", "🔍", "💡"],
    "en": "In class, the students were asked to **analyze** a news article and decide whether it was **reliable**. They had to find the **source**, check the **evidence**, and spot any **bias** in the writing. The teacher warned them not to jump to a **conclusion** based on a false **assumption** or a logical **fallacy**. After a lively **debate**, the class learned that the best **argument** uses **logic**, considers every **perspective**, and always asks the right **question**.",
    "vi": "Trong lớp học, học sinh được yêu cầu **phân tích** một bài báo và quyết định xem nó có **đáng tin cậy** không. Họ phải tìm **nguồn**, kiểm tra **bằng chứng** và phát hiện bất kỳ **thiên kiến** nào trong bài viết. Giáo viên cảnh báo không nhảy đến **kết luận** dựa trên **giả định** sai hoặc **ngụy biện** logic. Sau một cuộc **tranh luận** sôi nổi, lớp học nhận ra rằng **lập luận** tốt nhất dùng **logic**, xem xét mỗi **quan điểm** và luôn đặt đúng **câu hỏi**."
  },
  "explorer.global-issues": {
    "emojis": ["🌍", "✊", "🕊️"],
    "en": "The school organized a project to understand why millions of people still face **hunger** and **poverty** around the world. Students learned that **conflict** and **inequality** often force families to leave home, turning them into **refugees** with no access to **sanitation** or education. A video call with a **diplomat** showed how international **aid** and **treaties** are used to respond to a **crisis**. The class agreed that a fairer world depends on **cooperation**, stronger **democracy**, and respect for **human rights**.",
    "vi": "Trường học tổ chức một dự án để hiểu tại sao hàng triệu người vẫn phải đối mặt với **nạn đói** và **nghèo đói** trên thế giới. Học sinh học được rằng **xung đột** và **bất bình đẳng** thường buộc các gia đình rời bỏ nhà cửa, biến họ thành **người tị nạn** không có quyền tiếp cận **vệ sinh** hay giáo dục. Một cuộc gọi video với một **nhà ngoại giao** cho thấy cách **viện trợ** và **hiệp ước** quốc tế được dùng để ứng phó với **khủng hoảng**. Lớp học đồng ý rằng một thế giới công bằng hơn phụ thuộc vào **hợp tác**, **dân chủ** mạnh mẽ hơn và tôn trọng **quyền con người**."
  },
  "explorer.genetics-evolution": {
    "emojis": ["🧬", "🦎", "🔬"],
    "en": "Every living **organism** carries a unique set of instructions in its **DNA**, stored inside tiny **chromosomes**. These **genes** control the **traits** we **inherit** from our parents, from eye color to the shape of our nose. Over millions of years, **natural selection** favors **variations** that help a species survive, leading to powerful **evolution**. When scientists study an **extinct** animal's **fossil**, they can trace the **adaptations** that allowed its **ancestors** to **reproduce** in changing conditions.",
    "vi": "Mỗi **sinh vật** sống mang một bộ hướng dẫn độc đáo trong **DNA** của nó, được lưu trữ bên trong những **nhiễm sắc thể** nhỏ bé. Những **gen** này kiểm soát những **đặc điểm** chúng ta **thừa hưởng** từ cha mẹ, từ màu mắt đến hình dạng mũi. Qua hàng triệu năm, **chọn lọc tự nhiên** ưu tiên những **biến thể** giúp một loài tồn tại, dẫn đến **tiến hóa** mạnh mẽ. Khi các nhà khoa học nghiên cứu **hóa thạch** của loài động vật đã **tuyệt chủng**, họ truy tìm những **thích nghi** cho phép **tổ tiên** của nó **sinh sản** trong điều kiện thay đổi."
  },
  "explorer.art-creativity": {
    "emojis": ["🎨", "🖼️", "✨"],
    "en": "The young artist stood in the **gallery** and studied every painting in the **exhibition**, taking notes in a small sketchbook. One massive **canvas** filled the wall — an **abstract** piece with bold **contrast** between dark and light that seemed to **inspire** new emotions. Back in her studio, she tried a new **medium** and created a **sculpture** with rough **texture** that told a story without any words. Her teacher smiled and said that a truly **creative** **composition** does not need to look perfect — it just needs to speak.",
    "vi": "Nghệ sĩ trẻ đứng trong **phòng trưng bày** và nghiên cứu từng bức tranh trong **triển lãm**, ghi chú vào cuốn sổ phác thảo nhỏ. Một **bức tranh** khổng lồ lấp đầy bức tường — một tác phẩm **trừu tượng** với **tương phản** mạnh mẽ giữa tối và sáng dường như **truyền cảm hứng** những cảm xúc mới. Trở về xưởng, cô thử một **chất liệu** mới và tạo ra một **tác phẩm điêu khắc** với **kết cấu** thô ráp kể câu chuyện mà không cần từ ngữ. Giáo viên mỉm cười và nói rằng một **sáng tác** thực sự **sáng tạo** không cần trông hoàn hảo — nó chỉ cần có sức nói."
  }
}

data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'stories.json')
with open(data_path) as f:
    data = json.load(f)

data.update(stories)

with open(data_path, 'w') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Added {len(stories)} Explorer stories. Total: {len(data)} entries")
