import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { Nunito } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import PwaRegister from '@/components/PwaRegister'
import NoVoiceBanner from '@/components/NoVoiceBanner'
import OfflineBanner from '@/components/OfflineBanner'
import BottomNav from '@/components/BottomNav'
import MainContainer from '@/components/MainContainer'
import FontSizeApplier from '@/components/FontSizeApplier'
import PullToRefresh from '@/components/PullToRefresh'
import { GameSyncProvider } from '@/lib/GameSyncContext'
import { ChildMascotProvider } from '@/components/MascotContext'
import { FREE_KIDS, PAID_PLANS, PLAN_PERKS, TRIAL_DAYS } from '@/lib/plans'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '600', '700', '800', '900'],
  display: 'swap',
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vocabwise.id.vn'

export const viewport: Viewport = {
  themeColor: '#9333ea',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'VocabWise — App Học Từ Vựng Tiếng Anh Toàn Diện',
  description: 'Học tiếng Anh toàn diện: Phát âm IPA chuẩn · Từ vựng Pre-A1→C1 cho bé · IELTS/SAT A1→C2. Song ngữ Việt–Anh · 5.100+ từ · Dùng thử miễn phí 7 ngày.',
  keywords: [
    'VocabWise', 'vocab wise', 'vocabwise', 'vocab kids pro',
    'app học từ vựng tiếng anh', 'học tiếng anh cho trẻ em',
    'app học từ vựng tiếng anh toàn diện', 'học từ vựng tiếng anh online',
    'luyện phát âm IPA', 'từ vựng IELTS', 'từ vựng SAT',
    'IELTS CHAMPION', 'học tiếng anh CEFR',
  ],
  authors: [{ name: 'Andie Nguyễn — IELTS CHAMPION' }],
  metadataBase: new URL(APP_URL),
  manifest: '/manifest.webmanifest',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'VocabWise',
  },
  openGraph: {
    title: 'VocabWise — App Học Từ Vựng Tiếng Anh Toàn Diện',
    description: '3 module tiếng Anh: Phonics IPA · Daily Pre-A1→C1 · VocabWise Academic IELTS/SAT. 5.100+ từ vựng. Song ngữ Việt–Anh. Dùng thử miễn phí!',
    url: APP_URL,
    siteName: 'VocabWise',
    type: 'website',
    locale: 'vi_VN',
    images: [{ url: `${APP_URL}/opengraph-image`, width: 1200, height: 630, alt: 'VocabWise — App học từ vựng tiếng Anh toàn diện' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VocabWise — App Học Từ Vựng Tiếng Anh Toàn Diện',
    description: 'Phát âm IPA · Từ vựng 5.100+ từ · IELTS/SAT. Song ngữ Việt–Anh. Dùng thử miễn phí!',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      '@id': `${APP_URL}/#app`,
      name: 'VocabWise',
      alternateName: ['VocabWise', 'VocabWise', 'VocabWise'],
      url: APP_URL,
      applicationCategory: 'EducationalApplication',
      applicationSubCategory: 'Language Learning',
      operatingSystem: 'Web, iOS, Android, Windows',
      inLanguage: ['vi', 'en'],
      description: 'App học tiếng Anh toàn diện song ngữ Việt–Anh: Phonics IPA, Daily 2.400+ từ Pre-A1→C1, VocabWise Academic 2.700+ từ IELTS/SAT A1→C2.',
      featureList: [
        '5.100+ từ vựng tiếng Anh theo khung CEFR Pre-A1→C2',
        'Daily: 6 cấp độ Seeker→Master cho trẻ em',
        'VocabWise Academic: từ vựng IELTS/SAT A1→C2',
        'Phonics IPA chuẩn Cambridge',
        '10+ trò chơi học từ vựng tương tác',
        'AI chấm điểm phát âm tiếng Anh',
        'Ôn tập thông minh theo spaced repetition',
        'Dashboard theo dõi tiến độ cho phụ huynh',
        'PWA — không cần cài app, dùng như app thật',
        'Song ngữ Việt–Anh',
      ],
      audience: {
        '@type': 'EducationalAudience',
        audienceType: 'Học sinh, sinh viên và phụ huynh học tiếng Anh',
        educationalRole: 'student',
      },
      offers: [
        { '@type': 'Offer', name: `Dùng thử ${TRIAL_DAYS} ngày`, price: '0', priceCurrency: 'VND',
          description: `${FREE_KIDS} hồ sơ bé, 1 chủ đề đầu mỗi level/book, 1 bài Phonics` },
        ...PAID_PLANS.map(p => ({ '@type': 'Offer', name: `Pro ${p.label}`, price: String(p.amount), priceCurrency: 'VND',
          description: PLAN_PERKS[p.key].map(x => x.replace(/^\S+ /, '')).join(', ') })),
      ],
      screenshot: `${APP_URL}/opengraph-image`,
      author: { '@id': `${APP_URL}/#org` },
    },
    {
      '@type': 'Organization',
      '@id': `${APP_URL}/#org`,
      name: 'IELTS CHAMPION',
      url: APP_URL,
      description: 'Trung tâm Anh ngữ chuyên IELTS/SAT do Thầy Andie Nguyễn sáng lập',
      founder: {
        '@type': 'Person',
        name: 'Andie Nguyễn',
        description: 'IELTS 8.5 Overall (Writing 8.5), Thạc sỹ MBA Anh Quốc, Tốt nghiệp NUS Singapore, hơn 10 năm kinh nghiệm giảng dạy IELTS/SAT',
        knowsAbout: ['IELTS', 'SAT', 'English Vocabulary', 'Language Learning'],
      },
      sameAs: ['https://zalo.me/0977347707'],
    },
    {
      '@type': 'WebSite',
      '@id': `${APP_URL}/#website`,
      url: APP_URL,
      name: 'VocabWise',
      description: 'App học từ vựng tiếng Anh toàn diện song ngữ Việt–Anh',
      publisher: { '@id': `${APP_URL}/#org` },
    },
  ],
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get('x-nonce') ?? ''
  return (
    <html lang="vi" className="light">
      <head>
        <script
          nonce={nonce}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 ${nunito.className}`}>
        <GameSyncProvider>
          <FontSizeApplier />
          <PullToRefresh />
          <ChildMascotProvider>
            <MainContainer>{children}</MainContainer>
          </ChildMascotProvider>
          <OfflineBanner />
          <NoVoiceBanner />
          <BottomNav />
        </GameSyncProvider>
        <Analytics />
        <PwaRegister />
      </body>
    </html>
  )
}
