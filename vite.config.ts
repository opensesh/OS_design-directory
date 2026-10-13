import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// opensession.co/directory proxies to this app, so it lives under /directory/ everywhere:
// built URLs carry the prefix, and the build lands in dist/directory so Vercel serves the
// files at the same paths (vercel.json covers the SPA fallback and the API).
const BASE = '/directory/'

// https://vitejs.dev/config/
export default defineConfig({
  base: BASE,
  plugins: [react()],
  build: {
    outDir: `dist${BASE}`,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ogl': ['ogl'],
        },
      },
    },
  },
  server: {
    port: 3001,
    // Proxy API requests to Vercel dev server when running standalone Vite
    // For full API support, use `vercel dev` instead of `bun dev`
    proxy: {
      [`${BASE}api`]: {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // vercel dev serves the functions at /api, without the base
        rewrite: (url) => url.slice(BASE.length - 1),
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
