import { describe, it, expect } from 'vitest'
import {
  detectMultiLangPattern,
  getTranslationPlacement,
  getAllPossiblePlacements,
  type MultiLangPattern,

} from '../src/translation-storage'

describe('detectMultiLangPattern', () => {
  describe('root suffix pattern', () => {
    it('detects README with language suffix', () => {
      const files = ['README.md', 'README.zh.md', 'README.ja.md', 'src/index.ts']
      const pattern = detectMultiLangPattern(files)

      expect(pattern.type).toBe('root-suffix')
      expect(pattern.baseDir).toBeUndefined()
    })

    it('detects multiple files with language suffixes', () => {
      const files = [
        'README.md',
        'README.zh-CN.md',
        'CONTRIBUTING.md',
        'CONTRIBUTING.fr.md',
        'docs/guide.md',
      ]
      const pattern = detectMultiLangPattern(files)

      expect(pattern.type).toBe('root-suffix')
    })

    it('handles language codes with hyphens', () => {
      const files = ['README.md', 'README.zh-TW.md', 'README.pt-BR.md']
      const pattern = detectMultiLangPattern(files)

      expect(pattern.type).toBe('root-suffix')
    })
  })

  describe('docs subdirectory pattern', () => {
    it('detects docs with language subdirectories', () => {
      const files = [
        'docs/en/guide.md',
        'docs/zh/guide.md',
        'docs/ja/guide.md',
        'README.md',
      ]
      const pattern = detectMultiLangPattern(files)

      expect(pattern.type).toBe('docs-subdir')
      expect(pattern.baseDir).toBe('docs')
    })

    it('detects nested docs structure', () => {
      const files = [
        'docs/en/getting-started/intro.md',
        'docs/zh/getting-started/intro.md',
        'docs/en/api/reference.md',
      ]
      const pattern = detectMultiLangPattern(files)

      expect(pattern.type).toBe('docs-subdir')
      expect(pattern.baseDir).toBe('docs')
    })

    it('handles documentation folder variations', () => {
      const files = [
        'documentation/en/guide.md',
        'documentation/fr/guide.md',
      ]
      const pattern = detectMultiLangPattern(files)

      expect(pattern.type).toBe('docs-subdir')
      expect(pattern.baseDir).toBe('documentation')
    })
  })

  describe('language subdirectory pattern', () => {
    it('detects root-level language directories', () => {
      const files = [
        'en/README.md',
        'zh/README.md',
        'ja/README.md',
        'package.json',
      ]
      const pattern = detectMultiLangPattern(files)

      expect(pattern.type).toBe('lang-subdir')
      expect(pattern.baseDir).toBeUndefined()
    })

    it('handles nested content in language directories', () => {
      const files = [
        'en/docs/guide.md',
        'zh/docs/guide.md',
        'en/api/reference.md',
      ]
      const pattern = detectMultiLangPattern(files)

      expect(pattern.type).toBe('lang-subdir')
    })
  })

  describe('i18n/locales pattern', () => {
    it('detects i18n directory structure', () => {
      const files = [
        'i18n/en/docs.md',
        'i18n/zh/docs.md',
        'i18n/ja/docs.md',
        'src/index.ts',
      ]
      const pattern = detectMultiLangPattern(files)

      expect(pattern.type).toBe('i18n-subdir')
      expect(pattern.baseDir).toBe('i18n')
    })

    it('detects locales directory structure', () => {
      const files = [
        'locales/en/guide.md',
        'locales/fr/guide.md',
        'README.md',
      ]
      const pattern = detectMultiLangPattern(files)

      expect(pattern.type).toBe('i18n-subdir')
      expect(pattern.baseDir).toBe('locales')
    })

    it('detects translations directory structure', () => {
      const files = [
        'translations/en/content.md',
        'translations/zh-CN/content.md',
      ]
      const pattern = detectMultiLangPattern(files)

      expect(pattern.type).toBe('i18n-subdir')
      expect(pattern.baseDir).toBe('translations')
    })
  })

  describe('no pattern detected', () => {
    it('returns none for repository without multi-lang docs', () => {
      const files = [
        'README.md',
        'docs/guide.md',
        'src/index.ts',
        'package.json',
      ]
      const pattern = detectMultiLangPattern(files)

      expect(pattern.type).toBe('none')
      expect(pattern.baseDir).toBeUndefined()
    })

    it('returns none for empty file list', () => {
      const files: string[] = []
      const pattern = detectMultiLangPattern(files)

      expect(pattern.type).toBe('none')
    })

    it('ignores false positives', () => {
      const files = [
        'README.md',
        'src/zh.ts',  // not a language directory
        'docs/en-US.json',  // not markdown
        'test/fr-test.ts',  // not a language file
      ]
      const pattern = detectMultiLangPattern(files)

      expect(pattern.type).toBe('none')
    })
  })

  describe('pattern priority', () => {
    it('prefers docs-subdir over root-suffix when both exist', () => {
      const files = [
        'README.md',
        'README.zh.md',
        'docs/en/guide.md',
        'docs/zh/guide.md',
      ]
      const pattern = detectMultiLangPattern(files)

      expect(pattern.type).toBe('docs-subdir')
    })

    it('prefers i18n-subdir over lang-subdir', () => {
      const files = [
        'en/README.md',
        'zh/README.md',
        'i18n/en/docs.md',
        'i18n/zh/docs.md',
      ]
      const pattern = detectMultiLangPattern(files)

      expect(pattern.type).toBe('i18n-subdir')
    })
  })
})

describe('getTranslationPlacement', () => {
  describe('root suffix pattern', () => {
    it('places README translation with locale suffix', () => {
      const pattern: MultiLangPattern = { type: 'root-suffix' }
      const placement = getTranslationPlacement('README.md', 'zh', pattern)

      expect(placement.targetPath).toBe('README.zh.md')
      expect(placement.createDirectory).toBe(false)
    })

    it('places nested file translation with locale suffix', () => {
      const pattern: MultiLangPattern = { type: 'root-suffix' }
      const placement = getTranslationPlacement('docs/guide.md', 'fr', pattern)

      expect(placement.targetPath).toBe('docs/guide.fr.md')
      expect(placement.createDirectory).toBe(false)
    })

    it('handles files with multiple dots', () => {
      const pattern: MultiLangPattern = { type: 'root-suffix' }
      const placement = getTranslationPlacement('api.v2.md', 'ja', pattern)

      expect(placement.targetPath).toBe('api.v2.ja.md')
    })

    it('handles hyphenated locale codes', () => {
      const pattern: MultiLangPattern = { type: 'root-suffix' }
      const placement = getTranslationPlacement('README.md', 'zh-CN', pattern)

      expect(placement.targetPath).toBe('README.zh-CN.md')
    })
  })

  describe('docs subdirectory pattern', () => {
    it('places file in docs locale subdirectory', () => {
      const pattern: MultiLangPattern = { type: 'docs-subdir', baseDir: 'docs' }
      const placement = getTranslationPlacement('docs/en/guide.md', 'zh', pattern)

      expect(placement.targetPath).toBe('docs/zh/guide.md')
      expect(placement.createDirectory).toBe(true)
    })

    it('preserves nested structure within locale directory', () => {
      const pattern: MultiLangPattern = { type: 'docs-subdir', baseDir: 'docs' }
      const placement = getTranslationPlacement(
        'docs/en/getting-started/intro.md',
        'fr',
        pattern,
      )

      expect(placement.targetPath).toBe('docs/fr/getting-started/intro.md')
      expect(placement.createDirectory).toBe(true)
    })

    it('handles files not in language subdirectory', () => {
      const pattern: MultiLangPattern = { type: 'docs-subdir', baseDir: 'docs' }
      const placement = getTranslationPlacement('docs/guide.md', 'ja', pattern)

      expect(placement.targetPath).toBe('docs/ja/guide.md')
      expect(placement.createDirectory).toBe(true)
    })

    it('works with custom documentation folder name', () => {
      const pattern: MultiLangPattern = { type: 'docs-subdir', baseDir: 'documentation' }
      const placement = getTranslationPlacement(
        'documentation/en/api.md',
        'es',
        pattern,
      )

      expect(placement.targetPath).toBe('documentation/es/api.md')
    })
  })

  describe('language subdirectory pattern', () => {
    it('places file in target language directory', () => {
      const pattern: MultiLangPattern = { type: 'lang-subdir' }
      const placement = getTranslationPlacement('en/README.md', 'zh', pattern)

      expect(placement.targetPath).toBe('zh/README.md')
      expect(placement.createDirectory).toBe(true)
    })

    it('preserves nested structure', () => {
      const pattern: MultiLangPattern = { type: 'lang-subdir' }
      const placement = getTranslationPlacement('en/docs/guide.md', 'fr', pattern)

      expect(placement.targetPath).toBe('fr/docs/guide.md')
      expect(placement.createDirectory).toBe(true)
    })

    it('handles files not in language directory', () => {
      const pattern: MultiLangPattern = { type: 'lang-subdir' }
      const placement = getTranslationPlacement('README.md', 'ja', pattern)

      expect(placement.targetPath).toBe('ja/README.md')
      expect(placement.createDirectory).toBe(true)
    })
  })

  describe('i18n subdirectory pattern', () => {
    it('places file in i18n locale subdirectory', () => {
      const pattern: MultiLangPattern = { type: 'i18n-subdir', baseDir: 'i18n' }
      const placement = getTranslationPlacement('i18n/en/docs.md', 'zh', pattern)

      expect(placement.targetPath).toBe('i18n/zh/docs.md')
      expect(placement.createDirectory).toBe(true)
    })

    it('works with locales directory', () => {
      const pattern: MultiLangPattern = { type: 'i18n-subdir', baseDir: 'locales' }
      const placement = getTranslationPlacement('locales/en/guide.md', 'fr', pattern)

      expect(placement.targetPath).toBe('locales/fr/guide.md')
      expect(placement.createDirectory).toBe(true)
    })

    it('handles files not in locale subdirectory', () => {
      const pattern: MultiLangPattern = { type: 'i18n-subdir', baseDir: 'i18n' }
      const placement = getTranslationPlacement('docs/guide.md', 'ja', pattern)

      expect(placement.targetPath).toBe('i18n/ja/docs/guide.md')
      expect(placement.createDirectory).toBe(true)
    })
  })

  describe('no pattern (default behavior)', () => {
    it('creates docs locale structure for README', () => {
      const pattern: MultiLangPattern = { type: 'none' }
      const placement = getTranslationPlacement('README.md', 'zh', pattern)

      expect(placement.targetPath).toBe('README.zh.md')
      expect(placement.createDirectory).toBe(false)
    })

    it('creates docs locale structure for nested files', () => {
      const pattern: MultiLangPattern = { type: 'none' }
      const placement = getTranslationPlacement('docs/guide.md', 'fr', pattern)

      expect(placement.targetPath).toBe('docs/fr/guide.md')
      expect(placement.createDirectory).toBe(true)
    })

    it('handles deeply nested files', () => {
      const pattern: MultiLangPattern = { type: 'none' }
      const placement = getTranslationPlacement(
        'docs/api/v2/reference.md',
        'ja',
        pattern,
      )

      expect(placement.targetPath).toBe('docs/ja/api/v2/reference.md')
      expect(placement.createDirectory).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('handles root-level files with no extension', () => {
      const pattern: MultiLangPattern = { type: 'root-suffix' }
      const placement = getTranslationPlacement('LICENSE', 'zh', pattern)

      expect(placement.targetPath).toBe('LICENSE.zh')
    })

    it('handles files with uppercase extensions', () => {
      const pattern: MultiLangPattern = { type: 'root-suffix' }
      const placement = getTranslationPlacement('README.MD', 'fr', pattern)

      expect(placement.targetPath).toBe('README.fr.MD')
    })

    it('handles paths with trailing slashes', () => {
      const pattern: MultiLangPattern = { type: 'docs-subdir', baseDir: 'docs' }
      const placement = getTranslationPlacement('docs/en/guide.md', 'zh', pattern)

      expect(placement.targetPath).not.toContain('//')
    })

    it('handles empty locale code gracefully', () => {
      const pattern: MultiLangPattern = { type: 'root-suffix' }
      const placement = getTranslationPlacement('README.md', '', pattern)

      expect(placement.targetPath).toBe('README..md')
    })
  })
})

describe('getAllPossiblePlacements', () => {
  it('should return all 4 pattern placements for a file', () => {
    const placements = getAllPossiblePlacements('docs/guide.md', 'zh')

    expect(placements).toHaveLength(4)
    expect(placements.map(p => p.pattern)).toEqual([
      'i18n-subdir',
      'docs-subdir',
      'lang-subdir',
      'root-suffix',
    ])
  })

  it('should generate i18n-subdir placement', () => {
    const placements = getAllPossiblePlacements('docs/guide.md', 'zh')
    const i18nPlacement = placements.find(p => p.pattern === 'i18n-subdir')

    expect(i18nPlacement?.targetPath).toBe('i18n/zh/docs/guide.md')
  })

  it('should generate docs-subdir placement', () => {
    const placements = getAllPossiblePlacements('docs/guide.md', 'zh')
    const docsPlacement = placements.find(p => p.pattern === 'docs-subdir')

    expect(docsPlacement?.targetPath).toBe('docs/zh/guide.md')
  })

  it('should generate lang-subdir placement', () => {
    const placements = getAllPossiblePlacements('docs/guide.md', 'zh')
    const langPlacement = placements.find(p => p.pattern === 'lang-subdir')

    expect(langPlacement?.targetPath).toBe('zh/docs/guide.md')
  })

  it('should generate root-suffix placement', () => {
    const placements = getAllPossiblePlacements('docs/guide.md', 'zh')
    const suffixPlacement = placements.find(p => p.pattern === 'root-suffix')

    expect(suffixPlacement?.targetPath).toBe('docs/guide.zh.md')
  })

  it('should handle root-level files', () => {
    const placements = getAllPossiblePlacements('README.md', 'fr')

    expect(placements).toHaveLength(4)
    expect(placements.find(p => p.pattern === 'root-suffix')?.targetPath).toBe('README.fr.md')
    expect(placements.find(p => p.pattern === 'i18n-subdir')?.targetPath).toBe('i18n/fr/README.md')
    expect(placements.find(p => p.pattern === 'lang-subdir')?.targetPath).toBe('fr/README.md')
  })

  it('should handle deeply nested files', () => {
    const placements = getAllPossiblePlacements('docs/api/v2/endpoints.md', 'ja')

    expect(placements.find(p => p.pattern === 'docs-subdir')?.targetPath).toBe('docs/ja/api/v2/endpoints.md')
    expect(placements.find(p => p.pattern === 'root-suffix')?.targetPath).toBe('docs/api/v2/endpoints.ja.md')
  })

  it('should handle files without extensions', () => {
    const placements = getAllPossiblePlacements('LICENSE', 'zh')

    expect(placements.find(p => p.pattern === 'root-suffix')?.targetPath).toBe('LICENSE.zh')
  })
})
