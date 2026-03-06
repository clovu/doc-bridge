import { describe, it, expect, beforeEach } from 'vitest'
import { createLogger, setGlobalLogger, getLogger } from '../src/logger'

describe('Logger', () => {
  let logs: Array<{ level: string; message: string; data?: unknown }>

  beforeEach(() => {
    logs = []
  })

  describe('createLogger', () => {
    it('should create a logger that captures logs when enabled', () => {
      const logger = createLogger({
        enabled: true,
        onLog: (level, message, data) => {
          logs.push({ level, message, data })
        },
      })

      logger.info('test message', { key: 'value' })

      expect(logs).toHaveLength(1)
      expect(logs[0]).toEqual({
        level: 'info',
        message: 'test message',
        data: { key: 'value' },
      })
    })

    it('should not capture logs when disabled', () => {
      const logger = createLogger({
        enabled: false,
        onLog: (level, message, data) => {
          logs.push({ level, message, data })
        },
      })

      logger.info('test message')

      expect(logs).toHaveLength(0)
    })

    it('should support multiple log levels', () => {
      const logger = createLogger({
        enabled: true,
        onLog: (level, message, data) => {
          logs.push({ level, message, data })
        },
      })

      logger.info('info message')
      logger.error('error message')
      logger.debug('debug message')

      expect(logs).toHaveLength(3)
      expect(logs[0].level).toBe('info')
      expect(logs[1].level).toBe('error')
      expect(logs[2].level).toBe('debug')
    })

    it('should handle logs without data', () => {
      const logger = createLogger({
        enabled: true,
        onLog: (level, message, data) => {
          logs.push({ level, message, data })
        },
      })

      logger.info('message only')

      expect(logs).toHaveLength(1)
      expect(logs[0]).toEqual({
        level: 'info',
        message: 'message only',
        data: undefined,
      })
    })
  })

  describe('global logger', () => {
    it('should set and get global logger', () => {
      const logger = createLogger({
        enabled: true,
        onLog: (level, message, data) => {
          logs.push({ level, message, data })
        },
      })

      setGlobalLogger(logger)
      const retrieved = getLogger()

      retrieved.info('test')

      expect(logs).toHaveLength(1)
      expect(logs[0].message).toBe('test')
    })

    it('should return no-op logger when no global logger is set', () => {
      setGlobalLogger(null)
      const logger = getLogger()

      logger.info('should not log')

      expect(logs).toHaveLength(0)
    })
  })

  describe('sanitization', () => {
    it('should not log fields containing "apiKey"', () => {
      const logger = createLogger({
        enabled: true,
        onLog: (level, message, data) => {
          logs.push({ level, message, data })
        },
      })

      logger.info('provider config', {
        apiKey: 'secret-key',
        model: 'gpt-4',
        baseURL: 'https://api.example.com',
      })

      expect(logs).toHaveLength(1)
      expect(logs[0].data).toEqual({
        apiKey: '[REDACTED]',
        model: 'gpt-4',
        baseURL: 'https://api.example.com',
      })
    })

    it('should not log fields containing "token"', () => {
      const logger = createLogger({
        enabled: true,
        onLog: (level, message, data) => {
          logs.push({ level, message, data })
        },
      })

      logger.info('auth', {
        token: 'secret-token',
        userId: '123',
      })

      expect(logs).toHaveLength(1)
      expect(logs[0].data).toEqual({
        token: '[REDACTED]',
        userId: '123',
      })
    })

    it('should not log fields containing "password"', () => {
      const logger = createLogger({
        enabled: true,
        onLog: (level, message, data) => {
          logs.push({ level, message, data })
        },
      })

      logger.info('credentials', {
        password: 'secret-pass',
        username: 'user',
      })

      expect(logs).toHaveLength(1)
      expect(logs[0].data).toEqual({
        password: '[REDACTED]',
        username: 'user',
      })
    })

    it('should handle nested objects with sensitive fields', () => {
      const logger = createLogger({
        enabled: true,
        onLog: (level, message, data) => {
          logs.push({ level, message, data })
        },
      })

      logger.info('nested config', {
        provider: {
          apiKey: 'secret',
          model: 'gpt-4',
        },
        user: 'john',
      })

      expect(logs).toHaveLength(1)
      expect(logs[0].data).toEqual({
        provider: {
          apiKey: '[REDACTED]',
          model: 'gpt-4',
        },
        user: 'john',
      })
    })
  })
})
