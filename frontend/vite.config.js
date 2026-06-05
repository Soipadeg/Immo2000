/**
 * Configuration Vite pour le frontend
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://backend:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
      '/health': {
        target: 'http://backend:5000',
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,

    // Code splitting configuration (Phase 4.4)
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks (dépendances externes)
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-state': ['zustand'],
          'vendor-form': ['react-hook-form', 'zod', '@hookform/resolvers'],
          'vendor-ui': ['@mui/material', '@mui/icons-material'],
          'vendor-axios': ['axios'],

          // Feature chunks (fonctionnalités)
          'store': [
            './src/store/authStore.js',
            './src/store/notificationStore.js',
            './src/store/uiStore.js',
          ],
          'api': [
            './src/services/api/client.js',
            './src/services/api/auth.js',
            './src/services/api/listings.js',
            './src/services/api/messages.js',
            './src/services/api/offers.js',
          ],
          'forms': [
            './src/components/forms/schemas.js',
            './src/components/forms/FormField.jsx',
          ],
        },
      },
    },
  },

  // Optimization pour les previews
  preview: {
    port: 3000,
  },

  // Optimisation: minification et compression
  esbuild: {
    drop: ['console', 'debugger'],
  },
});
