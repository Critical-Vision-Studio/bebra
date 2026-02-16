import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/auth': { target: 'http://localhost:8000', changeOrigin: true },
      '/users': { target: 'http://localhost:8000', changeOrigin: true },
      '/message-sets': { target: 'http://localhost:8000', changeOrigin: true },
      '/friendships': { target: 'http://localhost:8000', changeOrigin: true },
      '/tinder-bother': { target: 'http://localhost:8000', changeOrigin: true },
      '/health': { target: 'http://localhost:8000', changeOrigin: true },
      '/ws': { target: 'http://localhost:8000', changeOrigin: true, ws: true },
    },
  },
})