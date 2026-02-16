import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { squareClient } from '@/lib/square'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const env = process.env.SQUARE_ENVIRONMENT || 'not set'
    const hasProductionToken = !!process.env.SQUARE_PRODUCTION_ACCESS_TOKEN
    const hasSandboxToken = !!process.env.SQUARE_SANDBOX_ACCESS_TOKEN
    const hasProductionAppId = !!process.env.SQUARE_PRODUCTION_APP_ID
    const hasSandboxAppId = !!process.env.SQUARE_SANDBOX_APP_ID

    // Try to list locations
    let locations = null
    let locationError = null
    try {
      const response = await squareClient.locations.list()
      locations = (response.locations || []).map(loc => ({
        id: loc.id,
        name: loc.name,
        status: loc.status,
        capabilities: loc.capabilities,
        country: loc.country,
        currency: loc.currency,
      }))
    } catch (err: unknown) {
      locationError = err instanceof Error ? err.message : String(err)
    }

    return NextResponse.json({
      environment: env,
      tokens: {
        hasProductionToken,
        hasSandboxToken,
        hasProductionAppId,
        hasSandboxAppId,
      },
      locations,
      locationError,
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Diagnosis failed' },
      { status: 500 }
    )
  }
}
