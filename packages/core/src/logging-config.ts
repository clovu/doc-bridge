let loggingEnabled = false

export interface LoggingConfig {
  enabled: boolean
}

export function configureLogging(config: LoggingConfig): void {
  loggingEnabled = config.enabled
}

export function isLoggingEnabled(): boolean {
  return loggingEnabled
}
