import { describe, expect, it } from 'vitest'
import {
  getSquareAppIdConfigError,
  getSquareSdkUrl,
  resolveSquareWebEnvironment,
} from '@/lib/squareClientConfig'

describe('squareClientConfig', () => {
  it('prefers explicitly configured environment', () => {
    expect(resolveSquareWebEnvironment('sq0idp-prod-app', 'sandbox')).toBe('sandbox')
    expect(resolveSquareWebEnvironment('sq0idb-sandbox-app', 'production')).toBe('production')
  })

  it('infers production environment from app id prefix', () => {
    expect(resolveSquareWebEnvironment('sq0idp-abc123')).toBe('production')
  })

  it('falls back to sandbox when inference is unavailable', () => {
    expect(resolveSquareWebEnvironment('')).toBe('sandbox')
    expect(resolveSquareWebEnvironment('invalid-app-id')).toBe('sandbox')
  })

  it('returns correct sdk urls for environment', () => {
    expect(getSquareSdkUrl('production')).toBe('https://web.squarecdn.com/v1/square.js')
    expect(getSquareSdkUrl('sandbox')).toBe('https://sandbox.web.squarecdn.com/v1/square.js')
  })

  it('validates app id configuration', () => {
    expect(getSquareAppIdConfigError('')).toMatch(/not configured/i)
    expect(getSquareAppIdConfigError('abc')).toMatch(/invalid/i)
    expect(getSquareAppIdConfigError('sq0idb-abc')).toBeNull()
    expect(getSquareAppIdConfigError('sandbox-sq0idb-abc')).toBeNull()
    expect(getSquareAppIdConfigError('sq0idp-abc')).toBeNull()
  })
})
