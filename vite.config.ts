import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  server: {
    port: 3001,
    // Proxy API requests to Vercel dev server when running standalone Vite
    // For full API support, use `vercel dev` instead of `bun dev`
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // If Vercel dev isn't running, requests will fail gracefully
        // and the client will use fallback parsing
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
