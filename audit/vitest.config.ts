import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// path.resolve() emits backslashes on Windows, and picomatch reads `\"` as an
// escape sequence — the suite then silently discovers 0 test files and exits.
// Glob patterns must always use forward slashes, on every platform.
const glob = (target: string) => path.resolve(__dirname, target).split(path.sep).join('/');

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, '..') } },
  define: { 'process.env.GEMINI_API_KEY': JSON.stringify('test') },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [path.resolve(__dirname, 'setup.ts')],
    include: [
      glob('**/*.test.ts?(x)'),
      // Grammar lib tests live with the domain code under src/lib/grammar.
      glob('../src/lib/grammar/**/*.test.ts?(x)'),
    ],
    testTimeout: 60000,
    hookTimeout: 60000,
    pool: 'forks',
  },
});
