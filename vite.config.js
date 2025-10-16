
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';



export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../../back_tresocash/lucid_api_trezocash/public/react',
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

