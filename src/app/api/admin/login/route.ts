import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Hardcoded admin credentials - change these!
const ADMIN_USERNAME = 'admin'
const ADMIN_PASSWORD = 'vivaah2024'
const ADMIN_TOKEN = 'vivaah_admin_session_token_2024'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Set admin session cookie
      cookies().set('admin_session', ADMIN_TOKEN, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  } catch {
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
