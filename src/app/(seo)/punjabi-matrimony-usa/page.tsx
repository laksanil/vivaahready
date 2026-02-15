import type { Metadata } from 'next'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'

export const metadata: Metadata = {
  title: 'Punjabi Matrimony in the USA',
  description:
    'Find verified Punjabi matches in the US. Privacy-first matchmaking for Sikh and Hindu Punjabi singles. Free to start on VivaahReady.',
  alternates: { canonical: '/punjabi-matrimony-usa' },
  openGraph: {
    title: 'Punjabi Matrimony in the USA | VivaahReady',
    description: 'Verified Punjabi matchmaking for the US diaspora. Free to start.',
    url: 'https://vivaahready.com/punjabi-matrimony-usa',
  },
}

const faqs = [
  {
    question: 'Does VivaahReady support both Sikh and Hindu Punjabi matchmaking?',
    answer:
      'Yes. The Punjabi community in America includes both Sikh and Hindu families, each with their own matchmaking traditions. VivaahReady allows you to set religious and community preferences so you can find matches that align with your family\'s background. You can search within Sikh Punjabi, Hindu Punjabi, or the broader Punjabi community.',
  },
  {
    question: 'Where are most Punjabi singles on VivaahReady?',
    answer:
      'Punjabi Americans have a strong presence in California (especially the Central Valley, Bay Area, and Sacramento), New York, New Jersey, and increasingly in Texas and the Midwest. VivaahReady connects Punjabi singles across all these regions and beyond.',
  },
  {
    question: 'Can I set preferences for Punjabi sub-communities?',
    answer:
      'Yes. Whether you identify as Jat Sikh, Khatri, Arora, Ramgarhia, or any other Punjabi sub-community, VivaahReady\'s preference system supports these distinctions. You can be as specific or as broad as your family prefers.',
  },
  {
    question: 'How does family involvement work?',
    answer:
      'Punjabi families often play a central role in matchmaking decisions. VivaahReady supports this by allowing you to share profile details with family members. The platform is designed to be accessible to parents and elders who want to participate in evaluating potential matches.',
  },
  {
    question: 'Are Punjabi profiles verified?',
    answer:
      'Every profile on VivaahReady is manually verified. This ensures Punjabi families interact only with genuine, marriage-minded prospects. Photos and contact details are gated behind mutual interest, keeping the process private and respectful.',
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

export default function PunjabiMatrimonyUsaPage() {
  return (
    <SeoPageLayout
      heroTitle="Punjabi Matrimony in the USA"
      heroHighlight="Punjabi Matrimony"
      heroSubtitle="Connect with verified Punjabi singles across America. Matchmaking that respects the warmth, traditions, and family values of the Punjabi community."
      contentSections={[
        {
          heading: 'The Punjabi Community in America',
          body: 'Punjabi Americans are one of the earliest and most established Indian immigrant communities in the United States, with over 250,000 speakers and a history stretching back more than a century. From the pioneering Sikh farmers of California\'s Central Valley to the thriving professionals in New York, New Jersey, and Texas, Punjabi Americans have built strong communities while preserving their vibrant cultural identity. The Punjabi community is known for its warmth, hospitality, and deep family bonds — values that are central to the matchmaking process.',
        },
        {
          heading: 'Honoring Punjabi Matchmaking Traditions',
          body: 'Punjabi matchmaking is deeply family-oriented. Roka ceremonies, family introductions, and community consultations are all part of the process. VivaahReady supports these traditions by providing a platform where families can participate meaningfully. Detailed profiles include information about education, profession, family background, dietary preferences, and religious practices — the same factors that Punjabi families have always considered when evaluating a match. The platform simply makes these connections possible across the vast geography of America.',
        },
        {
          heading: 'Sikh and Hindu Punjabi Matchmaking',
          body: 'The Punjabi diaspora includes both Sikh and Hindu families, each with distinct customs and considerations. VivaahReady recognizes this diversity and allows you to set preferences accordingly. Whether you\'re a Sikh family looking for a match within Jat Sikh or Khatri communities, or a Hindu Punjabi family seeking Arora or Khatri matches, the platform adapts to your specific criteria. For families who are open across religious lines but want Punjabi cultural compatibility, broader Punjabi searches are also supported.',
        },
        {
          heading: 'Privacy and Dignity in Every Connection',
          body: 'Punjabi families value respect and dignity in the matchmaking process. VivaahReady\'s privacy-first model ensures that your profile is never publicly visible — it appears only to people whose preferences mutually align with yours. Contact details are shared only after verification and mutual interest. There are no unsolicited messages, no public browsing, and no casual profiles. Every interaction on the platform is intentional and respectful.',
        },
      ]}
      faqs={faqs}
      jsonLd={jsonLd}
      relatedPages={[
        { href: '/hindi-matrimony-usa', label: 'Hindi Matrimony USA' },
        { href: '/gujarati-matrimony-usa', label: 'Gujarati Matrimony USA' },
        { href: '/indian-matchmaking-new-york', label: 'Indian Matchmaking in New York' },
        { href: '/indian-matchmaking-bay-area', label: 'Indian Matchmaking in Bay Area' },
        { href: '/indian-matchmaking-new-jersey', label: 'Indian Matchmaking in New Jersey' },
        { href: '/indian-matchmaking-usa', label: 'Indian Matchmaking in the USA' },
        { href: '/verified-indian-matrimony', label: 'Verified Indian Matrimony' },
      ]}
      ctaHeadline="Find your Punjabi match in the US"
      ctaSubtext="Create your free profile. Verified, privacy-first matchmaking for Punjabi singles."
    />
  )
}
