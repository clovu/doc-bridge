import { describe, it, expect } from 'vitest'
import { removeProvider } from '../src/provider-list'
import type { ProviderOption } from '../src/registry'

function makeOption(id: string): ProviderOption {
  return { id, label: id, fields: [] }
}

const CLAUDE = makeOption('claude')
const OPENAI = makeOption('openai')
const CUSTOM = makeOption('custom')

describe('removeProvider', () => {
  describe('normal removal', () => {
    it('removes the specified provider from the list', () => {
      const { providers } = removeProvider([CLAUDE, OPENAI, CUSTOM], 'openai', 'claude')
      expect(providers.map(p => p.id)).toEqual(['claude', 'custom'])
    })

    it('leaves all other providers intact', () => {
      const { providers } = removeProvider([CLAUDE, OPENAI, CUSTOM], 'openai', 'claude')
      expect(providers).toHaveLength(2)
      expect(providers[0]).toEqual(CLAUDE)
      expect(providers[1]).toEqual(CUSTOM)
    })

    it('does not mutate the original array', () => {
      const original = [CLAUDE, OPENAI, CUSTOM]
      removeProvider(original, 'openai', 'claude')
      expect(original).toHaveLength(3)
    })
  })

  describe('selection fallback', () => {
    it('keeps current selection when a different provider is removed', () => {
      const { selectedId } = removeProvider([CLAUDE, OPENAI, CUSTOM], 'openai', 'claude')
      expect(selectedId).toBe('claude')
    })

    it('falls back to first remaining when the selected provider is removed', () => {
      const { selectedId } = removeProvider([CLAUDE, OPENAI, CUSTOM], 'claude', 'claude')
      expect(selectedId).toBe('openai')
    })

    it('falls back to first remaining when last provider is removed and it was selected', () => {
      const { selectedId } = removeProvider([CLAUDE, OPENAI, CUSTOM], 'custom', 'custom')
      expect(selectedId).toBe('claude')
    })

    it('falls back to first remaining when middle provider is removed and it was selected', () => {
      const { selectedId } = removeProvider([CLAUDE, OPENAI, CUSTOM], 'openai', 'openai')
      expect(selectedId).toBe('claude')
    })
  })

  describe('last-provider guard', () => {
    it('returns unchanged providers when only one provider remains', () => {
      const { providers } = removeProvider([CLAUDE], 'claude', 'claude')
      expect(providers).toHaveLength(1)
      expect(providers[0].id).toBe('claude')
    })

    it('returns unchanged selectedId when only one provider remains', () => {
      const { selectedId } = removeProvider([CLAUDE], 'claude', 'claude')
      expect(selectedId).toBe('claude')
    })
  })

  describe('edge cases', () => {
    it('removing the first item leaves remaining items in order', () => {
      const { providers } = removeProvider([CLAUDE, OPENAI, CUSTOM], 'claude', 'openai')
      expect(providers.map(p => p.id)).toEqual(['openai', 'custom'])
    })

    it('removing the last item leaves remaining items in order', () => {
      const { providers } = removeProvider([CLAUDE, OPENAI, CUSTOM], 'custom', 'claude')
      expect(providers.map(p => p.id)).toEqual(['claude', 'openai'])
    })

    it('removing the middle item leaves remaining items in order', () => {
      const { providers } = removeProvider([CLAUDE, OPENAI, CUSTOM], 'openai', 'claude')
      expect(providers.map(p => p.id)).toEqual(['claude', 'custom'])
    })

    it('removing a non-existent id returns the original list unchanged', () => {
      const { providers, selectedId } = removeProvider([CLAUDE, OPENAI], 'nonexistent', 'claude')
      expect(providers).toHaveLength(2)
      expect(selectedId).toBe('claude')
    })

    it('works with exactly two providers — removing one leaves one', () => {
      const { providers } = removeProvider([CLAUDE, OPENAI], 'openai', 'claude')
      expect(providers).toHaveLength(1)
      expect(providers[0].id).toBe('claude')
    })
  })
})
