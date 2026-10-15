// Landing page copy — kept apart from layout so facts can be checked in one file.
// Counts must match the app: Daily = data/words/{level}.json (6 levels × 30 topics × 400 words),
// Academic = data/vocabwise (3 books × 60 topics, 13 exercise types in components/vocabwise/E*.tsx),
// Phonics = data/phonicsLevels.json (9 levels · 58 lessons). Prices + quotas come from lib/plans.ts.
import { AI_SPEAK_LIMIT, AI_TEXT_LIMIT, FREE_KIDS, FREE_WORD_CAP, PAID_PLANS, TRIAL_DAYS, cheapestPerDay, perDay } from './plans'

// Screenshots of the live app (demo family). Regenerate: `node scripts/capture-landing-screenshots.mjs`.
const shot = (name: string) => `/screenshots/app/${name}.webp`
export const SHOTS = {
  hub: { src: shot('topic-hub'), alt: 'Topic hub Daily: Bubi chỉ bước học tiếp theo' },
  trophy: { src: shot('trophy'), alt: 'Chinh phục chủ đề: nhận cúp và sticker' },
} as const

export const GALLERY = [
  { src: shot('pick-child'), caption: 'Mỗi bé một hồ sơ, tiến độ riêng' },
  { src: shot('daily-level'), caption: '30 chủ đề mỗi cấp độ' },
  { src: shot('topic-hub'), caption: 'Bạn đồng hành chỉ bước học tiếp theo' },
  { src: shot('flashcard'), caption: 'Flashcard: hình, phát âm, câu ví dụ' },
  { src: shot('game-listen'), caption: 'Nghe & Chọn hình' },
  { src: shot('game-speak'), caption: '🎤 Phát âm cùng AI, chấm điểm ngay' },
  { src: shot('trophy'), caption: '🏆 Chinh phục chủ đề, nhận sticker' },
  { src: shot('stickers'), caption: 'Huy hiệu & album sticker' },
  { src: shot('phonics'), caption: 'Phonics IPA: 9 cấp độ, 58 bài' },
  { src: shot('academic'), caption: 'Academic: bài đọc + 13 dạng bài tập' },
  { src: shot('my-words'), caption: '⭐ Từ của tôi: lưu và ôn từ yêu thích' },
  { src: shot('parent'), caption: 'Dashboard phụ huynh' },
] as const

export const STATS = [
  { value: '5.100+', label: 'từ vựng CEFR' },
  { value: '58', label: 'bài phát âm IPA' },
  { value: '360', label: 'chủ đề học' },
  { value: 'AI', label: 'chấm phát âm & bài viết' },
] as const

export type ModuleCard = {
  emoji: string; title: string; subtitle: string; badge: string
  gradient: string; bgLight: string; border: string; accent: string
  features: { icon: string; text: string }[]
}

export const MODULE_CARDS: ModuleCard[] = [
  {
    emoji: '📚', title: 'Daily', subtitle: 'Từ vựng hằng ngày cho bé', badge: '5–15 tuổi',
    gradient: 'from-purple-500 to-pink-500', bgLight: 'from-purple-50 to-pink-50', border: 'border-purple-200', accent: 'text-purple-700',
    features: [
      { icon: '🌱', text: '6 cấp độ CEFR: Pre-A1 → C1-C2 (Seeker → Master)' },
      { icon: '📖', text: '2.400 từ · 30 chủ đề mỗi cấp độ' },
      { icon: '🎮', text: 'Flashcard + 19–20 trò chơi mỗi chủ đề, có Phát âm cùng AI' },
      { icon: '✍️', text: 'Đặt câu cùng AI cho cấp độ B1 trở lên' },
      { icon: '🎵', text: 'Mini story theo chủ đề · Video học thêm chọn lọc' },
    ],
  },
  {
    emoji: '🔤', title: 'Phonics IPA', subtitle: 'Phát âm chuẩn quốc tế', badge: 'Mọi lứa tuổi',
    gradient: 'from-orange-500 to-amber-500', bgLight: 'from-orange-50 to-amber-50', border: 'border-orange-200', accent: 'text-orange-700',
    features: [
      { icon: '📐', text: '9 cấp độ · 58 bài: nguyên âm, phụ âm, minimal pairs' },
      { icon: '🇻🇳', text: 'Riêng nhóm âm khó với người Việt' },
      { icon: '🔊', text: 'Quy tắc đuôi -s/-ed, nối âm, ngữ điệu' },
      { icon: '🤖', text: 'AI chấm phát âm ngay, biết sai ở đâu' },
    ],
  },
  {
    emoji: '🎓', title: 'Academic', subtitle: 'Từ vựng học thuật IELTS/SAT', badge: 'Teen & người lớn',
    gradient: 'from-indigo-500 to-blue-600', bgLight: 'from-indigo-50 to-blue-50', border: 'border-indigo-200', accent: 'text-indigo-700',
    features: [
      { icon: '📚', text: '3 books · 180 chủ đề · 2.700 từ · A1 → C2' },
      { icon: '📄', text: 'Bài đọc theo ngữ cảnh + glossary song ngữ' },
      { icon: '✏️', text: '13 dạng bài tập: MCQ, Gap Fill, TFNG, Word Forms…' },
      { icon: '🤖', text: 'AI giải nghĩa từ khó và chấm câu bạn viết' },
      { icon: '🎯', text: 'Bài kiểm tra xếp level và kiểm tra cuối module' },
    ],
  },
  {
    emoji: '📊', title: 'Dashboard phụ huynh', subtitle: 'Theo dõi và đồng hành cùng con', badge: 'Cho ba mẹ',
    gradient: 'from-emerald-500 to-teal-500', bgLight: 'from-emerald-50 to-teal-50', border: 'border-emerald-200', accent: 'text-emerald-700',
    features: [
      { icon: '👧', text: 'Mỗi bé một hồ sơ: tiến độ, streak, sticker riêng' },
      { icon: '📈', text: 'Lịch sử học từng ngày, từ yếu cần ôn' },
      { icon: '🔔', text: 'Nhắc học theo lịch ba mẹ chọn (ngày + giờ)' },
      { icon: '🎁', text: 'Đổi sticker lấy quà, khoá bằng mã PIN của ba mẹ' },
    ],
  },
]

// How one Daily topic is learned (lib/topicMastery.ts: 3 Round-1 games (Seeker 2) + 3 Round-2 games at 3★).
export const JOURNEY = [
  { emoji: '📖', title: 'Flashcard', desc: 'Nghe phát âm, xem hình và câu ví dụ của từng từ mới' },
  { emoji: '🎯', title: 'Vòng 1 · Làm quen', desc: '6–7 trò chơi nhận diện từ, đạt ⭐⭐⭐ ở 3 trò' },
  { emoji: '🎤', title: 'Vòng 2 · Vận dụng', desc: 'Sắp xếp câu, phát âm cùng AI… đạt ⭐⭐⭐ ở 3 trò' },
  { emoji: '🏆', title: 'Chinh phục', desc: 'Nhận cúp và sticker của chủ đề, rồi ôn lại đúng lúc với SRS' },
] as const

export const MOTIVATION = [
  { emoji: '🐘', title: 'Rocky & Bubi', desc: 'Bé chọn một bạn đồng hành, bạn ấy chỉ bước học tiếp theo và ăn mừng cùng bé' },
  { emoji: '🎨', title: 'Album sticker', desc: 'Mỗi chủ đề chinh phục là một sticker mới để sưu tầm và khoe' },
  { emoji: '🎁', title: 'Đổi quà với ba mẹ', desc: 'Ba mẹ đặt phần thưởng, bé dùng sticker để đổi' },
  { emoji: '🔥', title: 'Streak & huy hiệu', desc: 'Học đều mỗi ngày giữ chuỗi streak, mở khoá 18 huy hiệu' },
] as const

export const TESTIMONIAL = {
  who: 'Bé Tim · lớp 5',
  context: 'Học cùng VocabWise suốt 3 tháng hè',
  headline: '2.000 từ, từ Pre-A1 đến B2, và đang học level Master (C1-C2)',
  quote: 'Tim đã học những từ khó như intersectionality, multiculturalism, genetically modified, subsistence, arable… Không chỉ biết nghĩa, bé còn đọc nhiều câu ví dụ, xem AI giải nghĩa từ khó, biết cách phát âm và cách dùng từ qua các trò chơi trực quan, thú vị. Vốn từ mở rộng thực chất, giúp bé rất tự tin!',
} as const

export const STEPS = [
  { n: '1', emoji: '🆕', title: 'Đăng ký miễn phí trong 1 phút', desc: 'Tạo tài khoản bằng số điện thoại, thêm hồ sơ cho bé' },
  { n: '2', emoji: '🐘', title: 'Bé chọn bạn đồng hành và học thử', desc: `Dùng thử ${TRIAL_DAYS} ngày: chủ đề đầu mỗi level, AI chấm phát âm ${AI_SPEAK_LIMIT.trial} lượt/ngày` },
  { n: '3', emoji: '📊', title: 'Ba mẹ theo dõi tiến độ', desc: 'Xem streak, từ yếu, sticker của con trên dashboard' },
  { n: '4', emoji: '⭐', title: 'Nâng cấp Pro khi sẵn sàng', desc: `Mở toàn bộ 360 chủ đề và 58 bài phát âm, chỉ từ ${cheapestPerDay()}/ngày` },
] as const

const [p1, p3, p6] = PAID_PLANS

export const FAQ_ITEMS = [
  {
    q: 'VocabWise có những gì?',
    a: 'VocabWise là app học tiếng Anh song ngữ Việt–Anh với 3 phần học:\n\n📚 Daily: 2.400 từ, 6 cấp độ CEFR (Pre-A1 đến C1-C2), Flashcard và 19–20 trò chơi mỗi chủ đề, dành cho bé 5–15 tuổi.\n\n🔤 Phonics IPA: 9 cấp độ, 58 bài phát âm, AI chấm điểm, phù hợp mọi lứa tuổi.\n\n🎓 Academic: từ vựng học thuật IELTS/SAT, 3 books · 180 chủ đề · bài đọc, glossary và 13 dạng bài tập (A1–C2).\n\nBa mẹ có dashboard riêng để theo dõi và nhắc con học.',
  },
  {
    q: 'Bé học một chủ đề như thế nào?',
    a: 'Mỗi chủ đề Daily đi theo 4 bước:\n① Flashcard: nghe phát âm, xem hình và câu ví dụ\n② Vòng 1 · Làm quen: 6–7 trò chơi nhận diện từ, cần đạt ⭐⭐⭐ ở 3 trò (Seeker: 2 trò)\n③ Vòng 2 · Vận dụng: 5 trò như Sắp xếp câu, Phát âm cùng AI, Phóng tên lửa, cần đạt ⭐⭐⭐ ở 3 trò\n④ Chinh phục: bé nhận cúp 🏆 và sticker của chủ đề\n\nSao tính theo lần chơi gần nhất, nên bé muốn giữ sao thì phải nhớ từ thật. Sau đó app tự nhắc ôn lại từ sắp quên (SRS).',
  },
  {
    q: 'Rocky & Bubi là ai? Sticker dùng để làm gì?',
    a: 'Rocky (voi xanh) và Bubi (cá heo xanh) là hai bạn đồng hành. Lần đầu vào học, bé chọn một bạn; bạn ấy sẽ chỉ bước học tiếp theo, ăn mừng khi bé làm tốt và xuất hiện trên huy hiệu.\n\nMỗi chủ đề chinh phục (Daily, Academic) và mỗi bài Phonics thành thạo cho bé 1 sticker để sưu tầm trong album. Ba mẹ có thể đặt phần thưởng thật trong mục Quà tặng (khoá bằng mã PIN), bé dùng sticker để đổi quà.',
  },
  {
    q: 'Bé có thể tự học một mình không?',
    a: 'VocabWise được thiết kế để dùng cùng ba mẹ, đặc biệt với bé dưới 10 tuổi. Các bé nhỏ chưa tự giác, cần người lớn ngồi cạnh hướng dẫn, giải thích từ khó và động viên. Sau vài tuần quen dùng, bé sẽ tự tin học độc lập hơn. Ba mẹ có thể đặt lịch nhắc học (chọn ngày và giờ) để app gửi thông báo đúng lúc.',
  },
  {
    q: 'App VocabWise có cần cài xuống không?',
    a: 'Không! VocabWise chạy ngay trên trình duyệt và có thể thêm vào màn hình chính như app thật.\n\n🍎 iPhone/iPad (Safari): bấm nút Chia sẻ ⬆ ở thanh dưới → chọn "Thêm vào Màn hình chính" → bấm Thêm.\n\n🤖 Android (Chrome): bấm menu ⋮ góc trên phải → chọn "Thêm vào Màn hình chính" → bấm Thêm.\n\nApp tự cập nhật, không cần App Store.',
  },
  {
    q: 'VocabWise phù hợp với lứa tuổi nào?',
    a: '📚 Daily: bé 5–15 tuổi, từ Seeker (Pre-A1) cho bé mới bắt đầu đến Master (C1-C2) cho bé nâng cao.\n\n🔤 Phonics IPA: mọi lứa tuổi, từ bé học phát âm cơ bản đến người lớn muốn hoàn thiện IPA.\n\n🎓 Academic: học sinh cấp 2, cấp 3, sinh viên và người đi làm luyện từ vựng IELTS/SAT.',
  },
  {
    q: 'Một tài khoản dùng được cho mấy bé?',
    a: `Dùng thử: ${FREE_KIDS} bé. Pro ${p1.label}: ${p1.kids} bé. Pro ${p3.label}: ${p3.kids} bé. Pro ${p6.label}: ${p6.kids} bé. Hạn mức AI tính riêng cho từng bé, anh chị em không phải chia lượt. Mỗi bé có hồ sơ, bạn đồng hành, tiến độ, streak, sticker và huy hiệu riêng, đồng bộ trên mọi thiết bị.`,
  },
  {
    q: 'Streak 🔥 là gì? Tại sao quan trọng?',
    a: 'Streak là số ngày học liên tiếp không bỏ ngày nào (tính theo giờ Việt Nam). Ví dụ bé học đều 10 ngày liền thì streak = 🔥 10; bỏ 1 ngày thì streak về 0.\n\nHọc đều 15–20 phút mỗi ngày hiệu quả hơn nhiều so với học dồn 2–3 tiếng cuối tuần. Streak giúp bé tạo thói quen, ba mẹ chỉ cần nhắc con "giữ streak" mỗi tối.',
  },
  {
    q: 'Dùng thử miễn phí được không?',
    a: `Có! Mọi tài khoản mới đều bắt đầu với ${TRIAL_DAYS} ngày dùng thử, không cần thẻ. Bé được học:\n• Daily: chủ đề đầu tiên của mỗi level (6 chủ đề), đủ các trò chơi\n• Academic: chủ đề đầu tiên của mỗi book (3 chủ đề)\n• Phonics IPA: 1 bài\n• AI chấm phát âm ${AI_SPEAK_LIMIT.trial} lượt/ngày, AI giải nghĩa ${AI_TEXT_LIMIT.trial} lượt/ngày\n• ⭐ Từ của tôi và ôn SRS: tối đa ${FREE_WORD_CAP} từ\n• Nhắc học theo lịch, sticker, huy hiệu\n\nHết ${TRIAL_DAYS} ngày, phần học khoá lại cho tới khi nâng cấp Pro. Ba mẹ vẫn đăng nhập để xem tiến độ, sticker và huy hiệu của bé.`,
  },
  {
    q: '⭐ Tính năng "Từ của tôi" là gì?',
    a: `"Từ của tôi" là sổ từ vựng cá nhân:\n• Bấm ⭐ cạnh bất kỳ từ nào trong Daily hoặc Academic để lưu lại\n• Chia thành nhiều danh sách: IELTS Writing, SAT, ôn thi tuần này…\n• Bấm "Học ngay" để ôn các từ đã lưu bằng flashcard\n\nDùng thử: tối đa ${FREE_WORD_CAP} từ. Pro: không giới hạn.`,
  },
  {
    q: `Các gói Pro ${p1.label}, ${p3.label} và ${p6.label} khác nhau thế nào?`,
    a: `Mọi gói Pro đều có trọn nội dung (Daily, Academic, Phonics IPA, trọng âm, bài kiểm tra level/module), theo dõi tiến độ, báo cáo email tuần & tháng, nhắc học, Từ của tôi và ôn SRS không giới hạn.\n\nKhác nhau ở giá mỗi ngày, số bé và hạn mức AI (tính riêng cho từng bé):\n• Pro ${p1.label} (≈${perDay(p1)}/ngày): ${p1.kids} bé · AI chấm phát âm và giải nghĩa ${AI_SPEAK_LIMIT.pro1} lượt/ngày\n• Pro ${p3.label} (≈${perDay(p3)}/ngày, tiết kiệm ${p3.savingPct}%): ${p3.kids} bé · AI không giới hạn\n• Pro ${p6.label} (≈${perDay(p6)}/ngày, tiết kiệm ${p6.savingPct}%): ${p6.kids} bé · AI không giới hạn · 🎁 tặng 1 người bạn 14 ngày Pro`,
  },
] as const
