import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

const basePath = process.env.BASE_PATH
  ? `/${process.env.BASE_PATH}/`
  : '/'

export default defineConfig({
  plugins: [vue()],
  base: basePath,
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
