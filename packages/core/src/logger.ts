export type LogLevel = 'info' | 'error' | 'debug'

export interface Logger {
  info(message: string, data?: unknown): void
  error(message: string, data?: unknown): void
  debug(message: string, data?: unknown): void
}

export interface LoggerConfig {
  enabled: boolean
  onLog: (level: LogLevel, message: string, data?: unknown) => void
}

const SENSITIVE_KEYS = ['apikey', 'token', 'password', 'secret', 'authorization']

function sanitizeData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data
  }

  if (typeof data !== 'object') {
    return data
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeData)
  }

  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase()
    if (SENSITIVE_KEYS.some(sensitive => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

export function createLogger(config: LoggerConfig): Logger {
  const log = (level: LogLevel, message: string, data?: unknown) => {
    if (!config.enabled) {
      return
    }

    const sanitized = data !== undefined ? sanitizeData(data) : undefined
    config.onLog(level, message, sanitized)
  }

  return {
    info: (message, data) => log('info', message, data),
    error: (message, data) => log('error', message, data),
    debug: (message, data) => log('debug', message, data),
  }
}

let globalLogger: Logger | null = null

export function setGlobalLogger(logger: Logger | null): void {
  globalLogger = logger
}

export function getLogger(): Logger {
  if (globalLogger) {
    return globalLogger
  }

  return {
    info: () => {},
    error: () => {},
    debug: () => {},
  }
}
