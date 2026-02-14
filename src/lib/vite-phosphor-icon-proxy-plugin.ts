import fs from 'fs'
import path from 'path'
import type { Plugin } from 'vite'

export function createIconImportProxy(): Plugin {
  const packageName = '@phosphor-icons/react'
  const fallbackIcon = 'Question'
  const packagePath = 'node_modules/@phosphor-icons/react'
  
  const existingExportsCache = new Set<string>()
  let hasLoadedExports = false
  const proxiedImports = new Map<string, string>()
  
  const loadExports = () => {
    if (hasLoadedExports) return
    try {
      const packageDir = path.resolve(packagePath)
      const filesToCheck = [
        path.join(packageDir, 'dist', 'index.js'),
        path.join(packageDir, 'dist', 'index.mjs'),
        path.join(packageDir, 'dist', 'index.d.ts'),
        path.join(packageDir, 'index.js'),
        path.join(packageDir, 'index.d.ts'),
      ]
      const existingFile = filesToCheck.find((file) => fs.existsSync(file))
      if (existingFile) {
        const content = fs.readFileSync(existingFile, 'utf-8')
        const exportPatterns = [
          /export\s+\{\s*([^}]+)\s*\}/g,
          /export\s+const\s+(\w+)/g,
          /export\s+function\s+(\w+)/g,
          /export\s+type\s+(\w+)/g,
          /export\s+\*\s+from\s+'.*\/csr\/(\w+)'/g,
        ]
        exportPatterns.forEach((pattern) => {
          let match
          while ((match = pattern.exec(content)) !== null) {
            if (pattern.source.includes('\\{')) {
              const exports = match[1].split(',').map((e) => {
                const parts = e.trim().split(/\s+as\s+/)
                return parts[parts.length - 1].trim()
              })
              exports.forEach((name) => existingExportsCache.add(name))
            } else {
              existingExportsCache.add(match[1])
            }
          }
        })
      }
      hasLoadedExports = true
    } catch (error) {
      console.error(`[icon-proxy] Error analyzing package exports:`, error)
    }
  }
  
  return {
    name: 'vite-icon-import-proxy',
    enforce: 'pre',
    configResolved() {
      loadExports()
    },
    transform(code, id) {
      if (!/\.(tsx?|jsx?|mjs)$/.test(id) || id.includes('node_modules')) return null
      const importRegex = new RegExp(
        `import\\s*\\{([^}]+)\\}\\s*from\\s*['"]${packageName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`,
        'g'
      )
      let match
      let hasChanges = false
      let newCode = code
      while ((match = importRegex.exec(code)) !== null) {
        const imports = match[1].split(',').map((i) => i.trim()).filter(Boolean)
        const newImports = imports.map((importSpec) => {
          const parts = importSpec.split(/\s+as\s+/)
          const originalName = parts[0].trim()
          const alias = parts.length > 1 ? parts[1].trim() : originalName
          if (!existingExportsCache.has(originalName)) {
            if (!proxiedImports.has(originalName)) {
              proxiedImports.set(originalName, fallbackIcon)
              console.warn(`[icon-proxy] Proxying missing icon: ${originalName} -> ${fallbackIcon}`)
            }
            hasChanges = true
            return alias !== originalName ? `${fallbackIcon} as ${alias}` : `${fallbackIcon} as ${originalName}`
          }
          return importSpec
        })
        if (hasChanges) {
          const newImportStr = match[0].replace(match[1], newImports.join(', '))
          newCode = newCode.replace(match[0], newImportStr)
        }
      }
      return hasChanges ? { code: newCode, map: null } : null
    },
  }
}
