import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, '..') } },
  define: { 'process.env.GEMINI_API_KEY': JSON.stringify('test') },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [path.resolve(__dirname, 'setup.ts')],
    include: [
      path.resolve(__dirname, '**/*.test.ts?(x)'),
      // Grammar lib tests live with the domain code under src/lib/grammar.
      path.resolve(__dirname, '../src/lib/grammar/**/*.test.ts?(x)'),
    ],
    testTimeout: 60000,
    hookTimeout: 60000,
    pool: 'forks',
  },
});
