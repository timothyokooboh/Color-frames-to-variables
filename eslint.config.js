import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import vue from 'eslint-plugin-vue'
import accessibility from 'eslint-plugin-vuejs-accessibility'
import globals from 'globals'
import ts from 'typescript-eslint'

export default ts.config(
  { ignores: ['**/node_modules/**', '**/dist/**', '**/coverage/**', '.agents/**'] },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...vue.configs['flat/recommended'],
  ...accessibility.configs['flat/recommended'],
  {
    files: ['scripts/**/*.mjs', '*.config.js'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: ts.parser, extraFileExtensions: ['.vue'] } },
    rules: {
      'max-lines': ['error', { max: 180, skipBlankLines: true, skipComments: true }],
      'vue/max-lines-per-block': ['error', { script: 80, template: 100, style: 60 }],
    },
  },
  {
    files: ['apps/ui/**/*.{ts,vue}'],
    rules: { 'no-restricted-imports': ['error', { patterns: ['**/apps/plugin/**', '@figma/*'] }] },
  },
  {
    files: ['apps/plugin/src/**/*.ts', 'packages/contracts/src/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: ['vue', 'pinia', 'reka-ui', '**/apps/ui/**'] },
      ],
    },
  },
  prettier,
)
