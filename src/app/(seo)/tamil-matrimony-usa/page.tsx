import type { Metadata } from 'next'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'

export const metadata: Metadata = {
  title: 'Tamil Matrimony in the USA',
  description:
    'Find verified Tamil matches in the US. Privacy-first matchmaking for Tamil-speaking singles from Tamil Nadu. Free to start on VivaahReady.',
  alternates: { canonical: '/tamil-matrimony-usa' },
  openGraph: {
    title: 'Tamil Matrimony in the USA | VivaahReady',
    description: 'Verified Tamil matchmaking for the US diaspora. Free to start.',
    url: 'https://vivaahready.com/tamil-matrimony-usa',
  },
}

const faqs = [
  {
    question: 'Does VivaahReady support Tamil community preferences?',
    answer:
      'Yes. VivaahReady lets you set preferences for language, community, sub-community, and cultural values important to Tamil families. Whether you identify as Iyer, Iyengar, Mudaliar, Pillai, Chettiar, Nadar, or any other Tamil sub-community, you can specify your preferences while keeping the flexibility to explore broader matches.',
  },
  {
    question: 'Where are most Tamil singles on VivaahReady located?',
    answer:
      'Tamil singles on VivaahReady are spread across major US metros including New Jersey (Edison, Jersey City), the Bay Area (Sunnyvale, Fremont), Chicago, Houston, and the greater New York area. The platform connects Tamil singles nationwide, so you can find matches beyond your local area.',
  },
  {
    question: 'How does VivaahReady respect Tamil cultural traditions?',
    answer:
      'Tamil matchmaking often involves family consultation, horoscope considerations, and community compatibility. VivaahReady supports family involvement in the process and provides detailed profile fields that capture the information Tamil families consider important. The platform respects the seriousness and intentionality of Tamil matrimonial traditions.',
  },
  {
    question: 'Are profiles verified on VivaahReady?',
    answer:
      'Every profile goes through manual verification regardless of community. This ensures Tamil singles and their families interact only with genuine prospects. Contact details are shared only after mutual interest is established.',
  },
  {
    question: 'Can I find matches from specific Tamil sub-communities?',
    answer:
      'Yes. VivaahReady\'s preference system allows you to specify sub-community preferences. You can search within your specific Tamil sub-community or keep your options open across the broader Tamil community — the choice is yours.',
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

export default function TamilMatrimonyUsaPage() {
  return (
    <SeoPageLayout
      heroTitle="Tamil Matrimony in the USA"
      heroHighlight="Tamil Matrimony"
      heroSubtitle="Connect with verified Tamil singles across America. Matchmaking that honors Tamil cultural values and family traditions."
      contentSections={[
        {
          heading: 'The Tamil Community in America',
          body: 'Tamil Americans represent one of the most established and accomplished Indian communities in the United States, with over 300,000 Tamil speakers across the country. Originating primarily from Tamil Nadu and the global Tamil diaspora, Tamil Americans have built strong communities in New Jersey, the Bay Area, Chicago, Houston, and beyond. Known for their deep respect for education, classical arts, and family values, Tamil Americans often seek partners who share these cultural touchstones — a need that general dating apps and even many Indian matrimony sites struggle to serve well.',
        },
        {
          heading: 'Matchmaking Rooted in Tamil Values',
          body: 'Tamil matchmaking carries traditions that span centuries — the involvement of family elders, the importance of educational and professional compatibility, and the respect for cultural heritage. VivaahReady supports these values with a platform that lets you set detailed preferences around community, education, profession, dietary habits, and more. Whether your family prioritizes same sub-community matches or is open to broader Tamil or South Indian connections, the platform adapts to your approach.',
        },
        {
          heading: 'Tamil Singles Across Every Major US Metro',
          body: 'From the tech corridors of Silicon Valley to the diverse neighborhoods of New Jersey, Tamil professionals and families are present in virtually every major American city. VivaahReady connects them across state lines, helping you find compatible matches whether you are in a metro with a large Tamil population or a smaller city where the local community is limited. The platform makes geography less of a barrier to finding the right partner.',
        },
        {
          heading: 'A Private, Verified Experience',
          body: 'Every Tamil profile on VivaahReady is manually verified. Your profile is visible only to mutual matches, and contact details are shared only after both parties express interest. This layered approach to privacy ensures that Tamil families can engage in the matchmaking process with confidence and dignity — no public exposure, no unsolicited messages, and no casual browsers.',
        },
      ]}
      faqs={faqs}
      jsonLd={jsonLd}
      relatedPages={[
        { href: '/telugu-matrimony-usa', label: 'Telugu Matrimony USA' },
        { href: '/kannada-matrimony-usa', label: 'Kannada Matrimony USA' },
        { href: '/marathi-matrimony-usa', label: 'Marathi Matrimony USA' },
        { href: '/indian-matchmaking-new-jersey', label: 'Indian Matchmaking in New Jersey' },
        { href: '/indian-matchmaking-bay-area', label: 'Indian Matchmaking in Bay Area' },
        { href: '/indian-matchmaking-chicago', label: 'Indian Matchmaking in Chicago' },
        { href: '/indian-matchmaking-usa', label: 'Indian Matchmaking in the USA' },
        { href: '/verified-indian-matrimony', label: 'Verified Indian Matrimony' },
      ]}
      ctaHeadline="Find your Tamil match in the US"
      ctaSubtext="Create your free profile. Verified, privacy-first matchmaking for Tamil singles."
    />
  )
}
