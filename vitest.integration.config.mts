import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Integration tests write real data. They MUST run against a dedicated
 * test/staging Supabase project, never production.
 *
 *   SUPABASE_TEST_URL=https://<test-project>.supabase.co \
 *   SUPABASE_TEST_ANON_KEY=... npm run test:integration
 */
const url = process.env.SUPABASE_TEST_URL;
const key = process.env.SUPABASE_TEST_ANON_KEY;

if (!url || !key) {
  throw new Error(
    'Integration tests require SUPABASE_TEST_URL and SUPABASE_TEST_ANON_KEY pointing to a NON-production Supabase project.'
  );
}

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    testTimeout: 30000,
    include: ['tests/integration/**/*.test.ts'],
    env: {
      NEXT_PUBLIC_SUPABASE_URL: url,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: key,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
});
