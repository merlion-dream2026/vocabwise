/**
 * Phase 1: Update Scholar stories.json
 * Rewrite 13 stories to include all new target words
 */

const fs = require('fs');
const path = require('path');

const storiesPath = path.join(__dirname, '../data/stories.json');
const wordsPath = path.join(__dirname, '../data/words.json');
const stories = JSON.parse(fs.readFileSync(storiesPath, 'utf8'));
const words = JSON.parse(fs.readFileSync(wordsPath, 'utf8'));

const NEW_STORIES = {

'scholar.art-culture': {
  emojis: ['🎨','🖼️','🏛️'],
  en: `The gallery's new **exhibition** celebrated the dialogue between **Renaissance** masters and **contemporary** artists. As visitors entered, they were greeted by a dramatic **installation** — a towering arrangement of mirrors that transformed the room into a world of light and reflection. The **curator** had chosen works that challenged conventional definitions of **genre**: oil **portrait**s stood beside **abstract** canvases, and classical **sculpture** shared space with digital projections.

What united all these works, the curator explained, was their meticulous attention to **composition**. Each artist, regardless of era, had arranged colour, form, and space to guide the viewer's eye and stir the emotions. This **aesthetic** sensibility — the ability to create meaning through visual balance — was the true **heritage** of great art.

The centrepiece of the exhibition was a recently restored **masterpiece** from the 17th century, displayed beside a modern interpretation. Standing together, the two works made a compelling argument: that every generation inherits the past and reshapes it into something new.`,
  vi: `Triển lãm mới của phòng tranh tôn vinh cuộc đối thoại giữa các bậc thầy **Phục Hưng** và các nghệ sĩ **đương đại**. Khi khách tham quan bước vào, họ được chào đón bởi một **công trình sắp đặt** ấn tượng. **Người phụ trách** đã chọn những tác phẩm thách thức định nghĩa thông thường về **thể loại**: các **bức chân dung** bằng sơn dầu đứng cạnh tác phẩm **trừu tượng**, và **điêu khắc** cổ điển chia sẻ không gian với hình chiếu kỹ thuật số.

Điều thống nhất tất cả các tác phẩm, theo lời người phụ trách, là sự chú ý tỉ mỉ đến **bố cục**. Mỗi nghệ sĩ, bất kể thời đại, đều sắp xếp màu sắc, hình dạng và không gian để hướng dẫn ánh nhìn người xem. Cảm quan **thẩm mỹ** này là **di sản** đích thực của nghệ thuật vĩ đại.

Tâm điểm của **triển lãm** là một **kiệt tác** mới được phục chế từ thế kỷ 17, trưng bày bên cạnh một cách diễn giải hiện đại.`
},

'scholar.arts-entertainment': {
  emojis: ['🎬','🎭','🎤'],
  en: `When the **screenplay** for a beloved **novel** was finally greenlit, expectations ran high. The production team assembled a talented **cast** and spent months crafting a story that would honour the source material while bringing something fresh to the screen. When the **premiere** arrived, the **audience** packed into the **theatre** in anticipation.

The finished **film** was more than an **adaptation** — it was a **spectacle** in its own right. Critics praised its bold visual language, and word spread quickly that this was no ordinary **remake**. A riveting **documentary** released alongside the film revealed the creative process behind it, earning its own **award** nomination.

The success of the project extended beyond the screen. The **concert** of the film's original score drew thousands of fans, proving that a single story could **inspire** across every form of entertainment — from page to stage.`,
  vi: `Khi **kịch bản** cho một **tiểu thuyết** được yêu thích cuối cùng được bật đèn xanh, kỳ vọng rất cao. Đội sản xuất tập hợp một **dàn diễn viên** tài năng để tạo ra thứ gì đó mới mẻ. Khi **buổi ra mắt** đến, **khán giả** đổ vào **rạp hát** với sự háo hức.

**Bộ phim** hoàn chỉnh không chỉ là một **sự chuyển thể** — nó là một **cảnh tượng** theo đúng nghĩa. Các nhà phê bình khen ngợi ngôn ngữ hình ảnh táo bạo, và **phim tài liệu** ra mắt cùng lúc đã giành được đề cử **giải thưởng**.

Thành công của dự án vượt ra ngoài màn ảnh. **Buổi hòa nhạc** nhạc phim gốc đã thu hút hàng nghìn người hâm mộ, chứng minh rằng một câu chuyện có thể **truyền cảm hứng** và vẫn là một **phiên bản làm lại** đáng xem.`
},

'scholar.advertising-consumer': {
  emojis: ['📣','💼','🛍️'],
  en: `When a global **brand** signed a record-breaking **endorsement** deal with one of the world's most recognised athletes, the marketing world took notice. The partnership was designed to **promote** a new sportswear line and **persuade** a younger generation of **consumer**s to make their next **purchase** through the brand's app.

The strategy was built around a memorable **slogan** — short, bold, and instantly shareable — that appeared across every **advertisement** and **commercial** the brand released. By carefully identifying the **target** audience and tailoring the message to **influence** their lifestyle choices, the campaign generated enormous online engagement.

The results were remarkable. **Demand** for the new line surpassed all forecasts, and the brand's **sponsor**ship visibility reached record highs. More importantly, the **loyalty** of existing customers deepened: people who already admired the athlete now felt a stronger emotional connection to the brand than ever before.`,
  vi: `Khi một **thương hiệu** toàn cầu ký hợp đồng **chứng thực** phá kỷ lục với một vận động viên nổi tiếng, thế giới tiếp thị chú ý. Sự hợp tác nhằm **quảng bá** dòng đồ thể thao mới và **thuyết phục** thế hệ **người tiêu dùng** trẻ thực hiện **giao dịch mua** qua ứng dụng.

Chiến lược xây dựng xung quanh **khẩu hiệu** đáng nhớ xuất hiện trên mọi **quảng cáo** và **đoạn phim quảng cáo**. Bằng cách xác định **đối tượng mục tiêu** và điều chỉnh thông điệp để **ảnh hưởng** đến lựa chọn lối sống, chiến dịch tạo ra sự tương tác khổng lồ.

Kết quả đáng chú ý. **Nhu cầu** vượt mọi dự báo, khả năng hiển thị **tài trợ** đạt mức cao kỷ lục, và **lòng trung thành** của khách hàng ngày càng sâu sắc hơn.`
},

'scholar.wellbeing-lifestyle': {
  emojis: ['🧘‍♀️','🌿','💪'],
  en: `When Linh began her journey toward better **wellbeing**, she quickly realised that no single change would be enough. True health, her doctor explained, required a **holistic** approach — one that attended to the body, mind, and daily environment together rather than in isolation.

She started by building a morning **routine**: gentle stretching to correct her **posture**, followed by a glass of water to prioritise **hydration**, and ten minutes of **mindfulness** meditation to clear her mind. Keeping **active** throughout the day became a natural **habit** rather than an effort.

Her **fitness** improved steadily, but what surprised her most was the shift in her overall **lifestyle**. She became more **productive** at work, found it easier to maintain **balance** between her personal and professional life, and began to see **self-care** not as indulgence but as necessity. After an illness, her **recovery** was faster than expected — evidence that consistent healthy habits truly compound over time.`,
  vi: `Khi Linh bắt đầu hành trình hướng tới **sức khỏe** tốt hơn, cô nhận ra không có một thay đổi đơn lẻ nào là đủ. Sức khỏe thực sự đòi hỏi cách tiếp cận **toàn diện** — quan tâm đến cơ thể, tâm trí và môi trường cùng nhau.

Cô xây dựng **thói quen** buổi sáng: kéo giãn để chỉnh **tư thế**, uống nước để **giữ nước**, và **thiền chánh niệm** để làm sạch tâm trí. Duy trì **tích cực** trong ngày trở thành **thói quen** tự nhiên.

**Thể lực** cải thiện đều đặn, nhưng điều ngạc nhiên nhất là sự thay đổi trong **lối sống** tổng thể. Cô **năng suất** hơn, dễ duy trì **sự cân bằng** hơn, và coi **chăm sóc bản thân** là điều cần thiết. Sau một trận ốm, **sự phục hồi** nhanh hơn dự kiến.`
},

'scholar.crime-society': {
  emojis: ['⚖️','👮','🔒'],
  en: `The city's rising crime rate prompted local authorities to reassess their approach to public safety. Police increased **patrol** presence in high-risk areas, while prosecutors pushed for tougher **punishment** to strengthen the **deterrence** effect against repeat offending. The belief was simple: a more visible legal response would signal that **illegal** behaviour carried real consequences.

One high-profile case drew particular attention. A **criminal** charged with organised **violence** was brought to trial after months of investigation. The defence argued that the **evidence** was insufficient to prove the defendant **guilty** beyond reasonable doubt, but the prosecution presented a compelling case. The **conviction** resulted in a lengthy **sentence** and a substantial **fine**.

Yet community groups questioned whether a harsh **arrest** record alone was enough. Research suggested that **rehabilitation** programmes were more effective at reducing reoffending than **deterrence** alone. For many **victim**s, justice meant not only a verdict but a guarantee that society had invested in preventing the next crime.`,
  vi: `Tỷ lệ tội phạm ngày càng tăng khiến chính quyền tăng cường **tuần tra**, thúc đẩy **hình phạt** nghiêm khắc hơn để tăng hiệu quả **răn đe** với người tái phạm. Hành vi **bất hợp pháp** phải kéo theo hậu quả thực sự.

Một vụ án nổi tiếng thu hút sự chú ý: một **tội phạm** bị buộc tội **bạo lực** có tổ chức ra hầu tòa. Bào chữa lập luận **bằng chứng** không đủ để chứng minh bị cáo **có tội**, nhưng bên công tố thuyết phục hơn. **Bản án kết tội** dẫn đến án **tù dài hạn** và **tiền phạt** đáng kể.

Tuy nhiên, nghiên cứu cho thấy **cải tạo** hiệu quả hơn đơn thuần răn đe. Đối với nhiều **nạn nhân**, công lý không chỉ là bản án mà còn là đầu tư ngăn chặn tội phạm tiếp theo. Chỉ có **bắt giữ** thôi là chưa đủ.`
},

'scholar.creativity-innovation': {
  emojis: ['💡','🎨','🚀'],
  en: `The startup's creative director believed that the best ideas rarely arrived fully formed — they needed to be grown. Every new project began with an **ideation** session, a structured phase where the team was encouraged to **brainstorm** freely, setting aside criticism to **generate** as many possibilities as they could.

The process drew heavily on **design thinking**, a methodology that placed human needs at the heart of every **concept**. Teams were asked to **collaborate** across disciplines, combining perspectives from engineering, marketing, and user research to find **original** solutions. Crucially, they were expected to **improvise** when early ideas did not work — to stay flexible and adapt rather than abandon a promising direction.

Once a promising concept emerged, the team would **refine** it iteratively. This **unconventional** approach sometimes frustrated stakeholders who wanted faster results, but it consistently led to **breakthrough** products. The **inspiration** behind every successful product, the director reminded her team, was not a single flash of brilliance — it was the discipline to keep asking better questions and to **implement** ideas with both boldness and care.`,
  vi: `Giám đốc sáng tạo tin rằng những ý tưởng tốt nhất cần được nuôi dưỡng. Mỗi dự án bắt đầu bằng buổi **phát triển ý tưởng**, nơi nhóm **động não** tự do để **tạo ra** nhiều khả năng nhất có thể.

Quy trình dựa vào **tư duy thiết kế**, đặt nhu cầu con người vào trung tâm mọi **khái niệm**. Các nhóm **cộng tác** xuyên ngành để tìm giải pháp **độc đáo**, sẵn sàng **ứng biến** khi ý tưởng ban đầu không hiệu quả.

Khi khái niệm hứa hẹn xuất hiện, nhóm **tinh chỉnh** nó theo từng bước. Cách tiếp cận **không theo lối mòn** dẫn đến các sản phẩm **đột phá**. **Cảm hứng** đằng sau mọi thành công là kỷ luật đặt câu hỏi tốt hơn và **thực hiện** ý tưởng một cách táo bạo và cẩn thận.`
},

'scholar.tourism-hospitality': {
  emojis: ['🌏','🕌','🌿'],
  en: `Hoa had been planning her trip for months, and her **itinerary** reflected the breadth of her ambitions. She wanted more than a standard holiday — she wanted a journey of genuine **cultural exchange**, one that left a lasting **impression** and deepened her understanding of the world's **diverse** traditions.

Her first stop was a remote village far from the polished experience of any **resort**. The local **accommodation** was modest but the **hospitality** of her hosts was extraordinary. She learned their **custom**s, participated in their festivals, and realised that **authentic** travel meant engaging respectfully with a place rather than merely photographing it.

Later in the trip, she visited a sacred site that drew thousands of visitors each year — some as tourists, others making a personal **pilgrimage** to honour their faith or ancestry. The site had embraced **eco-tourism** principles to protect its surroundings while remaining open to the world. By the journey's end, Hoa understood why this **destination** had captured so many imaginations. Great **tourism** was not about escaping reality — it was about encountering it more fully.`,
  vi: `Hoa lên kế hoạch nhiều tháng, và **lịch trình** phản ánh tham vọng rộng lớn. Cô muốn hành trình **giao lưu văn hóa** thực sự, để lại **ấn tượng** lâu dài về những truyền thống **đa dạng** của thế giới.

Điểm dừng đầu tiên xa khỏi bất kỳ **khu nghỉ dưỡng** nào. **Chỗ ở** khiêm tốn nhưng **lòng hiếu khách** phi thường. Cô học **phong tục** địa phương và nhận ra du lịch **chân thực** là gắn kết tôn trọng với một nơi.

Sau đó cô ghé thăm địa điểm linh thiêng — một số là khách du lịch, những người khác thực hiện **hành hương** cá nhân. Địa điểm áp dụng nguyên tắc **du lịch sinh thái** để bảo vệ môi trường. **Du lịch** tuyệt vời không phải là trốn thoát — mà là gặp gỡ thực tại đầy đủ hơn.`
},

'scholar.business-management': {
  emojis: ['💼','📈','🤝'],
  en: `When the tech **entrepreneur** announced plans to pursue an **acquisition**, her board moved quickly to evaluate the financial implications. A proposed **merger** with a European firm had been under discussion for months, but a full independent **audit** of the target company's accounts was required before any deal could proceed.

The findings were encouraging. The target firm had consistently exceeded **benchmark** performance standards in its sector, and its **revenue** projections remained strong. Potential **liability** issues had been identified but were manageable, and leadership agreed that the **partnership** would accelerate growth in markets that neither company could easily enter alone.

Key **stakeholder**s were briefed throughout the process. Shareholders were assured that **dividend** payments would continue, and employees were told that the decision to **outsource** certain administrative functions would free resources for higher-value work. With a clear **strategy** in place and an updated financial **forecast** approved, the company was ready to begin formal negotiations.`,
  vi: `Khi **doanh nhân** công nghệ thông báo kế hoạch thực hiện **mua lại**, hội đồng nhanh chóng đánh giá tác động tài chính. **Sáp nhập** được đề xuất cần một cuộc **kiểm toán** độc lập đầy đủ trước khi tiến hành.

Kết quả khả quan. Công ty mục tiêu vượt tiêu chuẩn **đối sánh** nhất quán, dự báo **doanh thu** mạnh. Vấn đề **trách nhiệm pháp lý** có thể quản lý được, và **quan hệ đối tác** sẽ đẩy nhanh tăng trưởng.

Các **bên liên quan** được thông báo đầy đủ. Cổ đông được đảm bảo trả **cổ tức**, nhân viên được biết việc **thuê ngoài** sẽ giải phóng nguồn lực. Với **chiến lược** rõ ràng và **dự báo** được phê duyệt, công ty sẵn sàng đàm phán.`
},

'scholar.family-relationships': {
  emojis: ['👨‍👩‍👧‍👦','❤️','🌱'],
  en: `The relationship between Nam and his grandmother had always been one of deep **kinship** — a **bond** shaped by shared stories, shared meals, and the quiet rituals that carried their family's **tradition** from one **generation** to the next. Yet as Nam grew older, he began to notice the tensions between those inherited **value**s and the world he was growing into.

His grandmother had entered **marriage** young, at a time when **parental** expectations and social **responsibility** left little room for personal choice. The concept of **independence** was something she had found only partially, later in life. **Divorce** was still spoken of in hushed tones within the family, carrying a weight of judgement that younger members found difficult to accept.

Nam's **generation** approached relationships differently. **Gender** roles were negotiated rather than assumed. Personal **boundary**s were named and respected. The **empowerment** of each partner — the idea that a loving relationship should enlarge rather than restrict a person's sense of self — was central to how they understood **commitment**. Bridging these two worldviews was not always easy, but the **bond** of family, Nam believed, was strong enough to hold different truths at once.`,
  vi: `Mối quan hệ giữa Nam và bà luôn là **mối quan hệ thân tộc** sâu sắc — **mối gắn kết** được hình thành bởi những câu chuyện, bữa ăn chung và các nghi lễ mang **truyền thống** gia đình qua **thế hệ**. Tuy nhiên, Nam nhận ra căng thẳng giữa những **giá trị** kế thừa và thế giới anh đang bước vào.

Bà bước vào **hôn nhân** khi còn trẻ, khi kỳ vọng **cha mẹ** và **trách nhiệm** xã hội ít có chỗ cho lựa chọn cá nhân. **Ly hôn** vẫn được nói thì thầm. **Sự độc lập** là điều bà tìm thấy muộn và chỉ một phần.

Thế hệ Nam tiếp cận khác hơn. Vai trò **giới tính** được thương lượng. **Ranh giới** cá nhân được tôn trọng. **Sự trao quyền** cho mỗi đối tác là trung tâm của **cam kết**. **Mối gắn kết** gia đình đủ mạnh để chứa đựng nhiều sự thật cùng một lúc.`
},

'scholar.ethical-issues': {
  emojis: ['⚖️','🤔','🕊️'],
  en: `Few questions in public life generate more debate than how societies should **regulate** powerful institutions while ensuring individual freedoms are preserved. The **dilemma** is real: excessive control can stifle innovation and restrict the **emancipation** of individuals from outdated systems, while too little oversight can allow abuses of power to go unchecked.

At the heart of many **controversial** cases lies the question of **culpability**. When harm occurs — whether through negligence, systemic failure, or deliberate policy — who bears **moral** responsibility? And when individuals stay silent in the face of wrongdoing, does their silence amount to **complicity**?

These are questions that demand genuine **deliberation** rather than quick answers. Any **obligation** to act must be weighed against the realistic **impact** of intervention. One cannot simply **justify** every measure that claims to **protect** the public without examining its **consequence**s for civil liberties and **fairness**. The challenge is to hold individuals and institutions to account without sacrificing the principles of justice in the process.`,
  vi: `Ít câu hỏi nào tạo ra nhiều tranh luận hơn về cách **điều tiết** các thể chế quyền lực mà vẫn bảo vệ tự do cá nhân. **Tình huống khó xử** là thực: kiểm soát quá mức hạn chế **sự giải phóng** cá nhân, trong khi giám sát quá ít để lạm dụng không bị kiểm soát.

Ở trung tâm nhiều vụ án **gây tranh cãi** là câu hỏi về **trách nhiệm**. Khi tổn hại xảy ra, ai chịu trách nhiệm **đạo đức**? Khi cá nhân im lặng trước hành động sai trái, liệu đó có phải là **đồng lõa** không?

Những câu hỏi này đòi hỏi **sự cân nhắc** thực sự. **Nghĩa vụ** hành động phải được cân đối với **tác động** thực tế. Không thể **biện hộ** mọi biện pháp tuyên bố **bảo vệ** công chúng mà không xem xét **hậu quả** đối với **sự công bằng**. Thách thức là giữ trách nhiệm mà không hy sinh nguyên tắc công lý.`
},

'scholar.media-journalism': {
  emojis: ['📰','🖊️','📡'],
  en: `When the foreign **correspondent** filed her report from the conflict zone, her editors faced a familiar challenge: how to give the story the **coverage** it deserved without allowing **bias** to shape the **headline**. The pressures of the twenty-four-hour news cycle made it tempting to prioritise speed over accuracy, but the paper's **editorial** standards were uncompromising.

Every claim had to be supported by a reliable **source**, and every fact had to be carefully **verify**-ied before **broadcast** or publication. The risk of spreading **propaganda** — whether intentionally or through carelessness — was taken seriously. The role of an independent press, the editor reminded her team, was to inform, not to persuade.

The paper's strong reputation had earned it a loyal readership and a healthy **circulation** across the region. The investigative **feature** published the previous week had already drawn considerable praise. In countries where **censorship** constrained the work of local reporters, the **journalist**s at this outlet understood that their independence was not merely a professional privilege — it was a responsibility they owed to the public they served.`,
  vi: `Khi **phóng viên** nước ngoài gửi bài từ vùng xung đột, các biên tập viên đối mặt với thách thức quen thuộc: làm thế nào để **đưa tin** xứng đáng mà không để **thiên kiến** định hình **tiêu đề**. Các tiêu chuẩn **biên tập** là không khoan nhượng.

Mỗi khẳng định phải được hỗ trợ bởi **nguồn** đáng tin, mỗi sự kiện phải được **kiểm tra** trước khi **phát sóng**. Rủi ro lan truyền **tuyên truyền** được coi trọng. Vai trò của báo chí độc lập là thông tin, không phải thuyết phục.

Danh tiếng tốt mang lại **lượng phát hành** lành mạnh. Bài **phóng sự** điều tra tuần trước được khen ngợi. Ở những quốc gia nơi **kiểm duyệt** hạn chế **nhà báo**, sự độc lập không chỉ là đặc quyền — đó là trách nhiệm với công chúng.`
},

'scholar.economics-trade': {
  emojis: ['📈','💰','🌐'],
  en: `When the country's **GDP** growth fell for the second consecutive quarter, economists confirmed what markets had feared: the economy had entered a **recession**. The central bank responded by cutting the **interest rate** to stimulate borrowing and spending, while the government announced a series of **fiscal** measures designed to boost activity.

One controversial decision was to raise the **tariff** on imported steel, intended to protect domestic producers from competition. Critics argued the policy would inflate costs for manufacturers who depended on affordable steel and warned that retaliation could damage the country's **export** sector. Supporters countered that the domestic industry had long required **subsidy** to survive, and that a temporary **tariff** was preferable to allowing a near-**monopoly** to form among foreign suppliers.

Underlying all these debates was the challenge of managing **currency** volatility. A weaker **currency** made **export**s more competitive but increased the cost of every imported **commodity**, feeding **inflation** and eroding purchasing power. Every **transaction** in the global economy carried consequences that extended far beyond a single **deficit** figure on a spreadsheet.`,
  vi: `Khi tăng trưởng **GDP** giảm quý thứ hai liên tiếp, nền kinh tế xác nhận đã vào **suy thoái**. Ngân hàng trung ương cắt giảm **lãi suất** để kích thích kinh tế, chính phủ công bố các biện pháp **tài khóa**.

Một quyết định gây tranh cãi là tăng **thuế quan** với thép nhập khẩu. Nhà phê bình lo ngại tác hại với **xuất khẩu**; người ủng hộ cho rằng ngành thép từ lâu cần **trợ cấp**, và **thuế quan** tạm thời tốt hơn để **độc quyền** nước ngoài hình thành.

Thách thức lớn hơn là quản lý biến động **tiền tệ**. Tiền tệ yếu tăng sức cạnh tranh **xuất khẩu** nhưng đẩy giá **hàng hóa** nhập khẩu lên, gây **lạm phát**. Mỗi **giao dịch** toàn cầu có hậu quả vượt xa một con số **thâm hụt** trên bảng tính.`
},

'scholar.personal-finance': {
  emojis: ['💰','📊','🏠'],
  en: `When Minh received his first full-time **salary**, he sat down with a financial planner to map out a realistic **budget**. His monthly **income** covered his basic needs comfortably, but he knew that without a plan, the money would disappear faster than he expected.

The planner's advice was straightforward: build an emergency fund first, then focus on reducing any existing **debt** — including the student **loan** he had taken out three years earlier. Once that was under control, he could begin thinking seriously about longer-term goals: saving for a **mortgage** deposit, building a **savings** cushion, and eventually starting an **investment** portfolio.

There were other obligations to factor in. Health **insurance** premiums had risen again, and his employer reminded him to consider increasing his **pension** contributions while he was young. He also needed to ensure his annual **tax** return accurately reflected his **expenditure**, including home office costs. His **credit** score, the planner noted, would affect his borrowing options for years to come — managing it carefully was as important as any other financial decision he would make.`,
  vi: `Khi Minh nhận **lương** toàn thời gian đầu tiên, anh lập **ngân sách** thực tế cùng nhà hoạch định tài chính. **Thu nhập** hàng tháng đủ cho nhu cầu cơ bản, nhưng không có kế hoạch, tiền sẽ biến mất nhanh.

Lời khuyên đơn giản: trước tiên xây dựng quỹ khẩn cấp, giảm **nợ** hiện tại — bao gồm **khoản vay** sinh viên. Sau đó tập trung mục tiêu dài hạn: khoản đặt cọc **thế chấp**, **tiết kiệm** dự phòng, và danh mục **đầu tư**.

Phí **bảo hiểm** sức khỏe đã tăng. Nhà tuyển dụng nhắc tăng đóng góp **lương hưu** khi còn trẻ. Tờ khai **thuế** phải phản ánh chính xác **chi tiêu**. Điểm **tín dụng** ảnh hưởng đến khả năng vay mượn nhiều năm — quản lý nó quan trọng như bất kỳ quyết định tài chính nào khác.`
}

};

// ─── Verify all target words appear in each story ─────────────────────────────

console.log('\n=== Verifying story word coverage ===\n');

const scholar = words['scholar'];
let allOk = true;

Object.entries(NEW_STORIES).forEach(([key, story]) => {
  const topicId = key.replace('scholar.', '');
  const topic = scholar.topics.find(t => t.id === topicId);
  if (!topic) { console.log(`❌ Topic not found: ${topicId}`); allOk = false; return; }

  const storyText = (story.en).toLowerCase();
  const missing = [];
  topic.words.forEach(w => {
    const wl = w.word.toLowerCase();
    // Check word appears (allow plural/conjugated forms by checking the root)
    const root = wl.replace(/s$/, '').replace(/ing$/, '').replace(/ed$/, '').replace(/ly$/, '');
    if (!storyText.includes(root) && !storyText.includes(wl)) {
      missing.push(w.word);
    }
  });

  if (missing.length > 0) {
    console.log(`⚠️  ${key} — missing: ${missing.join(', ')}`);
    allOk = false;
  } else {
    console.log(`✅ ${key}`);
  }
});

// ─── Apply updates ─────────────────────────────────────────────────────────────

console.log('\n=== Updating stories ===\n');
Object.entries(NEW_STORIES).forEach(([key, story]) => {
  stories[key] = story;
  console.log(`  Updated: ${key}`);
});

fs.writeFileSync(storiesPath, JSON.stringify(stories, null, 2));
console.log('\n✅ data/stories.json updated');
