/**
 * Phase 2: Write all 30 Master stories
 * Each story must contain ALL target words for its topic (root-match check)
 */

const fs = require('fs');
const path = require('path');

const wordsPath = path.join(__dirname, '../data/words.json');
const storiesPath = path.join(__dirname, '../data/stories.json');

const data = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));
const stories = JSON.parse(fs.readFileSync(storiesPath, 'utf8'));

const master = data['master'];

// ─── Stories ─────────────────────────────────────────────────────────────────

const MASTER_STORIES = {

  'academic-skills': {
    emojis: ['📚', '✍️', '🎓'],
    en: "Academic success depends on the ability to **analyze** complex texts and **synthesize** ideas from multiple sources. A strong **thesis** must be supported by **logical** **reasoning** and a sound **methodology**. When you **paraphrase** a source, include a proper **citation** to avoid plagiarism. The **abstract** provides a concise overview of the whole paper and should be **coherent** from start to finish. Scholars regularly **evaluate** and **critique** existing work to identify new directions, and a complete **bibliography** records every source consulted. **Peer review** ensures that published findings meet rigorous academic standards.",
    vi: "Thành công học thuật phụ thuộc vào khả năng **phân tích** các văn bản phức tạp và **tổng hợp** ý tưởng từ nhiều nguồn. Một **luận đề** mạnh phải được hỗ trợ bởi **lập luận** **logic** và một **phương pháp luận** vững chắc. Khi bạn **diễn giải lại** một nguồn, hãy bao gồm **trích dẫn** đúng cách để tránh đạo văn. **Tóm tắt** cung cấp cái nhìn tổng quan súc tích về toàn bộ bài viết và phải **mạch lạc** từ đầu đến cuối. Các học giả thường xuyên **đánh giá** và **phê bình** các công trình hiện có để xác định hướng mới, và **thư mục tài liệu** đầy đủ ghi lại mọi nguồn đã tham khảo. **Phản biện ngang hàng** đảm bảo rằng các phát hiện được xuất bản đáp ứng các tiêu chuẩn học thuật nghiêm ngặt."
  },

  'law-justice': {
    emojis: ['⚖️', '🏛️', '📜'],
    en: "The **defendant** faced trial after a formal **indictment** was issued under existing **legislation**. The **prosecution** presented compelling **evidence** and called witnesses whose **testimony** proved decisive. His **attorney** argued that the actions did not **constitute** a criminal offence under the relevant **statute**, but the jury disagreed and delivered a guilty **verdict**. The judge imposed a severe **penalty**, noting that the accused was **liable** for significant harm. The defence immediately filed an **appeal** and explored whether international **extradition** agreements might complicate enforcement.",
    vi: "**Bị cáo** phải đối mặt với phiên tòa sau khi một **cáo trạng** chính thức được ban hành theo **luật pháp** hiện hành. **Công tố viên** đưa ra **bằng chứng** thuyết phục và gọi nhân chứng có **lời khai** quyết định. **Luật sư** của anh ta lập luận rằng các hành động không **cấu thành** tội phạm hình sự theo **điều luật** liên quan, nhưng bồi thẩm đoàn không đồng ý và đưa ra **phán quyết** có tội. Thẩm phán áp đặt **hình phạt** nghiêm khắc, lưu ý rằng bị cáo **chịu trách nhiệm** về thiệt hại đáng kể. Bên bào chữa lập tức nộp đơn **kháng cáo** và khám phá liệu các hiệp định **dẫn độ** quốc tế có thể làm phức tạp việc thi hành hay không."
  },

  'science-research': {
    emojis: ['🔬', '🧬', '📊'],
    en: "Scientists designing a **clinical** study must carefully control every **variable** to ensure results are **significant**. Researchers collect **data** from a representative **sample** and examine whether a **correlation** exists between two factors. A study becomes credible only when other laboratories can **replicate** its **finding** under the same conditions. Each **peer-reviewed** publication advances the broader **theory** by adding a new **conclusion** to the field. Modern **genome** sequencing has revealed how a single **molecule** can influence complex traits. Throughout all stages, **ethics** committees ensure that procedures protect participants.",
    vi: "Các nhà khoa học thiết kế một nghiên cứu **lâm sàng** phải kiểm soát cẩn thận từng **biến số** để đảm bảo kết quả có **ý nghĩa**. Các nhà nghiên cứu thu thập **dữ liệu** từ một **mẫu** đại diện và xem xét liệu có **tương quan** giữa hai yếu tố hay không. Một nghiên cứu chỉ trở nên đáng tin cậy khi các phòng thí nghiệm khác có thể **tái tạo** **phát hiện** của nó trong cùng điều kiện. Mỗi ấn phẩm **được phản biện ngang hàng** thúc đẩy **lý thuyết** rộng lớn hơn bằng cách thêm một **kết luận** mới. Giải trình tự **hệ gen** hiện đại đã tiết lộ cách một **phân tử** đơn lẻ có thể ảnh hưởng đến các đặc điểm phức tạp. Trong suốt tất cả các giai đoạn, các ủy ban **đạo đức** đảm bảo rằng các thủ tục bảo vệ người tham gia."
  },

  'education-system': {
    emojis: ['🏫', '📝', '🎒'],
    en: "A well-designed **curriculum** relies on sound **pedagogy** to reach diverse learners. **Differentiation** allows teachers to adapt instruction to different ability levels, improving **literacy** outcomes across the board. **Assessment** methods range from standardised tests to project-based tasks. In many countries, education is **compulsory** until the age of sixteen, and falling **enrollment** numbers raise concerns about **dropout** rates. Some students choose **vocational** pathways instead of university, supported by **scholarship** programmes that reduce **tuition** costs. Schools also offer **extracurricular** activities to develop character and **discipline**, while institutional **accreditation** ensures overall quality.",
    vi: "Một **chương trình học** được thiết kế tốt dựa trên **phương pháp sư phạm** hợp lý để tiếp cận học sinh đa dạng. **Phân hóa** cho phép giáo viên điều chỉnh giảng dạy theo các mức độ năng lực khác nhau, cải thiện kết quả **biết chữ** cho tất cả. Phương pháp **đánh giá** dao động từ bài kiểm tra tiêu chuẩn hóa đến các nhiệm vụ dựa trên dự án. Ở nhiều quốc gia, giáo dục là **bắt buộc** đến mười sáu tuổi, và con số **tuyển sinh** giảm gây lo ngại về tỷ lệ **bỏ học**. Một số học sinh chọn con đường **hướng nghiệp** thay vì đại học, được hỗ trợ bởi các chương trình **học bổng** giúp giảm chi phí **học phí**. Các trường cũng cung cấp các hoạt động **ngoại khóa** để phát triển tính cách và **kỷ luật**, trong khi **kiểm định** thể chế đảm bảo chất lượng tổng thể."
  },

  'food-agriculture': {
    emojis: ['🌾', '🚜', '🌱'],
    en: "Small **subsistence** farmers struggle when **drought** reduces the **yield** of their main **crop**. Modern **agribusiness** relies on sophisticated **irrigation** networks and synthetic **fertilizer** to maximise production on **arable** land. **Pesticide** use protects plants but raises concerns about ecological damage. **Livestock** farming contributes significantly to greenhouse gas emissions. **Genetically modified** varieties have been developed to resist disease and thrive in harsh conditions, boosting **harvest** volumes. Achieving global **food security** requires balancing productivity with sustainability and encouraging a shift toward **organic** practices wherever feasible.",
    vi: "Những nông dân **tự cung tự cấp** nhỏ lẻ gặp khó khăn khi **hạn hán** làm giảm **năng suất** của **cây trồng** chính. **Nông nghiệp thương mại** hiện đại dựa vào các mạng lưới **tưới tiêu** tinh vi và **phân bón** tổng hợp để tối đa hóa sản xuất trên đất **canh tác**. Việc sử dụng **thuốc trừ sâu** bảo vệ cây trồng nhưng gây lo ngại về thiệt hại sinh thái. Chăn nuôi **gia súc** đóng góp đáng kể vào khí thải nhà kính. Các giống **biến đổi gen** đã được phát triển để chống lại bệnh tật và phát triển mạnh trong điều kiện khắc nghiệt, tăng cường khối lượng **thu hoạch**. Đạt được **an ninh lương thực** toàn cầu đòi hỏi cân bằng năng suất với tính bền vững và khuyến khích chuyển sang thực hành **hữu cơ** khi khả thi."
  },

  'innovation-startup': {
    emojis: ['🚀', '💡', '📈'],
    en: "A founder who wants to **disrupt** an established industry must develop a **scalable** product concept before approaching investors. The **seed round** is usually raised from angel investors after a compelling **pitch** at a startup **incubator** or **accelerator** programme. Each **iteration** of the product is tested under a **lean** development process, allowing the team to **pivot** quickly based on feedback. As the company grows, **venture capital** firms offer larger **funding** in exchange for equity. **Disruption** reshapes entire markets, and a rising **valuation** reflects investor confidence in the startup's long-term potential.",
    vi: "Một nhà sáng lập muốn **phá vỡ** một ngành công nghiệp đã được thiết lập phải phát triển một khái niệm sản phẩm **có khả năng mở rộng** trước khi tiếp cận các nhà đầu tư. **Vòng hạt giống** thường được huy động từ các nhà đầu tư thiên thần sau một **bài thuyết trình** hấp dẫn tại chương trình **vườn ươm** hoặc **tăng tốc** khởi nghiệp. Mỗi **vòng lặp** của sản phẩm được kiểm tra theo quy trình phát triển **tinh gọn**, cho phép nhóm **xoay trục** nhanh chóng dựa trên phản hồi. Khi công ty phát triển, các công ty **đầu tư mạo hiểm** cung cấp **tài trợ** lớn hơn để đổi lấy cổ phần. **Sự phá vỡ** định hình lại toàn bộ thị trường, và **định giá** tăng cao phản ánh sự tin tưởng của nhà đầu tư vào tiềm năng dài hạn của startup."
  },

  'language-communication': {
    emojis: ['🗣️', '📖', '🌐'],
    en: "**Linguistics** explores how humans acquire and use language across cultures. A speaker may switch between a formal and informal **register** depending on context, and a **bilingual** individual navigates two distinct systems simultaneously. **Fluency** goes beyond grammar: it involves the ability to **convey** meaning with **nuance** and to be **eloquent** when the situation demands. The **syntax** of a sentence determines how meaning is constructed, and **etymology** traces how words evolved over time. In **rhetoric**, an **articulate** speaker masters **discourse** to persuade an audience. When language is **ambiguous**, a **dialect** variation or cultural context often resolves the confusion.",
    vi: "**Ngôn ngữ học** khám phá cách con người tiếp thu và sử dụng ngôn ngữ qua các nền văn hóa. Người nói có thể chuyển đổi giữa **phong cách ngôn ngữ** trang trọng và không trang trọng tùy theo ngữ cảnh, và một người **song ngữ** điều hướng hai hệ thống riêng biệt cùng một lúc. **Sự thành thạo** vượt ra ngoài ngữ pháp: nó liên quan đến khả năng **truyền đạt** ý nghĩa với **sắc thái** và trở nên **hùng hồn** khi tình huống đòi hỏi. **Cú pháp** của một câu xác định cách ý nghĩa được xây dựng, và **từ nguyên học** truy nguyên cách các từ phát triển theo thời gian. Trong **hùng biện**, người nói **lưu loát** làm chủ **diễn ngôn** để thuyết phục khán giả. Khi ngôn ngữ **mơ hồ**, biến thể **phương ngữ** hoặc ngữ cảnh văn hóa thường giải quyết sự nhầm lẫn."
  },

  'philosophy-ethics': {
    emojis: ['🧠', '🤔', '⚖️'],
    en: "Philosophy begins with a fundamental **axiom**: we must examine our beliefs critically. **Epistemology** asks how we can know anything with certainty, while **skepticism** challenges our assumptions at every turn. A moral **dilemma** arises when competing values conflict, and different schools respond differently: **deontology** judges actions by fixed rules rooted in **virtue**, whereas **utilitarianism** takes a **pragmatic** approach and evaluates outcomes for the greatest good. The **paradox** of **consciousness** — how matter gives rise to subjective experience — remains unsolved. Every ethical **doctrine** carries **implications** for how a **rational** person ought to live, shaped by ideas of **morality** and human dignity.",
    vi: "Triết học bắt đầu với một **tiên đề** cơ bản: chúng ta phải xem xét niềm tin của mình một cách phê phán. **Nhận thức luận** hỏi làm thế nào chúng ta có thể biết bất cứ điều gì với sự chắc chắn, trong khi **chủ nghĩa hoài nghi** thách thức các giả định của chúng ta ở mọi bước. Một **tình huống khó xử** đạo đức nảy sinh khi các giá trị cạnh tranh xung đột: **nghĩa vụ luận** phán xét hành động theo các quy tắc cố định bắt nguồn từ **đức hạnh**, trong khi **chủ nghĩa công lợi** có cách tiếp cận **thực dụng** và đánh giá kết quả vì lợi ích lớn nhất. **Nghịch lý** của **ý thức** — làm thế nào vật chất tạo ra trải nghiệm chủ quan — vẫn chưa được giải quyết. Mỗi **học thuyết** đạo đức mang **hệ quả** cho cách một người **lý trí** nên sống, được định hình bởi các ý tưởng về **đạo đức** và phẩm giá con người."
  },

  'constitutional-law': {
    emojis: ['🏛️', '📜', '⚖️'],
    en: "A **democratic** state derives its authority from a **constitution** that protects **fundamental rights** and enshrines the **rule of law**. The **separation of powers** prevents any single branch from becoming dominant: the **legislature** makes law, the executive implements it, and the judiciary interprets it through **judicial review**. Citizens are guaranteed **civil liberties** and **due process**, including the right of **habeas corpus** to challenge unlawful detention. Courts rely on **precedent** to ensure consistency within their **jurisdiction**. When an official is alleged to have abused power, the **impeachment** process and the possibility of a constitutional **amendment** provide pathways for accountability.",
    vi: "Một nhà nước **dân chủ** có thẩm quyền bắt nguồn từ một **hiến pháp** bảo vệ **quyền cơ bản** và khẳng định **nhà nước pháp quyền**. **Phân chia quyền lực** ngăn bất kỳ nhánh nào trở nên thống trị: **cơ quan lập pháp** tạo ra luật, hành pháp thực thi nó, và tư pháp diễn giải nó thông qua **kiểm soát tư pháp**. Công dân được đảm bảo **các quyền tự do dân sự** và **thủ tục tố tụng hợp lệ**, bao gồm quyền **habeas corpus** để thách thức việc giam giữ trái phép. Các tòa án dựa vào **tiền lệ** để đảm bảo tính nhất quán trong **quyền tài phán**. Khi một quan chức bị cáo buộc lạm dụng quyền lực, quy trình **luận tội** và khả năng **sửa đổi** hiến pháp cung cấp các con đường để trách nhiệm giải trình."
  },

  'environmental-governance': {
    emojis: ['🌍', '♻️', '🌿'],
    en: "Countries that **ratify** international **protocol** agreements commit to ambitious climate **mitigation** and **adaptation** targets. A **carbon tax** creates economic incentives to **decarbonize** energy systems and achieve **net-zero** emissions. Businesses may purchase carbon **offset** credits to compensate for unavoidable emissions, though long-term **sustainability** requires structural change. A government **directive** can mandate a rapid **transition** to renewables. Strong **enforcement** mechanisms ensure compliance, while environmental **stewardship** programmes protect **biodiversity** at the local level. Balancing development with ecological preservation remains the central challenge of modern governance.",
    vi: "Các quốc gia **phê chuẩn** các thỏa thuận **nghị định thư** quốc tế cam kết các mục tiêu **giảm thiểu** và **thích ứng** biến đổi khí hậu đầy tham vọng. Một **thuế carbon** tạo ra các khuyến khích kinh tế để **khử carbon** trong các hệ thống năng lượng và đạt được lượng khí thải **trung hòa carbon**. Các doanh nghiệp có thể mua tín chỉ **bù đắp** carbon để bù đắp cho các lượng khí thải không thể tránh khỏi, mặc dù **bền vững** lâu dài đòi hỏi thay đổi cơ cấu. Một **chỉ thị** của chính phủ có thể yêu cầu **chuyển đổi** nhanh chóng sang năng lượng tái tạo. Các cơ chế **thực thi** mạnh mẽ đảm bảo tuân thủ, trong khi các chương trình **quản lý** môi trường bảo vệ **đa dạng sinh học** ở cấp địa phương."
  },

  'political-philosophy': {
    emojis: ['🏛️', '🗳️', '📖'],
    en: "Political philosophy examines the foundations of **governance** and the conditions that grant a state **legitimacy**. **Democracy** rests on a **social contract** in which citizens cede certain freedoms in exchange for protection and **equality** before the law. **Constitutionalism** limits state power through binding rules, while **federalism** distributes authority across multiple levels of government. **Pluralism** acknowledges that **civil society** encompasses many competing interests. By contrast, **authoritarianism** relies on **coercion** rather than consent, suppressing dissent. **Populism** and extreme **ideology** can erode the institutional checks that protect democratic norms.",
    vi: "Triết học chính trị xem xét nền tảng của **quản trị** và các điều kiện mang lại **tính hợp pháp** cho nhà nước. **Dân chủ** dựa trên một **khế ước xã hội** trong đó công dân nhường một số quyền tự do để đổi lấy sự bảo vệ và **bình đẳng** trước pháp luật. **Chủ nghĩa hợp hiến** giới hạn quyền lực nhà nước thông qua các quy tắc ràng buộc, trong khi **chủ nghĩa liên bang** phân phối quyền lực trên nhiều cấp độ. **Chủ nghĩa đa nguyên** thừa nhận rằng **xã hội dân sự** bao gồm nhiều lợi ích cạnh tranh. Ngược lại, **chủ nghĩa độc tài** dựa vào **cưỡng bức** hơn là sự đồng thuận. **Chủ nghĩa dân túy** và **hệ tư tưởng** cực đoan có thể xói mòn các kiểm tra thể chế bảo vệ các chuẩn mực dân chủ."
  },

  'public-policy': {
    emojis: ['🏛️', '📋', '🤝'],
    en: "Effective **public policy** depends on **evidence-based** analysis that links **regulation** to measurable **outcomes**. A government must ensure that **social policy** broadens **access** to education, healthcare, and **welfare** for every **constituency**. During **implementation**, **public service** agencies translate legislation into action, subject to parliamentary **oversight**. Interest groups engage in **lobbying** to shape policy in their favour. A clear **mandate** — whether from an election or a legislative vote — provides the political authority needed to introduce reform. Without accountability, even well-designed policies can fail to reach those who need them most.",
    vi: "**Chính sách công** hiệu quả phụ thuộc vào phân tích **dựa trên bằng chứng** liên kết **quy định** với các **kết quả** có thể đo lường. Chính phủ phải đảm bảo rằng **chính sách xã hội** mở rộng **khả năng tiếp cận** giáo dục, chăm sóc sức khỏe và **phúc lợi** cho mọi **khu vực bầu cử**. Trong quá trình **triển khai**, các cơ quan **dịch vụ công** chuyển pháp luật thành hành động, chịu sự **giám sát** của nghị viện. Các nhóm lợi ích tham gia **vận động hành lang** để định hình chính sách. Một **ủy quyền** rõ ràng — dù từ một cuộc bầu cử hay một cuộc bỏ phiếu lập pháp — cung cấp thẩm quyền chính trị cần thiết để giới thiệu cải cách."
  },

  'academic-discourse': {
    emojis: ['🎓', '📰', '🤝'],
    en: "**Academic rigor** demands that every **proposition** in a scholarly text be supported by evidence and sound **critical thinking**. Researchers who fail to provide proper **attribution** risk accusations of **plagiarism**, which violates **academic integrity**. A theoretical **framework** guides the study design and the interpretation of results. Findings gain credibility through **publication** in peer-reviewed journals and **dissemination** at conferences and **seminar** series. Scholars often **annotate** source texts to track arguments across the literature. Modern research increasingly values **interdisciplinary** **collaboration**, bringing together experts from different fields to address complex questions.",
    vi: "**Sự nghiêm ngặt học thuật** đòi hỏi mọi **mệnh đề** trong một văn bản học thuật phải được hỗ trợ bởi bằng chứng và **tư duy phê phán** vững chắc. Các nhà nghiên cứu không cung cấp **ghi công** đúng cách có nguy cơ bị buộc tội **đạo văn**, vi phạm **tính liêm chính học thuật**. Một **khung lý thuyết** hướng dẫn thiết kế nghiên cứu và diễn giải kết quả. Các phát hiện được công nhận thông qua **xuất bản** trên các tạp chí phản biện và **phổ biến** tại các hội nghị và chuỗi **hội thảo**. Các học giả thường **chú giải** các văn bản nguồn để theo dõi lập luận. Nghiên cứu hiện đại ngày càng coi trọng **hợp tác** **liên ngành**, tập hợp các chuyên gia từ nhiều lĩnh vực khác nhau để giải quyết các câu hỏi phức tạp."
  },

  'geopolitics': {
    emojis: ['🌍', '🤝', '⚔️'],
    en: "Geopolitics revolves around how nations pursue power and protect their **sovereignty**. A robust **alliance** provides **deterrence** against potential aggressors, reducing the risk of open conflict. When **negotiation** fails, states may impose **sanction** regimes to pressure governments without direct **intervention**. **Multilateral** forums allow competing powers to manage **tension** through **diplomacy**. Rising **nationalism** can disrupt regional **stability** by undermining existing **treaty** frameworks. Great powers often seek to dominate a **sphere of influence**, projecting economic and military strength beyond their borders to shape outcomes in neighbouring states.",
    vi: "Địa chính trị xoay quanh cách các quốc gia theo đuổi quyền lực và bảo vệ **chủ quyền**. Một **liên minh** vững chắc cung cấp **răn đe** chống lại những kẻ xâm lược tiềm năng, giảm nguy cơ xung đột công khai. Khi **đàm phán** thất bại, các quốc gia có thể áp đặt các chế độ **trừng phạt** để gây áp lực mà không cần **can thiệp** trực tiếp. Các diễn đàn **đa phương** cho phép các cường quốc cạnh tranh quản lý **căng thẳng** thông qua **ngoại giao**. **Chủ nghĩa dân tộc** gia tăng có thể phá vỡ **ổn định** khu vực bằng cách làm suy yếu các khuôn khổ **hiệp ước** hiện có. Các cường quốc thường tìm cách thống trị một **phạm vi ảnh hưởng**, phô trương sức mạnh vượt ra ngoài biên giới để định hình kết quả ở các quốc gia láng giềng."
  },

  'macroeconomics': {
    emojis: ['📉', '💹', '🏦'],
    en: "A **recession** typically coincides with rising **unemployment** and falling tax revenues, widening the government's **deficit** and increasing **public debt**. Policymakers respond with expansionary **fiscal policy** — such as stimulus spending — or loose **monetary policy**, which may include **quantitative easing** to inject liquidity into the economy. However, excess money supply can trigger **inflation**. The rare combination of stagnant growth and rising prices is called **stagflation**, which challenges conventional tools. **Austerity** measures cut spending to restore fiscal balance but risk deepening the downturn. A **trade surplus** strengthens a currency, while **market failure** can justify **privatization** or targeted public intervention.",
    vi: "Một cuộc **suy thoái** thường trùng hợp với **thất nghiệp** gia tăng và doanh thu thuế giảm, mở rộng **thâm hụt** của chính phủ và tăng **nợ công**. Các nhà hoạch định chính sách phản ứng bằng **chính sách tài khóa** mở rộng — như chi tiêu kích thích — hoặc **chính sách tiền tệ** lỏng lẻo, có thể bao gồm **nới lỏng định lượng** để bơm thanh khoản. Tuy nhiên, cung tiền quá mức có thể kích hoạt **lạm phát**. Sự kết hợp hiếm gặp giữa tăng trưởng trì trệ và giá cả tăng gọi là **đình lạm**, thách thức các công cụ thông thường. Các biện pháp **thắt lưng buộc bụng** cắt giảm chi tiêu để khôi phục cân bằng tài chính nhưng có nguy cơ làm sâu sắc thêm suy thoái. **Thặng dư thương mại** làm mạnh đồng tiền, trong khi **thất bại thị trường** có thể biện minh cho **tư nhân hóa** hoặc can thiệp công cộng có mục tiêu."
  },

  'medical-ethics': {
    emojis: ['🏥', '⚕️', '🧬'],
    en: "Modern medicine is built on the principle of **patient rights**, including the right to **informed consent** before any procedure. A hospital **ethics committee** reviews proposals for **experimental** treatments to ensure compliance with **research ethics** standards. In a **clinical trial**, some participants may receive a **placebo** to measure the true effect of a new drug — requiring transparent **disclosure** of risks to protect **autonomy**. **Palliative care** prioritises comfort when cure is no longer possible. Controversial debates surround **euthanasia**, **organ donation** procedures, and cases of alleged **malpractice**, where a physician's failure causes serious harm. The principle of **beneficence** underpins all ethical medical decision-making.",
    vi: "Y học hiện đại được xây dựng trên nguyên tắc **quyền bệnh nhân**, bao gồm quyền **đồng ý có thông tin** trước bất kỳ thủ tục nào. Một **ủy ban đạo đức** bệnh viện xem xét các đề xuất điều trị **thử nghiệm** để đảm bảo tuân thủ các tiêu chuẩn **đạo đức nghiên cứu**. Trong một **thử nghiệm lâm sàng**, một số người tham gia có thể nhận được **giả dược** để đo lường hiệu quả thực sự của một loại thuốc mới — đòi hỏi **tiết lộ** minh bạch về rủi ro để bảo vệ **quyền tự chủ**. **Chăm sóc giảm nhẹ** ưu tiên sự thoải mái khi chữa trị không còn khả thi. Các cuộc tranh luận xoay quanh **an tử**, các thủ tục **hiến tạng**, và các trường hợp **sai phạm y tế** bị cáo buộc. Nguyên tắc **nhân từ** củng cố mọi quyết định y tế có đạo đức."
  },

  'sociology': {
    emojis: ['👥', '🏙️', '📊'],
    en: "Sociology examines how **social stratification** shapes life outcomes. **Inequality** is embedded in structures of **social class** and reinforced by **discrimination** and **exclusion**. **Marginalization** occurs when groups are pushed to the periphery of economic and political life, often as a result of **stigma** attached to their identity. **Privilege** describes the unearned advantages that some groups enjoy by virtue of their position in the hierarchy. **Social capital** — the networks and trust that facilitate cooperation — is unevenly distributed. **Diversity** within institutions strengthens decision-making, yet achieving genuine **social mobility** requires addressing systemic barriers. The concept of **intersectionality** reveals how overlapping identities compound disadvantage.",
    vi: "Xã hội học xem xét cách **phân tầng xã hội** định hình các kết quả cuộc sống. **Bất bình đẳng** được nhúng vào các cấu trúc của **tầng lớp xã hội** và được củng cố bởi **phân biệt đối xử** và **loại trừ**. **Bên lề hóa** xảy ra khi các nhóm bị đẩy ra ngoại vi của cuộc sống kinh tế và chính trị, thường do **kỳ thị** gắn liền với bản sắc. **Đặc quyền** mô tả những lợi thế không xứng đáng mà một số nhóm được hưởng nhờ vị trí trong hệ thống phân cấp. **Vốn xã hội** — các mạng lưới và sự tin tưởng — được phân phối không đều. **Đa dạng** trong các thể chế củng cố việc ra quyết định, nhưng đạt được **lưu động xã hội** thực sự đòi hỏi phải giải quyết các rào cản hệ thống. Khái niệm **giao thoa** tiết lộ cách các bản sắc chồng lấp khuếch đại bất lợi."
  },

  'business-ethics': {
    emojis: ['💼', '⚖️', '🤝'],
    en: "A corporation must demonstrate **accountability** to every **stakeholder**, from shareholders to the wider community. **Corporate responsibility** demands **transparency** in financial reporting and a clear commitment to **integrity** in all dealings. Thorough **due diligence** and regular **audit** procedures help detect **corruption** and **bribery** before they cause lasting damage. When employees observe wrongdoing, a **whistleblower** policy provides legal protection for reporting it. Directors carry a **fiduciary** duty to act in the company's best interest, while strict **compliance** frameworks ensure adherence to the law. Managing a **conflict of interest** properly is essential to maintaining public trust.",
    vi: "Một tập đoàn phải thể hiện **trách nhiệm giải trình** đối với mọi **bên liên quan**, từ cổ đông đến cộng đồng rộng lớn hơn. **Trách nhiệm doanh nghiệp** đòi hỏi **minh bạch** trong báo cáo tài chính và cam kết rõ ràng về **tính liêm chính**. Quy trình **thẩm định** kỹ lưỡng và các thủ tục **kiểm toán** thường xuyên giúp phát hiện **tham nhũng** và **hối lộ** trước khi chúng gây ra thiệt hại lâu dài. Khi nhân viên quan sát thấy hành vi sai trái, chính sách **tố giác** cung cấp bảo vệ pháp lý. Các giám đốc có nghĩa vụ **ủy thác** để hành động vì lợi ích tốt nhất của công ty, trong khi các khuôn khổ **tuân thủ** nghiêm ngặt đảm bảo tuân theo pháp luật. Quản lý đúng cách **xung đột lợi ích** là điều thiết yếu để duy trì sự tin tưởng của công chúng."
  },

  'technology-ethics': {
    emojis: ['🤖', '🔒', '💻'],
    en: "As **AI** systems become more powerful, questions of **liability** and **rights** become increasingly urgent. A **platform** that uses a black-box **algorithm** to make decisions affecting people must ensure **explainability** — users deserve to understand how choices are made. **Automation** threatens to accelerate job **obsolescence** in many sectors. **Surveillance** technologies collect vast quantities of **metadata**, raising serious **privacy** concerns. **Deepfake** content illustrates how digital tools can be weaponised to deceive. Achieving **digital equity** means ensuring that the benefits of technology are shared fairly, even as rapid innovation creates new ethical dilemmas.",
    vi: "Khi các hệ thống **AI** ngày càng mạnh mẽ hơn, các câu hỏi về **trách nhiệm pháp lý** và **quyền** trở nên ngày càng cấp thiết. Một **nền tảng** sử dụng **thuật toán** hộp đen để đưa ra quyết định ảnh hưởng đến con người phải đảm bảo **khả năng giải thích** — người dùng xứng đáng được hiểu cách các lựa chọn được đưa ra. **Tự động hóa** đe dọa đẩy nhanh **sự lỗi thời** công việc trong nhiều lĩnh vực. Các công nghệ **giám sát** thu thập lượng lớn **siêu dữ liệu**, gây ra những lo ngại nghiêm trọng về **quyền riêng tư**. Nội dung **deepfake** minh họa cách các công cụ kỹ thuật số có thể bị lợi dụng để lừa dối. Đạt được **công bằng kỹ thuật số** có nghĩa là đảm bảo rằng các lợi ích của công nghệ được chia sẻ công bằng."
  },

  'media-literacy': {
    emojis: ['📰', '📱', '🔍'],
    en: "In the digital age, **media literacy** is an essential skill. A critical reader must assess the **credibility** of sources, recognising that **bias** and **framing** shape how events are reported. **Sensationalism** attracts attention at the expense of **objectivity**, while **propaganda** and **disinformation** are tools of deliberate deception, distinct from accidental **misinformation**. Social media algorithms create **echo chamber** environments that reinforce existing beliefs and limit exposure to diverse **representation**. **Censorship** by states restricts the free flow of information, altering the public **narrative**. Individuals can counter these forces by learning to **fact-check** claims and understand how media **influence** operates.",
    vi: "Trong thời đại kỹ thuật số, **hiểu biết về truyền thông** là một kỹ năng thiết yếu. Một độc giả có tư duy phê phán phải đánh giá **độ tin cậy** của các nguồn, nhận ra rằng **thiên kiến** và **định khung** định hình cách các sự kiện được đưa tin. **Giật gân** thu hút sự chú ý với chi phí của **tính khách quan**, trong khi **tuyên truyền** và **thông tin sai lệch có chủ ý** là công cụ lừa dối có chủ ý, khác với **thông tin sai lệch** vô tình. Các thuật toán mạng xã hội tạo ra môi trường **buồng vọng** củng cố niềm tin hiện có và hạn chế tiếp xúc với **đại diện** đa dạng. **Kiểm duyệt** của các nhà nước hạn chế luồng thông tin tự do, thay đổi **câu chuyện** công cộng. Các cá nhân có thể chống lại những lực lượng này bằng cách học cách **kiểm tra sự thật** các tuyên bố và hiểu cách **ảnh hưởng** truyền thông hoạt động."
  },

  'rhetoric-debate': {
    emojis: ['🗣️', '🎤', '⚖️'],
    en: "Classical rhetoric identifies three pillars of **persuasion**: **ethos** (the speaker's credibility), **logos** (logical **argument** supported by evidence), and **pathos** (emotional appeal). A well-structured **syllogism** links premises to a **claim** through valid inference. Skilled debaters use **eloquence** and **antithesis** — placing contrasting ideas in parallel — to sharpen their points. **Sophistry** describes reasoning that appears valid but is actually misleading. A strong **rebuttal** dismantles the opponent's position, while a strategic **concession** can build goodwill without abandoning the core argument. Careful **deliberation** before speaking ensures that rhetoric serves truth rather than mere manipulation.",
    vi: "Tu từ học cổ điển xác định ba trụ cột của **thuyết phục**: **ethos** (uy tín của người nói), **logos** (**lập luận** logic được hỗ trợ bởi bằng chứng), và **pathos** (kháng cáo cảm xúc). Một **tam đoạn luận** được cấu trúc tốt liên kết các tiền đề với một **tuyên bố** thông qua suy luận hợp lệ. Các nhà tranh luận lành nghề sử dụng **hùng hồn** và **phản đề** — đặt các ý tưởng tương phản song song — để làm sắc nét quan điểm. **Biện chứng ngụy** mô tả lập luận có vẻ hợp lệ nhưng thực sự gây hiểu lầm. Một **phản bác** mạnh mẽ phá vỡ vị trí của đối thủ, trong khi một **nhượng bộ** chiến lược có thể xây dựng thiện chí. Careful **deliberation** trước khi nói đảm bảo rằng tu từ phục vụ sự thật hơn là chỉ thao túng."
  },

  'global-governance': {
    emojis: ['🌐', '🕊️', '🏛️'],
    en: "Effective global governance requires **cooperation** among states that agree to be bound by **international law** and **supranational** bodies. The United Nations **secretariat** coordinates **peacekeeping** missions and **humanitarian** responses to crises. The principle of **self-determination** upholds the right of peoples to choose their political status. When conflict arises, **mediation** by neutral parties offers an alternative to military intervention. **Collective security** arrangements mean that an attack on one member obliges others to respond. **Harmonization** of legal standards facilitates trade and human rights protection. An **embargo** enforces compliance, while **extraterritorial** jurisdiction allows states to prosecute offences committed beyond their borders. **NGO**s hold institutions accountable.",
    vi: "Quản trị toàn cầu hiệu quả đòi hỏi **hợp tác** giữa các quốc gia đồng ý bị ràng buộc bởi **luật pháp quốc tế** và các cơ quan **siêu quốc gia**. **Ban thư ký** Liên Hợp Quốc điều phối các nhiệm vụ **gìn giữ hòa bình** và các phản ứng **nhân đạo** đối với các cuộc khủng hoảng. Nguyên tắc **tự quyết** duy trì quyền của các dân tộc lựa chọn địa vị chính trị. Khi xung đột nảy sinh, **hòa giải** bởi các bên trung lập cung cấp một giải pháp thay thế cho can thiệp quân sự. Các thỏa thuận **an ninh tập thể** có nghĩa là một cuộc tấn công vào một thành viên buộc những người khác phải phản ứng. **Hài hòa hóa** các tiêu chuẩn pháp lý tạo điều kiện cho thương mại và bảo vệ nhân quyền. Một **lệnh cấm vận** thực thi tuân thủ, trong khi **quyền tài phán ngoài lãnh thổ** cho phép truy tố các tội phạm ngoài biên giới. Các **tổ chức phi chính phủ** giữ các thể chế có trách nhiệm."
  },

  'bioethics': {
    emojis: ['🧬', '⚕️', '🤔'],
    en: "Bioethics addresses the **moral** questions raised by advances in life sciences. **Genetic engineering** and **gene editing** technologies such as CRISPR allow scientists to alter DNA with unprecedented precision, raising urgent debates about **permissibility** and **biosafety**. **Stem cell** research holds promise for treating degenerative diseases, yet the source of cells raises questions about **human dignity** and **consent**. The principle of **beneficence** requires that medical interventions benefit patients, not merely serve research interests. Cognitive and physical **enhancement** technologies push the boundaries of humanity — a debate central to **transhumanism**. **Cloning** remains one of the most contested issues regarding the long-term **impact** on society.",
    vi: "Đạo đức sinh học giải quyết các câu hỏi **đạo đức** do những tiến bộ trong khoa học đời sống đặt ra. Các công nghệ **kỹ thuật di truyền** và **chỉnh sửa gen** như CRISPR cho phép các nhà khoa học thay đổi DNA với độ chính xác chưa từng có, gây ra các cuộc tranh luận cấp thiết về **tính được phép** và **an toàn sinh học**. Nghiên cứu **tế bào gốc** hứa hẹn chữa trị các bệnh thoái hóa, nhưng nguồn gốc tế bào đặt ra câu hỏi về **phẩm giá con người** và **sự đồng thuận**. Nguyên tắc **nhân từ** yêu cầu rằng các can thiệp y tế mang lại lợi ích cho bệnh nhân. Các công nghệ **tăng cường** nhận thức và thể chất đẩy ranh giới của nhân loại — một cuộc tranh luận trung tâm với **chủ nghĩa siêu nhân**. **Nhân bản** vẫn là một trong những vấn đề gây tranh cãi nhất về **tác động** lâu dài lên xã hội."
  },

  'argumentation': {
    emojis: ['💬', '🧠', '⚖️'],
    en: "A strong argument requires more than a bold **assertion** — it needs a clear **premise**, a valid **inference**, and solid evidence to **substantiate** the claim. The **warrant** explains why the evidence supports the conclusion. Skilled analysts **deconstruct** complex positions to expose hidden **assumption**s and logical **fallacy**s. Every argument benefits from considering the **counterargument**: acknowledging an opposing **perspective** strengthens credibility. A **qualifier** limits the scope of a claim, preventing overgeneralisation. **Coherence** ties the argument together, and a thorough **refutation** of competing views demonstrates the writer's command of the debate.",
    vi: "Một lập luận mạnh mẽ đòi hỏi nhiều hơn một **khẳng định** táo bạo — nó cần một **tiền đề** rõ ràng, một **suy luận** hợp lệ, và bằng chứng vững chắc để **chứng minh** tuyên bố. **Lý lẽ bảo đảm** giải thích tại sao bằng chứng hỗ trợ kết luận. Các nhà phân tích lành nghề **phân tích** các vị trí phức tạp để phơi bày các **giả định** ẩn và **ngụy biện** logic. Mỗi lập luận đều được hưởng lợi từ việc xem xét **phản lập luận**: thừa nhận một **quan điểm** đối lập củng cố độ tin cậy. Một **giới hạn điều chỉnh** hạn chế phạm vi của một tuyên bố, ngăn chặn sự khái quát hóa thái quá. **Sự mạch lạc** kết nối lập luận lại với nhau, và một **bác bỏ** kỹ lưỡng các quan điểm cạnh tranh thể hiện sự làm chủ của người viết."
  },

  'globalisation': {
    emojis: ['🌐', '📦', '✈️'],
    en: "Globalisation has created an era of deep economic **interdependence**, in which **trade** flows and **outsourcing** strategies link countries across the globe. **Free trade** agreements reduce barriers, creating new **opportunity** for growth but also intensifying **competition**. Multinational **corporation**s exercise enormous **dominance** over supply chains. **Cultural diffusion** accelerates as ideas, products, and practices spread across borders, while **localization** strategies adapt global products to local tastes. The **convergence** of markets has lifted millions from poverty, yet it has also fuelled **polarization** between winners and losers. **Migration** of workers follows economic opportunity, reshaping societies and identities worldwide.",
    vi: "Toàn cầu hóa đã tạo ra một kỷ nguyên **phụ thuộc lẫn nhau** kinh tế sâu sắc, trong đó các luồng **thương mại** và chiến lược **thuê ngoài** kết nối các quốc gia trên toàn cầu. Các hiệp định **thương mại tự do** giảm rào cản, tạo ra **cơ hội** mới cho tăng trưởng nhưng cũng tăng cường **cạnh tranh**. Các **tập đoàn** đa quốc gia thực hiện **sự thống trị** khổng lồ đối với chuỗi cung ứng. **Khuếch tán văn hóa** tăng tốc khi các ý tưởng, sản phẩm và thực hành lan rộng qua biên giới, trong khi các chiến lược **địa phương hóa** điều chỉnh các sản phẩm toàn cầu. **Hội tụ** thị trường đã đưa hàng triệu người thoát nghèo, nhưng cũng thúc đẩy **phân cực** giữa những người thắng và thua. **Di cư** của người lao động theo cơ hội kinh tế, định hình lại xã hội và bản sắc trên toàn thế giới."
  },

  'social-change': {
    emojis: ['✊', '📢', '🕊️'],
    en: "Social **transformation** rarely happens without sustained effort from organised **movement**s. **Grassroots** **activism** and community **advocacy** can **mobilize** thousands of citizens to demand **reform**. **Protest** and peaceful **demonstration** are protected forms of political expression, whereas **civil disobedience** involves deliberately breaking unjust laws to draw attention to systemic injustice. **Solidarity** among diverse groups amplifies the call for **justice** and strengthens **resistance** against oppressive structures. History shows that incremental gains, achieved through persistent pressure, can eventually produce fundamental changes in law and social norms.",
    vi: "**Chuyển đổi** xã hội hiếm khi xảy ra mà không có nỗ lực bền vững từ các **phong trào** có tổ chức. **Hoạt động xã hội** **từ cơ sở** và **vận động** cộng đồng có thể **huy động** hàng ngàn công dân để yêu cầu **cải cách**. **Biểu tình** và **tuần hành** hòa bình là các hình thức biểu đạt chính trị được bảo vệ, trong khi **bất tuân dân sự** liên quan đến việc cố tình vi phạm các luật bất công để thu hút sự chú ý đến bất công hệ thống. **Đoàn kết** giữa các nhóm đa dạng khuếch đại tiếng gọi **công lý** và tăng cường **kháng cự** chống lại các cấu trúc áp bức. Lịch sử cho thấy những thành tựu dần dần, đạt được thông qua áp lực bền vững, cuối cùng có thể tạo ra những thay đổi cơ bản trong luật pháp và các chuẩn mực xã hội."
  },

  'immigration-identity': {
    emojis: ['🌍', '🛂', '🤝'],
    en: "Immigration shapes both the **host country** and the communities who move there. **Integration** policies aim to facilitate **belonging** without erasing the **identity** of **minority** groups. Full **assimilation** can erase cultural heritage, whereas **multiculturalism** celebrates difference as a national strength. A **diaspora** community maintains ties to its homeland while navigating **transnational** identities. **Cultural exchange** enriches societies, yet **xenophobia** — fear or hostility toward foreigners — remains a persistent obstacle to **acceptance**. **Naturalization** offers migrants a formal pathway to citizenship, yet formal status does not always guarantee social inclusion.",
    vi: "Di cư định hình cả **nước tiếp nhận** lẫn các cộng đồng di chuyển đến đó. Các chính sách **hội nhập** nhằm tạo điều kiện **quy thuộc** mà không xóa bỏ **bản sắc** của các nhóm **thiểu số**. **Đồng hóa** hoàn toàn có thể xóa bỏ di sản văn hóa, trong khi **đa văn hóa** tôn vinh sự khác biệt như một thế mạnh quốc gia. Một cộng đồng **diaspora** duy trì mối liên kết với quê hương trong khi điều hướng các bản sắc **xuyên quốc gia**. **Giao lưu văn hóa** làm phong phú thêm xã hội, nhưng **bài ngoại** — sự sợ hãi hoặc thù địch đối với người nước ngoài — vẫn là trở ngại dai dẳng đối với **sự chấp nhận**. **Nhập tịch** cung cấp cho người di dân một con đường chính thức đến quốc tịch, nhưng địa vị chính thức không phải lúc nào cũng đảm bảo hòa nhập xã hội."
  },

  'psychology-society': {
    emojis: ['🧠', '👥', '🔍'],
    en: "Social psychology reveals how powerfully our **perception** and **attitude**s are shaped by the groups we belong to. **Conformity** arises when individuals adjust their behaviour to match group norms under **social pressure**. **Groupthink** occurs when the desire for consensus overrides independent **cognitive** judgment, often leading to poor decisions. **Stereotype**s and **prejudice** distort our view of others, while **scapegoating** deflects blame onto a convenient target. **Manipulation** exploits **heuristic** shortcuts — mental rules of thumb that we use automatically. When a person holds two contradictory beliefs simultaneously, the resulting discomfort is **cognitive dissonance**. Understanding **motivation** helps explain why individuals comply or resist even when personal cost is high.",
    vi: "Tâm lý học xã hội tiết lộ mức độ mạnh mẽ **nhận thức** và **thái độ** của chúng ta được định hình bởi các nhóm mà chúng ta thuộc về. **Tuân thủ** nảy sinh khi các cá nhân điều chỉnh hành vi để phù hợp với các chuẩn mực nhóm dưới **áp lực xã hội**. **Tư duy nhóm** xảy ra khi mong muốn đồng thuận ghi đè phán đoán **nhận thức** độc lập, thường dẫn đến quyết định tồi. **Khuôn mẫu** và **thành kiến** làm méo mó cái nhìn của chúng ta về người khác, trong khi **đổ lỗi** chuyển trách nhiệm sang một mục tiêu thuận tiện. **Thao túng** khai thác các lối tắt **heuristic** — các quy tắc ngón tay cái tinh thần. Khi một người có hai niềm tin mâu thuẫn, sự khó chịu kết quả là **sự bất hòa nhận thức**. Hiểu **động lực** giúp giải thích tại sao các cá nhân tuân thủ hoặc kháng cự ngay cả khi chi phí cá nhân cao."
  },

  'consumer-society': {
    emojis: ['🛍️', '💳', '🗑️'],
    en: "Modern consumer society is driven by **materialism** — the belief that acquiring goods equates to **wellbeing** and **status**. **Aspiration** is fuelled by advertising that links **brand** identity to personal success. **Impulse** buying and the culture of **disposability** generate enormous **waste**, while **planned obsolescence** — designing products to fail quickly — encourages **overconsumption**. **Conspicuous consumption** displays wealth publicly to signal social position. Easy credit enables **consumption** beyond one's means, leading many households into **debt**. Critics argue that this model is environmentally unsustainable and fails to deliver genuine happiness, advocating for circular economies and conscious purchasing instead.",
    vi: "Xã hội tiêu dùng hiện đại được thúc đẩy bởi **chủ nghĩa vật chất** — niềm tin rằng việc mua hàng tương đương với **sức khỏe** và **địa vị**. **Khát vọng** được thúc đẩy bởi quảng cáo liên kết **thương hiệu** với thành công cá nhân. Mua hàng **bốc đồng** và văn hóa **tiêu hao** tạo ra lượng **chất thải** khổng lồ, trong khi **lỗi thời có kế hoạch** — thiết kế sản phẩm để hỏng nhanh — khuyến khích **tiêu dùng quá mức**. **Tiêu dùng phô trương** trưng bày sự giàu có công khai để phát tín hiệu vị trí xã hội. Tín dụng dễ dàng cho phép **tiêu thụ** vượt quá khả năng của một người, dẫn nhiều hộ gia đình vào **nợ nần**. Các nhà phê bình lập luận rằng mô hình này không bền vững về môi trường và không mang lại hạnh phúc thực sự."
  },

  'language-power': {
    emojis: ['🗣️', '✊', '📖'],
    en: "Language is never neutral — it reflects and reinforces **power** relations in society. **Hegemony** operates partly through language: the **dominant** group's vocabulary shapes what is considered normal or legitimate. **Doublespeak** uses deliberate ambiguity to obscure meaning and **legitimize** harmful policies. **Indoctrination** embeds particular values through repetition and **suppression** of alternative views. **Appropriation** of a **minority language** — adopting its words without acknowledging their **heritage** — can erode community identity. The theory of **linguistic relativity** suggests that the language we speak shapes the way we think. **Multilingual** societies navigate these tensions by recognising that **subtext** — what is left unsaid — often carries as much weight as explicit speech.",
    vi: "Ngôn ngữ không bao giờ trung lập — nó phản ánh và củng cố các mối quan hệ **quyền lực** trong xã hội. **Bá quyền** hoạt động một phần thông qua ngôn ngữ: vốn từ vựng của nhóm **thống trị** định hình những gì được coi là bình thường. **Ngôn ngữ hai mặt** sử dụng sự mơ hồ có chủ ý để che khuất ý nghĩa và **hợp pháp hóa** các chính sách có hại. **Nhồi sọ** nhúng các giá trị cụ thể thông qua sự lặp lại và **đàn áp** các quan điểm thay thế. **Chiếm dụng** của một **ngôn ngữ thiểu số** — áp dụng các từ của nó mà không thừa nhận **di sản** của chúng — có thể xói mòn bản sắc cộng đồng. Lý thuyết về **tương đối ngôn ngữ** cho rằng ngôn ngữ chúng ta nói định hình cách chúng ta suy nghĩ. Các xã hội **đa ngôn ngữ** điều hướng những căng thẳng này bằng cách nhận ra rằng **ẩn ý** — những gì không được nói — thường mang trọng lượng bằng lời nói rõ ràng."
  }

};

// ─── Verification helpers ─────────────────────────────────────────────────────

function stripBold(text) {
  return text.replace(/\*\*/g, '').toLowerCase();
}

function wordInStory(word, storyText) {
  const clean = stripBold(storyText);
  const w = word.toLowerCase();
  // exact match (handles multi-word phrases)
  if (clean.includes(w)) return true;
  // root match: check if first 5 chars appear (handles plurals, -ing, -ed etc.)
  if (w.length >= 5 && clean.includes(w.slice(0, 5))) return true;
  return false;
}

// ─── Apply + verify ───────────────────────────────────────────────────────────

console.log('\n=== Phase 2: Master stories ===\n');

let allOk = true;

master.topics.forEach(topic => {
  const key = `master.${topic.id}`;
  const storyData = MASTER_STORIES[topic.id];

  if (!storyData) {
    console.error(`  ❌ No story defined for: ${topic.id}`);
    allOk = false;
    return;
  }

  // Verify all target words appear in EN story
  const missing = topic.words.filter(w => !wordInStory(w.word, storyData.en));
  if (missing.length > 0) {
    console.error(`  ❌ [${topic.id}] Missing words: ${missing.map(w => w.word).join(', ')}`);
    allOk = false;
  } else {
    console.log(`  ✅ [${topic.id}] all ${topic.words.length} words present`);
  }

  stories[key] = storyData;
});

if (!allOk) {
  console.error('\n❌ Verification failed — stories.json NOT updated');
  process.exit(1);
}

console.log('\n✅ All 30 Master stories verified\n');

// ─── Write ────────────────────────────────────────────────────────────────────

fs.writeFileSync(storiesPath, JSON.stringify(stories, null, 2));
console.log('✅ data/stories.json updated');
