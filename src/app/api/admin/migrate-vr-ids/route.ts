import { NextResponse } from 'next/server'
import { assignMissingVrIds } from '@/lib/vrId'
import { isAdminAuthenticated } from '@/lib/admin'

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
