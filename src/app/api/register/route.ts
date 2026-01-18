import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  // Additional fields from Find Your Match modal
  profileFor: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password, phone, profileFor, gender, dateOfBirth } = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        // Create default free subscription
        subscription: {
          create: {
            plan: 'free',
            status: 'active',
          },
        },
      },
    })

    // Note: Welcome email is sent after full profile creation (photos uploaded)
    // See: /api/profile/send-welcome-email

    return NextResponse.json(
      {
        message: 'Account created successfully',
        userId: user.id,
        // Return profile data for profile creation flow
        profileData: profileFor ? { profileFor, gender, dateOfBirth } : null
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
