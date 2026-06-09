import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VocabWise',
    short_name: 'VocabWise',
    description: 'Học từ vựng tiếng Anh cho bé — 2.300+ từ, 6 cấp độ, 10+ trò chơi',
    start_url: '/kids',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#faf5ff',
    theme_color: '#9333ea',
    categories: ['education'],
    icons: [
      { src: '/icon', sizes: '192x192', type: 'image/png' },
      { src: '/icon', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
