import Link from 'next/link'
import Image from 'next/image'
import Reveal from '@/components/landing/Reveal'
import { FOCUS_RING, H2, LEAD, SECTION_Y } from '@/components/landing/ui'
import { mascotCutSrc } from '@/lib/mascots'
import { FAQ_ITEMS, JOURNEY, MODULE_CARDS, MOTIVATION, STEPS, TESTIMONIAL } from '@/lib/landingContent'
import { TRIAL_DAYS } from '@/lib/plans'


export function ModulesSection() {
  return (
    <section id="modules" className={`bg-white ${SECTION_Y} scroll-mt-20`}>
      <Reveal className="max-w-7xl mx-auto">
        <h2 className={`${H2} px-4`}>3 phần học + dashboard cho ba mẹ</h2>
        <p className={`${LEAD} px-4`}>Một tài khoản dùng cho cả nhà: bé học Daily & Phonics, anh chị lớn học Academic</p>
        <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 overflow-x-auto md:overflow-visible pb-3 md:pb-0 px-4 lg:px-12 snap-x snap-mandatory md:snap-none [scrollbar-width:none]">
          {MODULE_CARDS.map(card => (
            <article key={card.title}
              className={`flex-none md:flex-auto snap-center w-[280px] md:w-auto bg-gradient-to-br ${card.bgLight} rounded-2xl border-2 border-b-[4px] ${card.border} p-4 lg:p-5 flex flex-col`}>
              <span className={`inline-flex items-center gap-1.5 bg-gradient-to-r ${card.gradient} text-white text-xs lg:text-sm font-black px-2.5 py-1 rounded-full self-start mb-3`}>
                <span aria-hidden>{card.emoji}</span>{card.badge}
              </span>
              <h3 className={`font-black text-lg ${card.accent} leading-tight`}>{card.title}</h3>
              <p className="text-gray-600 text-sm mb-3">{card.subtitle}</p>
              <ul className="space-y-2 flex-1">
                {card.features.map(f => (
                  <li key={f.text} className="flex items-start gap-2">
                    <span aria-hidden className="text-base flex-shrink-0 leading-none mt-0.5">{f.icon}</span>
                    <span className="text-gray-700 text-sm leading-snug">{f.text}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <p className="text-center text-xs text-gray-500 mt-1 px-4 md:hidden">← Vuốt để xem cả 4 →</p>
      </Reveal>
    </section>
  )
}

export function JourneySection() {
  return (
    <section id="journey" className={`bg-gradient-to-b from-white to-purple-50 ${SECTION_Y} scroll-mt-20`}>
      <Reveal className="max-w-6xl mx-auto px-4 lg:px-12">
        <h2 className={H2}>Một chủ đề, học đến khi nhớ thật</h2>
        <p className={LEAD}>Mỗi chủ đề Daily đi qua 4 bước. Sao tính theo lần chơi gần nhất, nên muốn giữ cúp thì phải nhớ từ</p>
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          {JOURNEY.map((s, i) => (
            <li key={s.title} className="relative bg-white rounded-2xl border-2 border-b-[4px] border-purple-100 p-4 lg:p-5">
              <span className="absolute top-3 right-4 text-xs font-black text-purple-300">0{i + 1}</span>
              <span aria-hidden className="text-3xl">{s.emoji}</span>
              <h3 className="mt-2 font-black text-gray-800">{s.title}</h3>
              <p className="mt-1 text-sm text-gray-600 leading-snug">{s.desc}</p>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  )
}

export function MotivationSection() {
  return (
    <section className={`bg-purple-50 ${SECTION_Y}`}>
      <Reveal className="max-w-6xl mx-auto px-4 lg:px-12">
        <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
          <div className="flex items-end -space-x-4 flex-shrink-0">
            <Image src={mascotCutSrc('rocky', 'pose-trophy')} alt="Rocky giơ cúp" width={230} height={230} className="w-44 h-44 lg:w-56 lg:h-56 drop-shadow-lg" />
            <Image src={mascotCutSrc('bubi', 'pose-cheer')} alt="Bubi reo vui" width={180} height={180} className="w-36 h-36 lg:w-44 lg:h-44 drop-shadow-lg" />
          </div>
          <div className="flex-1 w-full">
            <h2 className={`${H2} lg:text-left`}>Có bạn đồng hành, có quà, bé muốn học mỗi ngày</h2>
            <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MOTIVATION.map(m => (
                <li key={m.title} className="bg-white rounded-2xl border-2 border-b-[4px] border-purple-100 p-4 flex gap-3">
                  <span aria-hidden className="text-2xl flex-shrink-0">{m.emoji}</span>
                  <div>
                    <h3 className="font-black text-gray-800">{m.title}</h3>
                    <p className="text-sm text-gray-600 leading-snug mt-0.5">{m.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

export function TestimonialSection() {
  return (
    <section className={`bg-white ${SECTION_Y}`}>
      <Reveal className="max-w-3xl mx-auto px-4 lg:px-12">
        <figure className="rounded-3xl border-2 border-b-[4px] border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 lg:p-8">
          <p className="text-xs font-black uppercase tracking-widest text-amber-700">Câu chuyện thật</p>
          <p className="mt-2 text-xl lg:text-2xl font-black text-gray-800 leading-snug">{TESTIMONIAL.headline}</p>
          <blockquote className="mt-3 text-gray-700 text-sm lg:text-base leading-relaxed">“{TESTIMONIAL.quote}”</blockquote>
          <figcaption className="mt-4 flex items-center gap-3">
            <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-200 text-xl">👦</span>
            <span>
              <span className="block font-black text-gray-800">{TESTIMONIAL.who}</span>
              <span className="block text-sm text-gray-600">{TESTIMONIAL.context}</span>
            </span>
          </figcaption>
        </figure>
      </Reveal>
    </section>
  )
}

export function StepsSection() {
  return (
    <section className={`bg-white ${SECTION_Y}`}>
      <Reveal className="max-w-5xl mx-auto px-4 lg:px-12">
        <h2 className={H2}>Bắt đầu thật dễ</h2>
        <p className={LEAD}>4 bước để con bắt đầu hành trình từ vựng</p>
        <ol className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
          {STEPS.map(s => (
            <li key={s.n} className="bg-white rounded-2xl p-4 lg:p-5 border-2 border-gray-100 flex items-center gap-4">
              <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-lg flex-shrink-0">{s.n}</span>
              <div>
                <h3 className="font-black text-gray-800 text-sm lg:text-base"><span aria-hidden>{s.emoji}</span> {s.title}</h3>
                <p className="text-gray-600 text-sm mt-0.5">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 lg:p-5 flex gap-3 items-start">
          <span aria-hidden className="text-2xl flex-shrink-0">👨‍👩‍👧</span>
          <div>
            <p className="font-black text-amber-800 text-sm lg:text-base">Lời khuyên cho phụ huynh</p>
            <p className="text-amber-800 text-sm lg:text-base mt-1 leading-relaxed">
              Với bé dưới 10 tuổi, ba mẹ nên <strong>ngồi học cùng con</strong>, nhất là những buổi đầu. Chỉ cần 15–20 phút mỗi ngày cùng nhau là đủ. Khi đã quen, bé sẽ tự học rất nhanh!
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

export function FounderSection() {
  return (
    <section className={`bg-slate-50 ${SECTION_Y}`}>
      <Reveal className="max-w-5xl mx-auto px-4 lg:px-12">
        <div className="bg-white rounded-3xl p-5 lg:p-6 border-2 border-b-[4px] border-purple-200 flex flex-col sm:flex-row gap-4 lg:gap-6 items-start">
          <span aria-hidden className="text-5xl flex-shrink-0">👨‍🏫</span>
          <div>
            <h2 className="font-black text-gray-800 text-base lg:text-lg mb-1">Được thiết kế bởi Thầy Andie Nguyễn</h2>
            <p className="text-gray-600 text-sm lg:text-base leading-relaxed">
              Đồng sáng lập <strong>IELTS CHAMPION</strong> · IELTS 8.5 Overall (Writing 8.5) · Thạc sỹ MBA Vương quốc Anh · Học bổng toàn phần của Chính phủ Singapore · Tốt nghiệp <strong>School of Business, National University of Singapore</strong> (Top 8 thế giới) · Hơn 10 năm kinh nghiệm giảng dạy IELTS/SAT · Trực tiếp đào tạo nhiều học viên IELTS 7.0, 7.5, 8.0.
            </p>
            <p className="text-purple-700 text-sm lg:text-base font-semibold mt-3 leading-relaxed">
              &quot;Khi học tiếng Anh và ngoại ngữ nói chung thì <em>Vocabulary is King</em>: học sinh nào có vốn từ đa dạng, học nhanh nhớ lâu sẽ có lợi thế vô cùng lớn. Tuy nhiên, cách học từ vựng truyền thống, học chay không có câu ví dụ, không phát âm hay hình ảnh minh hoạ sẽ làm các em mau chán, khó áp dụng từ mới. Dựa trên kinh nghiệm giảng dạy cho học sinh và chính các con của mình, tôi tạo ra VocabWise để giúp trẻ học từ vựng tiếng Anh thật vui, có hệ thống, và hiệu quả thực sự!&quot;
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

export function FaqSection() {
  return (
    <section id="faq" className={`bg-white ${SECTION_Y} scroll-mt-20`}>
      <Reveal className="max-w-3xl mx-auto px-4 lg:px-0">
        <h2 className={H2}>Câu hỏi thường gặp</h2>
        <p className={LEAD}>Về VocabWise</p>
        <div className="space-y-3">
          {FAQ_ITEMS.map(item => (
            <details key={item.q} className="bg-white rounded-2xl border-2 border-gray-100 group">
              <summary className={`px-5 py-4 lg:px-6 font-bold text-gray-800 text-sm lg:text-base cursor-pointer list-none flex items-center justify-between gap-3 hover:text-purple-600 transition-colors rounded-2xl ${FOCUS_RING}`}>
                {item.q}
                <span aria-hidden className="text-purple-500 text-lg flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="px-5 pb-4 lg:px-6 text-gray-600 text-sm lg:text-base leading-relaxed border-t border-gray-100 pt-3 whitespace-pre-line">{item.a}</p>
            </details>
          ))}
        </div>
      </Reveal>
    </section>
  )
}

export function FinalCtaSection() {
  return (
    <section className={`bg-gradient-to-br from-purple-500 to-pink-500 ${SECTION_Y}`}>
      <div className="max-w-3xl mx-auto px-4 text-center">
        <Image src={mascotCutSrc('rocky', 'pose-point')} alt="" aria-hidden width={120} height={120} className="mx-auto w-24 h-24 drop-shadow-lg" />
        <h2 className="mt-2 text-2xl lg:text-3xl font-black text-white">Rocky & Bubi đang chờ bé!</h2>
        <p className="mt-2 text-white/90 text-sm lg:text-base">Đăng ký trong 1 phút, dùng thử {TRIAL_DAYS} ngày miễn phí, không cần thẻ.</p>
        <Link href="/register"
          className={`mt-5 inline-flex items-center justify-center bg-white text-purple-700 font-black text-base px-8 py-3.5 rounded-2xl border-b-[4px] border-purple-200 shadow-lg active:translate-y-0.5 ${FOCUS_RING}`}>
          🚀 Dùng thử miễn phí
        </Link>
      </div>
    </section>
  )
}

export function LandingFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white pb-20 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 lg:px-12 py-5 flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-sm text-gray-600">
        <span className="font-semibold">📚 © {new Date().getFullYear()} VocabWise · IELTS CHAMPION</span>
        <nav aria-label="Liên kết cuối trang" className="flex items-center gap-4">
          <Link href="/login" className="hover:text-gray-900 transition-colors">🔐 Đăng nhập</Link>
          <Link href="/terms" className="hover:text-gray-900 transition-colors">📄 Điều khoản</Link>
          <Link href="/privacy" className="hover:text-gray-900 transition-colors">🔒 Bảo mật</Link>
          <a href="https://zalo.me/0977347707" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900 transition-colors">💬 Zalo hỗ trợ</a>
        </nav>
      </div>
    </footer>
  )
}

