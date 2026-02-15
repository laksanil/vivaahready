import type { Metadata } from 'next'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'

export const metadata: Metadata = {
  title: 'Indian Matchmaking in Los Angeles',
  description:
    'Meet verified Indian singles in Los Angeles. VivaahReady offers privacy-first matchmaking across LA, Artesia, Cerritos, and Orange County for serious marriage-minded professionals.',
  alternates: { canonical: '/indian-matchmaking-los-angeles' },
  openGraph: {
    title: 'Indian Matchmaking in Los Angeles | VivaahReady',
    description:
      'Privacy-first matchmaking for Indian singles in Los Angeles. Verified profiles, mutual matches, and family-friendly features.',
    url: 'https://vivaahready.com/indian-matchmaking-los-angeles',
  },
}

const faqs = [
  {
    question: 'How large is the Indian community in Los Angeles?',
    answer:
      'The greater Los Angeles metropolitan area is home to over 200,000 Indian Americans, making it one of the largest Indian communities on the West Coast. Indian families are spread across neighborhoods like Artesia, Cerritos, Irvine, Torrance, Pasadena, and the San Fernando Valley. Artesia\'s Pioneer Boulevard is often called LA\'s Little India, with dozens of Indian restaurants, jewelry shops, and grocery stores. VivaahReady connects singles across this entire sprawling metro, so distance within LA does not limit your matchmaking options.',
  },
  {
    question: 'What kind of Indian professionals live in Los Angeles?',
    answer:
      'Los Angeles attracts Indian professionals across a remarkable range of industries. The entertainment industry, including film, television, and streaming, employs a growing number of Indian Americans. The tech sector in Silicon Beach and Playa Vista draws software engineers and product managers. Healthcare systems like UCLA Health and Cedars-Sinai employ Indian physicians and researchers. Aerospace, finance, and entrepreneurship round out the professional landscape. VivaahReady helps you find matches who share your professional drive and ambitions.',
  },
  {
    question: 'Can I find matches from specific Indian communities in LA?',
    answer:
      'Yes. VivaahReady allows you to set detailed preferences for language, community, religion, and cultural background. Whether you are looking for a Gujarati, Punjabi, Tamil, Telugu, Hindi, or any other Indian community match, you can specify this in your profile. Los Angeles is one of the most diverse Indian cities in America, and our platform reflects that diversity with granular preference options.',
  },
  {
    question: 'How is VivaahReady different from Shaadi.com or BharatMatrimony?',
    answer:
      'The biggest difference is privacy. On traditional matrimony sites, your profile is visible to thousands of users who can browse freely. On VivaahReady, your profile is shown only to people whose preferences align with yours, and only when you also match their criteria. This mutual-match system eliminates unsolicited messages, random browsing, and the discomfort of having your profile exposed to the entire community. Additionally, every profile on VivaahReady is manually verified for authenticity.',
  },
  {
    question: 'Is VivaahReady suitable for NRI professionals who recently moved to LA?',
    answer:
      'Absolutely. Many of our members are professionals who recently relocated to Los Angeles for work and are looking to build their personal life alongside their career. Whether you arrived last month or have lived in LA for years, VivaahReady helps you connect with compatible Indian singles who understand the immigrant experience and value cultural compatibility. Our platform is also popular with families in India who are looking for matches for their children living in the US.',
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

export default function IndianMatchmakingLosAngelesPage() {
  return (
    <SeoPageLayout
      heroTitle="Indian Matchmaking in Los Angeles"
      heroHighlight="Los Angeles"
      heroSubtitle="Discover verified Indian singles across LA, from Artesia to Irvine. Private, intentional matchmaking for professionals who value cultural compatibility and family traditions."
      contentSections={[
        {
          heading: 'Los Angeles: A Mosaic of Indian Communities',
          body: 'Los Angeles is unlike any other Indian diaspora city in America. Its sheer size and diversity mean that Indian communities here span every region, language, and tradition of the subcontinent. Artesia\'s Pioneer Boulevard serves as the cultural anchor, a stretch of South Asian businesses, restaurants, and services that draws Indian families from across the metro. But the Indian presence extends far beyond Little India. Cerritos and Irvine in Orange County, the San Fernando Valley, Pasadena, and the Westside each host distinct pockets of Indian life. This geographic spread makes traditional matchmaking networks difficult to maintain. VivaahReady connects the dots, bringing together singles from every corner of this vast metropolitan area into one secure, privacy-first platform.',
        },
        {
          heading: 'Entertainment, Tech, and Healthcare: Where LA Indians Build Careers',
          body: 'Los Angeles offers Indian professionals career opportunities that few other cities can match. The entertainment industry has opened its doors wider than ever, with Indian Americans working in production, writing, directing, and technology roles at major studios and streaming companies. Silicon Beach in Playa Vista and the tech corridors of Santa Monica attract engineers and entrepreneurs from top Indian universities. Meanwhile, the world-class healthcare systems at UCLA, Cedars-Sinai, and USC Keck employ thousands of Indian physicians, researchers, and administrators. VivaahReady understands that career compatibility matters deeply in Indian matchmaking, and our preference settings allow you to find partners who match your professional trajectory and educational values.',
        },
        {
          heading: 'Navigating Matchmaking in a City This Large',
          body: 'One of the unique challenges of finding a life partner in Los Angeles is the city\'s infamous sprawl. It is entirely possible to live in LA for years without meeting compatible Indian singles outside your immediate social circle. Community events and temple gatherings connect you with a small fraction of the available pool. VivaahReady eliminates geography as a barrier. Our platform surfaces mutual matches across the entire Los Angeles metro, Orange County, and the Inland Empire. You set the radius and preferences that matter to you, and we show you only the profiles that align. No wasted time scrolling through irrelevant results or fielding messages from people who do not share your values.',
        },
        {
          heading: 'Family Values, Modern Platform',
          body: 'Indian matchmaking in Los Angeles often involves the whole family. Parents, siblings, and extended relatives all play a role in evaluating potential matches. VivaahReady supports this tradition with features that make it easy to share your profile with family members and discuss matches together. At the same time, our privacy-first architecture ensures that only people who genuinely match your criteria will see your profile. This balance of openness with close family and privacy from the wider world is what sets VivaahReady apart for LA\'s Indian community.',
        },
      ]}
      faqs={faqs}
      jsonLd={jsonLd}
      relatedPages={[
        { href: '/indian-matchmaking-bay-area', label: 'Indian Matchmaking in Bay Area', description: 'Connect with Indian singles in the Bay Area' },
        { href: '/indian-matchmaking-phoenix', label: 'Indian Matchmaking in Phoenix', description: 'Find matches in the Phoenix metro' },
        { href: '/indian-matchmaking-seattle', label: 'Indian Matchmaking in Seattle', description: 'Meet Indian professionals in Seattle' },
        { href: '/gujarati-matrimony-usa', label: 'Gujarati Matrimony USA', description: 'Matchmaking for Gujarati-speaking singles' },
        { href: '/punjabi-matrimony-usa', label: 'Punjabi Matrimony USA', description: 'Matchmaking for Punjabi-speaking singles' },
        { href: '/indian-matchmaking-usa', label: 'Indian Matchmaking in the USA', description: 'Nationwide Indian matchmaking' },
        { href: '/verified-indian-matrimony', label: 'Verified Indian Matrimony', description: 'Learn about our verification process' },
        { href: '/nri-matrimony-usa', label: 'NRI Matrimony in the USA', description: 'Made for the Indian diaspora' },
      ]}
      ctaHeadline="Find your match in Los Angeles"
      ctaSubtext="Join thousands of Indian singles across LA who trust VivaahReady for private, verified matchmaking that respects your culture and values."
    />
  )
}
