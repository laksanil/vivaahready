import type { Metadata } from 'next'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'

export const metadata: Metadata = {
  title: 'Bengali Matrimony in the USA',
  description:
    'Find verified Bengali matches in the US. Privacy-first matchmaking for Bengali-speaking singles from West Bengal. Free to start on VivaahReady.',
  alternates: { canonical: '/bengali-matrimony-usa' },
  openGraph: {
    title: 'Bengali Matrimony in the USA | VivaahReady',
    description: 'Verified Bengali matchmaking for the US diaspora. Free to start.',
    url: 'https://vivaahready.com/bengali-matrimony-usa',
  },
}

const faqs = [
  {
    question: 'Does VivaahReady cater to the Bengali community?',
    answer:
      'Yes. VivaahReady supports Bengali-specific preferences including language, community, educational background, and cultural values. Whether you\'re from a Brahmin, Kayastha, Baidya, or other Bengali background, you can set preferences that reflect your family\'s matchmaking criteria.',
  },
  {
    question: 'Where are most Bengali singles on VivaahReady?',
    answer:
      'Bengali Americans have notable communities in New Jersey (Edison, Jersey City), the New York metropolitan area, the Bay Area, and in college towns with strong academic institutions. The Boston area, Chicago, and Houston also have growing Bengali populations.',
  },
  {
    question: 'How does VivaahReady handle Bengali cultural values?',
    answer:
      'Bengali matchmaking often values intellectual and cultural compatibility alongside traditional considerations. VivaahReady\'s detailed profiles capture educational background, professional interests, and cultural preferences — allowing families to find matches who share the Bengali community\'s emphasis on learning, arts, and progressive thinking.',
  },
  {
    question: 'Are profiles verified?',
    answer:
      'Every profile on VivaahReady goes through manual verification. Bengali families can be confident that every match they see represents a genuine, marriage-minded individual. Contact details are shared only after mutual interest is established.',
  },
  {
    question: 'Can I search across different Bengali sub-communities?',
    answer:
      'Yes. You can specify sub-community preferences or keep your search open to the broader Bengali community. VivaahReady gives you the flexibility to search as narrowly or broadly as your family prefers.',
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

export default function BengaliMatrimonyUsaPage() {
  return (
    <SeoPageLayout
      heroTitle="Bengali Matrimony in the USA"
      heroHighlight="Bengali Matrimony"
      heroSubtitle="Connect with verified Bengali singles across America. Matchmaking that values intellectual compatibility, cultural depth, and family traditions."
      contentSections={[
        {
          heading: 'The Bengali Community in America',
          body: 'Bengali Americans, with over 150,000 speakers in the US, represent one of the most culturally rich communities in the Indian diaspora. Originating from West Bengal and the broader Bengali-speaking world, this community is known for its literary heritage, artistic sensibility, and emphasis on education. From Nobel laureates to Silicon Valley engineers, Bengali Americans have made their mark across academia, technology, medicine, and the arts. Finding a partner who shares this unique blend of intellectual curiosity and cultural pride is a priority for many Bengali families in America.',
        },
        {
          heading: 'Matchmaking for the Bengali Sensibility',
          body: 'Bengali matchmaking has always placed a premium on intellectual and cultural compatibility. Beyond the traditional considerations of family background, education, and profession, Bengali families often value a shared appreciation for literature, music, cinema, and progressive thought. VivaahReady\'s detailed profile system captures these dimensions, helping Bengali singles and their families find matches who align not just on conventional criteria but on the cultural values that define Bengali identity.',
        },
        {
          heading: 'Bengali Singles Across America',
          body: 'While Bengali communities are concentrated in the New York-New Jersey metro area, the Bay Area, and academic hubs like Boston, Bengali professionals are increasingly spread across the entire country. VivaahReady connects Bengali singles nationwide, making geography less of a barrier. Whether you are in a city with a vibrant Bengali cultural scene or in a smaller metro, the platform helps you find compatible matches who share your background and aspirations.',
        },
        {
          heading: 'A Thoughtful, Private Approach',
          body: 'VivaahReady\'s approach aligns well with Bengali values of privacy and dignity. Your profile is visible only to mutual matches — never to the general public. Contact details are shared only after verification and mutual interest. There are no unsolicited messages or casual browsers. For Bengali families who value a thoughtful, intentional matchmaking process, VivaahReady provides the right environment to find meaningful connections.',
        },
      ]}
      faqs={faqs}
      jsonLd={jsonLd}
      relatedPages={[
        { href: '/hindi-matrimony-usa', label: 'Hindi Matrimony USA' },
        { href: '/tamil-matrimony-usa', label: 'Tamil Matrimony USA' },
        { href: '/indian-matchmaking-new-york', label: 'Indian Matchmaking in New York' },
        { href: '/indian-matchmaking-new-jersey', label: 'Indian Matchmaking in New Jersey' },
        { href: '/indian-matchmaking-boston', label: 'Indian Matchmaking in Boston' },
        { href: '/indian-matchmaking-usa', label: 'Indian Matchmaking in the USA' },
        { href: '/privacy-first-matchmaking', label: 'Privacy-First Matchmaking' },
      ]}
      ctaHeadline="Find your Bengali match in the US"
      ctaSubtext="Create your free profile. Verified, privacy-first matchmaking for Bengali singles."
    />
  )
}
