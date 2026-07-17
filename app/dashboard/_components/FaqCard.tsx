'use client'

import { useState } from 'react'

// ── FAQ card ──────────────────────────────────────────────────────────────────
const FAQ_ITEMS = [
  {
    group: '📱 Cấu trúc & nội dung',
    items: [
      {
        q: 'App có mấy level và bao nhiêu từ vựng?',
        a: '6 levels từ Pre-A1 đến C1-C2 (tất cả đã hoàn thiện):\n🌱 Seeker (Pre-A1) · ⭐ Starter (A1) · 🏕️ Ranger (A2) · 🔭 Explorer (B1) · 🎓 Scholar (B2) · 🏆 Master (C1-C2)\n\nMỗi level: 30 chủ đề × 10–15 từ. Tổng toàn app: 2.400 từ vựng.',
      },
      {
        q: 'Một chủ đề gồm những gì?',
        a: 'Mỗi chủ đề có 10–15 từ vựng. Mỗi từ bao gồm:\n• Từ tiếng Anh + nghĩa tiếng Việt\n• Emoji minh họa\n• 2 câu ví dụ song ngữ (English + Việt)\n\nNgoài ra, mỗi chủ đề có 1 Mini Story — câu chuyện ngắn dùng các từ vừa học để giúp bé ghi nhớ trong ngữ cảnh thực tế.',
      },
    ],
  },
  {
    group: '🏆 Tiêu chí hoàn thành (Mastery)',
    items: [
      {
        q: 'Khi nào một chủ đề được tính là "xong"?',
        a: 'Bé phải hoàn thành đủ 2 điều kiện:\n① Xem hết Flashcard tất cả từ trong chủ đề\n② Đạt kết quả tốt trong ít nhất 3 trò chơi khác nhau\n\nChủ đề xong sẽ hiển thị 🏆 và được tính vào ✅ trên dashboard.',
      },
      {
        q: 'App có những trò chơi gì?',
        a: 'Level cơ bản (Seeker / Starter / Ranger) — 10 trò:\n📖 Flashcard từ mới · 👂 Nghe & Chọn · ✅ Đúng / Sai · 🖼️ Nối từ với hình · 🧠 Lật thẻ · 🫧 Bắn bong bóng · 🔡 Điền chữ thiếu · 🔤 Đánh vần · 🔁 Sắp xếp câu · 🎤 Phát âm cùng AI ✨\n\nLevel nâng cao (Explorer / Scholar / Master) — 10 trò:\n📖 Flashcard từ mới · 👂 Nghe & Chọn · ✅ Đúng / Sai · ❓ Trắc nghiệm · ✏️ Điền từ · 🔀 Ghép định nghĩa · 🎤 Phát âm cùng AI ✨ · ⌨️ Gõ từ nhanh 15s · 🔁 Sắp xếp câu · ⚡ Speed Round\n\nNgoài ra, mỗi chủ đề đều có 📖 Mini Story tích hợp ngay trong trang chủ đề — bé đọc chuyện, nghe audio, rồi làm bài điền từ ngay tại chỗ.',
      },
    ],
  },
  {
    group: '📊 Đọc hiểu Progress Card',
    items: [
      {
        q: 'Các ký hiệu trên thẻ tiến độ nghĩa là gì?',
        a: '📚 Daily X/30 chủ đề · X/N từ → Chủ đề hoàn thành đủ flashcard + 3 games / số từ bé đã học trong level đó\n🎓 Academic X/180 chủ đề · X/N từ → Tiến độ học thuật (3 books, A1–C2)\n🔤 Phonics X/58 bài → Số bài phát âm IPA bé đã học + thành thạo (xem chi tiết trên trang Phonics)\n🔥 Streak → Số ngày học liên tiếp không bỏ ngày nào (tính gộp toàn app)\n⚡ X/20 XP hôm nay → Mục tiêu XP mỗi ngày — đạt 20 XP là hoàn thành mục tiêu\n⚠️ Từ yếu → Từ bé trả lời sai nhiều lần, cần ôn thêm\n📅 Ngày → Lần gần nhất bé có hoạt động học\n🏅 Badges → Huy hiệu đạt được theo cột mốc học tập',
      },
      {
        q: '🔤 Module Phonics là gì?',
        a: 'Ngoài học từ vựng, bé còn có thể luyện phát âm tiếng Anh theo chuẩn IPA — module Phonics xuất hiện dưới dạng card 🔤 trên màn hình chọn level của bé.\n\nModule độc lập với các level từ vựng — bé học phát âm song song với học từ.\n\n9 nhóm, 58 bài:\n• Nguyên âm ngắn (7) · Nguyên âm đôi (5)\n• Cặp phụ âm (8) · Phụ âm khác (8)\n• Khó với người Việt (4) · Đọc từ thông minh (4)\n• Quy tắc phát âm (12)\n• Ngữ điệu (4) · Nói liên tục (6)\n\nMỗi bài thành thạo khi bé: học xem thẻ âm + hoàn thành các game bắt buộc, mỗi game đạt ≥70%.\nProgress tracking hiện trên dashboard: 🔤 X/58 bài',
      },
      {
        q: 'Các huy hiệu (badges) có ý nghĩa gì?',
        a: 'Hệ thống huy hiệu VocabWise gồm 2 loại:\n\n🌟 XP Rank — hiện trên màn hình chọn hồ sơ\nTích lũy XP toàn app để lên hạng:\n🌱 Beginner (50 XP) · 🌟 Rising (300 XP) · 🏆 Champion (1000 XP) · 👑 Master (3000 XP)\n\n🏅 Huy hiệu cột mốc — hiện trong màn hình level\n🌱 Mầm Non — học từ đầu tiên\n📚 Ham Học — học được 50 từ · 🎓 Học Giỏi — 100 từ · 🌟 Siêu Sao — 300 từ\n🏅 Chinh Phục — xong 1 chủ đề · 🏆 Xuất Sắc — 5 chủ đề · 🌈 Thiên Tài — 10 chủ đề\n🔥 Học Đều — streak 3 ngày · ⚡ Kiên Trì — 7 ngày · 💎 Bền Bỉ — 14 ngày · 👑 Sắt Đá — 30 ngày\n⭐ Chăm Chỉ — 100 XP · 💫 Giỏi Giang — 500 XP · 🚀 Huyền Thoại — 1000 XP',
      },
      {
        q: '⭐ XP là gì? Tính như thế nào?',
        a: 'XP (Experience Points) là điểm kinh nghiệm — chỉ số đo lượng kiến thức bé đã luyện tập.\n\nCách tính XP theo độ khó game:\n🟢 Game nhận biết (Nối từ, Lật thẻ, Đúng/Sai, Bắn bong bóng): 1 XP/câu đúng\n🟡 Game hiểu nghĩa (Trắc nghiệm, Điền từ, Nghe & Chọn, Sắp xếp câu, Câu chuyện, Phát âm AI, Ghép định nghĩa): 1,5 XP/câu đúng\n🔴 Game sản xuất (Đánh vần, Gõ từ nhanh, Điền chữ thiếu, Speed Round): 2 XP/câu đúng\n\nMục tiêu hàng ngày: 20 XP — hiển thị trên dashboard.\n\nXP tích lũy toàn app → XP Rank hiện trên màn hình chọn hồ sơ:\n🌱 Beginner (50+) → 🌟 Rising (300+) → 🏆 Champion (1000+) → 👑 Master (3000+)\n\nTrong màn hình level của từng bé, XP còn hiện cấp độ riêng của level đó:\n🌱 Khởi Đầu → 🔍 Nhà Thám Hiểm → ⚔️ Chiến Binh → 📜 Học Giả → 👑 Vô Địch',
      },
    ],
  },
  {
    group: '💡 Hướng dẫn học hiệu quả',
    items: [
      {
        q: 'Bé có thể tự học một mình không?',
        a: 'Với bé dưới 10 tuổi, ba/mẹ nên ngồi cùng — ít nhất trong những buổi đầu — để hướng dẫn cách dùng app, giải thích nghĩa từ, và động viên khi bé làm sai.\n\nKinh nghiệm thực tế: các bé còn nhỏ chưa có tính tự giác cao, dễ bỏ cuộc khi gặp từ khó hoặc thua game. Sự có mặt và cổ vũ của ba/mẹ tạo ra sự khác biệt rất lớn — giúp bé vui hơn, kiên trì hơn và học hiệu quả hơn.\n\nGợi ý: biến việc học thành "giờ học cùng nhau" — ba/mẹ cùng đọc từ, cùng chơi game, khen ngợi khi bé đúng. Khi bé đã quen (thường sau 1–2 tuần), bé sẽ tự tin dùng app một mình hơn.',
      },
      {
        q: 'Lịch học như thế nào là tốt nhất?',
        a: '15–20 phút/ngày đều đặn tốt hơn học dồn 1–2 tiếng/tuần.\n\nStreak 🔥 chính là chỉ số đo tính kiên trì — hãy giúp bé duy trì streak càng dài càng tốt. Chỉ cần học bất kỳ game nào trong ngày (Phonics, Daily hay Academic) là đủ để giữ streak — streak được tính gộp toàn app.\n\nMục tiêu XP hàng ngày: 20 XP. Bé đạt 20 XP trong ngày → ✅ hiển thị trên dashboard. Game khó (Đánh vần, Gõ từ) cho nhiều XP hơn game dễ!',
      },
      {
        q: 'Thứ tự học trong một chủ đề?',
        a: '① Flashcard từ mới — làm quen và ghi nhớ từ\n② Nghe & Chọn / Đúng & Sai / Nối từ với hình — luyện nhận diện\n③ Điền chữ thiếu / Đánh vần / Sắp xếp câu — củng cố chính tả và ngữ pháp\n④ 🎤 Phát âm cùng AI ✨ — luyện phát âm, bé nghe lại giọng của chính mình\n⑤ Mini Story 📖 — đọc câu chuyện tích hợp sẵn trong trang topic, rồi làm bài điền từ ngay bên dưới\n\nKhông cần làm tất cả trong 1 buổi. Mỗi game hoàn thành tốt tính là 1 "sao" cho chủ đề đó.',
      },
      {
        q: 'Khi nào chuyển sang level tiếp theo?',
        a: 'Khi bé hoàn thành >70% chủ đề của level hiện tại và cảm thấy tự tin với các từ đã học.\n\nBé vẫn có thể quay lại level cũ bất cứ lúc nào — màn hình chọn level hiển thị % tiến độ từng level để bé và phụ huynh theo dõi.',
      },
    ],
  },
  {
    group: '⭐ Sau khi mua Pro — cần làm gì?',
    items: [
      {
        q: 'Vừa mua Pro xong, tôi cần làm những gì?',
        a: 'Sau khi thanh toán và được kích hoạt Pro, bạn nên làm 3 việc ngay:\n\n① Đổi mật khẩu (bắt buộc)\nMật khẩu ban đầu do admin đặt. Vào Dashboard → Settings → "🔑 Đổi mật khẩu" để đổi sang mật khẩu riêng của gia đình.\n\n② Tạo hồ sơ cho bé\nVào Dashboard → "➕ Thêm hồ sơ bé". Tạo hồ sơ riêng cho từng bé với tên và emoji. Bé có thể tự chọn level phù hợp khi bắt đầu học. Gói Pro mặc định tối đa 3 bé.\n\n③ Cài app lên màn hình chính\nMở như app thật, tự cập nhật, không cần App Store!\n🍎 iPhone/iPad: Bấm nút Share ⬆ (thanh dưới Safari) → chọn "Thêm vào Màn hình chính" → bấm Thêm.\n🤖 Android: Bấm menu ⋮ (góc trên phải Chrome) → chọn "Thêm vào Màn hình chính" → bấm Thêm.',
      },
      {
        q: 'Làm sao đổi mật khẩu?',
        a: 'Dashboard → tab ⚙️ Cài đặt → mục "🔑 Đổi mật khẩu"\n\n① Nhập mật khẩu hiện tại (mật khẩu admin đã cấp)\n② Nhập mật khẩu mới (tối thiểu 6 ký tự)\n③ Xác nhận mật khẩu mới → bấm "Đổi mật khẩu"\n\nSau khi đổi thành công, lần đăng nhập tiếp theo dùng mật khẩu mới. Lưu ý: nếu quên mật khẩu mới, liên hệ admin để reset.',
      },
      {
        q: 'Tôi quên mật khẩu thì làm sao?',
        a: 'Vào trang đăng nhập → bấm "Quên mật khẩu?" → nhập email đăng ký → bấm Gửi.\n\nHệ thống sẽ gửi link đặt lại mật khẩu vào email của bạn (hiệu lực 1 giờ). Bấm vào link → nhập mật khẩu mới → đăng nhập lại bình thường.\n\nLưu ý: kiểm tra hòm thư rác nếu không thấy email. Nếu vẫn không nhận được, liên hệ admin qua Zalo 0977 347 707.',
      },
      {
        q: 'Gói Pro tạo được mấy hồ sơ bé? Dùng được trên mấy thiết bị?',
        a: '👶 Hồ sơ bé theo gói:\n• Pro 1 tháng: tối đa 2 hồ sơ bé\n• Pro 3 tháng và 6 tháng: tối đa 3 hồ sơ bé\nMỗi bé có tiến độ, streak, huy hiệu và lịch sử học riêng biệt.\n\n📱 Thiết bị: không giới hạn. Cả gia đình dùng chung 1 tài khoản — Ba/Mẹ xem dashboard trên điện thoại, bé học trên máy tính bảng — dữ liệu đồng bộ tự động.\n\n⚠️ Tài khoản chỉ dành cho 1 gia đình. Chia sẻ cho gia đình khác vi phạm điều khoản và có thể bị khóa tài khoản.',
      },
      {
        q: 'Gói Pro hết hạn thì dữ liệu có mất không? Gia hạn như thế nào?',
        a: '💾 Dữ liệu: tiến độ, streak, huy hiệu của bé được lưu trên server và KHÔNG bị xóa khi hết hạn. Sau khi gia hạn, bé tiếp tục từ chỗ đã học — không mất gì.\n\n🔄 Gia hạn: liên hệ admin qua Zalo 0977 347 707 trước khi hết hạn để được hỗ trợ gia hạn. Thanh toán chuyển khoản → admin kích hoạt trong vòng 24 giờ.\n\nApp sẽ hiển thị cảnh báo ⏰ khi còn 3 ngày là hết hạn để nhắc bạn gia hạn kịp thời.',
      },
    ],
  },
  {
    group: '🔧 Tính năng & cài đặt',
    items: [
      {
        q: 'PIN bảo vệ và Reset dùng khi nào?',
        a: '🔒 PIN (Cài đặt → PIN cho bé): đặt mã 4 số nếu nhiều bé dùng chung thiết bị — bé phải nhập đúng PIN mới vào học được, tránh nhầm lẫn hồ sơ.\n\n🔄 Reset (Cài đặt → Reset tiến độ): dùng khi bé muốn bắt đầu lại từ đầu hoàn toàn. ⚠️ Toàn bộ tiến độ, streak và huy hiệu sẽ bị xóa vĩnh viễn.',
      },
      {
        q: 'Báo cáo email tự động hoạt động như thế nào?',
        a: 'Vào Cài đặt → "📬 Báo cáo qua email" để thiết lập:\n\n• Gói Pro 1 tháng: gửi thủ công (bấm "Gửi ngay" bất kỳ lúc nào)\n• Gói Pro 3 tháng và 6 tháng: ngoài gửi thủ công, có thể bật tự động hàng tuần vào một ngày cố định trong tuần\n\nBáo cáo gồm: số từ đã học, topics hoàn thành, streak hiện tại, từ yếu cần ôn và huy hiệu của bé.\n\nLưu ý: cần có email đăng ký tài khoản để nhận báo cáo.',
      },
      {
        q: 'Email tổng kết hàng tháng là gì? (Pro 6 tháng)',
        a: 'Tính năng độc quyền dành cho gói Pro 6 tháng.\n\nVào ngày 1 mỗi tháng, hệ thống tự động gửi email tổng kết tháng vừa rồi cho từng bé, bao gồm:\n• Số ngày học / tổng số ngày trong tháng\n• Tổng từ học được, lượt game, XP tháng này\n• So sánh với tháng trước (↑ tăng / ↓ giảm)\n• Streak hiện tại, topics hoàn thành và badges\n\nĐể bật: Cài đặt → "📬 Báo cáo qua email" → bật toggle "Tổng kết hàng tháng".',
      },
      {
        q: 'Gift code "Tặng bạn bè" dùng như thế nào? (Pro 6 tháng)',
        a: 'Tính năng độc quyền dành cho gói Pro 6 tháng.\n\nKhi kích hoạt gói 6 tháng, hệ thống tự động tạo cho bạn 1 mã quà tặng 8 ký tự (ví dụ: ABCD1234). Bạn tìm thấy mã này trong Cài đặt → card "🎁 Tặng bạn bè".\n\nCách dùng:\n① Copy link hoặc mã chia sẻ cho bạn bè\n② Bạn bè đăng ký VocabWise và nhập mã vào ô "Nhận mã từ bạn bè"\n③ Bạn bè nhận ngay 14 ngày Pro miễn phí\n\nLưu ý: mã chỉ dùng được 1 lần và sau khi dùng sẽ không thể khôi phục.',
      },
    ],
  },
  {
    group: '⭐ So sánh các gói Pro',
    items: [
      {
        q: 'Pro 1 tháng, 3 tháng và 6 tháng khác nhau thế nào?',
        a: 'Tất cả gói Pro đều có đầy đủ:\n✅ 📚 Daily: 180 chủ đề · 2.400+ từ vựng (6 levels)\n✅ 🎓 Academic: 3 books · 180 chủ đề học thuật (A1–C2)\n✅ 10 trò chơi/chủ đề · Mini Story audio\n✅ Module phát âm IPA đầy đủ\n✅ ⭐ Từ của tôi không giới hạn (Free chỉ lưu 20 từ)\n✅ SRS ôn tập từ yếu không giới hạn · Push notification nhắc học\n✅ Dashboard phụ huynh · Không giới hạn thiết bị\n\nĐiểm khác biệt:\n• Pro 1 tháng (59k): 2 hồ sơ bé · AI phát âm 30 lần/ngày · Báo cáo email thủ công\n• Pro 3 tháng (53k/th): 3 hồ sơ bé · AI không giới hạn · Module Word Stress · Báo cáo tự động hàng tuần\n• Pro 6 tháng (50k/th): Tất cả như 3 tháng + 🎁 Tặng bạn bè 14 ngày Pro + 📅 Email tổng kết học hàng tháng',
      },
      {
        q: 'Module Word Stress là gì? (Pro 3 tháng trở lên)',
        a: 'Module Word Stress giúp bé luyện nhấn âm — kỹ năng quan trọng để phát âm tiếng Anh tự nhiên và dễ hiểu.\n\nTrong tiếng Anh, từ nhiều âm tiết luôn có 1 âm được nhấn mạnh hơn (ví dụ: PREsent vs preSENT). Đọc sai trọng âm khiến người bản ngữ khó hiểu, dù phát âm từng âm đúng.\n\nModule này đi kèm với module Phonics, truy cập qua màn hình học Phonics của bé.',
      },
    ],
  },
]

export function FaqCard() {
  const [open, setOpen] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(true)

  function toggle(key: string) {
    setOpen(o => o === key ? null : key)
  }

  return (
    <div className="bg-white rounded-3xl border-2 border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
        <div className="text-left">
          <h2 className="font-black text-gray-800 text-base">❓ Câu hỏi thường gặp</h2>
          {collapsed && <p className="text-xs text-gray-400 font-semibold mt-0.5">Hướng dẫn sử dụng app hiệu quả</p>}
        </div>
        <span className={`text-gray-400 font-black text-sm flex-shrink-0 transition-transform duration-200 ${collapsed ? '' : 'rotate-180'}`}>▾</span>
      </button>

      {!collapsed && <div className="border-t border-gray-100 divide-y divide-gray-50">
        {FAQ_ITEMS.map(group => (
          <div key={group.group}>
            {/* Group header */}
            <div className="px-5 py-2 bg-gray-50">
              <p className="text-xs font-black text-gray-500 uppercase tracking-wider">{group.group}</p>
            </div>

            {group.items.map((item, i) => {
              const key = `${group.group}-${i}`
              const isOpen = open === key
              return (
                <div key={key} className="border-t border-gray-100 first:border-t-0">
                  <button
                    onClick={() => toggle(key)}
                    className="w-full text-left px-5 py-3.5 flex items-start justify-between gap-3 hover:bg-gray-50 transition-colors">
                    <p className="text-sm font-bold text-gray-700 leading-snug">{item.q}</p>
                    <span className={`text-gray-400 font-black text-sm flex-shrink-0 mt-0.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                      ▾
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4">
                      <div className="bg-gray-50 rounded-2xl p-3.5">
                        {item.a.split('\n').map((line, j) => (
                          <p key={j} className={`text-xs text-gray-600 leading-relaxed ${j > 0 && line === '' ? 'mt-2' : j > 0 ? 'mt-1' : ''}`}>
                            {line || <span className="block h-1" />}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>}
    </div>
  )
}
