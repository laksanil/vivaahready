import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your VivaahReady account. Access your matches, connections, and messages.',
  openGraph: {
    title: 'Sign In | VivaahReady',
    description: 'Sign in to your VivaahReady account.',
    url: 'https://vivaahready.com/login',
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
