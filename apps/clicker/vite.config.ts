import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    alias: {
      '@clicker/atproto-idb': resolve(__dirname, '../../packages/atproto-idb/src/index.ts'),
    },
  },
});
