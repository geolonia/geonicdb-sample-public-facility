/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.')
  return {
    base: env.VITE_BASE || '/',
    plugins: [react()],
    server: {
      // 開発時: /v2, /ngsi-ld, /version 等の API リクエストをローカル GeonicDB に転送
      proxy: {
        '/v2': 'http://localhost:3001',
        '/ngsi-ld': 'http://localhost:3001',
        '/version': 'http://localhost:3001',
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
    },
  }
})
