import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const ADMIN_TOKEN = 'vivaahready-admin-authenticated'

export async function GET() {
  const adminSession = cookies().get('admin_session')

  if (adminSession?.value === ADMIN_TOKEN) {
    return NextResponse.json({ authenticated: true })
  }

  return NextResponse.json({ authenticated: false }, { status: 401 })
}
