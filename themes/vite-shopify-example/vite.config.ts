import { defineConfig } from 'vite'
import shopify from 'vite-plugin-shopify'
import shopifyModules from 'vite-plugin-shopify-modules'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  server: {
    host: true,
    https: true
  },
  plugins: [
    basicSsl(),
    shopify({
      additionalEntrypoints: [
        'frontend/foo.ts', // relative to sourceCodeDir
        'resources/bar.ts', // relative to themeRoot
        'modules/**/*.{ts,js}'
      ]
    }),
    shopifyModules()
  ],
  build: {
    sourcemap: true
  }
})
