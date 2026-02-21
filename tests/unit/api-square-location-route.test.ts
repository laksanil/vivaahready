import { beforeEach, describe, expect, it, vi } from 'vitest'

const getLocationIdMock = vi.fn()

vi.mock('@/lib/square', () => ({
  getLocationId: getLocationIdMock,
}))

describe('GET /api/square/location', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('returns location id and caches subsequent responses', async () => {
    getLocationIdMock.mockResolvedValue('LOC-123')

    const { GET } = await import('@/app/api/square/location/route')

    const first = await GET()
    expect(first.status).toBe(200)
    await expect(first.json()).resolves.toEqual({ locationId: 'LOC-123' })

    const second = await GET()
    expect(second.status).toBe(200)
    await expect(second.json()).resolves.toEqual({ locationId: 'LOC-123' })

    expect(getLocationIdMock).toHaveBeenCalledTimes(1)
  })

  it('returns 500 when location lookup fails', async () => {
    getLocationIdMock.mockRejectedValue(new Error('Square unavailable'))

    const { GET } = await import('@/app/api/square/location/route')
    const response = await GET()

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toMatchObject({
      error: 'Square unavailable',
    })
  })
})
