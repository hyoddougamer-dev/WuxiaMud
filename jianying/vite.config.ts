import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    // Capacitor serves from the filesystem; keep assets inlined small and paths relative.
    assetsInlineLimit: 8192,
  },
  server: {
    host: '127.0.0.1',
    port: 5273,
  },
})
