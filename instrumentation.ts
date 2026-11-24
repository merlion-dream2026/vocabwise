export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

// Reports errors thrown in Server Components, route handlers and server actions
export { captureRequestError as onRequestError } from '@sentry/nextjs'
