import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function isAdmin(session: { user?: { email?: string | null } } | null): Promise<boolean> {
  if (!session?.user?.email) return false
  const adminEmails = ['lakshmi@vivaahready.com', 'admin@vivaahready.com']
  return adminEmails.includes(session.user.email)
}

// GET - List all promo codes
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!await isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const codes = await prisma.eventPromoCode.findMany({
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ codes })
  } catch (error) {
    console.error('Error fetching promo codes:', error)
    return NextResponse.json({ error: 'Failed to fetch promo codes' }, { status: 500 })
  }
}

// POST - Create a new promo code
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!await isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { code, discountPercent, maxUses, eventSlug, expiresAt } = await request.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    if (!discountPercent || discountPercent < 1 || discountPercent > 100) {
      return NextResponse.json({ error: 'Discount must be between 1-100%' }, { status: 400 })
    }

    const normalizedCode = code.toUpperCase().trim()

    // Check if code already exists
    const existing = await prisma.eventPromoCode.findUnique({
      where: { code: normalizedCode },
    })
    if (existing) {
      return NextResponse.json({ error: 'Code already exists' }, { status: 400 })
    }

    const promoCode = await prisma.eventPromoCode.create({
      data: {
        code: normalizedCode,
        discountPercent,
        maxUses: maxUses || null,
        eventSlug: eventSlug || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    })

    return NextResponse.json({ promoCode }, { status: 201 })
  } catch (error) {
    console.error('Error creating promo code:', error)
    return NextResponse.json({ error: 'Failed to create promo code' }, { status: 500 })
  }
}

// PATCH - Update a promo code (toggle active, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!await isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, isActive, maxUses } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const updated = await prisma.eventPromoCode.update({
      where: { id },
      data: {
        ...(typeof isActive === 'boolean' ? { isActive } : {}),
        ...(typeof maxUses === 'number' ? { maxUses } : {}),
      },
    })

    return NextResponse.json({ promoCode: updated })
  } catch (error) {
    console.error('Error updating promo code:', error)
    return NextResponse.json({ error: 'Failed to update promo code' }, { status: 500 })
  }
}

// DELETE - Delete a promo code
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!await isAdmin(session)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await prisma.eventPromoCode.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting promo code:', error)
    return NextResponse.json({ error: 'Failed to delete promo code' }, { status: 500 })
  }
}
