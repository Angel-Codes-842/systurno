import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://127.0.0.1:8000',
        ws: true,
        changeOrigin: true,
        rewriteWsOrigin: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, req, _res) => {
            console.warn('[vite-proxy] websocket error:', err.message, 'for url:', req.url);
          });
          proxy.on('proxyReqWs', (_proxyReq, req, _socket, _options, _head) => {
            console.log('[vite-proxy] proxying websocket connection for url:', req.url);
          });
          proxy.on('close', (_res: unknown, _socket: unknown, _head: unknown) => {
            console.log('[vite-proxy] websocket proxy socket closed');
          });
        }
      },
      '/media': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    target: 'es2015',
  },
})
