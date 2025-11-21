import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  envDir: './config', // Point to non-existent directory to disable .env loading
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
      '@main': path.resolve(__dirname, './src/main'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@preload': path.resolve(__dirname, './src/preload'),
    },
  },
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          redux: ['@reduxjs/toolkit', 'react-redux'],
          ui: ['recharts', 'framer-motion'],
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  optimizeDeps: {
    exclude: ['electron'],
  },
});

