import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdminAuthenticated } from '@/lib/admin'

// GET - Fetch current settings
export async function GET() {
  try {
    if (!await isAdminAuthenticated()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let settings = await prisma.settings.findUnique({
      where: { id: 'default' },
    })

    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: 'default',
          verificationPrice: 50,
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// POST - Update settings
export async function POST(request: NextRequest) {
  try {
    if (!await isAdminAuthenticated()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { verificationPrice, promoPrice, promoEndDate } = body

    if (verificationPrice !== undefined && (typeof verificationPrice !== 'number' || verificationPrice < 1)) {
      return NextResponse.json({ error: 'Invalid verification price' }, { status: 400 })
    }

    const settings = await prisma.settings.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        verificationPrice: verificationPrice || 50,
        promoPrice: promoPrice || null,
        promoEndDate: promoEndDate ? new Date(promoEndDate) : null,
      },
      update: {
        verificationPrice: verificationPrice !== undefined ? verificationPrice : undefined,
        promoPrice: promoPrice !== undefined ? promoPrice : undefined,
        promoEndDate: promoEndDate !== undefined ? (promoEndDate ? new Date(promoEndDate) : null) : undefined,
      },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
