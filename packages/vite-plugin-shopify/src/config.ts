import path from 'path'
import { Plugin, UserConfig } from 'vite'
import glob from 'fast-glob'

import { ResolvedVitePluginShopifyOptions } from './options'

// Plugin for setting necessary Vite config to support Shopify plugin functionality
export default function shopifyConfig (options: ResolvedVitePluginShopifyOptions): Plugin {
  return {
    name: 'vite-plugin-shopify-config',
    config () {
      const generatedConfig: UserConfig = {
        base: '',
        // Do not use public directory
        publicDir: false,
        build: {
          // Output static files to "assets" directory
          outDir: path.join(options.themeRoot, 'assets'),
          // Do not use subfolder for output assets
          assetsDir: '',
          // Clear output directory before each build
          emptyOutDir: true,
          // Configure bundle entry points
          rollupOptions: {
            input: glob.sync(path.join(options.entrypointsDir, '**.*'), { onlyFiles: true })
          }
        },
        resolve: {
          alias: {
            '~': options.themeRoot,
            '@': options.themeRoot
          }
        },
        server: {
          host: true
        }
      }

      return generatedConfig
    }
  }
}
