import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  output: 'static',
  site: 'https://yushimoji.github.io',
  base: '/Signal-Chain-Preflight',
  trailingSlash: 'always',
});
