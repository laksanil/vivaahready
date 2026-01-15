import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { compare } from 'bcryptjs'
import { prisma } from './prisma'

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
                name: user.name || 'User',
                emailVerified: new Date(), // Google emails are verified
                lastLogin: new Date(),
              },
              include: { profile: true, subscription: true },
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
        }
      } else if (user) {
        token.id = user.id
        token.hasProfile = (user as any).hasProfile
        token.approvalStatus = (user as any).approvalStatus
        token.subscriptionPlan = (user as any).subscriptionPlan
      }

      // Always refresh profile status from database to catch changes
      // (e.g., profile creation, approval status updates)
      if (token.id && typeof token.id === 'string') {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          include: { profile: true, subscription: true },
        })
        if (dbUser) {
          token.hasProfile = !!dbUser.profile
          token.approvalStatus = dbUser.profile?.approvalStatus || null
          token.subscriptionPlan = dbUser.subscription?.plan || 'free'
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
