import { NextResponse } from 'next/server'
import { assignMissingVrIds, migrateVrIdFormat } from '@/lib/vrId'
import { isAdminAuthenticated } from '@/lib/admin'

export async function POST(request: Request) {
  try {
    const isAdmin = await isAdminAuthenticated()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'assign'

    if (action === 'migrate') {
      // Migrate old format (VR-YYYYMMDD-XXX) to new format (VRYYYYMMDDXXX)
      const result = await migrateVrIdFormat()
      return NextResponse.json({
        message: `Successfully migrated ${result.migrated} VR IDs to new format`,
        migrated: result.migrated,
        errors: result.errors,
      })
    } else {
      // Assign VR IDs to profiles that don't have one
      const count = await assignMissingVrIds()
      return NextResponse.json({
        message: `Successfully assigned VR IDs to ${count} profiles`,
        count,
      })
    }
  } catch (error) {
    console.error('VR ID migration error:', error)
    return NextResponse.json({ error: 'Failed to migrate VR IDs' }, { status: 500 })
  }
}
