import { SquareClient, SquareEnvironment } from 'square'

// Initialize Square client based on environment
const squareEnvironmentName =
  process.env.SQUARE_ENVIRONMENT === 'production' ? 'production' : 'sandbox'

const environment =
  squareEnvironmentName === 'production'
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox

const token = squareEnvironmentName === 'production'
  ? process.env.SQUARE_PRODUCTION_ACCESS_TOKEN
  : process.env.SQUARE_SANDBOX_ACCESS_TOKEN

export const squareClient = new SquareClient({
  token: token || '',
  environment,
})

// Get the application ID based on environment
export function getSquareAppId(): string {
  return squareEnvironmentName === 'production'
    ? process.env.SQUARE_PRODUCTION_APP_ID || ''
    : process.env.SQUARE_SANDBOX_APP_ID || ''
}

function assertSquareConfigured() {
  if (!token) {
    throw new Error(`Missing Square access token for ${squareEnvironmentName} environment`)
  }
}

// Get the location ID (needed for payments)
// You'll need to get this from your Square Dashboard
export async function getLocationId(): Promise<string> {
  try {
    assertSquareConfigured()
    const response = await squareClient.locations.list()
    const locations = response.locations || []
    if (locations.length === 0) {
      throw new Error('No Square locations found')
    }

    // Prefer active locations and fall back to the first returned location.
    const preferredLocation =
      locations.find(location => location.status === 'ACTIVE') || locations[0]

    if (!preferredLocation?.id) {
      throw new Error('Square location ID is missing')
    }

    return preferredLocation.id
  } catch (error) {
    console.error('Error getting Square location:', error)
    throw error
  }
}

// Helper to convert dollars to cents (Square uses cents)
export function dollarsToCents(dollars: number): bigint {
  return BigInt(Math.round(dollars * 100))
}
