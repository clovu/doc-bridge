import type { TranslationProvider } from './types'
import { getProviderDefinition } from './registry'
import type { ProviderConfig } from './registry'
import type { Logger } from '@docbridge/core'

export function createProvider(config: ProviderConfig, logger?: Logger): TranslationProvider {
  const definition = getProviderDefinition(config.id)
  if (!definition) {
    throw new Error(`Unknown provider: ${config.id}`)
  }

  for (const field of definition.fields) {
    if (field.required && !config[field.key]) {
      throw new Error(`Provider ${config.id} requires ${field.key}`)
    }
  }

  return definition.factory(config, logger)
}
