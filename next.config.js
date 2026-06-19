/** @type {import('next').NextConfig} */
const { withSentryConfig } = require('@sentry/nextjs')

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://img.vietqr.io;
  font-src 'self';
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://va.vercel-scripts.com https://*.sentry.io;
  media-src 'self' blob:;
  worker-src 'self' blob:;
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
`.replace(/\n/g, ' ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
]

const nextConfig = {
  poweredByHeader: false,
  compress: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        source: '/_next/static/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/audio/(.*)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
    ]
  },
}

module.exports = withSentryConfig(nextConfig, {
  org: 'vocabwise',
  project: 'vocabwise-nextjs',
  silent: true,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: false,
})
