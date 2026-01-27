import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the VivaahReady team. Email, WhatsApp, or contact form — we respond within 24 hours.',
  openGraph: {
    title: 'Contact Us | VivaahReady',
    description: 'Get in touch with the VivaahReady team. We respond within 24 hours.',
    url: 'https://vivaahready.com/contact',
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
