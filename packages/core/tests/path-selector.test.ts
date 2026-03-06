import { describe, it, expect } from 'vitest'
import {
  buildDirectoryTree,
  suggestPlacement,
  validatePlacement,
} from '../src/path-selector'
import { detectMultiLangPattern } from '../src/translation-storage'

describe('buildDirectoryTree', () => {
  it('should return empty root for empty file list', () => {
    const tree = buildDirectoryTree([])
    expect(tree).toEqual({
      name: '',
      path: '',
      type: 'directory',
      children: [],
    })
  })

  it('should build tree with flat files only', () => {
    const files = ['README.md', 'LICENSE', 'package.json']
    const tree = buildDirectoryTree(files)

    expect(tree.children).toHaveLength(3)
    expect(tree.children?.[0]).toEqual({
      name: 'README.md',
      path: 'README.md',
      type: 'file',
      isMarkdown: true,
    })
    expect(tree.children?.[1]).toEqual({
      name: 'LICENSE',
      path: 'LICENSE',
      type: 'file',
      isMarkdown: false,
    })
  })

  it('should build tree with nested directories', () => {
    const files = ['docs/guide.md', 'docs/api.md', 'src/index.ts']
    const tree = buildDirectoryTree(files)

    expect(tree.children).toHaveLength(2)

    const docsDir = tree.children?.find(n => n.name === 'docs')
    expect(docsDir).toBeDefined()
    expect(docsDir?.type).toBe('directory')
    expect(docsDir?.children).toHaveLength(2)
    expect(docsDir?.children?.[0]).toEqual({
      name: 'guide.md',
      path: 'docs/guide.md',
      type: 'file',
      isMarkdown: true,
    })
  })

  it('should build tree with mixed depth levels', () => {
    const files = [
      'README.md',
      'docs/guide.md',
      'docs/api/endpoints.md',
      'docs/api/auth/oauth.md',
    ]
    const tree = buildDirectoryTree(files)

    expect(tree.children).toHaveLength(2)

    const docsDir = tree.children?.find(n => n.name === 'docs')
    expect(docsDir?.children).toHaveLength(2)

    const apiDir = docsDir?.children?.find(n => n.name === 'api')
    expect(apiDir?.type).toBe('directory')
    expect(apiDir?.children).toHaveLength(2)

    const authDir = apiDir?.children?.find(n => n.name === 'auth')
    expect(authDir?.type).toBe('directory')
    expect(authDir?.children?.[0]?.name).toBe('oauth.md')
  })

  it('should handle duplicate directory paths', () => {
    const files = ['docs/a.md', 'docs/b.md', 'docs/sub/c.md']
    const tree = buildDirectoryTree(files)

    const docsDir = tree.children?.find(n => n.name === 'docs')
    expect(docsDir?.children).toHaveLength(3)
  })
})

describe('suggestPlacement', () => {
  it('should suggest i18n-subdir pattern when detected', () => {
    const files = ['i18n/en/guide.md', 'i18n/en/api.md', 'README.md']
    const pattern = detectMultiLangPattern(files)
    const tree = buildDirectoryTree(files)

    const suggestion = suggestPlacement('i18n/en/guide.md', 'zh', pattern, tree, files)

    expect(suggestion.targetPath).toBe('i18n/zh/guide.md')
    expect(suggestion.pattern).toBe('i18n-subdir')
    expect(suggestion.confidence).toBe('high')
    expect(suggestion.reason).toContain('i18n')
  })

  it('should suggest docs-subdir pattern when detected', () => {
    const files = ['docs/en/guide.md', 'docs/fr/guide.md', 'README.md']
    const pattern = detectMultiLangPattern(files)
    const tree = buildDirectoryTree(files)

    const suggestion = suggestPlacement('docs/en/guide.md', 'zh', pattern, tree, files)

    expect(suggestion.targetPath).toBe('docs/zh/guide.md')
    expect(suggestion.pattern).toBe('docs-subdir')
    expect(suggestion.confidence).toBe('high')
  })

  it('should suggest lang-subdir pattern when detected', () => {
    const files = ['en/guide.md', 'fr/guide.md', 'de/api.md']
    const pattern = detectMultiLangPattern(files)
    const tree = buildDirectoryTree(files)

    const suggestion = suggestPlacement('en/guide.md', 'zh', pattern, tree, files)

    expect(suggestion.targetPath).toBe('zh/guide.md')
    expect(suggestion.pattern).toBe('lang-subdir')
    expect(suggestion.confidence).toBe('high')
  })

  it('should suggest root-suffix pattern when detected', () => {
    const files = ['README.md', 'README.fr.md', 'guide.en.md']
    const pattern = detectMultiLangPattern(files)
    const tree = buildDirectoryTree(files)

    const suggestion = suggestPlacement('README.md', 'zh', pattern, tree, files)

    expect(suggestion.targetPath).toBe('README.zh.md')
    expect(suggestion.pattern).toBe('root-suffix')
    expect(suggestion.confidence).toBe('high')
  })

  it('should use default strategy when no pattern detected', () => {
    const files = ['README.md', 'docs/guide.md']
    const pattern = detectMultiLangPattern(files)
    const tree = buildDirectoryTree(files)

    const suggestion = suggestPlacement('README.md', 'zh', pattern, tree, files)

    expect(suggestion.targetPath).toBe('README.zh.md')
    expect(suggestion.pattern).toBe('none')
    expect(suggestion.confidence).toBe('medium')
  })

  it('should provide alternative placements', () => {
    const files = ['README.md', 'docs/guide.md']
    const pattern = detectMultiLangPattern(files)
    const tree = buildDirectoryTree(files)

    const suggestion = suggestPlacement('docs/guide.md', 'zh', pattern, tree, files)

    expect(suggestion.alternatives).toBeDefined()
    expect(suggestion.alternatives.length).toBeGreaterThan(0)
    expect(suggestion.alternatives).toContain('docs/zh/guide.md')
  })

  it('should handle nested file in docs with no pattern', () => {
    const files = ['docs/api/endpoints.md']
    const pattern = detectMultiLangPattern(files)
    const tree = buildDirectoryTree(files)

    const suggestion = suggestPlacement('docs/api/endpoints.md', 'zh', pattern, tree, files)

    expect(suggestion.targetPath).toBe('docs/zh/api/endpoints.md')
    expect(suggestion.confidence).toBe('medium')
  })
})

describe('validatePlacement', () => {
  it('should validate a valid path', () => {
    const files = ['docs/guide.md', 'README.md']
    const tree = buildDirectoryTree(files)

    const result = validatePlacement('docs/zh/guide.md', tree)

    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('should reject path that conflicts with existing file', () => {
    const files = ['docs/guide.md', 'docs/zh/guide.md']
    const tree = buildDirectoryTree(files)

    const result = validatePlacement('docs/zh/guide.md', tree)

    expect(result.valid).toBe(false)
    expect(result.error).toContain('already exists')
  })

  it('should reject path with invalid characters', () => {
    const files = ['docs/guide.md']
    const tree = buildDirectoryTree(files)

    const result = validatePlacement('docs/../etc/passwd', tree)

    expect(result.valid).toBe(false)
    expect(result.error).toContain('Invalid')
  })

  it('should warn about deeply nested paths', () => {
    const files = ['docs/guide.md']
    const tree = buildDirectoryTree(files)

    const result = validatePlacement('a/b/c/d/e/f/g/h/i/j/file.md', tree)

    expect(result.valid).toBe(true)
    expect(result.warnings).toBeDefined()
    expect(result.warnings?.[0]).toContain('deeply nested')
  })

  it('should validate root-level files', () => {
    const files = ['README.md']
    const tree = buildDirectoryTree(files)

    const result = validatePlacement('README.zh.md', tree)

    expect(result.valid).toBe(true)
  })

  it('should reject empty path', () => {
    const files = ['README.md']
    const tree = buildDirectoryTree(files)

    const result = validatePlacement('', tree)

    expect(result.valid).toBe(false)
    expect(result.error).toContain('empty')
  })
})
