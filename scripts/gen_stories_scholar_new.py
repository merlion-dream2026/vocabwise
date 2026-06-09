# -*- coding: utf-8 -*-
"""
1. Copies 8 transferred Scholar->Master stories (scholar.X -> master.X)
2. Adds 8 new Scholar B2 stories
"""
import json, os

TRANSFER_IDS = [
    "academic-skills", "law-justice", "science-research", "innovation-startup",
    "language-communication", "philosophy-ethics", "education-system", "food-agriculture"
]

NEW_SCHOLAR_STORIES = {
  "scholar.personal-finance": {
    "emojis": ["💳", "💰", "🏦"],
    "en": "Managing personal **finances** well requires creating a realistic **budget** and tracking all **expenditure**. Mai earns a modest **salary**, but she puts ten percent of her **income** into **savings** each month. She took out a small **loan** to pay for a training course that boosted her career. Her **investment** in professional development paid off, and she no longer struggles to **afford** her rent. With a good **credit** score and no serious **debt**, she feels financially secure.",
    "vi": "Quản lý **tài chính** cá nhân tốt đòi hỏi lập **ngân sách** thực tế và theo dõi mọi **chi tiêu**. Mai có **tiền lương** khiêm tốn, nhưng cô để dành mười phần trăm **thu nhập** vào **tiết kiệm** mỗi tháng. Cô vay một **khoản vay** nhỏ để chi trả cho khóa đào tạo giúp thăng tiến sự nghiệp. **Đầu tư** của cô vào phát triển nghề nghiệp đã có kết quả, và giờ cô không còn khó khăn để **đủ khả năng** chi trả tiền thuê nhà. Với điểm **tín dụng** tốt và không có **nợ** nghiêm trọng, cô cảm thấy an toàn tài chính."
  },
  "scholar.advertising-consumer": {
    "emojis": ["📢", "🛒", "📺"],
    "en": "Modern **advertising** uses clever strategies to **influence** buying decisions and build **brand** **loyalty**. Companies **target** specific groups of **consumers** through personalised online **campaigns**. Bright colours and emotional stories **persuade** people to **purchase** products they may not need. Celebrities **sponsor** products to make them seem more desirable. Understanding these tactics helps us become more critical about the **demand** that advertising creates.",
    "vi": "**Quảng cáo** hiện đại sử dụng các chiến lược thông minh để **tác động** đến quyết định mua hàng và xây dựng **lòng trung thành** với **thương hiệu**. Các công ty **nhắm mục tiêu** các nhóm **người tiêu dùng** cụ thể qua các **chiến dịch** trực tuyến được cá nhân hóa. Màu sắc tươi sáng và câu chuyện cảm xúc **thuyết phục** mọi người **mua** những sản phẩm họ có thể không cần. Người nổi tiếng **tài trợ** cho sản phẩm để làm chúng trông hấp dẫn hơn. Hiểu những chiến thuật này giúp chúng ta trở nên phê phán hơn về **nhu cầu** mà quảng cáo tạo ra."
  },
  "scholar.crime-society": {
    "emojis": ["🚔", "⚖️", "🌱"],
    "en": "**Crime** affects every level of society, from individual **victims** to entire communities. **Violence** and **illegal** activity erode trust and create fear in neighbourhoods. When someone is **arrested**, the justice system must ensure a fair trial before any **punishment** or **sentence** is given. The **evidence** presented in court determines whether a person is found **guilty**. Beyond **fines** and imprisonment, effective **rehabilitation** programmes help offenders reintegrate and reduce the chance of reoffending.",
    "vi": "**Tội phạm** ảnh hưởng đến mọi tầng lớp xã hội, từ cá nhân **nạn nhân** đến toàn bộ cộng đồng. **Bạo lực** và hoạt động **bất hợp pháp** làm xói mòn niềm tin và tạo ra nỗi sợ hãi trong các khu phố. Khi ai đó bị **bắt giữ**, hệ thống tư pháp phải đảm bảo xét xử công bằng trước khi đưa ra bất kỳ **hình phạt** hay **bản án** nào. **Bằng chứng** được trình bày tại tòa xác định liệu một người có bị kết luận là **có tội** hay không. Ngoài **phạt tiền** và giam tù, các chương trình **cải tạo** hiệu quả giúp người vi phạm tái hòa nhập và giảm khả năng tái phạm."
  },
  "scholar.family-relationships": {
    "emojis": ["👨‍👩‍👧‍👦", "💞", "🏠"],
    "en": "Healthy **family relationships** are built on mutual respect, shared **values**, and a strong sense of **commitment**. As each **generation** faces new challenges around **gender** roles and **equality**, **traditions** must sometimes adapt to modern expectations. Setting clear **boundaries** supports **independence** while maintaining close **bonds**. **Parental** guidance shapes a child's developing **identity** and their sense of **responsibility** to others.",
    "vi": "Các **mối quan hệ gia đình** lành mạnh được xây dựng trên sự tôn trọng lẫn nhau, các **giá trị** chung và ý thức **cam kết** mạnh mẽ. Khi mỗi **thế hệ** đối mặt với những thách thức mới về vai trò **giới tính** và **bình đẳng**, **truyền thống** đôi khi phải thích nghi với kỳ vọng hiện đại. Đặt ra **ranh giới** rõ ràng hỗ trợ **sự độc lập** trong khi duy trì **mối gắn kết** chặt chẽ. Sự hướng dẫn của **cha mẹ** định hình **bản sắc** đang phát triển của trẻ và ý thức **trách nhiệm** của trẻ với người khác."
  },
  "scholar.tourism-hospitality": {
    "emojis": ["✈️", "🏨", "🌿"],
    "en": "**Tourism** has become one of the world's largest industries, connecting people across borders through shared experiences. Travellers increasingly seek **authentic** local culture rather than commercialised **resorts**. Understanding a destination's **heritage** and **customs** leads to more meaningful **cultural exchange**. Responsible **eco-tourism** reduces environmental damage while supporting local communities. A carefully planned **itinerary** and warm **hospitality** can leave a lasting **impression** on visitors from **diverse** backgrounds.",
    "vi": "**Du lịch** đã trở thành một trong những ngành lớn nhất thế giới, kết nối con người qua các biên giới qua những trải nghiệm chung. Du khách ngày càng tìm kiếm văn hóa địa phương **chân thực** hơn là các **khu nghỉ dưỡng** thương mại. Hiểu **di sản** và **phong tục** của **điểm đến** dẫn đến **trao đổi văn hóa** có ý nghĩa hơn. **Du lịch sinh thái** có trách nhiệm giảm thiệt hại môi trường trong khi hỗ trợ cộng đồng địa phương. Một **lịch trình** được lập kế hoạch cẩn thận và **lòng hiếu khách** nồng hậu có thể để lại **ấn tượng** lâu dài với du khách từ các nền tảng **đa dạng**."
  },
  "scholar.wellbeing-lifestyle": {
    "emojis": ["🧘", "💪", "🌿"],
    "en": "Maintaining good **wellbeing** requires a thoughtful approach to both physical and mental health. A daily **routine** that includes **active** exercise, healthy nutrition, and adequate rest builds long-term **fitness**. Practising **mindfulness** helps manage stress and keeps you **productive** throughout the day. Small **habits** such as good **posture**, regular **hydration**, and meaningful **self-care** support **recovery** from work and illness alike. A **sustainable** **lifestyle** is not about perfection but about finding lasting **balance**.",
    "vi": "Duy trì **sức khỏe toàn diện** tốt đòi hỏi cách tiếp cận chu đáo với cả sức khỏe thể chất và tinh thần. Một **thói quen hàng ngày** bao gồm tập thể dục **năng động**, dinh dưỡng lành mạnh và nghỉ ngơi đầy đủ xây dựng **thể lực** lâu dài. Thực hành **chánh niệm** giúp quản lý căng thẳng và giữ bạn **năng suất** suốt cả ngày. Các **thói quen** nhỏ như **tư thế** tốt, **bổ sung nước** thường xuyên và **tự chăm sóc bản thân** có ý nghĩa hỗ trợ **phục hồi** sau công việc và bệnh tật. Một **lối sống** **bền vững** không phải về sự hoàn hảo mà là tìm kiếm **cân bằng** lâu dài."
  },
  "scholar.arts-entertainment": {
    "emojis": ["🎭", "🎬", "🎵"],
    "en": "The world of **arts** and **entertainment** spans everything from literary **novels** to blockbuster **films** and live **theatre**. Each art form reaches its **audience** through a distinct medium, whether a **concert**, an **exhibition**, or a streaming platform. A strong **performance** often leads to critical **awards** that boost the artist's career. When a book becomes a **screenplay**, the **adaptation** must balance faithfulness to the source with the demands of a new **genre**. Great storytellers **inspire** audiences across cultures, regardless of the **cast** or setting.",
    "vi": "Thế giới **nghệ thuật** và **giải trí** trải dài từ các **tiểu thuyết** văn học đến **bộ phim** bom tấn và **nhà hát** trực tiếp. Mỗi loại hình nghệ thuật tiếp cận **khán giả** qua một phương tiện riêng biệt, dù là một **buổi hòa nhạc**, **triển lãm** hay nền tảng phát trực tuyến. Một **màn trình diễn** ấn tượng thường dẫn đến các **giải thưởng** của giới phê bình giúp thăng tiến sự nghiệp của nghệ sĩ. Khi một cuốn sách trở thành **kịch bản phim**, **chuyển thể** phải cân bằng sự trung thành với nguồn gốc và nhu cầu của **thể loại** mới. Những người kể chuyện xuất sắc **truyền cảm hứng** cho khán giả khắp các nền văn hóa, bất kể **dàn diễn viên** hay bối cảnh."
  },
  "scholar.ethical-issues": {
    "emojis": ["⚖️", "🔒", "💬"],
    "en": "Modern society faces complex **ethical** questions that are often **controversial** and difficult to resolve. Issues of **privacy**, **freedom**, and personal **responsibility** frequently come into tension with each other. Governments must **regulate** technology and corporations to **protect** citizens from harm, yet they face the **dilemma** of restricting individual rights. Every policy **consequence** must be weighed carefully against its **impact** on society. When people **justify** their decisions, they appeal to shared **moral** principles and the **obligation** to maintain **fairness** for all.",
    "vi": "Xã hội hiện đại đối mặt với những câu hỏi **đạo đức** phức tạp thường **gây tranh cãi** và khó giải quyết. Các vấn đề về **quyền riêng tư**, **tự do** và **trách nhiệm** cá nhân thường xuyên mâu thuẫn với nhau. Chính phủ phải **quản lý** công nghệ và doanh nghiệp để **bảo vệ** công dân khỏi bị tổn hại, nhưng họ phải đối mặt với **tình huống khó xử** khi hạn chế quyền cá nhân. Mỗi **hậu quả** chính sách phải được cân nhắc cẩn thận so với **tác động** của nó lên xã hội. Khi mọi người **biện minh** cho quyết định của mình, họ kêu gọi các nguyên tắc **đạo đức** chung và **nghĩa vụ** duy trì **sự công bằng** cho tất cả."
  }
}

data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'stories.json')
with open(data_path, encoding='utf-8') as f:
    stories = json.load(f)

# Copy transferred stories: scholar.X -> master.X
TRANSFER_IDS = [
    "academic-skills", "law-justice", "science-research", "innovation-startup",
    "language-communication", "philosophy-ethics", "education-system", "food-agriculture"
]
copied = 0
for tid in TRANSFER_IDS:
    old_key = f"scholar.{tid}"
    new_key = f"master.{tid}"
    if old_key in stories and new_key not in stories:
        stories[new_key] = stories[old_key]
        copied += 1
print(f"Copied {copied} stories from scholar -> master")

# Add 8 new Scholar B2 stories
added = 0
for key, story in NEW_SCHOLAR_STORIES.items():
    if key not in stories:
        stories[key] = story
        added += 1
print(f"Added {added} new Scholar stories")

with open(data_path, 'w', encoding='utf-8') as f:
    json.dump(stories, f, ensure_ascii=False, indent=2)

# Summary
levels = {}
for key in stories.keys():
    lvl = key.split('.')[0]
    levels[lvl] = levels.get(lvl, 0) + 1
for lvl, count in sorted(levels.items()):
    print(f"  {lvl}: {count} stories")
print(f"Total: {len(stories)} stories")
