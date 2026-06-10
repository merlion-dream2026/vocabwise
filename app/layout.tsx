import type { Metadata, Viewport } from 'next'
import { Nunito } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import PwaRegister from '@/components/PwaRegister'
import NoVoiceBanner from '@/components/NoVoiceBanner'
import BottomNav from '@/components/BottomNav'
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
  title: 'VocabWise — App Học Từ Vựng Tiếng Anh Toàn Diện',
  description: 'Học tiếng Anh toàn diện: Phát âm IPA chuẩn · Từ vựng Pre-A1→C1 cho bé · IELTS/SAT A1→C2. Song ngữ Việt–Anh · 4.500+ từ · Dùng thử miễn phí 7 ngày.',
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
  alternates: { canonical: '/' },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'VocabWise',
  },
  openGraph: {
    title: 'VocabWise — App Học Từ Vựng Tiếng Anh Toàn Diện',
    description: '3 module tiếng Anh: Luyện Phát Âm IPA · VocabWise Daily Pre-A1→C1 · VocabWise Academic IELTS/SAT. 4.500+ từ vựng. Song ngữ Việt–Anh. Dùng thử miễn phí!',
    url: APP_URL,
    siteName: 'VocabWise',
    type: 'website',
    locale: 'vi_VN',
    images: [{ url: `${APP_URL}/opengraph-image`, width: 1200, height: 630, alt: 'VocabWise — App học từ vựng tiếng Anh toàn diện' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VocabWise — App Học Từ Vựng Tiếng Anh Toàn Diện',
    description: 'Phát âm IPA · Từ vựng 4.500+ từ · IELTS/SAT. Song ngữ Việt–Anh. Dùng thử miễn phí!',
  },
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'VocabWise là gì?',
      acceptedAnswer: { '@type': 'Answer', text: 'VocabWise là app học tiếng Anh toàn diện song ngữ Việt–Anh với 3 module: Luyện Phát Âm IPA, VocabWise Daily (4.500+ từ, Pre-A1→C1 cho trẻ em) và VocabWise Academic (từ vựng IELTS/SAT, A1→C2).' },
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
      name: 'VocabWise phù hợp với lứa tuổi nào?',
      acceptedAnswer: { '@type': 'Answer', text: 'VocabWise phù hợp cho mọi lứa tuổi: VocabWise Daily dành cho bé 4–15 tuổi (Pre-A1→C1), Luyện Phát Âm IPA cho mọi người, và VocabWise Academic cho học sinh cấp 2-3, sinh viên luyện IELTS/SAT (A1→C2).' },
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
      description: 'App học tiếng Anh toàn diện song ngữ Việt–Anh: Luyện Phát Âm IPA, VocabWise Daily 4.500+ từ Pre-A1→C1, VocabWise Academic IELTS/SAT A1→C2.',
      featureList: [
        '4.500+ từ vựng tiếng Anh theo khung CEFR Pre-A1→C2',
        'VocabWise Daily: 6 cấp độ Seeker→Master cho trẻ em',
        'VocabWise Academic: từ vựng IELTS/SAT A1→C2',
        'Luyện Phát Âm IPA chuẩn Cambridge',
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
      description: 'App học từ vựng tiếng Anh toàn diện song ngữ Việt–Anh',
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
        <main className="max-w-md mx-auto min-h-screen pb-16">
          {children}
        </main>
        <NoVoiceBanner />
        <BottomNav />
        <Analytics />
        <PwaRegister />
      </body>
    </html>
  )
}
