import type { Metadata } from 'next'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'

export const metadata: Metadata = {
  title: 'Indian Matchmaking in New Jersey',
  description:
    'Connect with verified Indian singles in New Jersey. Edison, Jersey City, and beyond — privacy-first matchmaking for NJ\'s 400,000+ Indian American community.',
  alternates: { canonical: '/indian-matchmaking-new-jersey' },
  openGraph: {
    title: 'Indian Matchmaking in New Jersey | VivaahReady',
    description:
      'Privacy-first matchmaking for New Jersey\'s thriving Indian American community. Verified profiles, mutual matches only.',
    url: 'https://vivaahready.com/indian-matchmaking-new-jersey',
  },
}

const faqs = [
  {
    question: 'Why is New Jersey such a popular state for Indian matchmaking?',
    answer:
      'New Jersey has the highest concentration of Indian Americans per capita in the United States, with over 400,000 residents of Indian origin. Towns like Edison, Jersey City, Iselin, and Plainsboro have vibrant Indian communities with temples, grocery stores, cultural centers, and community organizations. This dense network makes NJ a natural hub for Indian matchmaking, and VivaahReady connects singles across the state with verified, privacy-first profiles.',
  },
  {
    question: 'Does VivaahReady have members from Edison and Jersey City?',
    answer:
      'Yes, VivaahReady has members from across the New Jersey metro area, including Edison, Jersey City, Iselin, Plainsboro, Princeton, and the wider Middlesex and Hudson County areas. Our mutual-match system ensures you connect with people whose preferences align with yours, whether they are in your immediate neighborhood or elsewhere in the tri-state area.',
  },
  {
    question: 'Can I find matches from specific Indian communities in New Jersey?',
    answer:
      'Absolutely. New Jersey is home to strong Gujarati, Telugu, Tamil, Hindi-speaking, and Punjabi communities, among others. VivaahReady lets you set detailed preferences for language, community, religion, dietary habits, and more. You will only see matches where both sides\' preferences align, so the results are always relevant to what you are looking for.',
  },
  {
    question: 'How does VivaahReady protect my privacy in a close-knit NJ community?',
    answer:
      'We understand that in a tightly connected community like New Jersey\'s Indian diaspora, privacy matters deeply. On VivaahReady, there is no public profile directory. Your photos and contact details are hidden until both you and a match express mutual interest and complete verification. No one can casually browse or screenshot your profile — giving you full control over who sees your information.',
  },
  {
    question: 'Is VivaahReady suitable for NJ-based NRI families looking for matches?',
    answer:
      'Yes, VivaahReady is designed to support family-involved matchmaking. Many of our New Jersey members have parents or family members who participate in evaluating matches. You can share your profile details with family, and the privacy-first design ensures the process remains dignified and respectful — exactly as families expect.',
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

export default function IndianMatchmakingNewJerseyPage() {
  return (
    <SeoPageLayout
      heroTitle="Indian Matchmaking in New Jersey"
      heroHighlight="New Jersey"
      heroSubtitle="New Jersey is home to over 400,000 Indian Americans — the highest per-capita concentration in the nation. Find your match in the Garden State with verified profiles and privacy-first matchmaking."
      contentSections={[
        {
          heading: 'The Heart of Indian America',
          body: 'No state embodies the Indian American experience quite like New Jersey. From the bustling Indian shopping strips of Oak Tree Road in Edison to the growing professional communities in Jersey City and Hoboken, NJ is where Indian culture thrives in America. Temples, cultural associations, Diwali celebrations, and weekend cricket leagues create a fabric of community life that makes matchmaking feel natural. Yet finding the right partner within this vast community still requires intention. VivaahReady helps NJ singles and their families cut through the noise with verified profiles and a mutual-match system that prioritizes quality over quantity.',
        },
        {
          heading: 'Edison, Jersey City, and Beyond',
          body: 'Edison and Iselin in Middlesex County are often called the unofficial capital of Indian America. Jersey City, with its rapidly growing South Asian population, is not far behind. But New Jersey\'s Indian community extends well beyond these hubs — from the research corridor around Princeton and Plainsboro to the suburban families in Bridgewater, Parsippany, and Cherry Hill. VivaahReady serves singles across all of these areas, connecting professionals, students, and families who share a commitment to finding a meaningful, marriage-oriented relationship rooted in shared values.',
        },
        {
          heading: 'Diverse Communities, One Platform',
          body: 'New Jersey\'s Indian population is remarkably diverse. Strong Gujarati communities in Edison and Parsippany, Telugu families in Plainsboro and Princeton Junction, Tamil professionals across Middlesex County, and Punjabi and Hindi-speaking households throughout the state all call NJ home. VivaahReady respects this diversity with detailed preference filters for language, community, religion, diet, and lifestyle. Our mutual-match model means every connection is relevant — you see only the profiles that align with your criteria, and they see you only when the same is true.',
        },
        {
          heading: 'Privacy That Matters in a Close Community',
          body: 'In a state where the Indian community is closely knit, privacy is not a luxury — it is a necessity. Many NJ singles hesitate to join matrimony sites because they worry about acquaintances or colleagues finding their profiles. VivaahReady solves this with a fundamentally different architecture. There is no browsable directory. Photos and contact details remain hidden until mutual interest is confirmed and verification is complete. This means you can search for a partner confidently, knowing your information is protected until you choose to share it.',
        },
      ]}
      faqs={faqs}
      jsonLd={jsonLd}
      relatedPages={[
        { href: '/indian-matchmaking-new-york', label: 'Indian Matchmaking in New York', description: 'Connect with Indian singles across the tri-state area' },
        { href: '/indian-matchmaking-philadelphia', label: 'Indian Matchmaking in Philadelphia', description: 'Matches in the Greater Philadelphia region' },
        { href: '/indian-matchmaking-boston', label: 'Indian Matchmaking in Boston' },
        { href: '/indian-matchmaking-washington-dc', label: 'Indian Matchmaking in Washington DC' },
        { href: '/verified-indian-matrimony', label: 'Verified Indian Matrimony', description: 'Learn about our verification process' },
        { href: '/privacy-first-matchmaking', label: 'Privacy-First Matchmaking', description: 'How we protect your identity' },
        { href: '/gujarati-matrimony-usa', label: 'Gujarati Matrimony USA' },
        { href: '/telugu-matrimony-usa', label: 'Telugu Matrimony USA' },
      ]}
      ctaHeadline="Find your match in New Jersey"
      ctaSubtext="Join thousands of Indian singles across the Garden State. Create your free profile and start receiving mutual matches today."
    />
  )
}
