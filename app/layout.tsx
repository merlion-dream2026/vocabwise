import type { Metadata, Viewport } from 'next'
import { Nunito } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import PwaRegister from '@/components/PwaRegister'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '600', '700', '800', '900'],
  display: 'swap',
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vocabwise.vercel.app'

export const viewport: Viewport = {
  themeColor: '#9333ea',
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'VocabWise — App Học Từ Vựng Tiếng Anh Cho Bé',
  description: 'VocabWise — App học từ vựng tiếng Anh song ngữ Việt–Anh dành riêng cho trẻ em. 2.300+ từ vựng, 6 cấp độ CEFR (Pre-A1 đến C1-C2), 10+ trò chơi tương tác, AI chấm phát âm. Dùng thử miễn phí 7 ngày.',
  keywords: [
    'VocabWise', 'vocab wise', 'vocabwise', 'vocab kids pro',
    'app học từ vựng tiếng anh cho bé', 'học tiếng anh cho trẻ em',
    'app học từ vựng trẻ em', 'học từ vựng tiếng anh online',
    'game học tiếng anh cho bé', 'flashcard tiếng anh trẻ em',
    'IELTS CHAMPION', 'học tiếng anh CEFR',
  ],
  authors: [{ name: 'Andie Nguyễn — IELTS CHAMPION' }],
  metadataBase: new URL(APP_URL),
  manifest: '/manifest.webmanifest',
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  alternates: { canonical: '/' },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'VocabWise',
  },
  openGraph: {
    title: 'VocabWise — App Học Từ Vựng Tiếng Anh Cho Bé',
    description: 'App học từ vựng Việt–Anh với 2.300+ từ, 6 cấp độ CEFR, 10+ trò chơi. AI chấm phát âm. Không cần cài app — dùng thử miễn phí!',
    url: APP_URL,
    siteName: 'VocabWise',
    type: 'website',
    locale: 'vi_VN',
    images: [{ url: `${APP_URL}/opengraph-image`, width: 1200, height: 630, alt: 'VocabWise — App học từ vựng tiếng Anh cho bé' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VocabWise — App Học Từ Vựng Tiếng Anh Cho Bé',
    description: 'App học từ vựng Việt–Anh: 2.300+ từ, 6 cấp độ, 10+ game, AI phát âm. Dùng thử miễn phí!',
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'VocabWise là gì?',
      acceptedAnswer: { '@type': 'Answer', text: 'VocabWise (VocabWise) là app học từ vựng tiếng Anh song ngữ Việt–Anh dành riêng cho trẻ em. App có 2.300+ từ vựng, 6 cấp độ CEFR (Pre-A1 đến C1-C2) và 10+ trò chơi tương tác.' },
    },
    {
      '@type': 'Question',
      name: 'App VocabWise có cần cài xuống không?',
      acceptedAnswer: { '@type': 'Answer', text: 'Không! VocabWise là PWA — bé chỉ cần vào trình duyệt là học ngay. Ba/Mẹ có thể Thêm vào màn hình chính để dùng như app thật trên iPhone, Android, iPad và PC.' },
    },
    {
      '@type': 'Question',
      name: 'Dùng thử VocabWise miễn phí được không?',
      acceptedAnswer: { '@type': 'Answer', text: 'Có! Đăng ký miễn phí và dùng thử 7 ngày không cần thẻ tín dụng. Gói Free cho bé học topic đầu tiên của mỗi level với toàn bộ trò chơi.' },
    },
    {
      '@type': 'Question',
      name: 'Một tài khoản VocabWise dùng được cho mấy bé?',
      acceptedAnswer: { '@type': 'Answer', text: 'Gói Free: 1 bé. Gói Pro: tối đa 3 bé trong cùng 1 tài khoản gia đình, mỗi bé có hồ sơ và tiến độ riêng.' },
    },
    {
      '@type': 'Question',
      name: 'Bé bao nhiêu tuổi phù hợp với VocabWise?',
      acceptedAnswer: { '@type': 'Answer', text: 'VocabWise phù hợp cho bé từ 4–15 tuổi. Level Seeker (Pre-A1) cho bé bắt đầu, đến Master (C1-C2) cho bé nâng cao.' },
    },
  ],
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
      description: 'App học từ vựng tiếng Anh song ngữ Việt–Anh dành riêng cho trẻ em. 2.300+ từ vựng, 6 cấp độ CEFR (Pre-A1 đến C1-C2), 10+ trò chơi tương tác, AI chấm điểm phát âm.',
      featureList: [
        '2.300+ từ vựng tiếng Anh theo khung CEFR',
        '6 cấp độ: Seeker (Pre-A1) đến Master (C1-C2)',
        '10+ trò chơi học từ vựng tương tác',
        'AI chấm điểm phát âm tiếng Anh',
        'Ôn tập thông minh theo spaced repetition',
        'Dashboard theo dõi tiến độ cho phụ huynh',
        'PWA — không cần cài app, dùng như app thật',
        'Song ngữ Việt–Anh',
        'Streak, XP, huy hiệu gamification',
      ],
      audience: {
        '@type': 'EducationalAudience',
        audienceType: 'Trẻ em học tiếng Anh',
        educationalRole: 'student',
      },
      offers: [
        {
          '@type': 'Offer',
          name: 'Free — Dùng thử 7 ngày',
          price: '0',
          priceCurrency: 'VND',
          description: '1 hồ sơ bé, 1 chủ đề đầu mỗi level, tất cả trò chơi',
        },
        {
          '@type': 'Offer',
          name: 'Pro 1 tháng',
          price: '59000',
          priceCurrency: 'VND',
          description: 'Toàn bộ 30 chủ đề/level, tối đa 3 bé, báo cáo email hàng tuần',
        },
        {
          '@type': 'Offer',
          name: 'Pro 3 tháng',
          price: '159000',
          priceCurrency: 'VND',
        },
        {
          '@type': 'Offer',
          name: 'Pro 6 tháng',
          price: '299000',
          priceCurrency: 'VND',
        },
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
      description: 'App học từ vựng tiếng Anh cho bé',
      publisher: { '@id': `${APP_URL}/#org` },
    },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className="light">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </head>
      <body className={`min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 ${nunito.className}`}>
        <main className="max-w-md mx-auto min-h-screen">
          {children}
        </main>
        <Analytics />
        <PwaRegister />
      </body>
    </html>
  )
}
