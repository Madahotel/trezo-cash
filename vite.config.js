
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';



export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'F:/Upskill/Trezocash/git/trezo.cash/public/react',
    emptyOutDir: true,
    manifest: true, // zava-dehibe
  },
  // base: '/react/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

