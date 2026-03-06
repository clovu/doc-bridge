import { describe, it, expect } from 'vitest'
import {
  detectMultiLangPattern,
  getTranslationPlacement,
} from '../src'

/**
 * Integration tests demonstrating how translation-storage
 * works with the complete DocBridge workflow
 */
describe('Translation Storage Integration', () => {
  describe('complete workflow example', () => {
    it('handles repository with docs/locale structure', async () => {
      // Step 1: Repository file structure
      const repoFiles = [
        'README.md',
        'docs/en/getting-started.md',
        'docs/en/api/reference.md',
        'docs/zh/getting-started.md',  // existing Chinese translation
        'src/index.ts',
        'package.json',
      ]

      // Step 2: Detect multi-language pattern
      const pattern = detectMultiLangPattern(repoFiles)
      expect(pattern.type).toBe('docs-subdir')
      expect(pattern.baseDir).toBe('docs')

      // Step 3: Determine placement for new French translation
      const originalFile = 'docs/en/api/reference.md'
      const targetLocale = 'fr'

      const placement = getTranslationPlacement(originalFile, targetLocale, pattern)

      expect(placement.targetPath).toBe('docs/fr/api/reference.md')
      expect(placement.createDirectory).toBe(true)

      // Step 4: In actual workflow, you would:
      // - Create directory: docs/fr/api/
      // - Translate the file content
      // - Save to: docs/fr/api/reference.md
      // - Commit and create PR
    })

    it('handles repository with root suffix pattern', () => {
      // Repository with suffix pattern
      const repoFiles = [
        'README.md',
        'README.zh.md',
        'README.ja.md',
        'CONTRIBUTING.md',
        'LICENSE',
      ]

      const pattern = detectMultiLangPattern(repoFiles)
      expect(pattern.type).toBe('root-suffix')

      // Translate README to French
      const placement = getTranslationPlacement('README.md', 'fr', pattern)

      expect(placement.targetPath).toBe('README.fr.md')
      expect(placement.createDirectory).toBe(false)
    })

    it('handles repository with no multi-language docs', () => {
      // Fresh repository without translations
      const repoFiles = [
        'README.md',
        'docs/guide.md',
        'docs/api/reference.md',
        'src/index.ts',
      ]

      const pattern = detectMultiLangPattern(repoFiles)
      expect(pattern.type).toBe('none')

      // First translation: README
      const readmePlacement = getTranslationPlacement('README.md', 'zh', pattern)
      expect(readmePlacement.targetPath).toBe('README.zh.md')
      expect(readmePlacement.createDirectory).toBe(false)

      // First translation: docs file
      const guidePlacement = getTranslationPlacement('docs/guide.md', 'zh', pattern)
      expect(guidePlacement.targetPath).toBe('docs/zh/guide.md')
      expect(guidePlacement.createDirectory).toBe(true)
    })
  })

  describe('batch translation workflow', () => {
    it('translates multiple files maintaining structure', () => {
      const repoFiles = [
        'docs/en/intro.md',
        'docs/en/guide.md',
        'docs/en/api/auth.md',
        'docs/en/api/users.md',
      ]

      const pattern = detectMultiLangPattern(repoFiles)
      expect(pattern.type).toBe('docs-subdir')

      const filesToTranslate = [
        'docs/en/intro.md',
        'docs/en/guide.md',
        'docs/en/api/auth.md',
        'docs/en/api/users.md',
      ]

      const targetLocale = 'ja'
      const placements = filesToTranslate.map(file =>
        getTranslationPlacement(file, targetLocale, pattern),
      )

      expect(placements).toEqual([
        { targetPath: 'docs/ja/intro.md', createDirectory: true },
        { targetPath: 'docs/ja/guide.md', createDirectory: true },
        { targetPath: 'docs/ja/api/auth.md', createDirectory: true },
        { targetPath: 'docs/ja/api/users.md', createDirectory: true },
      ])

      // All files maintain their relative structure under docs/ja/
    })
  })

  describe('mixed pattern handling', () => {
    it('prefers docs-subdir over root-suffix', () => {
      // Repository with both patterns
      const repoFiles = [
        'README.md',
        'README.zh.md',  // root suffix
        'docs/en/guide.md',  // docs subdir
        'docs/zh/guide.md',
      ]

      const pattern = detectMultiLangPattern(repoFiles)
      expect(pattern.type).toBe('docs-subdir')

      // New translations follow the docs-subdir pattern
      const placement = getTranslationPlacement('docs/en/api.md', 'fr', pattern)
      expect(placement.targetPath).toBe('docs/fr/api.md')
    })

    it('prefers i18n-subdir over all others', () => {
      const repoFiles = [
        'README.md',
        'README.zh.md',
        'docs/en/guide.md',
        'i18n/en/content.md',
        'i18n/zh/content.md',
      ]

      const pattern = detectMultiLangPattern(repoFiles)
      expect(pattern.type).toBe('i18n-subdir')
      expect(pattern.baseDir).toBe('i18n')
    })
  })

  describe('edge cases in real workflows', () => {
    it('handles files not in detected pattern directory', () => {
      const repoFiles = [
        'docs/en/guide.md',
        'docs/zh/guide.md',
      ]

      const pattern = detectMultiLangPattern(repoFiles)
      expect(pattern.type).toBe('docs-subdir')

      // Translating a file outside docs/
      const placement = getTranslationPlacement('README.md', 'fr', pattern)

      // Should still follow the pattern by placing in docs/
      expect(placement.targetPath).toBe('docs/fr/README.md')
      expect(placement.createDirectory).toBe(true)
    })

    it('handles deeply nested documentation', () => {
      const repoFiles = [
        'docs/en/getting-started/installation/npm.md',
        'docs/en/getting-started/installation/yarn.md',
        'docs/zh/getting-started/installation/npm.md',
      ]

      const pattern = detectMultiLangPattern(repoFiles)
      expect(pattern.type).toBe('docs-subdir')

      const placement = getTranslationPlacement(
        'docs/en/getting-started/installation/yarn.md',
        'ja',
        pattern,
      )

      expect(placement.targetPath).toBe('docs/ja/getting-started/installation/yarn.md')
      expect(placement.createDirectory).toBe(true)
    })

    it('handles language code variations', () => {
      const repoFiles = [
        'docs/en-US/guide.md',
        'docs/zh-CN/guide.md',
        'docs/pt-BR/guide.md',
      ]

      const pattern = detectMultiLangPattern(repoFiles)
      expect(pattern.type).toBe('docs-subdir')

      const placement = getTranslationPlacement('docs/en-US/guide.md', 'zh-TW', pattern)
      expect(placement.targetPath).toBe('docs/zh-TW/guide.md')
    })
  })

  describe('directory creation requirements', () => {
    it('identifies when directories need creation', () => {
      const pattern = { type: 'docs-subdir' as const, baseDir: 'docs' }

      // New language directory needs creation
      const placement1 = getTranslationPlacement('docs/en/guide.md', 'ko', pattern)
      expect(placement1.createDirectory).toBe(true)

      // Root suffix doesn't need directory creation
      const pattern2 = { type: 'root-suffix' as const }
      const placement2 = getTranslationPlacement('README.md', 'ko', pattern2)
      expect(placement2.createDirectory).toBe(false)
    })
  })

  describe('real-world repository examples', () => {
    it('handles Vue.js style documentation', () => {
      // Vue.js uses translations/ at root with language subdirs
      const repoFiles = [
        'guide/introduction.md',
        'guide/essentials/application.md',
        'translations/zh-CN/guide/introduction.md',
        'translations/ja/guide/introduction.md',
      ]

      const pattern = detectMultiLangPattern(repoFiles)
      expect(pattern.type).toBe('i18n-subdir')
      expect(pattern.baseDir).toBe('translations')
    })

    it('handles React style documentation', () => {
      // React uses docs/ with language subdirs
      const repoFiles = [
        'docs/en/getting-started.md',
        'docs/es/getting-started.md',
        'docs/fr/getting-started.md',
      ]

      const pattern = detectMultiLangPattern(repoFiles)
      expect(pattern.type).toBe('docs-subdir')
      expect(pattern.baseDir).toBe('docs')
    })

    it('handles simple README-only translations', () => {
      const repoFiles = [
        'README.md',
        'README.zh-CN.md',
        'README.es.md',
        'src/index.ts',
      ]

      const pattern = detectMultiLangPattern(repoFiles)
      expect(pattern.type).toBe('root-suffix')

      const placement = getTranslationPlacement('README.md', 'pt-BR', pattern)
      expect(placement.targetPath).toBe('README.pt-BR.md')
    })
  })
})
