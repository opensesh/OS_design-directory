import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import resources from './src/data/resources.json'
import { SITE_ORIGIN } from './src/lib/canonical'
import { renderNotFound, renderPages } from './src/lib/prerender'
import type { NormalizedResource } from './src/types/resource'

// opensession.co/directory proxies to this app, so it lives under /directory/ everywhere:
// built URLs carry the prefix, and the build lands in dist/directory so Vercel serves the
// files at the same paths (vercel.json covers clean URLs and the API).
const BASE = '/directory/'
const OUTPUT_ROOT = 'dist'

/**
 * After the build, writes an HTML file for every route (the directory and each resource) and
 * a 404 page at the output root, so crawlers read real content and unknown addresses 404.
 * See src/lib/prerender.ts.
 */
function prerenderRoutes(): Plugin {
  let root = ''
  let outDir = ''
  return {
    name: 'prerender-routes',
    apply: 'build',
    configResolved(config) {
      root = config.root
      outDir = path.resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const template = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')
      const opts = { origin: SITE_ORIGIN, basename: BASE.replace(/\/$/, '') }

      for (const page of renderPages(template, resources as NormalizedResource[], opts)) {
        const file = path.join(outDir, page.file)
        fs.mkdirSync(path.dirname(file), { recursive: true })
        fs.writeFileSync(file, page.html)
      }
      fs.writeFileSync(path.resolve(root, OUTPUT_ROOT, '404.html'), renderNotFound(template, opts))
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  base: BASE,
  plugins: [react(), prerenderRoutes()],
  build: {
    outDir: `${OUTPUT_ROOT}${BASE}`,
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
