import Link from 'next/link'
import Image from 'next/image'
import LandingUpgradeButton from '@/components/landing/LandingUpgradeButton'
import { mascotCutSrc } from '@/lib/mascots'
import { SHOTS, STATS } from '@/lib/landingContent'
import { TRIAL_DAYS } from '@/lib/plans'

export const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2'
export const CTA_PRIMARY = `inline-flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 text-white font-black rounded-2xl border-b-[4px] border-purple-700/40 shadow-lg hover:shadow-xl transition-all active:translate-y-0.5 active:border-b-2 whitespace-nowrap ${FOCUS_RING}`

function Phone({ src, alt, className = '', priority = false }: { src: string; alt: string; className?: string; priority?: boolean }) {
  return (
    <div className={`rounded-[32px] border-[6px] border-gray-800 bg-gray-800 shadow-2xl overflow-hidden ${className}`}>
      <div className="h-5 bg-gray-800 flex items-center justify-center"><div className="w-14 h-2 bg-gray-600 rounded-full" /></div>
      <div className="relative overflow-hidden bg-white aspect-[9/16]">
        <Image src={src} alt={alt} fill sizes="(min-width: 1024px) 240px, 200px" priority={priority} className="object-cover object-top" />
      </div>
      <div className="h-4 bg-gray-800" />
    </div>
  )
}

export default function LandingHero() {
  return (
    <section className="bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 lg:px-12 pt-6 pb-8 lg:pt-16 lg:pb-20">
        <div className="flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-12">

          <div className="text-center lg:text-left lg:flex-1">
            <p className="text-purple-600 font-black text-xs lg:text-sm mb-3 tracking-widest uppercase">App học tiếng Anh song ngữ Việt–Anh</p>
            <h1 className="text-3xl lg:text-5xl font-black text-gray-800 leading-tight mb-4">
              Học tiếng Anh cùng Rocky & Bubi:{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">vui mỗi ngày, tiến bộ thật</span>
            </h1>
            <p className="text-gray-600 text-base lg:text-lg leading-relaxed mb-6 max-w-xl mx-auto lg:mx-0">
              Từ vựng theo chuẩn CEFR cho bé, phát âm IPA có AI chấm điểm, và từ vựng học thuật IELTS/SAT cho teen & người lớn.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-3">
              <Link href="/register" className={`${CTA_PRIMARY} text-base px-7 py-3.5 lg:px-8 lg:py-4`}>
                🚀 Dùng thử miễn phí {TRIAL_DAYS} ngày
              </Link>
              <LandingUpgradeButton label="⭐ Xem gói Pro"
                className={`bg-white text-gray-700 font-black text-base px-7 py-3.5 lg:px-8 lg:py-4 rounded-2xl border-2 border-b-[4px] border-gray-200 hover:border-gray-300 transition-all active:translate-y-0.5 whitespace-nowrap ${FOCUS_RING}`} />
            </div>
            <p className="text-xs lg:text-sm font-semibold text-gray-500 mb-6">Không cần thẻ · Không cần cài app · Dùng trên mọi điện thoại</p>

            <dl className="grid grid-cols-4 gap-2 max-w-lg mx-auto lg:mx-0">
              {STATS.map(s => (
                <div key={s.label} className="rounded-2xl bg-white/80 border-2 border-white px-2 py-2.5 text-center shadow-sm">
                  <dt className="sr-only">{s.label}</dt>
                  <dd className="text-lg lg:text-2xl font-black text-purple-600 leading-none">{s.value}</dd>
                  <dd aria-hidden className="mt-1 text-[11px] lg:text-xs font-bold text-gray-600 leading-tight">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Visual: phone mockups with the two mascots standing beside them */}
          <div className="relative lg:flex-1 flex justify-center items-end min-h-[300px]">
            <Image src={mascotCutSrc('rocky', 'pose-cheer')} alt="" aria-hidden width={150} height={150}
              className="absolute left-0 bottom-0 z-10 w-24 h-24 lg:w-36 lg:h-36 drop-shadow-lg" />
            <div className="flex gap-4 lg:gap-5">
              <Phone src={SHOTS.flashcard.src} alt={SHOTS.flashcard.alt} priority className="-rotate-3 w-[170px] lg:w-[230px]" />
              <Phone src={SHOTS.speakAI.src} alt={SHOTS.speakAI.alt} className="hidden sm:block rotate-3 mt-10 w-[170px] lg:w-[230px]" />
            </div>
            <Image src={mascotCutSrc('bubi', 'pose-wow')} alt="" aria-hidden width={150} height={150}
              className="absolute right-0 bottom-0 z-10 w-24 h-24 lg:w-36 lg:h-36 drop-shadow-lg" />
          </div>

        </div>
      </div>
    </section>
  )
}
