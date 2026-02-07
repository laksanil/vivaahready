import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { compare } from 'bcryptjs'
import { prisma } from './prisma'
import { sendWelcomeEmail } from './email'

/**
 * Format full name to "Firstname L." format for privacy
 * E.g., "Lakshmi Nagasamudra" -> "Lakshmi N."
 */
function formatDisplayName(fullName: string | null | undefined): string {
  if (!fullName) return 'User'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  const firstName = parts[0]
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase()
  return `${firstName} ${lastInitial}.`
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/login',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter your email and password')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { profile: true, subscription: true },
        })

        if (!user || !user.password) {
          throw new Error('No account found with this email')
        }

        const isPasswordValid = await compare(credentials.password, user.password)

        if (!isPasswordValid) {
          throw new Error('Invalid password')
        }

        // Update lastLogin timestamp
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          hasProfile: !!user.profile,
          approvalStatus: user.profile?.approvalStatus || null,
          subscriptionPlan: user.subscription?.plan || 'free',
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Handle Google sign-in
      if (account?.provider === 'google') {
        try {
          const email = user.email
          if (!email) return false

          // Check if user exists
          let existingUser = await prisma.user.findUnique({
            where: { email },
            include: { profile: true, subscription: true },
          })

          // If user doesn't exist, create one
          if (!existingUser) {
            existingUser = await prisma.user.create({
              data: {
                email,
                name: formatDisplayName(user.name), // Format as "Firstname L." for privacy
                emailVerified: new Date(), // Google emails are verified
                lastLogin: new Date(),
              },
              include: { profile: true, subscription: true },
            })

            // Send welcome email for new users (fire and forget)
            sendWelcomeEmail(email, user.name || 'there').catch((err) => {
              console.error('Failed to send welcome email:', err)
            })
          } else {
            // Update lastLogin and email verification status
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                lastLogin: new Date(),
                ...(!existingUser.emailVerified && { emailVerified: new Date() }),
              },
            })
          }

          return true
        } catch (error) {
          console.error('Error during Google sign-in:', error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      // IMPORTANT: Always ensure hasProfile has a default value to prevent undefined issues
      if (token.hasProfile === undefined) {
        token.hasProfile = false
      }

      // On initial sign-in, set token.id
      if (account?.provider === 'google' && user?.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { profile: true, subscription: true },
        })
        if (dbUser) {
          token.id = dbUser.id
          token.hasProfile = !!dbUser.profile
          token.approvalStatus = dbUser.profile?.approvalStatus || null
          token.subscriptionPlan = dbUser.subscription?.plan || 'free'
        } else {
          // User should exist (created in signIn callback) but handle edge case
          token.hasProfile = false
          token.approvalStatus = null
          token.subscriptionPlan = 'free'
        }
      } else if (user) {
        token.id = user.id
        token.hasProfile = (user as any).hasProfile ?? false
        token.approvalStatus = (user as any).approvalStatus ?? null
        token.subscriptionPlan = (user as any).subscriptionPlan ?? 'free'
      }

      // Always refresh profile status from database to catch changes
      // (e.g., profile creation, approval status updates)
      if (token.id && typeof token.id === 'string') {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id },
            include: { profile: true, subscription: true },
          })
          if (dbUser) {
            token.hasProfile = !!dbUser.profile
            token.approvalStatus = dbUser.profile?.approvalStatus || null
            token.subscriptionPlan = dbUser.subscription?.plan || 'free'
          }
        } catch (error) {
          console.error('Error refreshing user profile status:', error)
          // Don't fail - keep existing token values
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string
        (session.user as any).hasProfile = token.hasProfile as boolean
        (session.user as any).approvalStatus = token.approvalStatus as string | null
        (session.user as any).subscriptionPlan = token.subscriptionPlan as string
      }
      return session
    },
  },
}
