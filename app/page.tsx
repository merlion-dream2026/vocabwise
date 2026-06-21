'use client'
import Link from 'next/link'
import { useState } from 'react'
import UpgradeModal from '@/components/UpgradeModal'

const SECTIONS = [
  {
    emoji: '🎤',
    title: 'Phonics',
    badge: 'Mọi lứa tuổi',
    badgeCls: 'bg-green-100 text-green-700',
    desc: 'IPA chuẩn Cambridge · minimal pairs · AI chấm phát âm',
    available: true,
    cardCls: 'border-green-200 bg-green-50/50',
    accentCls: 'text-green-600',
  },
  {
    emoji: '📚',
    title: 'VocabWise Daily',
    badge: '5–15 tuổi',
    badgeCls: 'bg-purple-100 text-purple-700',
    desc: '4.500+ từ · 6 cấp độ CEFR · 10 trò chơi tương tác',
    available: true,
    cardCls: 'border-purple-200 bg-purple-50/50',
    accentCls: 'text-purple-600',
  },
  {
    emoji: '🎓',
    title: 'VocabWise Academic',
    badge: 'Teen & Người lớn · A1→C2',
    badgeCls: 'bg-blue-100 text-blue-700',
    desc: '3 books · 180 chủ đề · Passage · 8 dạng bài tập · IELTS/SAT',
    available: true,
    cardCls: 'border-blue-200 bg-blue-50/50',
    accentCls: 'text-blue-600',
  },
]

const MODULE_CARDS = [
  {
    emoji: '🎤',
    title: 'Phonics',
    subtitle: 'Phát âm chuẩn IPA',
    badge: 'Mọi lứa tuổi',
    gradient: 'from-green-500 to-emerald-600',
    bgLight: 'from-green-50 to-emerald-50',
    border: 'border-green-200',
    accent: 'text-green-700',
    features: [
      { icon: '📐', text: 'IPA chuẩn Cambridge — nguyên âm, phụ âm, minimal pairs' },
      { icon: '🔊', text: 'Nghe phát âm chuẩn từ native speaker' },
      { icon: '🤖', text: 'AI chấm phát âm ngay lập tức — biết sai biết đúng' },
      { icon: '🎮', text: '3 game/nhóm âm: Phân biệt · Chọn hình · Luyện đọc' },
    ],
  },
  {
    emoji: '📚',
    title: 'VocabWise Daily',
    subtitle: 'Từ vựng hàng ngày: cơ bản đến nâng cao',
    badge: '5–15 tuổi',
    gradient: 'from-purple-500 to-pink-500',
    bgLight: 'from-purple-50 to-pink-50',
    border: 'border-purple-200',
    accent: 'text-purple-700',
    features: [
      { icon: '🌱', text: '6 cấp độ CEFR: Pre-A1 → C1-C2 (Seeker → Master)' },
      { icon: '📖', text: '4.500+ từ vựng chọn lọc, 30 chủ đề/cấp độ' },
      { icon: '🎮', text: '10 trò chơi tương tác: Flashcard · Nghe · Đánh vần...' },
      { icon: '🎵', text: 'Mini story audio — nghe chuyện có chứa từ vựng' },
      { icon: '⭐', text: 'Từ của tôi — lưu từ yêu thích, tự tạo bộ ôn tập (Free: 20 từ)' },
    ],
  },
  {
    emoji: '🎓',
    title: 'VocabWise Academic',
    subtitle: 'Từ vựng học thuật IELTS/SAT',
    badge: 'Teen & Người lớn',
    gradient: 'from-indigo-500 to-blue-600',
    bgLight: 'from-indigo-50 to-blue-50',
    border: 'border-indigo-200',
    accent: 'text-indigo-700',
    features: [
      { icon: '📚', text: '3 books · 180 chủ đề học thuật · A1 → C2' },
      { icon: '📄', text: 'Passage ngữ cảnh + glossary song ngữ Việt–Anh' },
      { icon: '✏️', text: '8 loại bài tập: MCQ · Gap Fill · TFNG · Word Forms...' },
      { icon: '⭐', text: 'Từ của tôi — lưu từ quan trọng, tạo danh sách IELTS/SAT (Free: 20 từ)' },
      { icon: '🎯', text: 'Kiểm tra cấp độ tự động — tìm đúng level chỉ 2 phút' },
    ],
  },
  {
    emoji: '📊',
    title: 'Dashboard Phụ Huynh',
    subtitle: 'Quản lý & theo dõi tiến độ',
    badge: 'Cho ba mẹ',
    gradient: 'from-amber-500 to-orange-500',
    bgLight: 'from-amber-50 to-orange-50',
    border: 'border-amber-200',
    accent: 'text-amber-700',
    features: [
      { icon: '👧', text: 'Tạo 1–3 hồ sơ bé — mỗi bé tiến độ & streak riêng' },
      { icon: '🔥', text: 'Theo dõi streak, XP, cấp độ từng bé mỗi ngày' },
      { icon: '🏆', text: 'Huy hiệu thành tích — bé phấn đấu, ba mẹ tự hào' },
      { icon: '📋', text: 'Danh sách từ yếu cần ôn — app tự nhắc đúng lúc' },
    ],
  },
]

const FAQ_ITEMS = [
  {
    q: 'VocabWise có những gì?',
    a: 'VocabWise là nền tảng học tiếng Anh toàn diện với 3 module:\n\n📚 VocabWise Daily — 4.500+ từ vựng, 6 cấp độ CEFR (Pre-A1 đến C1), 10+ trò chơi tương tác — dành riêng cho trẻ em 5–15 tuổi.\n\n🎤 Phonics — học IPA chuẩn Cambridge qua nguyên âm, phụ âm, minimal pairs — phù hợp mọi lứa tuổi.\n\n🎓 VocabWise Academic — từ vựng học thuật cho IELTS/SAT với 3 books · 180 chủ đề · passage, glossary và 8 dạng bài tập theo chuẩn CEFR A1–C2.',
  },
  {
    q: 'Module Phonics là gì?',
    a: 'Module Phonics là tính năng độc lập giúp bé học phát âm tiếng Anh đúng chuẩn theo ký hiệu IPA.\n\nBé sẽ học qua 3 nhóm âm:\n• Nguyên âm (dài & ngắn): /iː/ vs /ɪ/, /æ/ vs /e/...\n• Phụ âm (cặp hữu thanh/vô thanh): /p/ vs /b/, /θ/ vs /ð/...\n• Khó với người Việt: /l/ vs /r/, âm cuối, cụm phụ âm\n\nMỗi nhóm âm có 3 game: Nghe & Phân biệt · Nghe & Chọn · Luyện đọc (AI chấm điểm).\nBé nghe phát âm mẫu từ native speaker rồi tự đọc theo — AI cho biết đúng hay sai ngay lập tức!',
  },
  {
    q: 'Bé có thể tự học một mình không?',
    a: 'VocabWise được thiết kế để dùng cùng ba/mẹ — đặc biệt với bé dưới 10 tuổi. Kinh nghiệm thực tế: các bé còn nhỏ chưa tự giác, cần người lớn ngồi cạnh hướng dẫn, giải thích từ khó và động viên khi học. Sự có mặt và cổ vũ của ba/mẹ tạo ra sự khác biệt rất lớn. Sau vài tuần quen dùng, bé sẽ tự tin học độc lập hơn.',
  },
  {
    q: 'App VocabWise có cần cài xuống không?',
    a: 'Không! VocabWise là PWA — bé chỉ cần vào trình duyệt là học ngay.\n\n🍎 iPhone/iPad (Safari): Bấm nút Share ⬆ ở thanh dưới → chọn "Thêm vào Màn hình chính" → bấm Thêm.\n\n🤖 Android (Chrome): Bấm menu ⋮ góc trên phải → chọn "Thêm vào Màn hình chính" → bấm Thêm.\n\nSau đó mở app từ icon vừa tạo — dùng như app thật, tự cập nhật, không cần App Store!',
  },
  {
    q: 'VocabWise phù hợp với lứa tuổi nào?',
    a: 'VocabWise phục vụ 3 nhóm người học:\n\n📚 VocabWise Daily: dành cho bé 5–15 tuổi. Level Seeker (Pre-A1) cho bé mới bắt đầu, đến Master (C1-C2) cho bé nâng cao.\n\n🎤 Phonics: phù hợp mọi lứa tuổi — từ bé học phát âm cơ bản đến người lớn muốn hoàn thiện IPA.\n\n🎓 VocabWise Academic: dành cho học sinh cấp 2, cấp 3, sinh viên và người đi làm luyện từ vựng học thuật IELTS/SAT — 3 books · 180 chủ đề · A1–C2.',
  },
  {
    q: 'Một tài khoản dùng được cho mấy bé?',
    a: 'Gói Free: 1 bé. Pro 1 tháng: 2 bé. Pro 3 tháng và 6 tháng: 3 bé — mỗi bé có hồ sơ, tiến độ, streak và huy hiệu riêng biệt, đồng bộ mọi thiết bị.',
  },
  {
    q: 'Streak 🔥 là gì? Tại sao quan trọng?',
    a: 'Streak là số ngày học liên tiếp không bỏ ngày nào — chỉ số đo tính kiên trì của bé.\n\nVí dụ: bé học đều 10 ngày liền → Streak = 🔥 10. Nếu bỏ 1 ngày → streak về 0 và phải bắt đầu lại từ đầu.\n\nTại sao quan trọng? Nghiên cứu cho thấy học đều đặn mỗi ngày 15–20 phút hiệu quả hơn nhiều so với học dồn 2–3 tiếng cuối tuần. Streak giúp tạo thói quen học tập tự nhiên và bền vững cho bé — ba/mẹ chỉ cần nhắc bé "giữ streak" mỗi tối là đủ!\n\nApp hiển thị: 🔥 học hôm nay · ⚡ chưa học hôm nay (streak sắp mất) · 💤 đã mất streak.',
  },
  {
    q: 'Dùng thử miễn phí được không?',
    a: 'Có! Đăng ký miễn phí — không cần thẻ tín dụng. Gói Free cho học 1 chủ đề đầu tiên mỗi level (6 chủ đề), toàn bộ 10 trò chơi, module phát âm IPA đầy đủ, dashboard phụ huynh trong 7 ngày — và tính năng ⭐ Từ của tôi (lưu tối đa 20 từ).\n\nSau 7 ngày, nâng cấp Pro để mở toàn bộ 180 chủ đề · 4.500+ từ · AI phát âm không giới hạn · Từ của tôi không giới hạn và nhiều tính năng độc quyền hơn.',
  },
  {
    q: '⭐ Tính năng "Từ của tôi" là gì?',
    a: '"Từ của tôi" là tính năng lưu từ vựng cá nhân — có sẵn cho mọi người dùng kể cả Free!\n\nCách dùng:\n• Nhấn ⭐ cạnh bất kỳ từ nào trong Academic (tab Từ vựng) hoặc Daily (Flashcard) để lưu lại\n• Tự tạo nhiều danh sách riêng: IELTS Writing, SAT Vocab, Ôn thi tuần này...\n• Xem lại và ôn tập nhanh tất cả từ đã lưu tại mục ⭐ Từ của tôi\n\nGiới hạn:\n• Free: lưu tối đa 20 từ\n• Pro (mọi gói): lưu không giới hạn, tạo không giới hạn danh sách',
  },
  {
    q: 'Các gói Pro 1 tháng, 3 tháng và 6 tháng khác nhau thế nào?',
    a: 'Tất cả gói Pro đều có: 180 chủ đề · 4.500+ từ · 10 trò chơi/chủ đề · Phonics IPA đầy đủ · ⭐ Từ của tôi không giới hạn · SRS ôn từ yếu không giới hạn · Push notification nhắc học.\n\nSự khác biệt:\n• Pro 1 tháng (59k): 2 hồ sơ bé · AI Speak 30 lần/ngày\n• Pro 3 tháng (53k/th): 3 hồ sơ bé · AI Speak không giới hạn · Module Word Stress · Báo cáo email tự động hàng tuần\n• Pro 6 tháng (50k/th): Tất cả như 3 tháng + 🎁 Tặng bạn bè 14 ngày Pro + 📅 Email tổng kết học tập hàng tháng',
  },
]

const FEATURES = [
  { emoji: '📖', label: '4.500+ từ vựng', desc: 'Chọn lọc theo khung CEFR — Kids & Academic', color: 'border-blue-200' },
  { emoji: '🌱', label: '6 cấp độ CEFR', desc: 'Pre-A1 → C1-C2 (Seeker → Master)', color: 'border-green-200' },
  { emoji: '🎮', label: '10+ trò chơi', desc: 'Flashcard, nghe, đánh vần, đọc to...', color: 'border-orange-200' },
  { emoji: '🎤', label: 'Phát âm cùng AI ✨', desc: 'Bé phát âm, AI chấm điểm ngay lập tức', color: 'border-pink-200' },
  { emoji: '🔤', label: 'Phonics IPA', desc: 'Nguyên âm, phụ âm, minimal pairs chuẩn Cambridge', color: 'border-teal-200' },
  { emoji: '⭐', label: 'Từ của tôi 🆕', desc: 'Lưu từ yêu thích, tạo danh sách ôn riêng', color: 'border-yellow-300' },
  { emoji: '📅', label: 'Ôn tập SRS', desc: 'App tự lên lịch nhắc từ chưa thuộc đúng lúc', color: 'border-indigo-200' },
  { emoji: '🔥', label: 'Streak & Huy hiệu', desc: 'Học đều mỗi ngày, tích XP, mở huy hiệu thành tích', color: 'border-red-200' },
  { emoji: '📊', label: 'Dashboard phụ huynh', desc: 'Theo dõi streak, XP, tiến độ từng bé', color: 'border-amber-200' },
  { emoji: '📲', label: 'Không cài app', desc: 'Dùng như app thật — không cần App Store, tự cập nhật', color: 'border-sky-200' },
]

const SCREENSHOTS = [
  { src: '/screenshots/select%20profile.jpg',              caption: 'Mỗi bé một hồ sơ riêng' },
  { src: '/screenshots/select%20level.jpg',                caption: '6 cấp độ từ Pre-A1 đến C1-C2' },
  { src: '/screenshots/select%20vocab%20topic.jpg',        caption: '30 chủ đề · 4.500+ từ vựng' },
  { src: '/screenshots/select%20game.jpg',                 caption: '10 trò chơi đa dạng mỗi chủ đề' },
  { src: '/screenshots/demo%20flashcard.jpg',              caption: 'Flashcard — học từ trong ngữ cảnh' },
  { src: '/screenshots/demo%20game%20ghep%20chu.jpg',      caption: 'Ghép chữ — luyện chính tả vui' },
  { src: '/screenshots/demo%20game%20phat%20am%20cung%20AI.jpg', caption: '🎤 AI chấm phát âm ngay lập tức' },
  { src: '/screenshots/demo%20game%20sap%20xep%20cau.jpg', caption: 'Sắp xếp câu — hiểu ngữ pháp tự nhiên' },
  { src: '/screenshots/luyen%20phat%20am.jpg',             caption: 'Phát âm IPA — nguyên âm & phụ âm' },
  { src: '/screenshots/parent%20dashboard%201.jpg',        caption: 'Ba/Mẹ theo dõi tiến độ mỗi ngày' },
  { src: '/screenshots/parent%20dashboard%202.jpg',        caption: 'Streak · Badges · Từ yếu cần ôn' },
]

const VIDEOS = [
  {
    src: '/videos/demo%20game%20nghe%20va%20chon%20hinh%20(Mia).mp4',
    poster: '/screenshots/select%20game.jpg',
    title: 'Bé Mia chơi Nghe & Chọn hình',
    tag: '🖼️ Nhận diện từ qua hình ảnh',
  },
  {
    src: '/videos/demo%20game%20phat%20am%20cung%20AI%20(Tim).mp4',
    poster: '/screenshots/demo%20game%20phat%20am%20cung%20AI.jpg',
    title: 'Bé Tim luyện Phát âm cùng AI ✨',
    tag: '🎤 AI chấm phát âm ngay',
  },
  {
    src: '/videos/demo%20mastery%20screen%20(Tim).mp4',
    poster: '/screenshots/select%20level.jpg',
    title: 'Bé Tim hoàn thành chủ đề',
    tag: '🏆 Chiến thắng sau 3 game',
  },
]

const STEPS = [
  { n: '1', emoji: '🆕', title: 'Đăng ký miễn phí trong 1 phút', desc: 'Tạo tài khoản và hồ sơ cho bé — không cần thẻ tín dụng' },
  { n: '2', emoji: '📖', title: 'Con bắt đầu học thử ngay', desc: 'Flashcard, game, mini story — vui và dễ theo từng chủ đề' },
  { n: '3', emoji: '📊', title: 'Ba/Mẹ theo dõi tiến độ', desc: 'Xem streak, từ yếu, huy hiệu của con ngay trên dashboard' },
  { n: '4', emoji: '⭐', title: 'Nâng cấp Pro khi sẵn sàng', desc: 'Mở khoá toàn bộ 30 chủ đề/level — chỉ từ 1.600đ/ngày' },
]

export default function LandingPage() {
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [activeVideo, setActiveVideo] = useState<string | null>(null)
  const [activeScreenshot, setActiveScreenshot] = useState<{ src: string; caption: string } | null>(null)

  return (
    <div className="min-h-screen bg-white">

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-black text-xl text-gray-800">📚 VocabWise</span>
          <Link href="/login"
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black text-sm px-5 py-2.5 rounded-2xl shadow hover:shadow-md transition-all">
            🔐 Đăng nhập
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      <div className="max-w-7xl mx-auto px-4 lg:px-12 pt-4 pb-4 text-center">
        <p className="text-purple-500 font-black text-sm mb-3 tracking-widest uppercase">Nền tảng học tiếng Anh toàn diện</p>
        <h1 className="text-3xl lg:text-6xl font-black text-gray-800 leading-tight mb-4 max-w-4xl mx-auto">
          Học tiếng Anh{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">vui, có hệ thống, đúng chuẩn</span>
        </h1>
        <p className="text-gray-500 text-sm lg:text-lg leading-relaxed mb-7 max-w-xl mx-auto">
          3 module học tập — phát âm IPA chuẩn, từ vựng CEFR cho trẻ em, và học thuật cho Teen &amp; người lớn.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-row gap-3 justify-center mb-4">
          <Link href="/register"
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black text-sm lg:text-base px-6 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 whitespace-nowrap">
            🚀 Dùng thử miễn phí
          </Link>
          <button onClick={() => setShowUpgrade(true)}
            className="bg-white text-gray-500 font-black text-sm lg:text-base px-6 py-3 rounded-2xl shadow border-2 border-gray-200 hover:border-gray-300 transition-all active:scale-95 whitespace-nowrap">
            ⭐ Xem gói Pro
          </button>
        </div>

      </div>
      </section>

      {/* Module feature carousel */}
      <section className="bg-white py-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-xl font-black text-gray-800 text-center mb-1 px-4">Khám phá từng module học</h2>
        <p className="text-gray-400 text-sm text-center mb-4 px-4">Vuốt để xem tất cả tính năng nổi bật</p>
        <div
          className="flex gap-4 overflow-x-auto pb-3 px-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        >
          {MODULE_CARDS.map(card => (
            <div
              key={card.title}
              className={`flex-none snap-center w-[280px] bg-gradient-to-br ${card.bgLight} rounded-2xl border-2 ${card.border} p-4 flex flex-col`}
            >
              <div className={`inline-flex items-center gap-1.5 bg-gradient-to-r ${card.gradient} text-white text-xs font-black px-2.5 py-1 rounded-full self-start mb-3`}>
                <span>{card.emoji}</span>
                <span>{card.badge}</span>
              </div>
              <p className={`font-black text-base ${card.accent} leading-tight mb-0.5`}>{card.title}</p>
              <p className="text-gray-500 text-xs mb-3">{card.subtitle}</p>
              <ul className="space-y-2 flex-1">
                {card.features.map(f => (
                  <li key={f.text} className="flex items-start gap-2">
                    <span className="text-base flex-shrink-0 leading-none mt-0.5">{f.icon}</span>
                    <span className="text-gray-600 text-xs leading-snug">{f.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-300 mt-1 px-4">← Vuốt để xem tất cả 4 module →</p>
      </div>
      </section>

      {/* Video demos */}
      <div className="max-w-7xl mx-auto pb-4">
        <h2 className="text-xl font-black text-gray-800 text-center mb-1 px-4">Xem app hoạt động thực tế</h2>
        <p className="text-gray-400 text-sm text-center mb-5 px-4">Video thật · Các bé đang học</p>
        {/* Mobile: scroll · Desktop: 3-col grid */}
        <div className="flex gap-3 overflow-x-auto pb-3 px-4 snap-x snap-mandatory lg:overflow-visible lg:grid lg:grid-cols-3 lg:pb-0 lg:gap-6" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
          {VIDEOS.map((v, i) => (
            <button key={i} onClick={() => setActiveVideo(v.src)}
              className="flex-none snap-center w-[150px] lg:w-auto text-left group active:scale-95 transition-transform">
              <div className="relative rounded-[20px] border-[3px] border-gray-800 bg-gray-900 overflow-hidden shadow-xl h-[268px] lg:h-auto lg:aspect-[9/16]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={v.poster} alt={v.title} className="w-full h-full object-cover object-top" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 lg:w-20 lg:h-20 bg-white/90 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 group-active:scale-90 transition-transform">
                    <span className="text-2xl lg:text-3xl ml-1">▶</span>
                  </div>
                </div>
                <div className="absolute bottom-2 left-2 right-2 lg:bottom-4 lg:left-4">
                  <span className="text-xs lg:text-sm font-black text-white/90 bg-black/40 px-2 py-0.5 rounded-full">{v.tag}</span>
                </div>
              </div>
              <p className="text-xs lg:text-sm font-black text-gray-700 mt-2 leading-snug px-0.5">{v.title}</p>
            </button>
          ))}
        </div>
        <p className="text-center text-xs text-gray-300 mt-1 px-4 lg:hidden">← Vuốt để xem thêm</p>
      </div>

      {/* Video modal */}
      {activeVideo && (
        <div className="fixed inset-0 bg-black/92 z-50 flex items-center justify-center px-4" onClick={() => setActiveVideo(null)}>
          <div className="relative w-full max-w-[320px]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setActiveVideo(null)}
              className="absolute -top-11 right-0 text-white/80 font-black text-sm flex items-center gap-1.5 hover:text-white">
              ✕ Đóng
            </button>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video src={activeVideo} controls autoPlay playsInline
              className="w-full rounded-[24px] shadow-2xl border-[3px] border-gray-700" />
          </div>
        </div>
      )}

      {/* Screenshot lightbox */}
      {activeScreenshot && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center px-4"
          onClick={() => setActiveScreenshot(null)}>
          <div className="relative w-full max-w-sm flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between w-full mb-3 px-1">
              <p className="text-white font-black text-sm">{activeScreenshot.caption}</p>
              <button onClick={() => setActiveScreenshot(null)} className="text-white/70 hover:text-white font-black text-sm ml-4 flex-shrink-0">✕ Đóng</button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={activeScreenshot.src} alt={activeScreenshot.caption}
              className="w-full rounded-2xl shadow-2xl" style={{ maxHeight: '80dvh', objectFit: 'contain' }} />
            {/* Prev / Next */}
            <div className="flex gap-3 mt-4">
              {(() => {
                const idx = SCREENSHOTS.findIndex(s => s.src === activeScreenshot.src)
                return (
                  <>
                    <button
                      onClick={() => setActiveScreenshot(SCREENSHOTS[(idx - 1 + SCREENSHOTS.length) % SCREENSHOTS.length])}
                      className="bg-white/10 hover:bg-white/20 text-white font-black px-4 py-2 rounded-xl text-sm transition-colors">
                      ← Trước
                    </button>
                    <span className="text-white/40 text-xs self-center">{idx + 1} / {SCREENSHOTS.length}</span>
                    <button
                      onClick={() => setActiveScreenshot(SCREENSHOTS[(idx + 1) % SCREENSHOTS.length])}
                      className="bg-white/10 hover:bg-white/20 text-white font-black px-4 py-2 rounded-xl text-sm transition-colors">
                      Sau →
                    </button>
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Screenshots carousel */}
      <div className="max-w-7xl mx-auto pb-4">
        <h2 className="text-xl font-black text-gray-800 text-center mb-1 px-4">Khám phá từng tính năng</h2>
        <p className="text-gray-400 text-sm text-center mb-5 px-4">Screenshots thực tế từ app · Không chỉnh sửa</p>
        <div className="flex gap-4 overflow-x-auto pb-4 px-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
          {SCREENSHOTS.map((s, i) => (
            <button key={i} onClick={() => setActiveScreenshot(s)}
              className="flex-none snap-center active:scale-95 hover:scale-105 transition-transform"
              style={{ width: 148 }}>
              <div className="rounded-[22px] border-[3px] border-gray-800 bg-gray-800 shadow-xl overflow-hidden">
                <div className="h-3.5 bg-gray-800 flex items-center justify-center"><div className="w-10 h-1.5 bg-gray-600 rounded-full" /></div>
                <div className="overflow-hidden bg-white" style={{ height: 264 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.src} alt={s.caption} className="w-full h-full object-cover object-top" loading="lazy" />
                </div>
                <div className="h-3 bg-gray-800" />
              </div>
              <p className="text-xs font-black text-gray-600 mt-2 text-center leading-tight px-0.5">{s.caption}</p>
            </button>
          ))}
        </div>
        <p className="text-center text-xs text-gray-300 px-4">← Vuốt để xem tất cả {SCREENSHOTS.length} màn hình →</p>
      </div>

      {/* Features */}
      <section className="bg-white border-t border-gray-100 py-4">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-xl font-black text-gray-800 text-center mb-5">Tại sao chọn VocabWise?</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {FEATURES.map(f => (
            <div key={f.label} className={`bg-white rounded-2xl p-4 shadow-sm border-2 ${f.color}`}>
              <div className="text-3xl mb-2">{f.emoji}</div>
              <div>
                <p className="font-black text-gray-800 text-sm">{f.label}</p>
                <p className="text-gray-400 text-xs mt-0.5 leading-snug">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      </section>

      {/* Pricing */}
      <section className="bg-white py-4">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-xl font-black text-gray-800 text-center mb-1">Gói dịch vụ</h2>
        <p className="text-gray-400 text-sm text-center mb-4">1 tài khoản · 1 gia đình · Đồng bộ mọi thiết bị</p>

        {/* Free — compact */}
        <div className="bg-white rounded-2xl p-4 border-2 border-gray-100 mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="font-black text-gray-700 text-sm">🆓 Dùng thử 7 ngày miễn phí</p>
            <p className="text-xs text-gray-400 mt-0.5">1 bé · 1 chủ đề/level · Phonics IPA đầy đủ · Không cần thẻ tín dụng</p>
          </div>
          <Link href="/register" className="flex-shrink-0 bg-gray-100 text-gray-600 font-black text-xs px-3 py-2 rounded-xl hover:bg-gray-200 transition-colors whitespace-nowrap">
            Thử miễn phí →
          </Link>
        </div>

        {/* Pro plans — 3 tiers */}
        <div className="grid grid-cols-3 gap-3">
          {/* 1 tháng */}
          <div className="bg-white rounded-2xl p-3 border-2 border-purple-100 flex flex-col">
            <p className="text-sm font-black text-purple-400 uppercase tracking-wide">1 tháng</p>
            <p className="text-xl font-black text-purple-600 mt-1 leading-none">59k</p>
            <p className="text-xs text-gray-400 mt-0.5 mb-2.5">59k/tháng</p>
            <ul className="text-xs md:text-sm text-gray-500 space-y-1.5 flex-1 leading-snug">
              <li>✅ <strong>2 bé</strong></li>
              <li>✅ 4.500+ từ</li>
              <li>✅ AI phát âm<br/><span className="text-gray-400">30 lần/ngày</span></li>
              <li>✅ Push notification</li>
              <li>✅ Báo cáo email thủ công</li>
            </ul>
            <button onClick={() => setShowUpgrade(true)}
              className="mt-3 w-full bg-purple-100 text-purple-700 font-black text-xs py-2 rounded-xl hover:bg-purple-200 transition-colors active:scale-95">
              Chọn
            </button>
          </div>

          {/* 3 tháng — most popular */}
          <div className="relative bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-3 flex flex-col shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-400 text-white text-xs font-black px-2.5 py-0.5 rounded-full whitespace-nowrap shadow">
              PHỔ BIẾN ★
            </div>
            <p className="text-sm font-black text-white/70 uppercase tracking-wide mt-1">3 tháng</p>
            <p className="text-xl font-black text-white mt-1 leading-none">159k</p>
            <p className="text-xs text-white/60 mt-0.5 mb-2.5">53k/tháng · tiết kiệm 10%</p>
            <ul className="text-xs md:text-sm text-white/90 space-y-1.5 flex-1 leading-snug">
              <li>✅ <strong>3 bé</strong></li>
              <li>✅ AI phát âm<br/><span className="text-white/70">không giới hạn</span></li>
              <li>✅ Module Word Stress</li>
              <li>✅ Báo cáo email<br/><span className="text-white/70">tự động hàng tuần</span></li>
            </ul>
            <button onClick={() => setShowUpgrade(true)}
              className="mt-3 w-full bg-white text-purple-600 font-black text-xs py-2 rounded-xl hover:bg-purple-50 transition-colors active:scale-95">
              Chọn
            </button>
          </div>

          {/* 6 tháng — best value */}
          <div className="relative bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-3 flex flex-col shadow-lg">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-black px-2.5 py-0.5 rounded-full whitespace-nowrap shadow">
              GIÁ TỐT NHẤT 👑
            </div>
            <p className="text-sm font-black text-white/70 uppercase tracking-wide mt-1">6 tháng</p>
            <p className="text-xl font-black text-white mt-1 leading-none">299k</p>
            <p className="text-xs text-white/60 mt-0.5 mb-2.5">50k/tháng · tiết kiệm 16%</p>
            <ul className="text-xs md:text-sm text-white/90 space-y-1.5 flex-1 leading-snug">
              <li>✅ <strong>3 bé</strong></li>
              <li>✅ AI phát âm<br/><span className="text-white/70">không giới hạn</span></li>
              <li>🎁 Tặng bạn bè<br/><span className="text-white/70">14 ngày Pro</span></li>
              <li>📅 Tổng kết học<br/><span className="text-white/70">hàng tháng</span></li>
            </ul>
            <button onClick={() => setShowUpgrade(true)}
              className="mt-3 w-full bg-white text-indigo-600 font-black text-xs py-2 rounded-xl hover:bg-indigo-50 transition-colors active:scale-95">
              Chọn
            </button>
          </div>
        </div>

        {/* All Pro includes */}
        <div className="mt-3 bg-purple-50 rounded-2xl p-3">
          <p className="text-xs font-black text-purple-600 mb-2">Tất cả gói Pro đều có:</p>
          <div className="flex flex-wrap gap-1.5">
            {['📚 Daily: 180 chủ đề · 4.500+ từ', '🎮 10 trò chơi/chủ đề', '🔤 Phonics IPA đầy đủ', '📖 Mini Story audio', '🎓 Academic: 3 books · 180 chủ đề', '⭐ Từ của tôi không giới hạn', '🔁 SRS ôn từ yếu không giới hạn', '🔔 Nhắc học hàng ngày', '📱 Không giới hạn thiết bị'].map(f => (
              <span key={f} className="text-xs md:text-sm font-bold text-purple-500 bg-white px-2.5 py-1 rounded-lg border border-purple-100">{f}</span>
            ))}
          </div>
        </div>
      </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-t border-gray-100 py-4">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-xl font-black text-gray-800 text-center mb-1">Bắt đầu trải nghiệm thật dễ dàng!</h2>
        <p className="text-gray-400 text-sm text-center mb-5">4 bước đơn giản để con bắt đầu hành trình từ vựng</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {STEPS.map(s => (
            <div key={s.n} className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-lg flex-shrink-0">{s.n}</div>
              <div>
                <p className="font-black text-gray-800 text-sm">{s.emoji} {s.title}</p>
                <p className="text-gray-400 text-xs mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
          {/* Parental involvement tip */}
          <div className="md:col-span-2 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 items-start">
            <span className="text-xl flex-shrink-0">👨‍👩‍👧</span>
            <div>
              <p className="font-black text-amber-800 text-sm">Lời khuyên từ người tạo ra app</p>
              <p className="text-amber-700 text-xs mt-1 leading-relaxed">
                Với bé dưới 10 tuổi, ba/mẹ nên <strong>ngồi học cùng con</strong> — đặc biệt trong những buổi đầu. Các bé chưa tự giác và cần được hướng dẫn, động viên. Chỉ cần 15–20 phút mỗi ngày cùng nhau là đủ. Khi bé đã quen, bé sẽ tự học một mình rất nhanh!
              </p>
            </div>
          </div>
        </div>
      </div>
      </section>

      {/* Founder trust */}
      <section className="bg-white py-4">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-3xl p-6 shadow-sm border-2 border-purple-200 flex gap-4 items-start">
          <div className="text-4xl flex-shrink-0">👨‍🏫</div>
          <div>
            <p className="font-black text-gray-800 text-sm mb-1">Được thiết kế bởi Thầy Andie Nguyễn</p>
            <p className="text-gray-500 text-xs leading-relaxed">
              Đồng sáng lập <strong>IELTS CHAMPION</strong> · IELTS 8.5 Overall (Writing 8.5) · Thạc sỹ MBA Vương quốc Anh · Học bổng toàn phần của Chính phủ Singapore · Tốt nghiệp <strong>School of Business, National University of Singapore</strong> (Top 8 thế giới) · Hơn 10 năm kinh nghiệm giảng dạy IELTS/SAT · Trực tiếp đào tạo nhiều học viên IELTS 7.0, 7.5, 8.0.
            </p>
            <p className="text-purple-500 text-xs font-semibold mt-2 leading-relaxed">
              "Khi học Tiếng Anh và ngoại ngữ nói chung thì <em>Vocabulary is King</em> — học sinh nào có vốn từ đa dạng, học nhanh nhớ lâu sẽ có lợi thế vô cùng lớn. Tuy nhiên, một số cách học từ vựng truyền thống, học chay mà không có câu ví dụ, không phát âm hay hình ảnh minh hoạ sẽ làm các em mau chán, khó áp dụng từ mới. Dựa trên kinh nghiệm giảng dạy cho học sinh và chính các con của mình, tôi tạo ra VocabWise để giúp trẻ học từ vựng Tiếng Anh thật vui, có hệ thống, và hiệu quả thực sự!"
            </p>
          </div>
        </div>
      </div>
      </section>

      {/* FAQ — SEO structured content */}
      <section className="bg-white border-t border-gray-100 py-4">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-xl font-black text-gray-800 text-center mb-1">Câu hỏi thường gặp</h2>
        <p className="text-gray-400 text-sm text-center mb-5">Về VocabWise</p>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item) => (
            <details key={item.q} className="bg-white rounded-2xl shadow-sm border border-gray-100 group">
              <summary className="px-5 py-4 font-medium text-gray-800 text-sm cursor-pointer list-none flex items-center justify-between gap-3">
                {item.q}
                <span className="text-purple-400 text-lg flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="px-5 pb-4 text-gray-500 text-sm leading-relaxed border-t border-gray-50 pt-3 whitespace-pre-line">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-xs text-gray-400">
          <span className="font-semibold">📚 © 2026 VocabWise</span>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="hover:text-gray-600 transition-colors">📄 Điều khoản</Link>
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">🔒 Bảo mật</Link>
            <a href="https://zalo.me/0977347707" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 transition-colors">💬 Zalo hỗ trợ</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
