# Translation Pipeline Logging

This document describes the logging system added to the DocBridge translation pipeline.

## Overview

Logging has been added throughout the translation pipeline to capture:
- Incoming translation requests (files, targetLocale, provider)
- Provider API calls (baseURL, model, segment count)
- Responses received from providers
- Errors and timeouts

## Features

- **Modular**: Logging can be enabled or disabled globally
- **Secure**: Automatically redacts sensitive information (API keys, tokens, passwords)
- **Flexible**: Custom log handlers can be configured
- **Type-safe**: Full TypeScript support

## Usage

### Basic Logger

```typescript
import { createLogger } from '@docbridge/core'

const logger = createLogger({
  enabled: true,
  onLog: (level, message, data) => {
    console.log(`[${level}] ${message}`, data)
  },
})

logger.info('Translation started', { fileCount: 5 })
logger.error('Translation failed', { error: 'Timeout' })
```

### Global Logger

```typescript
import { createLogger, setGlobalLogger, getLogger } from '@docbridge/core'

// Set up global logger
const logger = createLogger({
  enabled: true,
  onLog: (level, message, data) => {
    console.log(`[${level}] ${message}`, data)
  },
})
setGlobalLogger(logger)

// Use global logger anywhere
const log = getLogger()
log.info('Using global logger')
```

### Provider Logging

Providers accept an optional logger parameter:

```typescript
import { ClaudeTranslationProvider } from '@docbridge/ai'
import { createLogger } from '@docbridge/core'

const logger = createLogger({
  enabled: true,
  onLog: (level, message, data) => {
    console.log(`[${level}] ${message}`, data)
  },
})

const provider = new ClaudeTranslationProvider(
  'api-key',
  undefined, // timeout
  logger
)
```

### API Route Logging

The translation API route automatically logs:

```typescript
// apps/web/src/app/api/translate/route.ts
const logger = createLogger({
  enabled: process.env.NODE_ENV !== 'test',
  onLog: (level, message, data) => {
    const timestamp = new Date().toISOString()
    console.log(`[${timestamp}] [${level}] ${message}`, data)
  },
})
```

## Log Levels

- **info**: General information (requests, responses)
- **error**: Errors and failures
- **debug**: Detailed debugging information

## Security

The logger automatically redacts sensitive fields:
- `apiKey`
- `token`
- `password`
- `secret`
- `authorization`

Example:

```typescript
logger.info('Provider config', {
  apiKey: 'secret-key',
  model: 'gpt-4',
})
// Logs: { apiKey: '[REDACTED]', model: 'gpt-4' }
```

## Disabling Logging

To disable logging globally:

```typescript
import { configureLogging } from '@docbridge/core'

configureLogging({ enabled: false })
```

Or create a disabled logger:

```typescript
const logger = createLogger({
  enabled: false,
  onLog: () => {},
})
```

## Example Log Output

```
[2026-03-06T19:25:00.000Z] [INFO] Translation request received {
  "owner": "user",
  "repo": "docs",
  "fileCount": 3,
  "targetLocale": "es",
  "sourceLocale": "en",
  "providerId": "claude"
}

[2026-03-06T19:25:01.000Z] [INFO] ClaudeTranslationProvider: API call {
  "model": "claude-haiku-4-5-20251001",
  "segmentCount": 15,
  "sourceLocale": "en",
  "targetLocale": "es"
}

[2026-03-06T19:25:03.000Z] [INFO] ClaudeTranslationProvider: response received {
  "translatedCount": 15
}

[2026-03-06T19:25:05.000Z] [INFO] Translation completed successfully {
  "fileCount": 3
}
```

## Testing

All logging functionality is fully tested:

```bash
pnpm --filter @docbridge/core test logger.test.ts
pnpm --filter @docbridge/ai test claude-provider.test.ts
pnpm --filter @docbridge/ai test openai-provider.test.ts
```

## Architecture

- `packages/core/src/logger.ts` - Core logger implementation
- `packages/core/src/logging-config.ts` - Global logging configuration
- `packages/ai/src/claude-provider.ts` - Claude provider with logging
- `packages/ai/src/openai-provider.ts` - OpenAI provider with logging
- `apps/web/src/app/api/translate/route.ts` - API route with logging
