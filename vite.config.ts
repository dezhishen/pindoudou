import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { readFileSync, writeFileSync } from 'fs'

/** 构建前自动编译 i18n YAML → TS */
function i18nPrebuild(): Plugin {
  return {
    name: 'i18n-prebuild',
    buildStart() {
      try {
        const yamlPath = resolve(__dirname, 'src/i18n/locales.yaml')
        const tsPath = resolve(__dirname, 'src/i18n/index.ts')
        const yaml = readFileSync(yamlPath, 'utf8')
        const result: Record<string, Record<string, string>> = { 'zh-CN': {}, 'en': {}, 'zh-TW': {} }
        let currentKey = ''
        for (const line of yaml.split('\n')) {
          const t = line.trim()
          if (!t || t.startsWith('#')) continue
          if (/^[\w.-]+:\s*$/.test(t)) { currentKey = t.replace(/:.*$/, ''); continue }
          if (!currentKey) continue
          const m = t.match(/^([\w-]+):\s*(.*)$/)
          if (m) {
            let v = m[2]
            if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) v = v.slice(1, -1)
            result[m[1]][currentKey] = v
          }
        }
        let out = ''
        for (const [locale, keys] of Object.entries(result)) {
          out += `  '${locale}': {\n`
          for (const [k, v] of Object.entries(keys)) {
            const esc = v.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')
            out += `    '${k}': '${esc}',\n`
          }
          out += '  },\n'
        }
        let idx = readFileSync(tsPath, 'utf8')
        const startMarker = 'const messages: Record<string, Record<string, string>> = {'
        const startPos = idx.indexOf(startMarker)
        const afterMessages = idx.indexOf('\n// ========== i18n', startPos)
        if (startPos >= 0 && afterMessages > startPos) {
          const template = idx.substring(0, startPos)
          const tail = idx.substring(afterMessages)
          let msgBlock = startMarker + '\n'
          msgBlock += out
          msgBlock += '}\n'
          idx = template + msgBlock + tail
        }
        writeFileSync(tsPath, idx)
        console.log(`[i18n] Compiled ${Object.keys(result).length} locales, ${Object.keys(result['zh-CN']).length} keys`)
      } catch (e: any) {
        console.warn('[i18n] Build failed, using cached translations:', e.message)
      }
    },
  }
}

export default defineConfig({
  plugins: [vue(), i18nPrebuild()],
  base: './',
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
    target: 'es2020',
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router'],
        },
      },
    },
  },
})
