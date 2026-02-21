import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const locationsListMock = vi.fn()
const squareClientCtorMock = vi.fn()

vi.mock('square', () => {
  class SquareClient {
    locations = {
      list: locationsListMock,
    }

    constructor(config: unknown) {
      squareClientCtorMock(config)
    }
  }

  const SquareEnvironment = {
    Production: 'production',
    Sandbox: 'sandbox',
  }

  return {
    SquareClient,
    SquareEnvironment,
  }
})

describe('src/lib/square', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('initializes Square client using production config when SQUARE_ENVIRONMENT=production', async () => {
    process.env.SQUARE_ENVIRONMENT = 'production'
    process.env.SQUARE_PRODUCTION_ACCESS_TOKEN = 'prod-token'
    process.env.SQUARE_SANDBOX_ACCESS_TOKEN = 'sandbox-token'
    process.env.SQUARE_PRODUCTION_APP_ID = 'sq0idp-prod-app'

    const mod = await import('@/lib/square')
    expect(mod.getSquareAppId()).toBe('sq0idp-prod-app')
    expect(squareClientCtorMock).toHaveBeenCalledWith({
      token: 'prod-token',
      environment: 'production',
    })
  })

  it('prefers an ACTIVE location id when resolving location', async () => {
    process.env.SQUARE_ENVIRONMENT = 'sandbox'
    process.env.SQUARE_SANDBOX_ACCESS_TOKEN = 'sandbox-token'
    process.env.SQUARE_SANDBOX_APP_ID = 'sq0idb-sandbox-app'
    locationsListMock.mockResolvedValue({
      locations: [
        { id: 'loc-inactive', status: 'INACTIVE' },
        { id: 'loc-active', status: 'ACTIVE' },
      ],
    })

    const { getLocationId } = await import('@/lib/square')
    await expect(getLocationId()).resolves.toBe('loc-active')
  })

  it('throws when Square token is missing', async () => {
    process.env.SQUARE_ENVIRONMENT = 'sandbox'
    process.env.SQUARE_SANDBOX_ACCESS_TOKEN = ''
    locationsListMock.mockResolvedValue({
      locations: [{ id: 'loc-any', status: 'ACTIVE' }],
    })

    const { getLocationId } = await import('@/lib/square')
    await expect(getLocationId()).rejects.toThrow(/Missing Square access token/i)
    expect(locationsListMock).not.toHaveBeenCalled()
  })
})
