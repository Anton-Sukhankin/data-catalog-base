import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    assetsInlineLimit: 0,
    cssCodeSplit: false,
    rollupOptions: {
      input: { index: 'src/index.ts' },
      preserveEntrySignatures: 'strict',
      external: /^(react(?:-dom|-router)?|lucide-react|radix-ui|@tanstack\/react-table)(?:\/|$)/,
      output: {
        entryFileNames: '[name].js',
        assetFileNames: asset => asset.names.includes('style.css') ? 'styles.css' : 'assets/[name]-[hash][extname]',
      },
    },
  },
});
