import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// 多页面应用配置 - 孩子端和家长端共享同一端口和 localStorage
// localhost:3333/ → 孩子端
// localhost:3333/parent/index.html → 家长端

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3333,
    host: true,
    allowedHosts: ['sp.1231506.xyz'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        parent: path.resolve(__dirname, 'parent/index.html'),
      },
    },
  },
})