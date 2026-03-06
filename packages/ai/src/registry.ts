import type { TranslationProvider } from './types'
import { ClaudeTranslationProvider } from './claude-provider'
import { OpenAITranslationProvider } from './openai-provider'
import type { Logger } from '@docbridge/core'

export interface ProviderField {
  key: 'apiKey' | 'baseURL' | 'model'
  label: string
  required: boolean
  secret: boolean
  placeholder?: string
}

export interface ProviderConfig {
  id: string
  apiKey?: string
  baseURL?: string
  model?: string
  protocol?: string
}

export interface ProviderDefinition {
  id: string
  label: string
  fields: ProviderField[]
  factory: (config: ProviderConfig, logger?: Logger) => TranslationProvider
}

export type ProviderOption = Omit<ProviderDefinition, 'factory'>

const registry = new Map<string, ProviderDefinition>()

export function registerProvider(definition: ProviderDefinition): void {
  registry.set(definition.id, definition)
}

export function getProviderDefinition(id: string): ProviderDefinition | undefined {
  return registry.get(id)
}

export function listProviders(): ProviderDefinition[] {
  return Array.from(registry.values())
}

// Built-in providers
registerProvider({
  id: 'claude',
  label: 'Claude (Anthropic)',
  fields: [
    {
      key: 'apiKey',
      label: 'API Key',
      required: false,
      secret: true,
      placeholder: 'Uses ANTHROPIC_API_KEY if not provided',
    },
  ],
  factory: (config, logger) => {
    const apiKey = config.apiKey ?? process.env['ANTHROPIC_API_KEY'] ?? ''
    return new ClaudeTranslationProvider(apiKey, undefined, logger)
  },
})

registerProvider({
  id: 'openai',
  label: 'OpenAI',
  fields: [
    {
      key: 'apiKey',
      label: 'API Key',
      required: true,
      secret: true,
      placeholder: 'sk-...',
    },
    {
      key: 'model',
      label: 'Model',
      required: false,
      secret: false,
      placeholder: 'gpt-4o',
    },
  ],
  factory: (config, logger) => new OpenAITranslationProvider(config.apiKey!, config.model, config.baseURL, undefined, logger),
})

registerProvider({
  id: 'deepseek',
  label: 'DeepSeek (OpenAI-compatible)',
  fields: [
    {
      key: 'apiKey',
      label: 'API Key',
      required: true,
      secret: true,
      placeholder: 'sk-...',
    },
  ],
  factory: (config, logger) => new OpenAITranslationProvider(config.apiKey!, 'deepseek-reasoner', 'https://api.deepseek.com', undefined, logger),
})

registerProvider({
  id: 'custom',
  label: 'Custom (OpenAI-compatible)',
  fields: [
    {
      key: 'apiKey',
      label: 'API Key',
      required: true,
      secret: true,
    },
    {
      key: 'baseURL',
      label: 'Base URL',
      required: true,
      secret: false,
      placeholder: 'https://...',
    },
    {
      key: 'model',
      label: 'Model',
      required: false,
      secret: false,
    },
  ],
  factory: (config, logger) => {
    const protocolId = config.protocol ?? 'openai'
    if (protocolId === 'custom') throw new Error('Custom provider protocol cannot be "custom"')
    const protocolDef = getProviderDefinition(protocolId)
    if (!protocolDef) throw new Error(`Unknown protocol provider: ${protocolId}`)
    return protocolDef.factory({ ...config, id: protocolId }, logger)
  },
})
