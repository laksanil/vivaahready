import { NextResponse } from 'next/server'
import { getLocationId } from '@/lib/square'

// Cache the location ID since it doesn't change
let cachedLocationId: string | null = null

export async function GET() {
  try {
    if (cachedLocationId) {
      return NextResponse.json({ locationId: cachedLocationId })
    }

    const locationId = await getLocationId()
    cachedLocationId = locationId

    return NextResponse.json({ locationId })
  } catch (error: unknown) {
    console.error('Error getting Square location:', error)
    const message = error instanceof Error ? error.message : 'Failed to get location'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
