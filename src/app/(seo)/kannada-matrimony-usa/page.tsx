import type { Metadata } from 'next'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'

export const metadata: Metadata = {
  title: 'Kannada Matrimony in the USA',
  description:
    'Find verified Kannada matches in the US. Privacy-first matchmaking for Kannada-speaking singles from Karnataka. Free to start on VivaahReady.',
  alternates: { canonical: '/kannada-matrimony-usa' },
  openGraph: {
    title: 'Kannada Matrimony in the USA | VivaahReady',
    description: 'Verified Kannada matchmaking for the US diaspora. Free to start.',
    url: 'https://vivaahready.com/kannada-matrimony-usa',
  },
}

const faqs = [
  {
    question: 'Does VivaahReady support Kannada community preferences?',
    answer:
      'Yes. VivaahReady allows you to specify preferences for Kannada sub-communities including Vokkaliga, Lingayat, Brahmin (Smartha, Madhwa, Sri Vaishnava), Kuruba, and others. You can search within your specific community or keep your options open to the broader Kannada-speaking community.',
  },
  {
    question: 'Where are most Kannada singles in the US?',
    answer:
      'Kannada Americans have growing communities in the Bay Area, Seattle, Dallas, New Jersey, and Chicago. Bengaluru\'s tech industry has been a major pipeline, bringing many Kannada-speaking professionals to US tech hubs. VivaahReady connects these members across all major metros.',
  },
  {
    question: 'How does the matching process work for Kannada singles?',
    answer:
      'Create your profile with your preferences — language, community, education, profession, diet, and more. VivaahReady shows you only mutual matches: people whose criteria align with yours. Express interest, and if it is mutual, verification unlocks messaging and contact sharing.',
  },
  {
    question: 'Can families be involved in the process?',
    answer:
      'Yes. Kannada families often participate actively in matchmaking decisions. VivaahReady supports this by providing detailed profiles and allowing members to share their profile information with family members who can help evaluate potential matches.',
  },
  {
    question: 'Are profiles on VivaahReady verified?',
    answer:
      'Every profile goes through manual verification. Kannada families can trust that the profiles they see represent genuine, marriage-minded individuals. Photos and contact details are gated behind mutual interest for added privacy.',
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

export default function KannadaMatrimonyUsaPage() {
  return (
    <SeoPageLayout
      heroTitle="Kannada Matrimony in the USA"
      heroHighlight="Kannada Matrimony"
      heroSubtitle="Connect with verified Kannada singles across America. Matchmaking that understands the values and traditions of the Kannada-speaking community."
      contentSections={[
        {
          heading: 'The Kannada Community in America',
          body: 'Kannada-speaking Americans, with over 150,000 members, represent a growing and dynamic segment of the Indian diaspora. Many have come from Karnataka\'s thriving IT hub of Bengaluru, bringing strong technical expertise and a progressive cultural outlook. Kannada Koota organizations in cities like the Bay Area, Seattle, Dallas, and New Jersey keep the community connected through cultural events, Rajyotsava celebrations, and language programs. Yet the geographic spread of the community means that finding a compatible Kannada match through traditional networks can be challenging in America.',
        },
        {
          heading: 'Kannada Matchmaking Traditions in a Modern Context',
          body: 'Kannada matchmaking combines respect for family guidance with a progressive approach to partner selection. Families consider educational compatibility, professional background, community affinity, and shared cultural values. Sub-community considerations — Vokkaliga, Lingayat, Brahmin, and others — can be important to some families while others prioritize broader Karnataka identity. VivaahReady\'s flexible preference system supports both approaches, allowing you to search as specifically or broadly as your family prefers.',
        },
        {
          heading: 'From Bengaluru to Silicon Valley and Beyond',
          body: 'The Bengaluru-to-Silicon Valley pipeline has brought thousands of Kannada-speaking tech professionals to American cities. Seattle (Microsoft, Amazon), the Bay Area (Google, Apple, startups), and Dallas (Texas Instruments, major tech companies) all have strong Kannada communities. VivaahReady connects these professionals — and their families back in Karnataka who may be helping with the matchmaking process — creating matches that span the geography of the American Kannada diaspora.',
        },
        {
          heading: 'Verified, Private, and Intentional',
          body: 'Every Kannada profile on VivaahReady is manually verified. Your profile is visible only to mutual matches — there is no public directory or search. Contact details are shared only after both parties express interest. For Kannada families who value privacy and seriousness in matchmaking, VivaahReady provides a platform that matches their expectations. No casual browsing, no fake profiles, and no unsolicited messages.',
        },
      ]}
      faqs={faqs}
      jsonLd={jsonLd}
      relatedPages={[
        { href: '/telugu-matrimony-usa', label: 'Telugu Matrimony USA' },
        { href: '/tamil-matrimony-usa', label: 'Tamil Matrimony USA' },
        { href: '/marathi-matrimony-usa', label: 'Marathi Matrimony USA' },
        { href: '/indian-matchmaking-bay-area', label: 'Indian Matchmaking in Bay Area' },
        { href: '/indian-matchmaking-seattle', label: 'Indian Matchmaking in Seattle' },
        { href: '/indian-matchmaking-dallas', label: 'Indian Matchmaking in Dallas' },
        { href: '/indian-matchmaking-usa', label: 'Indian Matchmaking in the USA' },
      ]}
      ctaHeadline="Find your Kannada match in the US"
      ctaSubtext="Create your free profile. Verified, privacy-first matchmaking for Kannada singles."
    />
  )
}
