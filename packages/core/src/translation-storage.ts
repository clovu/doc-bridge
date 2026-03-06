export type MultiLangPatternType =
  | 'root-suffix'
  | 'docs-subdir'
  | 'lang-subdir'
  | 'i18n-subdir'
  | 'none'

export interface MultiLangPattern {
  type: MultiLangPatternType
  baseDir?: string
}

export interface TranslationPlacement {
  targetPath: string
  createDirectory: boolean
  pattern?: MultiLangPatternType
}

// Common language codes to detect
const LANG_CODES = [
  'en', 'zh', 'ja', 'ko', 'fr', 'de', 'es', 'pt', 'ru', 'it', 'nl', 'pl', 'tr',
  'vi', 'th', 'ar', 'he', 'id', 'ms', 'hi', 'bn', 'ta', 'te', 'mr',
  'zh-CN', 'zh-TW', 'zh-HK', 'pt-BR', 'pt-PT', 'en-US', 'en-GB', 'es-ES', 'es-MX',
]

// i18n-related directory names
const I18N_DIRS = ['i18n', 'locales', 'translations', 'locale', 'lang', 'languages']

// Documentation directory names
const DOCS_DIRS = ['docs', 'doc', 'documentation', 'documents']

/**
 * Detects the multi-language pattern used in a repository
 * by analyzing the file paths.
 *
 * Priority order:
 * 1. i18n-subdir (i18n/en/, locales/zh/)
 * 2. docs-subdir (docs/en/, docs/zh/)
 * 3. lang-subdir (en/, zh/ at root)
 * 4. root-suffix (README.zh.md, guide.fr.md)
 * 5. none (no pattern detected)
 */
export function detectMultiLangPattern(files: string[]): MultiLangPattern {
  if (files.length === 0) {
    return { type: 'none' }
  }

  // Check for i18n-subdir pattern (highest priority)
  const i18nPattern = detectI18nSubdir(files)
  if (i18nPattern) {
    return i18nPattern
  }

  // Check for docs-subdir pattern
  const docsPattern = detectDocsSubdir(files)
  if (docsPattern) {
    return docsPattern
  }

  // Check for lang-subdir pattern
  if (detectLangSubdir(files)) {
    return { type: 'lang-subdir' }
  }

  // Check for root-suffix pattern
  if (detectRootSuffix(files)) {
    return { type: 'root-suffix' }
  }

  return { type: 'none' }
}

/**
 * Determines where to place a translated file based on the detected pattern.
 */
export function getTranslationPlacement(
  originalPath: string,
  targetLocale: string,
  pattern: MultiLangPattern,
): TranslationPlacement {
  switch (pattern.type) {
  case 'root-suffix':
    return placeWithRootSuffix(originalPath, targetLocale)

  case 'docs-subdir':
    return placeInDocsSubdir(originalPath, targetLocale, pattern.baseDir!)

  case 'lang-subdir':
    return placeInLangSubdir(originalPath, targetLocale)

  case 'i18n-subdir':
    return placeInI18nSubdir(originalPath, targetLocale, pattern.baseDir!)

  case 'none':
    return placeWithDefaultStrategy(originalPath, targetLocale)

  default:
    return placeWithDefaultStrategy(originalPath, targetLocale)
  }
}

// Detection helpers

function detectI18nSubdir(files: string[]): MultiLangPattern | null {
  for (const i18nDir of I18N_DIRS) {
    const pattern = `${i18nDir}/`
    const matchingFiles = files.filter(f => f.startsWith(pattern))

    if (matchingFiles.length === 0) continue

    // Check if any language code appears after the i18n directory
    // Must have at least one more segment after the language code (i.e., it's a directory, not a file)
    const hasLangCode = matchingFiles.some(f => {
      const parts = f.split('/')
      if (parts.length < 3) return false  // Need: i18n/lang/file.md (at least 3 parts)
      const langPart = parts[1]
      return LANG_CODES.some(code => langPart === code || langPart.startsWith(code + '-'))
    })

    if (hasLangCode) {
      return { type: 'i18n-subdir', baseDir: i18nDir }
    }
  }

  return null
}

function detectDocsSubdir(files: string[]): MultiLangPattern | null {
  for (const docsDir of DOCS_DIRS) {
    const pattern = `${docsDir}/`
    const matchingFiles = files.filter(f => f.startsWith(pattern))

    if (matchingFiles.length === 0) continue

    // Check if any language code appears as first subdirectory
    // Must have at least one more segment after the language code (i.e., it's a directory, not a file)
    const hasLangCode = matchingFiles.some(f => {
      const parts = f.split('/')
      if (parts.length < 3) return false  // Need: docs/lang/file.md (at least 3 parts)
      const langPart = parts[1]
      return LANG_CODES.some(code => langPart === code || langPart.startsWith(code + '-'))
    })

    if (hasLangCode) {
      return { type: 'docs-subdir', baseDir: docsDir }
    }
  }

  return null
}

function detectLangSubdir(files: string[]): boolean {
  // Look for root-level language directories
  const rootLangDirs = files.filter(f => {
    const parts = f.split('/')
    if (parts.length < 2) return false
    const firstPart = parts[0]
    return LANG_CODES.some(code => firstPart === code || firstPart.startsWith(code + '-'))
  })

  // Need at least 2 different language directories to confirm pattern
  const uniqueLangDirs = new Set(rootLangDirs.map(f => f.split('/')[0]))
  return uniqueLangDirs.size >= 2
}

function detectRootSuffix(files: string[]): boolean {
  // Look for files with language code before extension
  const suffixPattern = /\.([a-z]{2}(-[A-Z]{2})?)\.md$/i

  const matchingFiles = files.filter(f => {
    const match = f.match(suffixPattern)
    if (!match) return false
    const langCode = match[1]
    return LANG_CODES.some(code =>
      langCode.toLowerCase() === code.toLowerCase(),
    )
  })

  return matchingFiles.length >= 1
}

// Placement helpers

function placeWithRootSuffix(
  originalPath: string,
  targetLocale: string,
): TranslationPlacement {
  const lastDotIndex = originalPath.lastIndexOf('.')

  if (lastDotIndex === -1) {
    // No extension
    return {
      targetPath: `${originalPath}.${targetLocale}`,
      createDirectory: false,
    }
  }

  const basePath = originalPath.substring(0, lastDotIndex)
  const extension = originalPath.substring(lastDotIndex)

  return {
    targetPath: `${basePath}.${targetLocale}${extension}`,
    createDirectory: false,
  }
}

function placeInDocsSubdir(
  originalPath: string,
  targetLocale: string,
  baseDir: string,
): TranslationPlacement {
  const parts = originalPath.split('/')

  // Check if file is already in baseDir
  if (parts[0] === baseDir) {
    // Check if second part is a language code
    if (parts.length >= 2 && isLangCode(parts[1])) {
      // Replace language code
      parts[1] = targetLocale
      return {
        targetPath: parts.join('/'),
        createDirectory: true,
      }
    } else {
      // Insert language code after baseDir
      parts.splice(1, 0, targetLocale)
      return {
        targetPath: parts.join('/'),
        createDirectory: true,
      }
    }
  }

  // File not in baseDir, place it there
  return {
    targetPath: `${baseDir}/${targetLocale}/${originalPath}`,
    createDirectory: true,
  }
}

function placeInLangSubdir(
  originalPath: string,
  targetLocale: string,
): TranslationPlacement {
  const parts = originalPath.split('/')

  // Check if first part is a language code
  if (parts.length >= 1 && isLangCode(parts[0])) {
    // Replace language code
    parts[0] = targetLocale
    return {
      targetPath: parts.join('/'),
      createDirectory: true,
    }
  }

  // File not in language directory, place it in target locale
  return {
    targetPath: `${targetLocale}/${originalPath}`,
    createDirectory: true,
  }
}

function placeInI18nSubdir(
  originalPath: string,
  targetLocale: string,
  baseDir: string,
): TranslationPlacement {
  const parts = originalPath.split('/')

  // Check if file is already in baseDir
  if (parts[0] === baseDir) {
    // Check if second part is a language code
    if (parts.length >= 2 && isLangCode(parts[1])) {
      // Replace language code
      parts[1] = targetLocale
      return {
        targetPath: parts.join('/'),
        createDirectory: true,
      }
    } else {
      // Insert language code after baseDir
      parts.splice(1, 0, targetLocale)
      return {
        targetPath: parts.join('/'),
        createDirectory: true,
      }
    }
  }

  // File not in baseDir, place it there
  return {
    targetPath: `${baseDir}/${targetLocale}/${originalPath}`,
    createDirectory: true,
  }
}

function placeWithDefaultStrategy(
  originalPath: string,
  targetLocale: string,
): TranslationPlacement {
  // Default strategy:
  // - README.md -> README.zh.md (root suffix)
  // - docs/guide.md -> docs/zh/guide.md (docs subdir)
  // - other files -> docs/zh/path (docs subdir)

  const parts = originalPath.split('/')

  if (parts.length === 1) {
    // Root-level file, use suffix
    return placeWithRootSuffix(originalPath, targetLocale)
  }

  // Nested file, use docs/locale structure
  const firstDir = parts[0]

  if (DOCS_DIRS.includes(firstDir)) {
    // Already in docs directory
    parts.splice(1, 0, targetLocale)
    return {
      targetPath: parts.join('/'),
      createDirectory: true,
    }
  }

  // Not in docs, create docs/locale structure
  return {
    targetPath: `${firstDir}/${targetLocale}/${parts.slice(1).join('/')}`,
    createDirectory: true,
  }
}

function isLangCode(str: string): boolean {
  return LANG_CODES.some(code =>
    str === code || str.startsWith(code + '-'),
  )
}

/**
 * Returns all possible placement strategies for a file.
 * Useful for providing users with alternative placement options.
 */
export function getAllPossiblePlacements(
  originalPath: string,
  targetLocale: string,
): TranslationPlacement[] {
  const placements: TranslationPlacement[] = []

  // 1. i18n-subdir pattern
  const i18nPlacement = placeInI18nSubdir(originalPath, targetLocale, 'i18n')
  placements.push({ ...i18nPlacement, pattern: 'i18n-subdir' })

  // 2. docs-subdir pattern
  const parts = originalPath.split('/')
  const firstDir = parts[0]
  const docsBaseDir = DOCS_DIRS.includes(firstDir) ? firstDir : 'docs'
  const docsPlacement = placeInDocsSubdir(originalPath, targetLocale, docsBaseDir)
  placements.push({ ...docsPlacement, pattern: 'docs-subdir' })

  // 3. lang-subdir pattern
  const langPlacement = placeInLangSubdir(originalPath, targetLocale)
  placements.push({ ...langPlacement, pattern: 'lang-subdir' })

  // 4. root-suffix pattern
  const suffixPlacement = placeWithRootSuffix(originalPath, targetLocale)
  placements.push({ ...suffixPlacement, pattern: 'root-suffix' })

  return placements
}
