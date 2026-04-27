// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';

import vue from '@astrojs/vue';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  integrations: [mdx(), vue()],
  legacy: {
    collectionsBackwardsCompat: true,
  },
  vite: {
    plugins: [tailwindcss()]
  }
});