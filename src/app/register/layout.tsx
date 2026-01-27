import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Your Profile',
  description: 'Join VivaahReady — Indian matchmaking for US diaspora. Create your free profile, get verified, and find meaningful connections.',
  openGraph: {
    title: 'Create Your Profile | VivaahReady',
    description: 'Join VivaahReady — create your free profile, get verified, and find meaningful connections.',
    url: 'https://vivaahready.com/register',
  },
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
