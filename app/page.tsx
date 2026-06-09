'use client'
import Link from 'next/link'
import { useState } from 'react'
import UpgradeModal from '@/components/UpgradeModal'

const SECTIONS = [
  {
    emoji: '🎤',
    title: 'Luyện Phát Âm',
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
    badge: 'Trẻ em · 4–15 tuổi',
    badgeCls: 'bg-purple-100 text-purple-700',
    desc: '2.300+ từ · 6 cấp độ CEFR · 10 trò chơi tương tác',
    available: true,
    cardCls: 'border-purple-200 bg-purple-50/50',
    accentCls: 'text-purple-600',
  },
  {
    emoji: '🎓',
    title: 'VocabWise Academic',
    badge: 'Teen & Người lớn · A1→C2',
    badgeCls: 'bg-blue-100 text-blue-700',
    desc: 'Từ vựng học thuật · Passage · 5 dạng bài tập · IELTS/SAT',
    available: false,
    cardCls: 'border-blue-100 bg-blue-50/30',
    accentCls: 'text-blue-500',
  },
]

const FAQ_ITEMS = [
  {
    q: 'VocabWise có những gì?',
    a: 'VocabWise là nền tảng học tiếng Anh toàn diện với 3 module:\n\n📚 VocabWise Daily — 2.300+ từ vựng, 6 cấp độ CEFR (Pre-A1 đến C1), 10+ trò chơi tương tác — dành riêng cho trẻ em 4–15 tuổi.\n\n🎤 Luyện Phát Âm — học IPA chuẩn Cambridge qua nguyên âm, phụ âm, minimal pairs — phù hợp mọi lứa tuổi.\n\n🎓 VocabWise Academic (sắp ra mắt) — từ vựng học thuật cho IELTS/SAT với passage, glossary và 5 dạng bài tập theo chuẩn CEFR A1–C2.',
  },
  {
    q: 'Module học phát âm IPA là gì?',
    a: 'Module "Luyện Phát Âm" là tính năng độc lập giúp bé học phát âm tiếng Anh đúng chuẩn theo ký hiệu IPA.\n\nBé sẽ học qua 3 nhóm âm:\n• Nguyên âm (dài & ngắn): /iː/ vs /ɪ/, /æ/ vs /e/...\n• Phụ âm (cặp hữu thanh/vô thanh): /p/ vs /b/, /θ/ vs /ð/...\n• Khó với người Việt: /l/ vs /r/, âm cuối, cụm phụ âm\n\nMỗi nhóm âm có 3 game: Nghe & Phân biệt · Nghe & Chọn · Luyện đọc (AI chấm điểm).\nBé nghe phát âm mẫu từ native speaker rồi tự đọc theo — AI cho biết đúng hay sai ngay lập tức!',
  },
  {
    q: 'Bé có thể tự học một mình không?',
    a: 'VocabWise được thiết kế để dùng cùng ba/mẹ — đặc biệt với bé dưới 10 tuổi. Kinh nghiệm thực tế: các bé còn nhỏ chưa tự giác, cần người lớn ngồi cạnh hướng dẫn, giải thích từ khó và động viên khi học. Sự có mặt và cổ vũ của ba/mẹ tạo ra sự khác biệt rất lớn. Sau vài tuần quen dùng, bé sẽ tự tin học độc lập hơn.',
  },
  {
    q: 'App VocabWise có cần cài xuống không?',
    a: 'Không! VocabWise là PWA (Progressive Web App) — bé chỉ cần vào trình duyệt là học ngay. Ba/Mẹ có thể "Thêm vào màn hình chính" để dùng như app thật trên iPhone, Android, iPad và PC, tự động cập nhật, không cần lên App Store.',
  },
  {
    q: 'VocabWise phù hợp với lứa tuổi nào?',
    a: 'VocabWise phục vụ 3 nhóm người học:\n\n📚 VocabWise Daily: dành cho bé 4–15 tuổi. Level Seeker (Pre-A1) cho bé mới bắt đầu, đến Master (C1-C2) cho bé nâng cao.\n\n🎤 Luyện Phát Âm: phù hợp mọi lứa tuổi — từ bé học phát âm cơ bản đến người lớn muốn hoàn thiện IPA.\n\n🎓 VocabWise Academic (sắp ra mắt): dành cho học sinh cấp 2, cấp 3, sinh viên và người đi làm luyện từ vựng học thuật IELTS/SAT (A1–C2).',
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
    a: 'Có! Đăng ký miễn phí — không cần thẻ tín dụng. Gói Free cho bé học 1 chủ đề đầu tiên mỗi level (6 chủ đề), toàn bộ 10 trò chơi, module phát âm IPA đầy đủ và dashboard phụ huynh trong 7 ngày.\n\nSau 7 ngày, nâng cấp Pro để mở toàn bộ 180 chủ đề · 2.300+ từ · AI phát âm không giới hạn và nhiều tính năng độc quyền hơn.',
  },
  {
    q: 'Các gói Pro 1 tháng, 3 tháng và 6 tháng khác nhau thế nào?',
    a: 'Tất cả gói Pro đều có: 180 chủ đề · 2.300+ từ · 10 trò chơi/chủ đề · Phonics IPA đầy đủ · SRS ôn từ yếu · Push notification nhắc học.\n\nSự khác biệt:\n• Pro 1 tháng (59k): 2 hồ sơ bé · AI Speak 30 lần/ngày\n• Pro 3 tháng (53k/th): 3 hồ sơ bé · AI Speak không giới hạn · Module Word Stress · Báo cáo email tự động hàng tuần\n• Pro 6 tháng (50k/th): Tất cả như 3 tháng + 🎁 Tặng bạn bè 14 ngày Pro + 📅 Email tổng kết học tập hàng tháng',
  },
]

const FEATURES = [
  { emoji: '🌱', label: '6 cấp độ', desc: 'Pre-A1 → C1-C2 (Seeker → Master)' },
  { emoji: '📖', label: '2.300+ từ vựng', desc: 'Chọn lọc theo khung CEFR' },
  { emoji: '🎮', label: '10+ trò chơi', desc: 'Flashcard, nghe, đánh vần, đọc to...' },
  { emoji: '🎤', label: 'Phát âm cùng AI ✨', desc: 'Bé phát âm, AI chấm điểm ngay!' },
  { emoji: '🔤', label: 'Học phát âm IPA', desc: 'Nguyên âm, phụ âm, minimal pairs theo chuẩn Cambridge' },
  { emoji: '📅', label: 'Ôn tập thông minh', desc: 'App tự nhắc từ chưa thuộc đúng lúc' },
  { emoji: '📊', label: 'Dashboard phụ huynh', desc: 'Theo dõi streak, XP, tiến độ' },
  { emoji: '📲', label: 'Không cài app · Tự cập nhật', desc: 'Chạy như app thật trên iPhone, Android, iPad, PC — luôn phiên bản mới nhất, không cần lên App Store', wide: true },
]

const SCREENSHOTS = [
  { src: '/screenshots/select%20profile.jpg',              caption: 'Mỗi bé một hồ sơ riêng' },
  { src: '/screenshots/select%20level.jpg',                caption: '6 cấp độ từ Pre-A1 đến C1-C2' },
  { src: '/screenshots/select%20vocab%20topic.jpg',        caption: '30 chủ đề · 2.300+ từ vựng' },
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 pb-20">

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      {/* Nav */}
      <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <span className="font-black text-xl text-gray-800">📚 VocabWise</span>
        <Link href="/login"
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black text-sm px-5 py-2.5 rounded-2xl shadow hover:shadow-md transition-all">
          🔐 Đăng nhập
        </Link>
      </nav>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 lg:px-8 pt-8 pb-4">
        <div className="lg:flex lg:items-center lg:gap-16">

          {/* Text content */}
          <div className="flex-1 text-center lg:text-left">
            <div className="text-7xl mb-4 lg:hidden">🌟</div>
            <p className="text-purple-500 font-black text-sm mb-2 tracking-wide uppercase">Nền tảng học tiếng Anh toàn diện</p>
            <h1 className="text-3xl lg:text-5xl font-black text-gray-800 leading-tight mb-4">
              Học tiếng Anh{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">vui, có hệ thống, đúng chuẩn</span>
            </h1>
            <p className="text-gray-500 text-sm lg:text-base leading-relaxed mb-4 lg:max-w-lg">
              VocabWise có 3 module học tập — phù hợp cho mọi lứa tuổi, từ phát âm chuẩn IPA đến từ vựng CEFR cho trẻ em và học thuật cho người lớn.
            </p>

            {/* 3 section cards */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              {SECTIONS.map(s => (
                <div key={s.title} className={`rounded-2xl border-2 p-2.5 text-left ${s.cardCls} ${!s.available ? 'opacity-70' : ''}`}>
                  <div className="flex flex-wrap items-center gap-1 mb-1">
                    <span className="text-xl">{s.emoji}</span>
                    {!s.available && (
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 whitespace-nowrap">🔜 Sắp ra</span>
                    )}
                  </div>
                  <p className={`font-black text-xs ${s.accentCls} leading-tight`}>{s.title}</p>
                  <p className={`text-[10px] font-black px-1.5 py-0.5 rounded-full mt-1 inline-block ${s.badgeCls}`}>{s.badge}</p>
                  <p className="text-gray-500 text-[10px] mt-1 leading-snug hidden sm:block">{s.desc}</p>
                </div>
              ))}
            </div>

            {/* Primary CTA */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-5">
              <button onClick={() => setShowUpgrade(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black text-base px-8 py-3.5 rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 whitespace-nowrap">
                ⭐ Xem gói Pro
              </button>
              <Link href="/register"
                className="bg-white text-gray-500 font-black text-base px-8 py-3.5 rounded-2xl shadow border-2 border-gray-200 hover:border-gray-300 transition-all active:scale-95 whitespace-nowrap">
                🚀 Dùng thử miễn phí
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-8">
              <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">✅ Không cần cài app</span>
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full">🔄 Tự động cập nhật</span>
              <span className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1.5 rounded-full">📲 Dùng như app thật</span>
            </div>
          </div>

          {/* Phone mockup — desktop only */}
          <div className="hidden lg:flex flex-shrink-0 gap-4 items-end">
            <div className="w-[200px] rounded-[28px] border-4 border-gray-800 bg-gray-800 shadow-2xl overflow-hidden rotate-[-3deg] translate-y-4">
              <div className="h-3.5 bg-gray-800 flex items-center justify-center"><div className="w-10 h-1.5 bg-gray-600 rounded-full" /></div>
              <div className="overflow-hidden bg-white h-[400px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/screenshots/select%20profile.jpg" alt="VocabWise" className="w-full h-full object-cover object-top" />
              </div>
              <div className="h-3 bg-gray-800" />
            </div>
            <div className="w-[200px] rounded-[28px] border-4 border-gray-800 bg-gray-800 shadow-2xl overflow-hidden rotate-[3deg]">
              <div className="h-3.5 bg-gray-800 flex items-center justify-center"><div className="w-10 h-1.5 bg-gray-600 rounded-full" /></div>
              <div className="overflow-hidden bg-white h-[400px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/screenshots/select%20game.jpg" alt="VocabWise games" className="w-full h-full object-cover object-top" />
              </div>
              <div className="h-3 bg-gray-800" />
            </div>
          </div>

        </div>
      </div>

      {/* Video demos */}
      <div className="max-w-6xl mx-auto pb-10">
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

      {/* Features */}
      <div className="max-w-6xl mx-auto px-4 pb-10">
        <h2 className="text-xl font-black text-gray-800 text-center mb-5">Tại sao chọn VocabWise?</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {FEATURES.map(f => (
            <div key={f.label} className={`bg-white rounded-2xl p-4 shadow-sm border border-white${'wide' in f && f.wide ? ' col-span-2 md:col-span-4 flex items-center gap-4' : ''}`}>
              <div className={`text-3xl${'wide' in f && f.wide ? ' flex-shrink-0' : ' mb-2'}`}>{f.emoji}</div>
              <div>
                <p className="font-black text-gray-800 text-sm">{f.label}</p>
                <p className="text-gray-400 text-xs mt-0.5 leading-snug">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-6xl mx-auto px-4 pb-10">
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

      {/* Screenshots carousel */}
      <div className="max-w-6xl mx-auto pb-12">
        <h2 className="text-xl font-black text-gray-800 text-center mb-1 px-4">Khám phá từng tính năng</h2>
        <p className="text-gray-400 text-sm text-center mb-5 px-4">Screenshots thực tế từ app · Không chỉnh sửa</p>
        {/* Carousel — mobile scroll, desktop shows ~5-6 at once */}
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

      {/* Pricing */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
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
              <li>✅ 2.300+ từ</li>
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
            {['📚 180 chủ đề · 2.300+ từ', '🎮 10 trò chơi/chủ đề', '🔤 Phonics IPA đầy đủ', '📖 Mini Story audio', '🔁 SRS ôn từ yếu', '🔔 Nhắc học hàng ngày', '📱 Không giới hạn thiết bị'].map(f => (
              <span key={f} className="text-xs md:text-sm font-bold text-purple-500 bg-white px-2.5 py-1 rounded-lg border border-purple-100">{f}</span>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-3">
          Thanh toán chuyển khoản · Kích hoạt trong 12h · Dữ liệu không mất khi hết hạn
        </p>
      </div>

      {/* Founder trust */}
      <div className="max-w-6xl mx-auto px-4 pb-10">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex gap-4 items-start">
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

      {/* FAQ — SEO structured content */}
      <div className="max-w-6xl mx-auto px-4 pb-10">
        <h2 className="text-xl font-black text-gray-800 text-center mb-1">Câu hỏi thường gặp</h2>
        <p className="text-gray-400 text-sm text-center mb-5">Về VocabWise</p>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item) => (
            <details key={item.q} className="bg-white rounded-2xl shadow-sm border border-gray-100 group">
              <summary className="px-5 py-4 font-black text-gray-800 text-sm cursor-pointer list-none flex items-center justify-between gap-3">
                {item.q}
                <span className="text-purple-400 text-lg flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="px-5 pb-4 text-gray-500 text-sm leading-relaxed border-t border-gray-50 pt-3">{item.a}</p>
            </details>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/60">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-xs text-gray-400">
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
