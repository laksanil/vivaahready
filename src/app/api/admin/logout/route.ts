import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { destroyAdminSession } from '@/lib/admin'

export async function POST() {
  const cookieStore = cookies()
  const token = cookieStore.get('admin_session')?.value
  if (token) {
    destroyAdminSession(token)
  }
  cookieStore.delete('admin_session')
  return NextResponse.json({ success: true })
}
