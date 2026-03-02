import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint is disabled. Please use PayPal for payments.' },
    { status: 410 }
  )
}
