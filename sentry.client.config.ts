import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Capture 10% of sessions for performance (free tier friendly)
  tracesSampleRate: 0.1,

  // Don't send errors in dev
  enabled: process.env.NODE_ENV === 'production',

  // Ignore common non-actionable errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
    /^Network request failed/,
    /^Load failed/,
  ],
})
