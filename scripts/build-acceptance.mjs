import { build } from 'vite'
import { mkdir, writeFile } from 'node:fs/promises'
await build({
  configFile: false,
  build: {
    outDir: 'dist/acceptance',
    emptyOutDir: true,
    target: 'es2017',
    minify: false,
    lib: {
      entry: 'apps/plugin/src/acceptance/main.ts',
      name: 'NativeAcceptance',
      formats: ['iife'],
      fileName: () => 'code.js',
    },
  },
})
await mkdir('dist/acceptance', { recursive: true })
await writeFile(
  'dist/acceptance/manifest.json',
  JSON.stringify(
    {
      name: 'Color Palette — Native acceptance (empty file only)',
      api: '1.0.0',
      main: 'code.js',
      editorType: ['figma'],
      documentAccess: 'dynamic-page',
      networkAccess: { allowedDomains: ['none'] },
    },
    null,
    2,
  ) + '\n',
)
