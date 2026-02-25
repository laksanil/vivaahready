import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendWelcomeEmail } from '@/lib/email'
import { storeNotification } from '@/lib/notifications'
import { Prisma } from '@prisma/client'

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().trim().optional(),
  // Additional fields from Find Your Match modal
  profileFor: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  // UTM tracking
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  utm_term: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password, phone, profileFor, gender, dateOfBirth, utm_source, utm_medium, utm_campaign, utm_content, utm_term } = registerSchema.parse(body)
    const normalizedEmail = email.toLowerCase()
    const normalizedPhone = phone || undefined

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, password: true },
    })

    if (existingUser) {
      const accountMessage = existingUser.password
        ? 'An account with this email already exists. Please log in.'
        : 'This email is already registered with Google. Please use "Continue with Google".'
      return NextResponse.json(
        { error: accountMessage },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create user first so account creation is not blocked by optional subscription write failures.
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        phone: normalizedPhone,
      },
    })

    // Best-effort: create default free subscription without blocking registration.
    try {
      await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'free',
          status: 'active',
        },
      })
    } catch (subscriptionError) {
      console.error('Failed to create default subscription for new user:', subscriptionError)
    }

    // Send welcome email (fire and forget - don't block registration)
    sendWelcomeEmail(normalizedEmail, name).catch((err) => {
      console.error('Failed to send welcome email:', err)
    })
    storeNotification('welcome', user.id, { name }, { deliveryModes: ['email'] }).catch((err) => {
      console.error('Failed to store welcome notification:', err)
    })

    return NextResponse.json(
      {
        message: 'Account created successfully',
        userId: user.id,
        // Return profile data for profile creation flow
        profileData: profileFor ? { profileFor, gender, dateOfBirth } : null,
        // Pass UTM params forward to profile creation
        utm_params: { utm_source, utm_medium, utm_campaign, utm_content, utm_term }
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

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json(
          { error: 'An account with this email already exists. Please log in.' },
          { status: 400 }
        )
      }
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
