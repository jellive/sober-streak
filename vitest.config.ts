import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/hooks/**'],
      thresholds: { 'src/lib/**': { statements: 100, branches: 100, functions: 100, lines: 100 } },
    },
  },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
});
