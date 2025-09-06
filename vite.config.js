import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    proxy: {},
    historyApiFallback: true,
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  // Ensures proper client-side routing
  preview: {
    historyApiFallback: {
      rewrites: [
        { from: /^\/.*$/, to: '/index.html' },
      ],
    },
  },
})
