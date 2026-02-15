import type { Metadata } from 'next'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'

export const metadata: Metadata = {
  title: 'Hindi Matrimony in the USA',
  description:
    'Find verified Hindi-speaking matches in the US. Privacy-first matchmaking for singles from the Hindi belt. Free to start on VivaahReady.',
  alternates: { canonical: '/hindi-matrimony-usa' },
  openGraph: {
    title: 'Hindi Matrimony in the USA | VivaahReady',
    description: 'Verified Hindi-speaking matchmaking for the US diaspora. Free to start.',
    url: 'https://vivaahready.com/hindi-matrimony-usa',
  },
}

const faqs = [
  {
    question: 'Does VivaahReady cater to Hindi-speaking communities?',
    answer:
      'Yes. Hindi-speaking Indians form the largest linguistic group in the US diaspora, encompassing diverse communities from Uttar Pradesh, Madhya Pradesh, Rajasthan, Bihar, Jharkhand, and other Hindi-belt states. VivaahReady supports this diversity with detailed preference settings for language, community, sub-community, and cultural values.',
  },
  {
    question: 'Can I find matches from specific Hindi-speaking sub-communities?',
    answer:
      'Absolutely. Whether you identify as Kayastha, Brahmin, Marwari, Agarwal, Rajput, Baniya, Jat, or any other Hindi-speaking community, VivaahReady lets you set specific sub-community preferences while keeping the option to search more broadly.',
  },
  {
    question: 'Where are Hindi-speaking singles on VivaahReady?',
    answer:
      'Hindi-speaking members are spread across virtually every major US metro — New York, New Jersey, Chicago, the Bay Area, Houston, Dallas, Washington DC, Atlanta, and more. As the largest Indian language community, Hindi speakers have a presence in every region of the country.',
  },
  {
    question: 'How does the privacy model work?',
    answer:
      'Your profile is visible only to mutual matches — people whose preferences align with yours and vice versa. There is no public directory. Photos and contact details are shared only after verification and mutual interest, ensuring a private, dignified matchmaking experience.',
  },
  {
    question: 'Is VivaahReady suitable for arranged marriage?',
    answer:
      'Yes. VivaahReady is designed for serious, marriage-oriented matchmaking. The platform supports family involvement, detailed preference matching, and a verification process that ensures all members are genuine. It modernizes the arranged marriage process while preserving its core values of intentionality and family support.',
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

export default function HindiMatrimonyUsaPage() {
  return (
    <SeoPageLayout
      heroTitle="Hindi Matrimony in the USA"
      heroHighlight="Hindi Matrimony"
      heroSubtitle="Connect with verified Hindi-speaking singles across America. Matchmaking that understands the diversity and traditions of the Hindi-speaking community."
      contentSections={[
        {
          heading: 'The Hindi-Speaking Community in America',
          body: 'Hindi-speaking Indians form the largest linguistic community in the Indian American diaspora, with over 800,000 speakers across the United States. Originating from a wide geography — Uttar Pradesh, Madhya Pradesh, Rajasthan, Bihar, Delhi, Jharkhand, Uttarakhand, and beyond — this community is incredibly diverse in customs, traditions, and family expectations. From Marwari business families to Kayastha professionals to Brahmin academics, the Hindi-speaking community encompasses a rich tapestry of sub-communities, each with their own matchmaking traditions and values.',
        },
        {
          heading: 'Navigating Diversity Within Hindi Communities',
          body: 'One of the unique challenges of Hindi-speaking matchmaking is the sheer diversity within the community. A family from Lucknow may have very different cultural expectations than one from Jaipur or Patna. VivaahReady\'s detailed preference system accounts for this diversity — you can specify sub-community, dietary preferences (vegetarian vs. non-vegetarian), religious practices, education level, and more. This granularity helps you find matches who truly align with your family\'s values and expectations, not just someone who speaks the same language.',
        },
        {
          heading: 'Nationwide Reach for Hindi Singles',
          body: 'Hindi speakers are present in every major US metro, making them uniquely positioned for cross-state matchmaking. Whether you are in the New York-New Jersey corridor, the Midwest, Texas, or the West Coast, VivaahReady connects you with compatible Hindi-speaking singles nationwide. Many families are open to interstate matches when the cultural and professional compatibility is strong, and the platform makes these connections possible.',
        },
        {
          heading: 'Modernizing Arranged Marriage',
          body: 'For many Hindi-speaking families, arranged marriage remains the preferred path to finding a life partner. VivaahReady modernizes this process without losing its essence. Families can participate in profile evaluation, preferences are detailed enough to reflect genuine compatibility, and the verification process ensures every prospect is serious. The privacy-first model adds a layer of dignity that traditional matrimony sites often lack — no public browsing, no unsolicited messages, and no casual profiles.',
        },
      ]}
      faqs={faqs}
      jsonLd={jsonLd}
      relatedPages={[
        { href: '/punjabi-matrimony-usa', label: 'Punjabi Matrimony USA' },
        { href: '/gujarati-matrimony-usa', label: 'Gujarati Matrimony USA' },
        { href: '/marathi-matrimony-usa', label: 'Marathi Matrimony USA' },
        { href: '/indian-matchmaking-new-york', label: 'Indian Matchmaking in New York' },
        { href: '/indian-matchmaking-chicago', label: 'Indian Matchmaking in Chicago' },
        { href: '/indian-matchmaking-usa', label: 'Indian Matchmaking in the USA' },
        { href: '/nri-matrimony-usa', label: 'NRI Matrimony in the USA' },
      ]}
      ctaHeadline="Find your Hindi-speaking match in the US"
      ctaSubtext="Create your free profile. Verified, privacy-first matchmaking for Hindi-speaking singles."
    />
  )
}
