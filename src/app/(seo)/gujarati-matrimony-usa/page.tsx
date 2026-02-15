import type { Metadata } from 'next'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'

export const metadata: Metadata = {
  title: 'Gujarati Matrimony in the USA',
  description:
    'Find verified Gujarati matches in the US. Privacy-first matchmaking for Gujarati-speaking singles. Free to start on VivaahReady.',
  alternates: { canonical: '/gujarati-matrimony-usa' },
  openGraph: {
    title: 'Gujarati Matrimony in the USA | VivaahReady',
    description: 'Verified Gujarati matchmaking for the US diaspora. Free to start.',
    url: 'https://vivaahready.com/gujarati-matrimony-usa',
  },
}

const faqs = [
  {
    question: 'Does VivaahReady support Gujarati community preferences?',
    answer:
      'Yes. VivaahReady allows you to set preferences for Gujarati sub-communities including Patel, Agarwal, Jain, Brahmin, Lohana, Vania, and others. You can filter by dietary preferences (many Gujarati families prefer strict vegetarian), religious practices, and other criteria important to your family.',
  },
  {
    question: 'Where are most Gujarati singles on VivaahReady?',
    answer:
      'Gujarati Americans have strong communities in New Jersey (Edison, Jersey City), the Bay Area, Chicago (Devon Avenue area), Houston, and across the New York metropolitan region. The hospitality industry has spread Gujarati families to smaller cities as well, and VivaahReady connects members nationwide.',
  },
  {
    question: 'Can vegetarian dietary preferences be specified?',
    answer:
      'Yes. Dietary compatibility is important for many Gujarati families. VivaahReady allows you to specify vegetarian, Jain vegetarian, or other dietary preferences as part of your matching criteria. This ensures you see matches who share your family\'s food culture.',
  },
  {
    question: 'How does verification work for Gujarati profiles?',
    answer:
      'Every profile on VivaahReady goes through manual verification. This ensures Gujarati families interact with genuine, serious prospects. Your profile is visible only to mutual matches, and contact details are shared after verification and mutual interest.',
  },
  {
    question: 'Is VivaahReady suitable for Jain matchmaking?',
    answer:
      'Yes. Many Gujarati Jain families use VivaahReady for matchmaking. You can set specific Jain community preferences, dietary requirements, and other criteria. The platform supports the specific needs of Jain families while also connecting them to the broader Gujarati community if desired.',
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

export default function GujaratiMatrimonyUsaPage() {
  return (
    <SeoPageLayout
      heroTitle="Gujarati Matrimony in the USA"
      heroHighlight="Gujarati Matrimony"
      heroSubtitle="Connect with verified Gujarati singles across America. Matchmaking that understands the entrepreneurial spirit and family values of the Gujarati community."
      contentSections={[
        {
          heading: 'The Gujarati Community in America',
          body: 'Gujarati Americans are among the most entrepreneurial Indian communities in the United States, with over 300,000 speakers nationwide. Known for their business acumen — from the hospitality industry to retail to technology — Gujarati Americans have built thriving communities across the country. With strong roots in Gujarat\'s traditions of family unity, community support, and cultural preservation, Gujarati families in America often seek partners who share these foundational values. The Gujarati Samaj organizations in cities like Edison, Chicago, Houston, and the Bay Area remain vibrant cultural anchors.',
        },
        {
          heading: 'Understanding Gujarati Matchmaking Values',
          body: 'Gujarati matchmaking places a strong emphasis on family compatibility, business and professional alignment, dietary and religious practices, and community reputation. Many Gujarati families prefer vegetarian households, and sub-community compatibility (Patel, Lohana, Jain, Brahmin, etc.) can be an important consideration. VivaahReady captures these preferences in detail, allowing families to search for matches that truly align with their lifestyle and values. The platform respects the Gujarati tradition of family-driven matchmaking where parents and elders play an active advisory role.',
        },
        {
          heading: 'Gujarati Singles From Coast to Coast',
          body: 'Unlike some Indian communities that concentrate in a few metros, Gujarati Americans are spread across the entire country — a natural result of the community\'s entrepreneurial nature. From the motels of the Southeast to the tech companies of Silicon Valley, from the diamond district of New York to the medical practices of the Midwest, Gujarati families are everywhere. VivaahReady\'s nationwide platform makes it possible to find compatible matches across this wide geography, connecting families who might never have met through traditional community channels.',
        },
        {
          heading: 'A Trusted Platform for Gujarati Families',
          body: 'Trust is paramount in Gujarati matchmaking. VivaahReady earns that trust through manual profile verification, a privacy-first model where profiles are visible only to mutual matches, and a commitment to serious, marriage-oriented connections. There is no public directory, no unsolicited messaging, and no casual browsing. Every profile you see has been verified, and every match is based on genuine mutual compatibility. Gujarati families can participate in the process with confidence.',
        },
      ]}
      faqs={faqs}
      jsonLd={jsonLd}
      relatedPages={[
        { href: '/hindi-matrimony-usa', label: 'Hindi Matrimony USA' },
        { href: '/marathi-matrimony-usa', label: 'Marathi Matrimony USA' },
        { href: '/punjabi-matrimony-usa', label: 'Punjabi Matrimony USA' },
        { href: '/indian-matchmaking-new-jersey', label: 'Indian Matchmaking in New Jersey' },
        { href: '/indian-matchmaking-chicago', label: 'Indian Matchmaking in Chicago' },
        { href: '/indian-matchmaking-houston', label: 'Indian Matchmaking in Houston' },
        { href: '/indian-matchmaking-usa', label: 'Indian Matchmaking in the USA' },
      ]}
      ctaHeadline="Find your Gujarati match in the US"
      ctaSubtext="Create your free profile. Verified, privacy-first matchmaking for Gujarati singles."
    />
  )
}
