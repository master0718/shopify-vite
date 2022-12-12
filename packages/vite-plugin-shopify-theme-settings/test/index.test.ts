import { describe, expect, it, vi } from 'vitest'
import path from 'path'
import { build } from 'vite'
import shopifyThemeSettings from '../src'
import fs from 'fs/promises'

vi.mock('../src/package.ts', () => ({
  getPackage: () => ({
    name: 'vite-plugin-shopify-theme-settings',
    version: '0.0.0',
    author: 'Barrel, LLC'
  })
}))

describe('vite-plugin-shopify', () => {
  it('builds out settings_schema.json as expected', async () => {
    await build({
      logLevel: 'silent',
      plugins: [
        shopifyThemeSettings({
          themeRoot: path.join(__dirname, '__fixtures__'),
          schemaSourceDir: path.join(__dirname, '__fixtures__', 'config', 'src')
        })
      ],
      build: {
        emptyOutDir: false,
        outDir: path.join(__dirname, '__fixtures__'),
        rollupOptions: {
          input: path.join(__dirname, '__fixtures__', 'app.js')
        }
      }
    })

    const settingsSchema = await fs.readFile(path.join(__dirname, '__fixtures__', 'config', 'settings_schema.json'), { encoding: 'utf8' })

    expect(settingsSchema).toMatchSnapshot()
  })
})
