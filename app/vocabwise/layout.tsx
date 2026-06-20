import type { Metadata } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vocabwise.id.vn'

export const metadata: Metadata = {
  title: 'VocabWise Academic — Từ Vựng IELTS/SAT A1–C2',
  description: 'Học từ vựng học thuật chuẩn IELTS/SAT với VocabWise Academic. 3 books · 180 chủ đề · 2.500+ từ CEFR A1→C2 · Passage, glossary song ngữ Việt–Anh + 8 dạng bài tập.',
  keywords: [
    'VocabWise Academic', 'từ vựng IELTS', 'từ vựng SAT', 'từ vựng học thuật',
    'luyện IELTS', 'luyện SAT', 'học tiếng anh CEFR', 'IELTS vocabulary',
    'book IELTS', 'từ vựng A1 đến C2', 'vocabulary IELTS SAT',
  ],
  alternates: { canonical: '/vocabwise' },
  openGraph: {
    title: 'VocabWise Academic — Từ Vựng IELTS/SAT A1–C2',
    description: 'Học từ vựng học thuật: 3 books · 180 chủ đề · 2.500+ từ CEFR A1→C2. Passage + glossary song ngữ + 8 dạng bài tập. Chuẩn IELTS/SAT.',
    url: `${APP_URL}/vocabwise`,
    siteName: 'VocabWise',
    type: 'website',
    locale: 'vi_VN',
    images: [{ url: `${APP_URL}/opengraph-image`, width: 1200, height: 630, alt: 'VocabWise Academic — Từ vựng IELTS/SAT A1–C2' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VocabWise Academic — Từ Vựng IELTS/SAT A1–C2',
    description: '3 books · 180 chủ đề · 2.500+ từ CEFR A1→C2. Passage + glossary song ngữ + 8 dạng bài tập.',
  },
}

export default function VocabWiseLayout({ children }: { children: React.ReactNode }) {
  return children
}
