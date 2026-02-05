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
  } catch (error) {
    console.error('Error getting Square location:', error)
    return NextResponse.json(
      { error: 'Failed to get location' },
      { status: 500 }
    )
  }
}
