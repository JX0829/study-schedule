import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// 家长端配置
export default defineConfig({
  plugins: [react()],
  root: 'parent',
  server: {
    port: 5555,
    host: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})