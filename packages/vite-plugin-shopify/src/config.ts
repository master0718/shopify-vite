import path from 'path'
import { Plugin, UserConfig } from 'vite'
import glob from 'fast-glob'
import createDebugger from 'debug'

import { ResolvedVitePluginShopifyOptions } from './options'

const debug = createDebugger('vite-plugin-shopify:config')

// Plugin for setting necessary Vite config to support Shopify plugin functionality
export default function shopifyConfig (options: ResolvedVitePluginShopifyOptions): Plugin {
  const sourceCodeDir = path.resolve(options.sourceCodeDir)

  return {
    name: 'vite-plugin-shopify-config',
    config (config: UserConfig): UserConfig {
      const host = config.server?.host ?? 'localhost'
      const port = config.server?.port ?? 5173
      const https = config?.server?.https
      const protocol = https === true ? 'https:' : 'http:'
      const origin = `${protocol}//${host as string}:${port}`

      debug({ host, port, https, protocol, origin })

      const generatedConfig: UserConfig = {
        // Use relative base path so to load imported assets from Shopify CDN
        base: './',
        // Do not use "public" directory
        publicDir: false,
        build: {
          // Output files to "assets" directory
          outDir: path.join(options.themeRoot, 'assets'),
          // Do not use subfolder for static assets
          assetsDir: '',
          // Clear output directory before each build
          emptyOutDir: true,
          // Configure bundle entry points
          rollupOptions: {
            input: glob.sync(path.join(options.entrypointsDir, '**/*'), { onlyFiles: true })
          },
          // Output manifest file for backend integration
          manifest: true
        },
        resolve: {
          // Provide import alias to source code dir for convenience
          alias: {
            '~': sourceCodeDir,
            '@': sourceCodeDir
          }
        },
        server: {
          host: true,
          origin
        }
      }

      return generatedConfig
    }
  }
}
