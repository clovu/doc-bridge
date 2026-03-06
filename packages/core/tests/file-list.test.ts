import { describe, it, expect } from 'vitest'
import { removeFile } from '../src/file-list'

describe('removeFile', () => {
  describe('basic removal', () => {
    it('removes the specified file from the list', () => {
      const result = removeFile(['a.md', 'b.md', 'c.md'], 'b.md')
      expect(result).toEqual(['a.md', 'c.md'])
    })

    it('leaves all other files intact', () => {
      const result = removeFile(['a.md', 'b.md', 'c.md'], 'b.md')
      expect(result).toHaveLength(2)
      expect(result).toContain('a.md')
      expect(result).toContain('c.md')
    })

    it('does not mutate the original array', () => {
      const original = ['a.md', 'b.md', 'c.md']
      removeFile(original, 'b.md')
      expect(original).toHaveLength(3)
    })
  })

  describe('edge cases', () => {
    it('removes the first file and keeps remaining in order', () => {
      const result = removeFile(['a.md', 'b.md', 'c.md'], 'a.md')
      expect(result).toEqual(['b.md', 'c.md'])
    })

    it('removes the last file and keeps remaining in order', () => {
      const result = removeFile(['a.md', 'b.md', 'c.md'], 'c.md')
      expect(result).toEqual(['a.md', 'b.md'])
    })

    it('returns empty array when only file is removed', () => {
      const result = removeFile(['a.md'], 'a.md')
      expect(result).toEqual([])
    })

    it('returns original array unchanged when file is not in the list', () => {
      const result = removeFile(['a.md', 'b.md'], 'z.md')
      expect(result).toEqual(['a.md', 'b.md'])
    })

    it('returns empty array unchanged when input is empty', () => {
      const result = removeFile([], 'a.md')
      expect(result).toEqual([])
    })

    it('removes only the first occurrence when duplicates exist', () => {
      const result = removeFile(['a.md', 'b.md', 'a.md'], 'a.md')
      expect(result).toEqual(['b.md'])
    })
  })
})
