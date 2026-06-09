import json, os

extra_words = {
  "academic-skills": {"word": "logical", "meaning": "có logic, hợp lý", "emoji": "🔗", "class": "adj",
    "examples": [{"en": "A logical argument is easy to follow and hard to refute.", "vi": "Một lập luận có logic dễ theo dõi và khó bác bỏ."},
                 {"en": "Logical thinking is essential in science and mathematics.", "vi": "Tư duy logic rất cần thiết trong khoa học và toán học."}]},
  "media-journalism": {"word": "impartial", "meaning": "khách quan, không thiên vị", "emoji": "⚖️", "class": "adj",
    "examples": [{"en": "A good journalist should be impartial and report all sides.", "vi": "Một nhà báo tốt nên khách quan và đưa tin tất cả các khía cạnh."},
                 {"en": "Viewers trust news sources that appear impartial.", "vi": "Khán giả tin tưởng các nguồn tin có vẻ khách quan."}]},
  "law-justice": {"word": "evidence", "meaning": "bằng chứng pháp lý", "emoji": "🔍", "class": "n",
    "examples": [{"en": "The prosecution must present clear evidence to secure a conviction.", "vi": "Bên công tố phải trình bày bằng chứng rõ ràng để có bản kết tội."},
                 {"en": "Digital evidence such as phone records can be crucial in court.", "vi": "Bằng chứng kỹ thuật số như hồ sơ điện thoại có thể rất quan trọng ở tòa."}]},
  "economics-trade": {"word": "interest rate", "meaning": "lãi suất", "emoji": "🏦", "class": "n",
    "examples": [{"en": "The central bank raised interest rates to slow inflation.", "vi": "Ngân hàng trung ương tăng lãi suất để làm chậm lạm phát."},
                 {"en": "Low interest rates encourage people to borrow and spend.", "vi": "Lãi suất thấp khuyến khích mọi người vay và chi tiêu."}]},
  "politics-society": {"word": "diplomat", "meaning": "nhà ngoại giao", "emoji": "🌐", "class": "n",
    "examples": [{"en": "The diplomat worked to improve relations between the two countries.", "vi": "Nhà ngoại giao làm việc để cải thiện quan hệ giữa hai nước."},
                 {"en": "Experienced diplomats can defuse tense international situations.", "vi": "Các nhà ngoại giao có kinh nghiệm có thể làm dịu các tình huống quốc tế căng thẳng."}]},
  "science-research": {"word": "peer-reviewed", "meaning": "được phản biện học thuật", "emoji": "✅", "class": "adj",
    "examples": [{"en": "Only peer-reviewed studies are considered reliable in academia.", "vi": "Chỉ các nghiên cứu được phản biện học thuật mới được coi là đáng tin cậy trong học thuật."},
                 {"en": "She submitted her work to a peer-reviewed journal.", "vi": "Cô nộp bài của mình cho một tạp chí được phản biện học thuật."}]},
  "technology-future": {"word": "machine learning", "meaning": "học máy", "emoji": "🤖", "class": "n",
    "examples": [{"en": "Machine learning enables computers to improve their performance through experience.", "vi": "Học máy cho phép máy tính cải thiện hiệu suất của chúng qua kinh nghiệm."},
                 {"en": "Recommendation systems use machine learning to predict user preferences.", "vi": "Hệ thống đề xuất sử dụng học máy để dự đoán sở thích người dùng."}]},
  "environment-policy": {"word": "carbon neutral", "meaning": "trung hòa carbon", "emoji": "🌿", "class": "adj",
    "examples": [{"en": "The company pledged to become carbon neutral by 2040.", "vi": "Công ty cam kết trở thành trung hòa carbon vào năm 2040."},
                 {"en": "Achieving carbon neutral status requires balancing emissions with offsets.", "vi": "Đạt được trạng thái trung hòa carbon đòi hỏi cân bằng khí thải với bù đắp."}]},
  "health-medicine": {"word": "nutrition", "meaning": "dinh dưỡng", "emoji": "🥗", "class": "n",
    "examples": [{"en": "Good nutrition is the foundation of a healthy lifestyle.", "vi": "Dinh dưỡng tốt là nền tảng của lối sống lành mạnh."},
                 {"en": "The doctor recommended changes in nutrition to manage the condition.", "vi": "Bác sĩ khuyến nghị thay đổi dinh dưỡng để kiểm soát tình trạng bệnh."}]},
  "art-culture": {"word": "perception", "meaning": "sự cảm thụ (nghệ thuật)", "emoji": "👁️", "class": "n",
    "examples": [{"en": "Art changes our perception of the world around us.", "vi": "Nghệ thuật thay đổi sự cảm thụ của chúng ta về thế giới xung quanh."},
                 {"en": "The artist wanted viewers to challenge their perception of beauty.", "vi": "Nghệ sĩ muốn khán giả thách thức sự cảm thụ của họ về vẻ đẹp."}]},
}

data_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'words.json')
with open(data_path) as f:
    data = json.load(f)

added = 0
for topic in data['scholar']['topics']:
    if topic['id'] in extra_words:
        topic['words'].append(extra_words[topic['id']])
        added += 1

with open(data_path, 'w') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

total = sum(len(t['words']) for t in data['scholar']['topics'])
print(f"Added {added} words. Scholar total: {len(data['scholar']['topics'])} topics, {total} words")
