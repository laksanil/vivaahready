import { SquareClient, SquareEnvironment } from 'square'

// Initialize Square client based on environment
const environment = process.env.SQUARE_ENVIRONMENT === 'production'
  ? SquareEnvironment.Production
  : SquareEnvironment.Sandbox

const token = process.env.SQUARE_ENVIRONMENT === 'production'
  ? process.env.SQUARE_PRODUCTION_ACCESS_TOKEN
  : process.env.SQUARE_SANDBOX_ACCESS_TOKEN

export const squareClient = new SquareClient({
  token: token || '',
  environment,
})

// Get the application ID based on environment
export function getSquareAppId(): string {
  return process.env.SQUARE_ENVIRONMENT === 'production'
    ? process.env.SQUARE_PRODUCTION_APP_ID || ''
    : process.env.SQUARE_SANDBOX_APP_ID || ''
}

// Get the location ID (needed for payments)
// You'll need to get this from your Square Dashboard
export async function getLocationId(): Promise<string> {
  try {
    const response = await squareClient.locations.list()
    if (response.locations && response.locations.length > 0) {
      return response.locations[0].id || ''
    }
    throw new Error('No Square locations found')
  } catch (error) {
    console.error('Error getting Square location:', error)
    throw error
  }
}

// Helper to convert dollars to cents (Square uses cents)
export function dollarsToCents(dollars: number): bigint {
  return BigInt(Math.round(dollars * 100))
}
