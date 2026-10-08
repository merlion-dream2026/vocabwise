'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Confetti from '@/components/Confetti'
import { PRESS } from '@/components/TopicHub'
import { speak } from '@/lib/speak'
import { MASCOT_NAMES, mascotSrc, type MascotCharacter, type MascotShot } from '@/lib/mascots'

// Shown right after a child picks a companion: three short slides on the mascot's authored
// onboarding scenes (hello → learn through games → collect rewards). Every claim matches what the
// mascot actually does in the app: hub/result-screen cheering + retry encouragement, level outfits
// (portraits), stickers + badges. Motion is CSS-only (globals.css .mi-*) and off under reduced motion.
type Slide = { scene: MascotShot; tint: string; title: (child: string) => string; wave?: boolean; line: (m: string) => string }

const SLIDES: Slide[] = [
  {
    scene: 'scene-onboarding-1', tint: 'from-sky-100 via-sky-50 to-white', wave: true,
    title: child => `Chào ${child}!`,
    line: m => `Mình là ${m} đây! Từ hôm nay mình sẽ học tiếng Anh cùng bạn mỗi ngày nhé!`,
  },
  {
    scene: 'scene-onboarding-2', tint: 'from-emerald-100 via-emerald-50 to-white',
    title: () => 'Vừa học vừa chơi 🎮',
    line: () => 'Mỗi chủ đề có flashcard và trò chơi. Bạn làm đúng, mình reo hò! Chưa đúng cũng không sao, mình cùng bạn thử lại.',
  },
  {
    scene: 'scene-onboarding-3', tint: 'from-amber-100 via-amber-50 to-white',
    title: () => 'Sưu tầm quà cùng mình 🏆',
    line: () => 'Chinh phục chủ đề để nhận sticker và huy hiệu. Bạn lên level nào, mình cũng "lên đồ" theo bạn!',
  },
]

function reducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

export default function MascotIntro({ character, childName, onDone }: {
  character: MascotCharacter
  childName: string
  onDone: () => void
}) {
  const [i, setI] = useState(0)
  const [confetti, setConfetti] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const name = MASCOT_NAMES[character]
  const slide = SLIDES[i]
  const last = i === SLIDES.length - 1

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onDone() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onDone])

  useEffect(() => { if (last && !reducedMotion()) setConfetti(true) }, [last])

  function hello() {
    speak(`Hi! I'm ${name}. Let's learn English together!`, {
      onStart: () => setSpeaking(true), onEnd: () => setSpeaking(false), onError: () => setSpeaking(false),
    })
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="mascot-intro-title"
      className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/40 p-4">
      {confetti && <Confetti onDone={() => setConfetti(false)} />}
      <div className={`relative my-auto w-full max-w-sm overflow-hidden rounded-[2rem] border-2 border-b-[4px] border-white border-b-slate-300 bg-gradient-to-b ${slide.tint} px-5 pb-5 pt-4 text-center shadow-2xl transition-colors duration-500`}>
        {/* Progress + skip */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex gap-1.5" aria-label={`Bước ${i + 1}/${SLIDES.length}`}>
            {SLIDES.map((_, k) => (
              <span key={k} className={`h-2 rounded-full transition-all duration-300 ${k === i ? 'w-6 bg-purple-500' : k < i ? 'w-2 bg-purple-300' : 'w-2 bg-white'}`} />
            ))}
          </div>
          {!last && <button type="button" onClick={onDone} className="rounded-full px-3 py-1 text-xs font-bold text-slate-400 hover:text-slate-600">Bỏ qua</button>}
        </div>

        {/* Scene (authored background, kept at its 2:3 ratio — never cropped) + twinkles */}
        <div key={i} className="mi-pop relative mx-auto" style={{ height: 'min(40vh, 320px)', aspectRatio: '2 / 3' }}>
          <Image src={mascotSrc(character, slide.scene)} alt="" fill priority sizes="220px"
            className="rounded-3xl object-contain shadow-lg ring-4 ring-white" />
          <span aria-hidden className="mi-twinkle absolute -left-4 top-6 text-xl">✨</span>
          <span aria-hidden className="mi-twinkle absolute -right-3 top-1/3 text-lg" style={{ animationDelay: '.6s' }}>⭐</span>
          <span aria-hidden className="mi-twinkle absolute -left-2 bottom-8 text-base" style={{ animationDelay: '1.1s' }}>💫</span>
        </div>

        {/* Speech bubble */}
        <div key={`t${i}`} className="mi-rise">
          <h2 id="mascot-intro-title" className="mt-4 text-2xl font-bold text-slate-800">
            {slide.title(childName)}{slide.wave && <span aria-hidden className="mi-wave ml-1 inline-block">👋</span>}
          </h2>
          <div className="relative mx-auto mt-3 rounded-2xl border-2 border-b-[4px] border-slate-200 border-b-slate-300 bg-white px-4 py-3 text-left">
            <span aria-hidden className="absolute -top-2 left-8 h-3.5 w-3.5 rotate-45 border-l-2 border-t-2 border-slate-200 bg-white" />
            <p className="text-sm font-semibold leading-relaxed text-slate-600">
              <span className="font-bold text-purple-600">{name}: </span>{slide.line(name)}
            </p>
            {i === 0 && (
              <button type="button" onClick={hello}
                className={`mt-2 rounded-full border-b-[3px] border-sky-300 bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700 ${PRESS}`}>
                {speaking ? '🔊 Đang nói...' : `🔊 Nghe ${name} chào`}
              </button>
            )}
          </div>
        </div>

        <button type="button" onClick={() => (last ? onDone() : setI(i + 1))}
          className={`mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border-b-[4px] border-amber-600 bg-amber-400 px-4 text-base font-bold text-amber-950 ${PRESS}`}>
          {last ? 'Bắt đầu học thôi! 🚀' : 'Tiếp theo →'}
        </button>
      </div>
    </div>
  )
}
