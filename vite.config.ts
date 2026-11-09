import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@':fileURLToPath(new URL('./src',import.meta.url)) } },
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        icons: fileURLToPath(new URL('./previews/icons.html', import.meta.url)),
        news: fileURLToPath(new URL('./previews/news.html', import.meta.url)),
        subscriptions: fileURLToPath(new URL('./previews/subscriptions.html', import.meta.url)),
        contributors: fileURLToPath(new URL('./previews/contributors.html', import.meta.url)),
        columnFilters: fileURLToPath(new URL('./previews/column-filters.html', import.meta.url)),
        homeControls: fileURLToPath(new URL('./previews/home-controls.html', import.meta.url)),
        filterPanel: fileURLToPath(new URL('./previews/filter-panel.html', import.meta.url)),
      },
    },
  },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
