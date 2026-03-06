import {
  getTranslationPlacement,
  type MultiLangPattern,
  type MultiLangPatternType,
} from './translation-storage'

export interface DirectoryNode {
  name: string
  path: string
  type: 'file' | 'directory'
  children?: DirectoryNode[]
  isMarkdown?: boolean
}

export interface PathSuggestion {
  targetPath: string
  reason: string
  confidence: 'high' | 'medium' | 'low'
  pattern: MultiLangPatternType
  alternatives: string[]
}

export interface ValidationResult {
  valid: boolean
  error?: string
  warnings?: string[]
}

/**
 * Builds a directory tree structure from a flat list of file paths.
 */
export function buildDirectoryTree(files: string[]): DirectoryNode {
  const root: DirectoryNode = {
    name: '',
    path: '',
    type: 'directory',
    children: [],
  }

  if (files.length === 0) {
    return root
  }

  for (const filePath of files) {
    const parts = filePath.split('/')
    let currentNode = root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isLastPart = i === parts.length - 1
      const currentPath = parts.slice(0, i + 1).join('/')

      if (isLastPart) {
        // It's a file
        if (!currentNode.children) {
          currentNode.children = []
        }
        currentNode.children.push({
          name: part,
          path: currentPath,
          type: 'file',
          isMarkdown: part.endsWith('.md'),
        })
      } else {
        // It's a directory
        if (!currentNode.children) {
          currentNode.children = []
        }

        let childDir = currentNode.children.find(
          n => n.name === part && n.type === 'directory',
        )

        if (!childDir) {
          childDir = {
            name: part,
            path: currentPath,
            type: 'directory',
            children: [],
          }
          currentNode.children.push(childDir)
        }

        currentNode = childDir
      }
    }
  }

  return root
}

/**
 * Suggests where to place a translated file based on detected pattern.
 */
export function suggestPlacement(
  originalPath: string,
  targetLocale: string,
  pattern: MultiLangPattern,
  _tree: DirectoryNode,
  _allFiles: string[],
): PathSuggestion {
  const placement = getTranslationPlacement(originalPath, targetLocale, pattern)
  const alternatives = generateAlternatives(originalPath, targetLocale)

  let confidence: 'high' | 'medium' | 'low' = 'medium'
  let reason = ''

  switch (pattern.type) {
  case 'i18n-subdir':
    confidence = 'high'
    reason = `Following existing i18n/${targetLocale}/ pattern`
    break
  case 'docs-subdir':
    confidence = 'high'
    reason = `Following existing docs/${targetLocale}/ pattern`
    break
  case 'lang-subdir':
    confidence = 'high'
    reason = `Following existing ${targetLocale}/ root directory pattern`
    break
  case 'root-suffix':
    confidence = 'high'
    reason = `Following existing .${targetLocale}.md suffix pattern`
    break
  case 'none':
    confidence = 'medium'
    reason = 'Using default placement strategy (no existing pattern detected)'
    break
  }

  return {
    targetPath: placement.targetPath,
    reason,
    confidence,
    pattern: pattern.type,
    alternatives,
  }
}

/**
 * Validates if a target path is acceptable.
 */
export function validatePlacement(
  targetPath: string,
  tree: DirectoryNode,
): ValidationResult {
  // Check for empty path
  if (!targetPath || targetPath.trim() === '') {
    return {
      valid: false,
      error: 'Path cannot be empty',
    }
  }

  // Check for invalid characters (path traversal)
  if (targetPath.includes('..') || targetPath.includes('//')) {
    return {
      valid: false,
      error: 'Invalid path: contains illegal characters',
    }
  }

  // Check if file already exists
  if (fileExistsInTree(targetPath, tree)) {
    return {
      valid: false,
      error: `File already exists at ${targetPath}`,
    }
  }

  // Warn about deeply nested paths (more than 8 levels)
  const depth = targetPath.split('/').length
  const warnings: string[] = []

  if (depth > 8) {
    warnings.push('Path is deeply nested (more than 8 levels)')
  }

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}

// Helper functions

function generateAlternatives(
  originalPath: string,
  targetLocale: string,
): string[] {
  const alternatives: string[] = []
  const parts = originalPath.split('/')
  const filename = parts[parts.length - 1]

  // Alternative 1: root-suffix pattern
  const lastDot = filename.lastIndexOf('.')
  if (lastDot !== -1) {
    const base = filename.substring(0, lastDot)
    const ext = filename.substring(lastDot)
    const suffixFilename = `${base}.${targetLocale}${ext}`

    if (parts.length === 1) {
      alternatives.push(suffixFilename)
    } else {
      alternatives.push([...parts.slice(0, -1), suffixFilename].join('/'))
    }
  }

  // Alternative 2: docs/locale pattern
  if (parts.length === 1) {
    alternatives.push(`docs/${targetLocale}/${filename}`)
  } else if (parts[0] === 'docs') {
    alternatives.push(`docs/${targetLocale}/${parts.slice(1).join('/')}`)
  } else {
    alternatives.push(`${parts[0]}/${targetLocale}/${parts.slice(1).join('/')}`)
  }

  // Alternative 3: i18n/locale pattern
  alternatives.push(`i18n/${targetLocale}/${originalPath}`)

  // Alternative 4: locale at root
  alternatives.push(`${targetLocale}/${originalPath}`)

  // Remove duplicates
  return [...new Set(alternatives)]
}

function fileExistsInTree(targetPath: string, tree: DirectoryNode): boolean {
  const parts = targetPath.split('/')

  function search(node: DirectoryNode, pathParts: string[]): boolean {
    if (pathParts.length === 0) return false

    const [first, ...rest] = pathParts

    if (!node.children) return false

    for (const child of node.children) {
      if (child.name === first) {
        if (rest.length === 0) {
          // Found the target
          return child.type === 'file'
        } else {
          // Continue searching
          if (child.type === 'directory') {
            return search(child, rest)
          }
        }
      }
    }

    return false
  }

  return search(tree, parts)
}
