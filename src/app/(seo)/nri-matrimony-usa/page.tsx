import type { Metadata } from 'next'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'

export const metadata: Metadata = {
  title: 'NRI Matrimony in the USA',
  description:
    'Indian matchmaking designed for NRIs in America. Verified profiles, cross-state matching, and family-friendly features. Free to start on VivaahReady.',
  alternates: { canonical: '/nri-matrimony-usa' },
  openGraph: {
    title: 'NRI Matrimony in the USA | VivaahReady',
    description:
      'Indian matchmaking designed for NRIs in America. Verified profiles and cross-state matching.',
    url: 'https://vivaahready.com/nri-matrimony-usa',
  },
}

const faqs = [
  {
    question: 'Is VivaahReady specifically for NRIs in the US?',
    answer:
      'Yes. VivaahReady is designed specifically for the Indian diaspora in the United States. Our platform understands the unique challenges NRIs face in matchmaking — from navigating cultural expectations across time zones to finding someone who shares both your Indian heritage and your American lifestyle.',
  },
  {
    question: 'Can I find matches across different US states?',
    answer:
      'Absolutely. VivaahReady connects Indian singles across all 50 states. Whether you\'re in the Bay Area, New York, Houston, or any other city, you can set your location preferences to find matches locally or across the country. Many couples are open to relocating for the right match, and our platform supports that flexibility.',
  },
  {
    question: 'Can my family in India participate in the matchmaking process?',
    answer:
      'Yes. Many NRI families have parents or relatives in India who play an active role in matchmaking. You can share your profile details with family members so they can help evaluate matches. VivaahReady is designed to support the collaborative, family-involved approach that many Indian families prefer, regardless of geography.',
  },
  {
    question: 'How does VivaahReady handle different Indian communities?',
    answer:
      'VivaahReady supports the full diversity of the Indian diaspora. You can set preferences for language, community, religion, caste, dietary habits, and more. Whether you\'re Telugu, Tamil, Punjabi, Gujarati, Bengali, Marathi, Hindi-speaking, or from any other Indian community, you\'ll find relevant matches who share your background and values.',
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

export default function NriMatrimonyUsaPage() {
  return (
    <SeoPageLayout
      heroTitle="NRI Matrimony in the USA"
      heroHighlight="NRI Matrimony"
      heroSubtitle="Matchmaking designed for the Indian diaspora in America. Find verified, compatible matches who understand the NRI experience."
      contentSections={[
        {
          heading: 'The NRI Matchmaking Challenge',
          body: 'Finding the right life partner as an NRI in the United States comes with a unique set of challenges. The community networks that facilitated matchmaking in India are fragmented across American cities. Family members who traditionally played a central role may be thousands of miles away. And many existing matrimony platforms cater primarily to the India market, leaving NRI needs as an afterthought. VivaahReady was built from the ground up to solve these challenges for Indian Americans.',
        },
        {
          heading: 'Built for the Indian American Experience',
          body: 'VivaahReady understands that NRIs live between two cultures — and that\'s a strength, not a complication. Our platform helps you find someone who appreciates your Indian roots and understands your American life. Whether you were born in the US, moved here for education or work, or are a second-generation Indian American, VivaahReady\'s preference system helps you find matches who share your unique blend of values and lifestyle expectations.',
        },
        {
          heading: 'Cross-State Matching, Coast to Coast',
          body: 'Unlike local community events or regional matrimony services, VivaahReady connects Indian singles across the entire United States. Major metro areas like New York, the Bay Area, Chicago, Houston, Dallas, Atlanta, Seattle, Boston, and Washington DC all have active VivaahReady members. You can search locally or expand your radius nationally — many successful matches involve couples from different states who were willing to relocate for the right person.',
        },
        {
          heading: 'Family-Friendly and Privacy-First',
          body: 'VivaahReady supports the family-involved matchmaking tradition that many NRI families value. Parents and relatives can participate in the process while the platform ensures privacy for all members. Your profile is never publicly visible — it appears only to compatible mutual matches. Photos and contact details are gated behind verification and mutual interest, giving both individuals and families the confidence to engage meaningfully.',
        },
      ]}
      faqs={faqs}
      jsonLd={jsonLd}
      relatedPages={[
        { href: '/indian-matchmaking-usa', label: 'Indian Matchmaking in the USA', description: 'Overview of matchmaking for US diaspora' },
        { href: '/verified-indian-matrimony', label: 'Verified Indian Matrimony', description: 'Trusted, verified profiles' },
        { href: '/privacy-first-matchmaking', label: 'Privacy-First Matchmaking', description: 'How we protect your identity' },
        { href: '/indian-matchmaking-new-york', label: 'Indian Matchmaking in New York' },
        { href: '/indian-matchmaking-bay-area', label: 'Indian Matchmaking in Bay Area' },
        { href: '/telugu-matrimony-usa', label: 'Telugu Matrimony USA' },
        { href: '/punjabi-matrimony-usa', label: 'Punjabi Matrimony USA' },
      ]}
      ctaHeadline="Find your match in the Indian American community"
      ctaSubtext="Free to start. Verified profiles. Privacy-first matchmaking for NRIs."
    />
  )
}
