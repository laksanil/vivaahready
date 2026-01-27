import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'VivaahReady terms and conditions. Read our terms of service for using the platform.',
  openGraph: {
    title: 'Terms of Use | VivaahReady',
    description: 'VivaahReady terms and conditions for using the platform.',
    url: 'https://vivaahready.com/terms',
  },
}

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
