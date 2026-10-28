import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias: {
      '@pawstay/shared': path.resolve(__dirname, './packages/shared/src/index.ts'),
      '@pawstay/db': path.resolve(__dirname, './packages/db/src/index.ts'),
    },
  },
});
