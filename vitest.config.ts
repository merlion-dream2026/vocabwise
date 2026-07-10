import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    exclude: ['**/node_modules/**', '**/e2e/**', '.claude/**'],
    env: {
      // Test-only placeholder so lib/session.ts's fail-fast check doesn't block the suite —
      // never used for real sessions, has no bearing on the production/dev secret.
      JWT_SECRET: 'test-only-jwt-secret-not-for-production-use-0000',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
