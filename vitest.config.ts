import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('./apps/ui/src', import.meta.url)) } },
  test: {
    projects: [
      {
        extends: true,
        test: { name: 'ui', environment: 'jsdom', include: ['apps/ui/**/*.test.ts'] },
      },
      {
        extends: true,
        test: {
          name: 'controller',
          environment: 'node',
          include: ['apps/plugin/**/*.test.ts', 'packages/**/*.test.ts'],
        },
      },
    ],
    passWithNoTests: true,
  },
})
