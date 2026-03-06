import { mergeConfig } from 'vitest/config'
import base from '../../packages/config/vitest.config.base'

export default mergeConfig(base, {
  test: {
    include: ['tests/**/*.test.ts'],
  },
})
