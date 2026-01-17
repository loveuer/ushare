import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:9119',
        changeOrigin: true
      },
      '/api/ulocal/ws': {
        target: 'ws://127.0.0.1:9119',
        rewriteWsOrigin: true,
        ws: true,
      },
      '/ushare': {
        target: 'http://127.0.0.1:9119',
        changeOrigin: true
      },
    }
  }
})
