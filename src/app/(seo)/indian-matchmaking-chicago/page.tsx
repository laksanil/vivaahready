import type { Metadata } from 'next'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'

export const metadata: Metadata = {
  title: 'Indian Matchmaking in Chicago',
  description:
    'Discover verified Indian singles in Chicago. VivaahReady connects over 200,000 Indian Americans in the Chicago metro with privacy-first, family-friendly matchmaking.',
  alternates: { canonical: '/indian-matchmaking-chicago' },
  openGraph: {
    title: 'Indian Matchmaking in Chicago | VivaahReady',
    description:
      'Privacy-first matchmaking for Indian singles in Chicago. Verified profiles, mutual matches only.',
    url: 'https://vivaahready.com/indian-matchmaking-chicago',
  },
}

const faqs = [
  {
    question: 'What makes Chicago unique for Indian matchmaking?',
    answer:
      'Chicago has a well-established Indian community of over 200,000 people concentrated in the city and surrounding suburbs like Schaumburg, Naperville, and Skokie. Devon Avenue on the North Side is one of the most recognized Indian neighborhoods in the country, home to dozens of restaurants, grocery stores, jewelry shops, and sari boutiques. The community is diverse, spanning Gujarati, Punjabi, South Indian, and Bengali families, and maintains strong cultural institutions including multiple temples and community organizations. This combination of community depth and professional opportunity makes Chicago an ideal market for serious Indian matchmaking.',
  },
  {
    question: 'Are there enough Indian singles in Chicago to find a good match?',
    answer:
      'Yes. The Chicago metropolitan area has a substantial and growing Indian American population. Beyond the city itself, suburbs like Naperville, Aurora, Schaumburg, and Hoffman Estates have significant Indian populations. VivaahReady also allows you to expand your search radius to include nearby cities or the entire Midwest, giving you access to Indian singles in Detroit, Minneapolis, Columbus, and Indianapolis. Many members are open to relocating within the region for the right partner.',
  },
  {
    question: 'How does VivaahReady support Gujarati and Punjabi families in Chicago?',
    answer:
      'Chicago has particularly strong Gujarati and Punjabi communities, each with their own matchmaking traditions and expectations. VivaahReady lets you filter matches by language, community, and subcommunity preferences. You can specify whether you prefer a partner from a specific caste or community, dietary preferences like vegetarian or Jain diet, and other cultural factors that matter to your family. Our platform is designed to accommodate both individual preferences and family involvement in the matchmaking process.',
  },
  {
    question: 'Can my parents help manage my profile on VivaahReady?',
    answer:
      'Yes, and many families in the Chicago area prefer this approach. Parents or family members can help create the profile, set preferences, review matches, and participate in decisions. VivaahReady is built to accommodate the collaborative, family-involved matchmaking process that is central to many Indian households. Whether you are managing your own profile or your parents are taking the lead, the platform works the same way.',
  },
  {
    question: 'What industries do Indian professionals in Chicago typically work in?',
    answer:
      'Chicago is a major center for finance, consulting, healthcare, manufacturing, and technology. Many Indian professionals in the area work at firms along the Loop and in suburban corporate campuses. VivaahReady serves professionals across all these industries, and our preference settings let you filter by education level and career background. Many of our Chicago members hold advanced degrees and are looking for partners with similar educational and professional ambitions.',
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

export default function IndianMatchmakingChicagoPage() {
  return (
    <SeoPageLayout
      heroTitle="Indian Matchmaking in Chicago"
      heroHighlight="Chicago"
      heroSubtitle="From Devon Avenue to the western suburbs, Chicago's Indian community is deeply rooted and richly diverse. VivaahReady connects verified Indian singles across Chicagoland with matchmaking that honors tradition and protects your privacy."
      contentSections={[
        {
          heading: 'Devon Avenue and Beyond: Chicago\'s Indian Roots',
          body: 'Chicago\'s relationship with the Indian diaspora stretches back generations. Devon Avenue, straddling the West Rogers Park and West Ridge neighborhoods, has been the beating heart of Indian life in the Midwest for decades. Walk down Devon and you will pass Gujarati sweet shops, Punjabi jewelry stores, South Indian restaurants, and Bollywood music vendors all within a few blocks. But the Indian community has long expanded beyond Devon. Suburbs like Naperville, Schaumburg, Skokie, and Hoffman Estates now house large Indian populations with their own temples, language schools, and cultural events. The Hindu Temple of Greater Chicago, the Sikh Religious Society of Chicago, and the BAPS Shri Swaminarayan Mandir reflect the community\'s spiritual and organizational depth.',
        },
        {
          heading: 'Why VivaahReady Fits the Chicago Lifestyle',
          body: 'Chicago is a city of hard-working professionals, and its Indian community is no exception. Long winters, demanding careers, and the geographic spread of the suburbs make it difficult to attend enough community events or family introductions to find the right partner organically. VivaahReady solves this by bringing the matchmaking process online with a system designed for quality over quantity. You will only see profiles of people whose preferences match yours, eliminating the frustration of one-sided interest or irrelevant suggestions. Every profile is verified, every interaction is intentional, and your personal details are protected until you choose to share them.',
        },
        {
          heading: 'Gujarati, Punjabi, South Indian, and More',
          body: 'Chicago\'s Indian community is a microcosm of the subcontinent. The Gujarati community, one of the largest in the Midwest, is well-represented in business and the professions. Punjabi families have deep roots on the North Side and in the suburbs. South Indian professionals, particularly from Andhra Pradesh, Tamil Nadu, and Karnataka, have grown rapidly in numbers as technology and healthcare employers have expanded in the metro area. Bengali, Marathi, and Rajasthani families also contribute to the community\'s richness. VivaahReady\'s detailed preference system lets you navigate this diversity, whether you are looking for someone who shares your specific community background or are open to matches from across the Indian spectrum.',
        },
        {
          heading: 'Your Path to a Meaningful Connection',
          body: 'Getting started with VivaahReady is free and takes just a few minutes. Build your profile with information about your education, career, family background, and the qualities that matter most in a partner. Set your preferences, including community, language, diet, location radius, and lifestyle factors. Our mutual-match algorithm will start surfacing compatible profiles right away. When both you and a potential match express interest, verification opens the door to direct communication. No subscriptions, no hidden costs, and no compromises on privacy.',
        },
      ]}
      faqs={faqs}
      jsonLd={jsonLd}
      relatedPages={[
        { href: '/indian-matchmaking-new-york', label: 'Indian Matchmaking in New York', description: 'Connect with Indian singles on the East Coast' },
        { href: '/indian-matchmaking-dallas', label: 'Indian Matchmaking in Dallas', description: 'Explore matches in the Dallas-Fort Worth area' },
        { href: '/indian-matchmaking-houston', label: 'Indian Matchmaking in Houston', description: 'Find matches in Houston' },
        { href: '/indian-matchmaking-usa', label: 'Indian Matchmaking in the USA', description: 'Nationwide matchmaking for Indian Americans' },
        { href: '/verified-indian-matrimony', label: 'Verified Indian Matrimony', description: 'Learn about our verification process' },
        { href: '/nri-matrimony-usa', label: 'NRI Matrimony in the USA', description: 'Made for the Indian diaspora' },
        { href: '/hindi-matrimony-usa', label: 'Hindi Matrimony USA' },
        { href: '/punjabi-matrimony-usa', label: 'Punjabi Matrimony USA' },
      ]}
      ctaHeadline="Find your match in Chicago"
      ctaSubtext="Join Indian singles across Chicagoland. Create your free profile and discover verified, compatible matches who share your values."
    />
  )
}
