import type { Metadata } from 'next'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'

export const metadata: Metadata = {
  title: 'Marathi Matrimony in the USA',
  description:
    'Find verified Marathi matches in the US. Privacy-first matchmaking for Marathi-speaking singles from Maharashtra. Free to start on VivaahReady.',
  alternates: { canonical: '/marathi-matrimony-usa' },
  openGraph: {
    title: 'Marathi Matrimony in the USA | VivaahReady',
    description: 'Verified Marathi matchmaking for the US diaspora. Free to start.',
    url: 'https://vivaahready.com/marathi-matrimony-usa',
  },
}

const faqs = [
  {
    question: 'Does VivaahReady support Marathi community preferences?',
    answer:
      'Yes. VivaahReady allows you to set preferences specific to the Marathi community, including sub-communities like Maratha, Brahmin (Deshastha, Kokanastha, Chitpavan), CKP, Pathare Prabhu, and others. You can also filter by dietary preferences, education, and profession.',
  },
  {
    question: 'Where are most Marathi singles in the US?',
    answer:
      'Marathi Americans have growing communities in the Bay Area, Seattle, New Jersey, Chicago, and the Dallas-Fort Worth area. The tech sector has brought many Marathi professionals to cities with major tech employers, and VivaahReady connects them across all these metros.',
  },
  {
    question: 'Can my family participate in the matchmaking?',
    answer:
      'Absolutely. Marathi families often take an active role in matchmaking. VivaahReady supports family involvement by providing detailed profiles and a process where families can evaluate matches together. The platform modernizes the traditional process while preserving the family-centric approach Marathi families value.',
  },
  {
    question: 'How is privacy maintained?',
    answer:
      'Your profile is visible only to mutual matches on VivaahReady. There is no public directory or search. Photos and contact details are shared only after verification and mutual interest. This ensures a dignified, private matchmaking experience.',
  },
  {
    question: 'Is VivaahReady better than Maharashtra Mandal events for matchmaking?',
    answer:
      'Maharashtra Mandal events are wonderful for community building but limited by geography and timing. VivaahReady complements these events by connecting Marathi singles nationwide, 24/7. You can discover compatible matches in cities you might never visit, greatly expanding your options beyond local community events.',
  },
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: { '@type': 'Answer', text: faq.answer },
  })),
}

export default function MarathiMatrimonyUsaPage() {
  return (
    <SeoPageLayout
      heroTitle="Marathi Matrimony in the USA"
      heroHighlight="Marathi Matrimony"
      heroSubtitle="Connect with verified Marathi singles across America. Matchmaking that respects the progressive values and strong family bonds of the Marathi community."
      contentSections={[
        {
          heading: 'The Marathi Community in America',
          body: 'Marathi Americans, with over 200,000 speakers in the US, have built a vibrant presence particularly in technology hubs and major metros. Originating from Maharashtra — home to Mumbai, Pune, and Nagpur — this community brings a unique blend of progressive thinking, strong educational values, and deep cultural roots. Active Maharashtra Mandal organizations in cities across America host cultural events, Ganesh festivals, and community gatherings that keep Marathi traditions alive. Yet when it comes to matchmaking, the geographic spread of the community often makes it hard to find compatible matches through local networks alone.',
        },
        {
          heading: 'Marathi Matchmaking Values',
          body: 'Marathi families value education, professional achievement, and cultural compatibility. Many families prefer partners who understand Marathi customs — from the importance of festivals like Ganeshotsav and Gudi Padwa to the culinary traditions and the value placed on intellectual discourse. VivaahReady\'s detailed preference system captures these nuances, helping families find matches who share not just demographic criteria but the cultural sensibility that defines Marathi identity. Sub-community preferences, dietary requirements, and family values are all part of the matching process.',
        },
        {
          heading: 'Connecting Marathi Professionals Nationwide',
          body: 'The tech boom has spread Marathi professionals across the Bay Area, Seattle, New Jersey, Dallas, Chicago, and beyond. Many arrived as engineers or researchers and have built careers at major technology companies. Finding a partner within the Marathi community can be challenging when the local community is small. VivaahReady solves this by connecting members nationwide — your next match might be in a city you haven\'t even considered, and the platform makes that discovery possible.',
        },
        {
          heading: 'Privacy and Trust for Marathi Families',
          body: 'VivaahReady provides the privacy and verification that Marathi families expect. Profiles are visible only to mutual matches, contact details are shared only after mutual interest, and every profile is manually verified. No public browsing, no unsolicited contact, and no fake profiles. The platform creates a trusted space where Marathi families can engage in matchmaking with confidence and dignity.',
        },
      ]}
      faqs={faqs}
      jsonLd={jsonLd}
      relatedPages={[
        { href: '/hindi-matrimony-usa', label: 'Hindi Matrimony USA' },
        { href: '/gujarati-matrimony-usa', label: 'Gujarati Matrimony USA' },
        { href: '/kannada-matrimony-usa', label: 'Kannada Matrimony USA' },
        { href: '/indian-matchmaking-bay-area', label: 'Indian Matchmaking in Bay Area' },
        { href: '/indian-matchmaking-seattle', label: 'Indian Matchmaking in Seattle' },
        { href: '/indian-matchmaking-new-jersey', label: 'Indian Matchmaking in New Jersey' },
        { href: '/indian-matchmaking-usa', label: 'Indian Matchmaking in the USA' },
      ]}
      ctaHeadline="Find your Marathi match in the US"
      ctaSubtext="Create your free profile. Verified, privacy-first matchmaking for Marathi singles."
    />
  )
}
