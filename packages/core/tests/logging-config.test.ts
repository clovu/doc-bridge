import { describe, it, expect, beforeEach } from 'vitest'
import { configureLogging, isLoggingEnabled } from '../src/logging-config'

describe('logging configuration', () => {
  beforeEach(() => {
    configureLogging({ enabled: false })
  })

  it('should enable logging globally', () => {
    configureLogging({ enabled: true })
    expect(isLoggingEnabled()).toBe(true)
  })

  it('should disable logging globally', () => {
    configureLogging({ enabled: false })
    expect(isLoggingEnabled()).toBe(false)
  })

  it('should default to disabled', () => {
    expect(isLoggingEnabled()).toBe(false)
  })
})
