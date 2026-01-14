import { NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/admin'

export async function GET() {
  const isAdmin = await isAdminAuthenticated()

  if (isAdmin) {
    return NextResponse.json({ authenticated: true })
  }

  return NextResponse.json({ authenticated: false }, { status: 401 })
}
