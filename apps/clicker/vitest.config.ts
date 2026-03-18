import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig({
  plugins: [svelte({ hot: false })],
  resolve: {
    conditions: ['browser'],
    alias: {
      '$app/paths': resolve(__dirname, './src/__mocks__/paths.ts'),
      '$app/stores': resolve(__dirname, './src/__mocks__/stores.ts'),
      '$lib': resolve(__dirname, './src/lib'),
      '@clicker/atproto-idb': resolve(__dirname, '../../packages/atproto-idb/src/index.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  },
});
