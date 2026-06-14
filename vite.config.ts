/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
// vite.config.ts
export default defineConfig({
  plugins: [react(), legacy()],
  server: {
    proxy: {
      // Dev: el front pega a /api/... y se proxea al backend local.
      // (En prod no se usa este proxy: se sirve el build estático.)
      '/api': {
        target: 'http://localhost:4300',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    globals: true
  }
});

