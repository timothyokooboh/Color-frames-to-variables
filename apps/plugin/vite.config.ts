import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: '../../dist/plugin',
    emptyOutDir: true,
    target: 'es2017',
    minify: false,
    lib: {
      entry: fileURLToPath(new URL('./src/main.ts', import.meta.url)),
      name: 'ColorFramesPlugin',
      formats: ['iife'],
      fileName: () => 'code.js',
    },
  },
})
