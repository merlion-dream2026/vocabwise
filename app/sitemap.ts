import type { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vocabwise.id.vn'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${APP_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${APP_URL}/register`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${APP_URL}/login`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${APP_URL}/terms`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${APP_URL}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
