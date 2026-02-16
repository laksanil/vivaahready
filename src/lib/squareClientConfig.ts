export type SquareWebEnvironment = 'sandbox' | 'production'

/**
 * Resolve the web SDK environment from explicit config first,
 * then fall back to app-id prefix inference.
 */
export function resolveSquareWebEnvironment(
  appId: string,
  configuredEnvironment?: string
): SquareWebEnvironment {
  const normalized = (configuredEnvironment || '').trim().toLowerCase()
  if (normalized === 'production' || normalized === 'sandbox') {
    return normalized
  }

  const normalizedAppId = appId.trim().toLowerCase()

  // Square app IDs use sq0idp- for production and sq0idb- for sandbox.
  if (normalizedAppId.includes('sq0idp-')) {
    return 'production'
  }

  return 'sandbox'
}

export function getSquareSdkUrl(environment: SquareWebEnvironment): string {
  return environment === 'production'
    ? 'https://web.squarecdn.com/v1/square.js'
    : 'https://sandbox.web.squarecdn.com/v1/square.js'
}

export function getSquareAppIdConfigError(appId: string): string | null {
  if (!appId) return 'Square app ID is not configured.'
  if (!/sq0id[bp]-/i.test(appId)) return 'Square app ID format looks invalid.'
  return null
}
