import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@games': path.resolve(__dirname, './src/games'),
      '@components': path.resolve(__dirname, './src/components'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@assets': path.resolve(__dirname, './src/assets')
    }
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'phaser': ['phaser'],
          'react-vendor': ['react', 'react-dom', 'react-router-dom']
        }
      }
    }
  }
});
