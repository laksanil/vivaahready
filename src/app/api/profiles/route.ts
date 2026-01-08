import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse filters
    const gender = searchParams.get('gender')
    const caste = searchParams.get('caste')
    const qualification = searchParams.get('qualification')
    const diet = searchParams.get('diet')
    const location = searchParams.get('location')

    // Build where clause
    const where: any = {
      isActive: true,
    }

    if (gender) {
      where.gender = gender
    }

    if (caste) {
      where.caste = { contains: caste }
    }

    if (qualification) {
      where.qualification = { contains: qualification }
    }

    if (diet) {
      where.dietaryPreference = { contains: diet }
    }

    if (location) {
      where.currentLocation = { contains: location }
    }

    const profiles = await prisma.profile.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({ profiles })
  } catch (error) {
    console.error('Profiles fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch profiles', profiles: [] }, { status: 500 })
  }
}
