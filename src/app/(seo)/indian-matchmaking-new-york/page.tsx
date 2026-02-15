import type { Metadata } from 'next'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'

export const metadata: Metadata = {
  title: 'Indian Matchmaking in New York',
  description:
    'Connect with verified Indian singles in New York. VivaahReady offers privacy-first matchmaking for over 800,000 Indian Americans in the NYC metro area.',
  alternates: { canonical: '/indian-matchmaking-new-york' },
  openGraph: {
    title: 'Indian Matchmaking in New York | VivaahReady',
    description:
      'Privacy-first matchmaking for Indian singles in New York. Verified profiles, mutual matches only.',
    url: 'https://vivaahready.com/indian-matchmaking-new-york',
  },
}

const faqs = [
  {
    question: 'How large is the Indian community in New York?',
    answer:
      'The New York metropolitan area is home to over 800,000 Indian Americans, making it the largest Indian community on the East Coast. From Jackson Heights in Queens to Edison in New Jersey, Indian families have built thriving neighborhoods with temples, cultural centers, and community organizations. This concentration means VivaahReady members in the NYC area have a deep pool of compatible matches who share similar cultural backgrounds and values.',
  },
  {
    question: 'Can I find matches from specific Indian communities in New York?',
    answer:
      'Yes. New York attracts Indians from every state and linguistic background. VivaahReady lets you set preferences for language, community, religion, dietary habits, and more. Whether you are looking for someone from a Gujarati family in Jersey City, a Bengali professional in Manhattan, or a Punjabi family in Long Island, our detailed preference system helps you find matches that align with your cultural background.',
  },
  {
    question: 'How does VivaahReady protect my privacy in a city as connected as New York?',
    answer:
      'In a densely connected city like New York, privacy matters even more. VivaahReady operates on a mutual-match model, meaning your profile is only visible to people whose preferences align with yours and vice versa. Your photos and contact details remain hidden until both sides express interest and verification is complete. There is no public browsing or searchable directory, so colleagues, acquaintances, or casual browsers will not stumble across your profile.',
  },
  {
    question: 'Is VivaahReady suitable for busy professionals in NYC?',
    answer:
      'VivaahReady is designed for people who do not have hours to scroll through thousands of profiles. Our mutual-match system filters out incompatible profiles automatically, so you only spend time reviewing people who genuinely fit your criteria. Many of our New York members are working professionals in finance, tech, healthcare, and law who appreciate an efficient, high-signal matchmaking experience that respects their time.',
  },
  {
    question: 'Do families in New York use VivaahReady to help find matches?',
    answer:
      'Many families in the New York area are actively involved in the matchmaking process, and VivaahReady supports this. Parents can help create or review profiles, evaluate matches, and participate in the decision-making process. Our platform accommodates the family-driven matchmaking tradition that many Indian households in New York prefer, while also giving individuals the autonomy to manage their own profiles.',
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

export default function IndianMatchmakingNewYorkPage() {
  return (
    <SeoPageLayout
      heroTitle="Indian Matchmaking in New York"
      heroHighlight="New York"
      heroSubtitle="New York is home to the largest Indian community on the East Coast. VivaahReady connects verified Indian singles across the five boroughs, Long Island, Westchester, and northern New Jersey with privacy-first matchmaking built around your values."
      contentSections={[
        {
          heading: 'The Heart of Indian America on the East Coast',
          body: 'New York has been a gateway for Indian immigrants for decades, and today the metro area is home to more than 800,000 Indian Americans. From the bustling streets of Jackson Heights, where Punjabi dhabas sit beside South Indian restaurants, to the thriving Gujarati and Telugu communities in Edison and Iselin, the cultural tapestry here is unmatched. Community organizations like the Federation of Indian Associations, Navaratri celebrations at the Javits Center, and Diwali festivities on the streets of Manhattan reflect the depth of Indian life in this city. Yet for all this community richness, finding the right life partner remains a deeply personal challenge that VivaahReady is built to address.',
        },
        {
          heading: 'Why VivaahReady Works for New York Singles',
          body: 'New York moves fast, and its Indian singles need a matchmaking platform that keeps up. VivaahReady eliminates the noise of traditional matrimony sites by showing you only mutual matches, people who fit your criteria and whose criteria you meet. There are no unsolicited messages, no random profile views from strangers, and no wasted time scrolling through incompatible profiles. Every profile on the platform is manually verified, so you know you are connecting with real, marriage-minded individuals. For professionals juggling demanding careers in Manhattan and family expectations at home, VivaahReady delivers a focused and dignified matchmaking experience.',
        },
        {
          heading: 'Every Community, Every Tradition',
          body: 'The Indian diaspora in New York spans an extraordinary range of communities. You will find Malayali nurses in the Bronx, Tamil IT professionals in Midtown, Marathi families in suburban New Jersey, and Sikh business owners in Richmond Hill. VivaahReady supports this diversity with comprehensive preference settings. Specify your preferred language, community, religious background, vegetarian or non-vegetarian diet, education level, and more. Our system ensures that your matches reflect not just basic compatibility but the cultural nuances that matter to you and your family.',
        },
        {
          heading: 'Getting Started Is Simple',
          body: 'Create your free profile in minutes. Add details about your background, education, career, family, and what you are looking for in a partner. Set your preferences and deal-breakers so our system can surface the right matches. Once your profile is live, you will begin seeing mutual matches, people who are looking for someone like you, just as you are looking for someone like them. Express interest, and when the feeling is mutual, verification unlocks messaging. No subscriptions, no hidden fees, just honest matchmaking designed for serious intent.',
        },
      ]}
      faqs={faqs}
      jsonLd={jsonLd}
      relatedPages={[
        { href: '/indian-matchmaking-bay-area', label: 'Indian Matchmaking in Bay Area', description: 'Connect with Indian singles in Silicon Valley' },
        { href: '/indian-matchmaking-chicago', label: 'Indian Matchmaking in Chicago', description: 'Find matches in the Midwest' },
        { href: '/indian-matchmaking-usa', label: 'Indian Matchmaking in the USA', description: 'Nationwide matchmaking for Indian Americans' },
        { href: '/verified-indian-matrimony', label: 'Verified Indian Matrimony', description: 'Learn about our verification process' },
        { href: '/privacy-first-matchmaking', label: 'Privacy-First Matchmaking', description: 'How we protect your identity' },
        { href: '/nri-matrimony-usa', label: 'NRI Matrimony in the USA', description: 'Made for the Indian diaspora' },
        { href: '/telugu-matrimony-usa', label: 'Telugu Matrimony USA' },
        { href: '/tamil-matrimony-usa', label: 'Tamil Matrimony USA' },
      ]}
      ctaHeadline="Find your match in New York"
      ctaSubtext="Join thousands of Indian singles in the NYC metro area. Create your free profile and discover compatible, verified matches today."
    />
  )
}
