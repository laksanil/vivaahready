import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      hasProfile: boolean
      subscriptionPlan: string
    }
  }

  interface User {
    id: string
    email: string
    name: string
    hasProfile: boolean
    subscriptionPlan: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    hasProfile: boolean
    subscriptionPlan: string
  }
}
