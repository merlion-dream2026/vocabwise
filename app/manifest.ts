import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VocabWise',
    short_name: 'VocabWise',
    description: 'Học từ vựng tiếng Anh cho bé — 2.400+ từ, 6 cấp độ, 20 trò chơi',
    start_url: '/kids',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#faf5ff',
    theme_color: '#9333ea',
    categories: ['education'],
    icons: [
      { src: '/brand/app-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/brand/app-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/brand/app-icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
