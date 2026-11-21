import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { loadTrophyCard } from '@/lib/trophyShare'
import { TRIAL_DAYS } from '@/lib/plans'

// Public landing for a shared "topic conquered" card (/c/{signed token}). Its og:image is the
// personalised preview, so the link looks like the achievement when pasted in Zalo/Facebook.

type Props = { params: Promise<{ token: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params
  const c = await loadTrophyCard(token)
  if (!c) return { title: 'VocabWise', robots: { index: false } }
  const title = `🏆 ${c.childName} chinh phục “${c.topicNameEn}” (${c.topicName}) — VocabWise Daily`
  const description = `Bé vừa học xong ${c.wordCount} từ mới chủ đề ${c.topicName} (${c.levelLabel}) qua các trò chơi. Cho con bạn học thử miễn phí!`
  const image = { url: `/c/${token}/og.png`, width: 1200, height: 630, alt: title }
  return {
    title, description,
    robots: { index: false, follow: false },
    openGraph: { title, description, type: 'website', url: `/c/${token}`, siteName: 'VocabWise', images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [image.url] },
  }
}

export default async function TrophySharePage({ params }: Props) {
  const { token } = await params
  const c = await loadTrophyCard(token)
  if (!c) notFound()
  const cta = c.referralCode ? `/r/${c.referralCode}` : '/register'

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#3b2a8a] via-[#6d34d8] to-[#ec4899] px-4 py-8">
      <div className="mx-auto flex max-w-md flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/c/${token}/card.png`} width={1080} height={1350}
          alt={`Giấy khen: ${c.childName} đã chinh phục chủ đề ${c.topicName}`}
          className="w-full rounded-3xl shadow-2xl" />
        <h1 className="mt-6 text-2xl font-black text-white">
          {c.childName} vừa học xong {c.wordCount} từ tiếng Anh mới! 🎉
        </h1>
        <p className="mt-2 text-base font-semibold text-white/85">
          VocabWise Daily giúp bé học từ vựng qua trò chơi, phát âm cùng AI và nhận giấy khen sau mỗi chủ đề.
        </p>
        <Link href={cta}
          className="mt-6 w-full rounded-2xl border-b-[5px] border-amber-600 bg-amber-400 py-4 text-lg font-black text-amber-950 active:translate-y-1 active:border-b-[1px]">
          Cho con học thử miễn phí {TRIAL_DAYS} ngày →
        </Link>
        <Link href="/" className="mt-3 text-sm font-bold text-white/85 underline underline-offset-4">
          Tìm hiểu thêm về VocabWise
        </Link>
      </div>
    </main>
  )
}
