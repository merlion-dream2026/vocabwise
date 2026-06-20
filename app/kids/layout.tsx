import type { Metadata } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vocabwise.id.vn'

export const metadata: Metadata = {
  title: 'VocabWise Kids — Học Từ Vựng Tiếng Anh Cho Trẻ Em',
  description: 'Học từ vựng tiếng Anh cho trẻ em với VocabWise Kids. 6 cấp độ Pre-A1→C1 · 2.300+ từ vựng · 10 trò chơi tương tác. Flashcard song ngữ Việt–Anh. Phát âm AI.',
  keywords: [
    'VocabWise Kids', 'học tiếng anh cho trẻ em', 'app học từ vựng tiếng anh trẻ em',
    'flashcard tiếng anh', 'game học từ vựng', 'học tiếng anh CEFR',
    'tiếng anh cho bé', 'luyện từ vựng tiếng anh', 'học tiếng anh online',
    'seeker starter ranger explorer scholar master',
  ],
  alternates: { canonical: '/kids' },
  openGraph: {
    title: 'VocabWise Kids — Học Từ Vựng Tiếng Anh Cho Trẻ Em',
    description: '6 cấp độ Pre-A1→C1 · 2.300+ từ · 10 games tương tác · Phát âm AI. Flashcard song ngữ Việt–Anh. Dùng thử miễn phí 7 ngày!',
    url: `${APP_URL}/kids`,
    siteName: 'VocabWise',
    type: 'website',
    locale: 'vi_VN',
    images: [{ url: `${APP_URL}/opengraph-image`, width: 1200, height: 630, alt: 'VocabWise Kids — Học từ vựng tiếng Anh cho trẻ em' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VocabWise Kids — Học Từ Vựng Tiếng Anh Cho Trẻ Em',
    description: '6 cấp độ Pre-A1→C1 · 2.300+ từ · 10 games · Phát âm AI. Dùng thử miễn phí!',
  },
}

export default function KidsLayout({ children }: { children: React.ReactNode }) {
  return children
}
