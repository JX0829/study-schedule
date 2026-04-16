import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// 孩子端配置
export default defineConfig({
  plugins: [react()],
  root: '.',
  server: {
    port: 3333,
    host: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})