import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How VivaahReady protects your personal data. Privacy-first matchmaking — essential cookies only, no third-party tracking.',
  openGraph: {
    title: 'Privacy Policy | VivaahReady',
    description: 'How VivaahReady protects your personal data. Privacy-first matchmaking.',
    url: 'https://vivaahready.com/privacy',
  },
}

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
