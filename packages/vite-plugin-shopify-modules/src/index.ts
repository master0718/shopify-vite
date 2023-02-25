import { lstatSync, renameSync, unlinkSync, symlinkSync, existsSync, statSync } from 'node:fs'
import path from 'node:path'
import { Plugin, normalizePath } from 'vite'
import chokidar from 'chokidar'
import glob from 'fast-glob'
import createDebugger from 'debug'
import debounce from 'just-debounce'

import { VitePluginShopifyModulesOptions, resolveOptions } from './options'

const debug = createDebugger('vite-plugin-shopify:modules')

export default function shopifyModules (options: VitePluginShopifyModulesOptions = {}): Plugin {
  const resolvedOptions = resolveOptions(options)

  return {
    name: 'vite-plugin-shopify-modules',
    enforce: 'post',
    config () {
      return {
        resolve: {
          alias: {
            '@modules': path.resolve(resolvedOptions.modulesDir),
            '~modules': path.resolve(resolvedOptions.modulesDir)
          }
        }
      }
    },
    resolveId: async (id) => {
      // Check if path is within modules directory
      if (!path.relative(path.resolve(resolvedOptions.modulesDir), id).includes('..')) {
        try {
          const fileStat = statSync(id)

          // Check if path refers to folder instead of file
          if (fileStat.isDirectory()) {
            // Check if module script file exists matching folder name
            const results = await glob(`${id}/${path.basename(id)}.{js,jsx,ts,tsx}`, { onlyFiles: true })

            // Resolve to actual file path instead of module shorthand
            if (results.length > 0) {
              return results[0]
            }

            // No file matches the folder name
            return null
          }
        } catch (e) {
          // The dirctory does not exist
          return null
        }
      }
      return null
    },
    buildStart: async () => {
      const modulePaths = await glob(`${normalizePath(resolvedOptions.modulesDir)}/**/*.liquid`)

      // Link modules on build start
      modulePaths.forEach(modulePath => linkModule(modulePath, resolvedOptions))
    },
    configureServer () {
      const watcher = chokidar.watch([`${resolvedOptions.modulesDir}/**/*.liquid`], {
        ignoreInitial: true,
        followSymlinks: false
      })

      // Create debounced function for generating module symlinks
      const linkModulesFn = debounce((_event: string, path: string) => linkModule(path, resolvedOptions), 100)

      // Watch for relevant file or directory changes to re-run script
      watcher.on('all', linkModulesFn)
    }
  }
}

// Check for module folders with corresponding liquid files and set up symlinks as needed
const linkModule = (modulePath: string, { modulesDir, themeRoot }: Required<VitePluginShopifyModulesOptions>): void => {
  const themeFilePath = getThemeFilePath(modulePath, { modulesDir, themeRoot })
  setupSymlink(modulePath, themeFilePath)
}

const getThemeFilePath = (modulePath: string, { modulesDir, themeRoot }: Required<VitePluginShopifyModulesOptions>): string => {
  const rootPath = path.resolve(themeRoot)
  const sectionsDir = path.resolve(rootPath, './sections')
  const snippetsDir = path.resolve(rootPath, './snippets')
  const fileName = path.basename(modulePath)

  if (/\.section.liquid/.test(fileName)) {
    const moduleName = fileName.replace(/\.section/, '')
    return path.join(sectionsDir, `${moduleName}`)
  }

  const moduleName = fileName.replace(/\.snippet/, '')
  return path.join(snippetsDir, `${moduleName}`)
}

// Move liquid file from module path to theme path and generate symbolic link
const setupSymlink = (modulePath: string, themePath: string): void => {
  const moduleDir = path.basename(path.dirname(modulePath))
  let modulePathStats
  const fileName = path.basename(modulePath)
  const regex = new RegExp(moduleDir)
  const isPotentialModuleName = regex.test(fileName)

  debug({ modulePath, themePath, moduleDir, fileName })

  if (!isPotentialModuleName) {
    return
  }

  try {
    modulePathStats = lstatSync(modulePath)
  } catch (e) {
    //
  }

  if (typeof modulePathStats === 'undefined') {
    // If no existing file at module path, skip
    return
  }

  if (existsSync(themePath)) {
    if (!modulePathStats.isSymbolicLink()) {
      // If theme file exists but hasn't been linked, create symlink
      unlinkSync(modulePath)
      symlinkSync(path.relative(path.dirname(modulePath), themePath), modulePath)
    }

    // If theme path file already exists, skip
    return
  }

  if (modulePathStats.isSymbolicLink()) {
    if (!existsSync(themePath)) {
      // If symlink exists without target file, delete it
      unlinkSync(modulePath)
    }

    // If module path file is already a symlink, skip
    return
  }

  // Move liquid file to theme folder
  renameSync(modulePath, themePath)

  // Generate symlink from module path to theme path
  symlinkSync(path.relative(path.dirname(modulePath), themePath), modulePath)
}
