import type { Metadata } from 'next'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'

export const metadata: Metadata = {
  title: 'Indian Matrimony USA \u2014 Trusted Matchmaking for Indian Families in America',
  description:
    'Indian matrimony in the USA made private, verified, and family-friendly. VivaahReady connects Indian singles and families across America with compatible, verified matches. Free to start.',
  keywords: [
    'Indian matrimony USA',
    'Indian matrimony in USA',
    'Indian matrimonial USA',
    'Indian matrimony site USA',
    'Indian marriage USA',
    'Indian matrimony in America',
    'best Indian matrimony USA',
    'Indian matchmaking USA',
    'Hindu matrimony USA',
    'Indian bride groom USA',
  ],
  alternates: { canonical: '/indian-matrimony-usa' },
  openGraph: {
    title: 'Indian Matrimony USA | VivaahReady',
    description:
      'Trusted Indian matrimony in the USA. Verified profiles, privacy-first matching, and family-friendly features.',
    url: 'https://vivaahready.com/indian-matrimony-usa',
  },
}

const faqs = [
  {
    question: 'What is the best Indian matrimony site in the USA?',
    answer:
      'VivaahReady is built specifically for Indian families and professionals in the United States. Unlike large portals that serve millions globally, VivaahReady focuses on quality over quantity \u2014 every profile is verified, photos are gated behind mutual interest, and the matching algorithm considers both your preferences and the other person\u2019s preferences for truly compatible results.',
  },
  {
    question: 'How is Indian matrimony in the USA different from matrimony in India?',
    answer:
      'Indian families in the USA face unique challenges: smaller community networks, children balancing two cultures, and fewer opportunities for the organic introductions that happen naturally in India. Indian matrimony in the USA needs to bridge that gap \u2014 connecting families across states while respecting both tradition and independence. VivaahReady was designed for exactly this reality.',
  },
  {
    question: 'Is VivaahReady free to use for Indian matrimony in the USA?',
    answer:
      'Yes, creating a profile and seeing your matches is completely free. VivaahReady charges a one-time verification fee to unlock full features like photos, messaging, and sending interests. There are no monthly subscriptions or recurring charges.',
  },
  {
    question: 'Can parents and families be involved in the matrimony process?',
    answer:
      'Absolutely. VivaahReady supports the family-involved approach that many Indian families value. Parents can help create and review profiles. The platform is designed so that families feel comfortable participating \u2014 with privacy protections, verified members, and a respectful environment that honors the collaborative nature of Indian matrimony.',
  },
  {
    question: 'Which Indian communities does VivaahReady serve in the USA?',
    answer:
      'VivaahReady serves the full diversity of the Indian diaspora in America \u2014 Telugu, Tamil, Hindi, Punjabi, Gujarati, Bengali, Marathi, Kannada, and all other Indian communities. You can set preferences for language, religion, caste, dietary habits, and location to find matches that align with your family values.',
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

export default function IndianMatrimonyUsaPage() {
  return (
    <SeoPageLayout
      heroTitle="Indian Matrimony in the USA"
      heroHighlight="Indian Matrimony"
      heroSubtitle="A private, verified matrimony platform built for Indian families and professionals across America. Find compatible matches who share your values, culture, and vision for the future."
      contentSections={[
        {
          heading: 'Why Indian Families in America Need a Better Matrimony Option',
          body: 'Most Indian matrimony sites were built for India\u2019s market \u2014 millions of profiles, broad search filters, and limited privacy. For Indian families in the USA, the experience feels overwhelming and impersonal. VivaahReady takes a different approach: fewer, higher-quality profiles, mutual-match-only visibility, and a platform that understands the Indian American experience. Your profile is never publicly listed. It only appears to compatible matches who meet your preferences \u2014 and whose preferences you meet too.',
        },
        {
          heading: 'Verified Profiles You Can Trust',
          body: 'Trust is everything in Indian matrimony. VivaahReady requires verification before members can access photos, names, and contact details. This keeps the platform serious, private, and spam-free. Every verified member has made a commitment to the process \u2014 which means the people you interact with are genuinely looking for a life partner, not casually browsing.',
        },
        {
          heading: 'Matching That Works Both Ways',
          body: 'VivaahReady\u2019s matching algorithm is mutual by design. You only see profiles where both your preferences and the other person\u2019s preferences align. This eliminates the frustration of scrolling through hundreds of incompatible profiles. Whether your priorities are location, education, language, religion, dietary preferences, or family values \u2014 the system ensures both sides are a good fit before showing a match.',
        },
        {
          heading: 'Connecting Indian Families Across All 50 States',
          body: 'Whether you\u2019re in the Bay Area, New York, Houston, Chicago, Atlanta, Dallas, Seattle, Boston, or any other city \u2014 VivaahReady connects Indian singles and families coast to coast. Many successful matches involve partners from different states who found each other through thoughtful preference matching. The Indian diaspora in America is spread wide, and VivaahReady brings it closer together.',
        },
        {
          heading: 'Privacy-First Indian Matrimony',
          body: 'Indian matrimony is a deeply personal journey, and privacy matters. On VivaahReady, your profile is never searchable on Google. Photos are hidden until mutual interest is expressed. Contact details are shared only after both parties connect. This is the level of discretion that Indian families in the USA expect and deserve.',
        },
      ]}
      faqs={faqs}
      jsonLd={jsonLd}
      relatedPages={[
        { href: '/indian-matchmaking-usa', label: 'Indian Matchmaking in the USA', description: 'Overview of matchmaking for US diaspora' },
        { href: '/nri-matrimony-usa', label: 'NRI Matrimony USA', description: 'Matchmaking for NRIs in America' },
        { href: '/verified-indian-matrimony', label: 'Verified Indian Matrimony', description: 'Trusted, verified profiles' },
        { href: '/privacy-first-matchmaking', label: 'Privacy-First Matchmaking', description: 'How we protect your identity' },
        { href: '/indian-matchmaking-bay-area', label: 'Indian Matchmaking in Bay Area' },
        { href: '/indian-matchmaking-new-york', label: 'Indian Matchmaking in New York' },
        { href: '/telugu-matrimony-usa', label: 'Telugu Matrimony USA' },
        { href: '/tamil-matrimony-usa', label: 'Tamil Matrimony USA' },
      ]}
      ctaHeadline="Start your Indian matrimony journey in the USA"
      ctaSubtext="Free to start. Verified profiles. Privacy-first matchmaking for Indian families in America."
    />
  )
}
