import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Node 25+ ships a global localStorage stub that shadows the DOM env's, so every
// localStorage call in tests hits undefined (vitest-dev/vitest#8757, won't fix).
const nodeMajor = Number(process.versions.node.split('.')[0]);

export default defineConfig({
  plugins: [react()],
  test: {
    ...(nodeMajor >= 25 && { execArgv: ['--no-experimental-webstorage'] }),
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/hooks/**'],
      thresholds: { 'src/lib/**': { statements: 100, branches: 100, functions: 100, lines: 100 } },
    },
  },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
});
