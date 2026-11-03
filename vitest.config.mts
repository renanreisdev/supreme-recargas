import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Unit tests: never talk to a real Supabase project.
 * The Supabase client is pointed at an unreachable local address so any
 * accidental network call fails fast instead of writing to production data.
 * Integration tests live in tests/integration and run via `npm run test:integration`.
 */
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 15000,
    include: ['tests/unit/**/*.test.ts'],
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:1',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'unit-test-offline-key',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
});
