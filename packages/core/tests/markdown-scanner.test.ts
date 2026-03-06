import { describe, it, expect } from 'vitest'
import { scanMarkdownFiles } from '../src/markdown-scanner'

describe('scanMarkdownFiles', () => {
  it('returns empty array for empty input', () => {
    expect(scanMarkdownFiles([])).toEqual([])
  })

  it('returns .md files', () => {
    expect(scanMarkdownFiles(['README.md'])).toEqual(['README.md'])
  })

  it('returns .mdx files', () => {
    expect(scanMarkdownFiles(['page.mdx'])).toEqual(['page.mdx'])
  })

  it('excludes .txt files', () => {
    expect(scanMarkdownFiles(['notes.txt'])).toEqual([])
  })

  it('excludes .json files', () => {
    expect(scanMarkdownFiles(['config.json'])).toEqual([])
  })

  it('excludes .ts files', () => {
    expect(scanMarkdownFiles(['index.ts'])).toEqual([])
  })

  it('handles mixed extensions, returns only .md and .mdx', () => {
    const input = ['README.md', 'index.ts', 'guide.mdx', 'data.json', '.gitignore']
    expect(scanMarkdownFiles(input)).toEqual(['README.md', 'guide.mdx'])
  })

  it('preserves full paths including directory segments', () => {
    const input = ['docs/setup.md', 'docs/api/reference.mdx']
    expect(scanMarkdownFiles(input)).toEqual(['docs/setup.md', 'docs/api/reference.mdx'])
  })

  it('handles files with no extension', () => {
    expect(scanMarkdownFiles(['Makefile', 'LICENSE'])).toEqual([])
  })

  it('handles path with .md in directory name but non-markdown extension', () => {
    expect(scanMarkdownFiles(['docs.md/config.ts', 'docs.md/notes.md'])).toEqual([
      'docs.md/notes.md',
    ])
  })
})
