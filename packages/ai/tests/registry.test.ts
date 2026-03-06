import { describe, it, expect } from 'vitest'
import {
  registerProvider,
  getProviderDefinition,
  listProviders,
  type ProviderDefinition,
  type ProviderConfig,
} from '../src/registry'
import type { TranslationProvider } from '../src/types'

// Helper to create a minimal stub provider definition
function makeStub(id: string, label = 'Stub'): ProviderDefinition {
  return {
    id,
    label,
    fields: [],
    factory: (): TranslationProvider => ({
      translate: async () => ({ segments: [] }),
    }),
  }
}

describe('registerProvider', () => {
  it('adds an entry to the registry', () => {
    registerProvider(makeStub('test-add'))
    expect(getProviderDefinition('test-add')).toBeDefined()
  })

  it('overwrites an existing entry with the same id', () => {
    registerProvider(makeStub('test-overwrite', 'First'))
    registerProvider(makeStub('test-overwrite', 'Second'))
    expect(getProviderDefinition('test-overwrite')?.label).toBe('Second')
  })
})

describe('getProviderDefinition', () => {
  it('returns definition for a known provider id', () => {
    registerProvider(makeStub('test-get'))
    const def = getProviderDefinition('test-get')
    expect(def?.id).toBe('test-get')
  })

  it('returns undefined for an unknown provider id', () => {
    expect(getProviderDefinition('nonexistent-xyz')).toBeUndefined()
  })
})

describe('listProviders', () => {
  it('includes all registered providers in order', () => {
    registerProvider(makeStub('alpha'))
    registerProvider(makeStub('beta'))
    const ids = listProviders().map(p => p.id)
    const alphaIdx = ids.indexOf('alpha')
    const betaIdx = ids.indexOf('beta')
    expect(alphaIdx).toBeGreaterThanOrEqual(0)
    expect(betaIdx).toBeGreaterThanOrEqual(0)
    expect(alphaIdx).toBeLessThan(betaIdx)
  })
})

describe('built-in providers', () => {
  it('claude is registered at module load', () => {
    expect(getProviderDefinition('claude')).toBeDefined()
  })

  it('openai is registered at module load', () => {
    expect(getProviderDefinition('openai')).toBeDefined()
  })

  it('custom is registered at module load', () => {
    expect(getProviderDefinition('custom')).toBeDefined()
  })

  it('claude factory returns object with translate() method', () => {
    const def = getProviderDefinition('claude')!
    const config: ProviderConfig = { id: 'claude' }
    const provider = def.factory(config)
    expect(typeof provider.translate).toBe('function')
  })

  it('openai factory returns object with translate() method', () => {
    const def = getProviderDefinition('openai')!
    const config: ProviderConfig = { id: 'openai', apiKey: 'sk-test' }
    const provider = def.factory(config)
    expect(typeof provider.translate).toBe('function')
  })

  it('custom factory returns object with translate() method', () => {
    const def = getProviderDefinition('custom')!
    const config: ProviderConfig = { id: 'custom', apiKey: 'sk-test', baseURL: 'https://example.com/v1' }
    const provider = def.factory(config)
    expect(typeof provider.translate).toBe('function')
  })

  it('claude has apiKey field that is optional and secret', () => {
    const def = getProviderDefinition('claude')!
    const apiKeyField = def.fields.find(f => f.key === 'apiKey')!
    expect(apiKeyField).toBeDefined()
    expect(apiKeyField.required).toBe(false)
    expect(apiKeyField.secret).toBe(true)
  })

  it('openai has required apiKey field and optional model field', () => {
    const def = getProviderDefinition('openai')!
    const apiKeyField = def.fields.find(f => f.key === 'apiKey')!
    const modelField = def.fields.find(f => f.key === 'model')!
    expect(apiKeyField.required).toBe(true)
    expect(apiKeyField.secret).toBe(true)
    expect(modelField.required).toBe(false)
  })

  it('custom has required apiKey and baseURL, optional model', () => {
    const def = getProviderDefinition('custom')!
    const apiKeyField = def.fields.find(f => f.key === 'apiKey')!
    const baseURLField = def.fields.find(f => f.key === 'baseURL')!
    const modelField = def.fields.find(f => f.key === 'model')!
    expect(apiKeyField.required).toBe(true)
    expect(baseURLField.required).toBe(true)
    expect(modelField.required).toBe(false)
  })

  it('built-in providers have correct labels', () => {
    expect(getProviderDefinition('claude')?.label).toBe('Claude (Anthropic)')
    expect(getProviderDefinition('openai')?.label).toBe('OpenAI')
    expect(getProviderDefinition('custom')?.label).toBe('Custom (OpenAI-compatible)')
  })
})
