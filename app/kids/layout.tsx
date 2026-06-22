import type { Metadata } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vocabwise.id.vn'

export const metadata: Metadata = {
  title: 'Daily — Học Từ Vựng Tiếng Anh Hàng Ngày',
  description: 'Daily: học từ vựng tiếng Anh hàng ngày cho bé. 6 cấp độ Pre-A1→C1 · 2.300+ từ vựng · 10 trò chơi tương tác. Flashcard song ngữ Việt–Anh. Phát âm AI.',
  keywords: [
    'Daily VocabWise', 'học tiếng anh cho trẻ em', 'app học từ vựng tiếng anh trẻ em',
    'flashcard tiếng anh', 'game học từ vựng', 'học tiếng anh CEFR',
    'tiếng anh cho bé', 'luyện từ vựng tiếng anh', 'học tiếng anh online',
    'seeker starter ranger explorer scholar master',
  ],
  alternates: { canonical: '/kids' },
  openGraph: {
    title: 'Daily — Học Từ Vựng Tiếng Anh Hàng Ngày',
    description: '6 cấp độ Pre-A1→C1 · 2.300+ từ · 10 games tương tác · Phát âm AI. Flashcard song ngữ Việt–Anh. Dùng thử miễn phí 7 ngày!',
    url: `${APP_URL}/kids`,
    siteName: 'VocabWise',
    type: 'website',
    locale: 'vi_VN',
    images: [{ url: `${APP_URL}/opengraph-image`, width: 1200, height: 630, alt: 'Daily — Học từ vựng tiếng Anh hàng ngày' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daily — Học Từ Vựng Tiếng Anh Hàng Ngày',
    description: '6 cấp độ Pre-A1→C1 · 2.300+ từ · 10 games · Phát âm AI. Dùng thử miễn phí!',
  },
}

export default function KidsLayout({ children }: { children: React.ReactNode }) {
  return children
}
