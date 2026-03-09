import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Singles Zoom Mixer - Indian Singles Ages 28-35',
  description:
    'Join VivaahReady\'s Singles Zoom Mixer for Indian singles ages 28-35. Moderated, structured conversations. 20 seats max. April 5, 2026.',
  alternates: {
    canonical: 'https://vivaahready.com/aprilevent',
  },
  openGraph: {
    title: 'Singles Zoom Mixer - Indian Singles Ages 28-35 | VivaahReady',
    description:
      'Structured Zoom mixer for Indian singles ages 28-35. 20 seats, balanced attendance, moderated conversations. $25 registration.',
    url: 'https://vivaahready.com/aprilevent',
    type: 'website',
    images: [
      {
        url: 'https://vivaahready.com/logo-banner.png',
        width: 2460,
        height: 936,
        alt: 'VivaahReady Singles Zoom Mixer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Singles Zoom Mixer - Indian Singles Ages 28-35 | VivaahReady',
    description:
      'Structured Zoom mixer for Indian singles ages 28-35. 20 seats, balanced attendance. $25.',
  },
}

export default function AprilEventLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Event',
            name: 'Singles Zoom Mixer - April Edition',
            description:
              'Structured Zoom mixer for Indian singles ages 28-35. Moderated conversations, balanced attendance, contact shared only by mutual opt-in.',
            startDate: '2026-04-05T11:00:00-07:00',
            endDate: '2026-04-05T13:00:00-07:00',
            eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
            eventStatus: 'https://schema.org/EventScheduled',
            location: {
              '@type': 'VirtualLocation',
              url: 'https://vivaahready.com/aprilevent',
            },
            organizer: {
              '@type': 'Organization',
              name: 'VivaahReady',
              url: 'https://vivaahready.com',
            },
            offers: {
              '@type': 'Offer',
              price: '25',
              priceCurrency: 'USD',
              url: 'https://vivaahready.com/aprilevent',
              availability: 'https://schema.org/LimitedAvailability',
              validFrom: '2026-02-01',
            },
            maximumAttendeeCapacity: 20,
            image: 'https://vivaahready.com/logo-banner.png',
          }),
        }}
      />
      {children}
    </>
  )
}
