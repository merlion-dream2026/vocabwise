import type { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://vocabwise.id.vn'

// Public marketing + auth pages are crawlable; everything behind login is not worth crawling.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/dashboard', '/kids', '/vocabwise', '/my-words', '/ielts-speaking', '/superadmin', '/onboarding'],
    },
    sitemap: `${APP_URL}/sitemap.xml`,
  }
}
