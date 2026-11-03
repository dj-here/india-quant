import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    env: {
      DATABASE_URL: 'file:./dev.db',
      NEXTAUTH_SECRET: 'test_secret_for_vitest_min_32_characters_long',
      NEXTAUTH_URL: 'http://localhost:3000',
    },
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './apps/web/src'),
      '@pawstay/db': path.resolve(__dirname, './packages/db/src/index.ts'),
    },
  },
});
