import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { assignMissingVrIds } from '@/lib/vrId'

const ADMIN_EMAILS = ['lnagasamudra1@gmail.com', 'usdesivivah@gmail.com', 'usedesivivah@gmail.com']
const ADMIN_TOKEN = 'vivaahready-admin-authenticated'

async function isAdminAuthenticated(): Promise<boolean> {
  const adminSession = cookies().get('admin_session')
  if (adminSession?.value === ADMIN_TOKEN) {
    return true
  }

  const session = await getServerSession(authOptions)
  if (session?.user?.email && ADMIN_EMAILS.includes(session.user.email)) {
    return true
  }

  return false
}

export async function POST() {
  try {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const count = await assignMissingVrIds()

    return NextResponse.json({
      message: `Successfully assigned VR IDs to ${count} profiles`,
      count,
    })
  } catch (error) {
    console.error('VR ID migration error:', error)
    return NextResponse.json({ error: 'Failed to migrate VR IDs' }, { status: 500 })
  }
}
