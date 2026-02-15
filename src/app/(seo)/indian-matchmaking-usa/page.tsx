import type { Metadata } from 'next'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'

export const metadata: Metadata = {
  title: 'Indian Matchmaking in the USA',
  description:
    'Find your perfect match with VivaahReady. Verified profiles, privacy-first Indian matchmaking designed for the US diaspora. Free to start.',
  alternates: { canonical: '/indian-matchmaking-usa' },
  openGraph: {
    title: 'Indian Matchmaking in the USA | VivaahReady',
    description:
      'Verified profiles, privacy-first Indian matchmaking designed for the US diaspora. Free to start.',
    url: 'https://vivaahready.com/indian-matchmaking-usa',
  },
}

const faqs = [
  {
    question: 'How does Indian matchmaking work in the US?',
    answer:
      'Indian matchmaking in the US blends traditional values with modern convenience. On VivaahReady, you create a detailed profile with your preferences and deal-breakers. Our system shows you only mutual matches — people whose preferences align with yours and vice versa. Photos and contact details are shared only after verification and mutual interest, keeping the process private and intentional.',
  },
  {
    question: 'Is VivaahReady free to use?',
    answer:
      'Yes, creating a profile, setting preferences, viewing mutual matches, and expressing interest are completely free. A one-time verification fee is required to unlock full features like messaging and contact sharing. There are no recurring subscriptions.',
  },
  {
    question: 'How are profiles verified on VivaahReady?',
    answer:
      'Every profile on VivaahReady goes through a manual review process. We verify identity to ensure each profile represents a genuine person with serious intent. This keeps the platform free from fake profiles and casual browsers.',
  },
  {
    question: 'Can my family participate in the matchmaking process?',
    answer:
      'Absolutely. Many of our members involve their parents or family in the matchmaking process. You can share your profile details with family members, and they can help you evaluate matches. VivaahReady is built to support the family-involved matchmaking tradition that many Indian families prefer.',
  },
  {
    question: 'What makes VivaahReady different from other matrimony sites?',
    answer:
      'VivaahReady is built on a privacy-first model. Unlike traditional matrimony sites where anyone can browse profiles, VivaahReady shows matches only when both sides\' preferences align. Your photos and contact details remain hidden until verification and mutual interest. This means no unsolicited messages, no random browsing, and no spam.',
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

export default function IndianMatchmakingUsaPage() {
  return (
    <SeoPageLayout
      heroTitle="Indian Matchmaking in the USA"
      heroHighlight="USA"
      heroSubtitle="Connect with verified Indian singles across America. Privacy-first matchmaking that respects your values, preferences, and family traditions."
      contentSections={[
        {
          heading: 'A Modern Approach to Traditional Matchmaking',
          body: 'For millions of Indian Americans, finding the right life partner means balancing two worlds — honoring family traditions and cultural values while navigating life in the United States. Traditional matchmaking networks that worked in India often fall short for the diaspora. Family connections are spread across continents, community events are infrequent, and many existing matrimony sites feel outdated or intrusive. VivaahReady bridges this gap with a platform designed specifically for Indian singles in America who want meaningful, marriage-oriented connections without compromising on privacy or cultural compatibility.',
        },
        {
          heading: 'Why Indian Singles in the US Choose VivaahReady',
          body: 'VivaahReady stands apart because of its privacy-first architecture. There is no public directory of profiles — you only see people whose preferences match yours, and they only see you when the same is true. This mutual-match model eliminates the noise of unsolicited messages and casual browsing that plague other platforms. Every profile is manually verified to ensure authenticity, and contact details are shared only after both parties express interest. Whether you\'re a tech professional in the Bay Area, a medical resident in Chicago, or a family helping their son or daughter find a partner, VivaahReady provides a dignified, secure matchmaking experience.',
        },
        {
          heading: 'Connecting Indian Communities Across America',
          body: 'The Indian diaspora in the US is incredibly diverse — Telugu, Tamil, Hindi, Punjabi, Gujarati, Bengali, Marathi, Kannada, and many more communities each have their own traditions and matchmaking customs. VivaahReady supports this diversity with detailed preference settings that let you specify language, community, dietary preferences, and more. With members across major metros including New York, the Bay Area, Chicago, Houston, Dallas, Atlanta, Seattle, and beyond, you can find compatible matches no matter where you are in the country.',
        },
        {
          heading: 'How VivaahReady Works',
          body: 'Getting started is simple and free. Create your profile with details about yourself, your background, and what you\'re looking for. Set your preferences and deal-breakers — age, location, education, religion, diet, and more. Once your profile is complete, you\'ll start seeing mutual matches: people whose criteria you meet and who meet yours. Express interest to signal your intent, and if the feeling is mutual, verification unlocks messaging and contact sharing. It\'s matchmaking the way it should be — intentional, private, and respectful.',
        },
      ]}
      faqs={faqs}
      jsonLd={jsonLd}
      relatedPages={[
        { href: '/verified-indian-matrimony', label: 'Verified Indian Matrimony', description: 'Learn about our verification process' },
        { href: '/privacy-first-matchmaking', label: 'Privacy-First Matchmaking', description: 'How we protect your identity' },
        { href: '/nri-matrimony-usa', label: 'NRI Matrimony in the USA', description: 'Made for the Indian diaspora' },
        { href: '/indian-matchmaking-new-york', label: 'Indian Matchmaking in New York' },
        { href: '/indian-matchmaking-bay-area', label: 'Indian Matchmaking in Bay Area' },
        { href: '/indian-matchmaking-chicago', label: 'Indian Matchmaking in Chicago' },
        { href: '/telugu-matrimony-usa', label: 'Telugu Matrimony USA' },
        { href: '/tamil-matrimony-usa', label: 'Tamil Matrimony USA' },
        { href: '/hindi-matrimony-usa', label: 'Hindi Matrimony USA' },
      ]}
      ctaHeadline="Start your matchmaking journey today"
      ctaSubtext="Create your free profile and discover compatible matches across the US."
    />
  )
}
