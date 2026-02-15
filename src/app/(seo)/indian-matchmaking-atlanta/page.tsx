import type { Metadata } from 'next'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'

export const metadata: Metadata = {
  title: 'Indian Matchmaking in Atlanta',
  description:
    'Find your perfect Indian match in Atlanta. VivaahReady connects verified Indian singles across Alpharetta, Johns Creek, and metro Atlanta with privacy-first matchmaking.',
  alternates: { canonical: '/indian-matchmaking-atlanta' },
  openGraph: {
    title: 'Indian Matchmaking in Atlanta | VivaahReady',
    description:
      'Connect with verified Indian singles in Atlanta. Privacy-first matchmaking for the Southeast Indian community.',
    url: 'https://vivaahready.com/indian-matchmaking-atlanta',
  },
}

const faqs = [
  {
    question: 'Where do most Indian singles live in the Atlanta area?',
    answer:
      'The Indian community in metro Atlanta is concentrated in several key areas. Alpharetta and Johns Creek in North Fulton County have some of the highest concentrations of Indian American families in the Southeast, with thriving Telugu, Tamil, and Hindi-speaking communities. Decatur, Dunwoody, and Suwanee also have significant Indian populations. VivaahReady connects singles across all of these neighborhoods and beyond, so your location within the metro area does not limit your matches.',
  },
  {
    question: 'Is VivaahReady popular among Telugu singles in Atlanta?',
    answer:
      'Yes. Atlanta has one of the largest Telugu-speaking communities outside of India, particularly in Alpharetta, Johns Creek, and Duluth. VivaahReady supports detailed language and community preferences, allowing Telugu singles to find matches who share their cultural background, traditions, and values. You can also broaden your preferences to include other South Indian or pan-Indian communities if you wish.',
  },
  {
    question: 'How does VivaahReady protect my privacy in a close-knit community like Atlanta?',
    answer:
      'We understand that in tight-knit communities, privacy is especially important. VivaahReady uses a mutual-match model, meaning your profile is only visible to people whose preferences align with yours and vice versa. Your photos and contact information are never displayed publicly. This means acquaintances, coworkers, or community members will not stumble across your profile unless you are both actively matched.',
  },
  {
    question: 'Can my parents help manage my profile on VivaahReady?',
    answer:
      'Absolutely. Many Indian families in Atlanta prefer a family-involved matchmaking approach. You can share your profile details with your parents or family members so they can help review matches. VivaahReady is designed to accommodate both self-driven and family-assisted matchmaking, reflecting the traditions that many Indian American families value.',
  },
  {
    question: 'What industries do Indian professionals in Atlanta typically work in?',
    answer:
      'Atlanta is a major hub for technology, healthcare, finance, and logistics. Many Indian professionals in the area work at companies like NCR, Home Depot, UPS, Delta Air Lines, and numerous Fortune 500 headquarters. The city also has a growing startup ecosystem. VivaahReady helps you find matches who share similar professional ambitions and educational backgrounds, which is important for long-term compatibility.',
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

export default function IndianMatchmakingAtlantaPage() {
  return (
    <SeoPageLayout
      heroTitle="Indian Matchmaking in Atlanta"
      heroHighlight="Atlanta"
      heroSubtitle="Connect with verified Indian singles across metro Atlanta, Alpharetta, and Johns Creek. Privacy-first matchmaking built for the Southeast's fastest-growing Indian community."
      contentSections={[
        {
          heading: 'Atlanta: The Heart of Indian Culture in the Southeast',
          body: 'Atlanta has emerged as one of the most vibrant centers of Indian life in the American Southeast. With over 100,000 Indian Americans calling metro Atlanta home, the city offers a thriving network of temples, cultural organizations, and community events. From the Hindu Temple of Atlanta in Riverdale to the BAPS Shri Swaminarayan Mandir in Lilburn, the cultural infrastructure here rivals cities with far longer histories of Indian settlement. Yet despite this strong community presence, finding a compatible life partner remains a challenge. Traditional networks are often limited by geography and family connections, while generic dating apps lack the cultural nuance that matters. VivaahReady fills this gap with intentional, privacy-first matchmaking designed for Indian singles who value both tradition and modern convenience.',
        },
        {
          heading: 'Alpharetta, Johns Creek, and the North Fulton Corridor',
          body: 'The suburbs of North Fulton County have become a focal point for Indian families in Atlanta. Alpharetta and Johns Creek, in particular, are home to one of the largest Telugu communities in the United States. The area boasts excellent schools, thriving Indian grocery stores and restaurants, and active community organizations. For singles living in these neighborhoods, VivaahReady offers a way to connect with like-minded individuals who share their cultural roots, whether they are looking within the Telugu community or across the broader Indian diaspora. Our platform lets you set detailed preferences for language, religion, diet, and lifestyle so that every match is meaningful.',
        },
        {
          heading: 'Why Atlanta Indian Singles Choose VivaahReady',
          body: 'In a community as interconnected as metro Atlanta, discretion matters. VivaahReady operates on a mutual-match model: your profile is only shown to people whose preferences align with yours, and their profile appears to you only when the reverse is also true. There is no public browsing, no unsolicited messages, and no risk of your profile being discovered by someone you did not intend. Every profile undergoes manual verification for authenticity. Whether you are a software engineer in Midtown, a physician at Emory, or a business professional in Buckhead, VivaahReady provides a dignified path to finding your life partner.',
        },
        {
          heading: 'A Growing Community with Growing Expectations',
          body: 'Atlanta continues to attract Indian professionals at a rapid pace, drawn by its affordable cost of living, warm climate, and expanding job market. As the community grows, so does the demand for matchmaking services that understand Indian values and family dynamics. VivaahReady is built for this moment. Our platform supports family involvement, accommodates diverse community traditions, and connects singles not just within Atlanta but across the entire United States. Start your journey with a free profile and discover what intentional matchmaking feels like.',
        },
      ]}
      faqs={faqs}
      jsonLd={jsonLd}
      relatedPages={[
        { href: '/indian-matchmaking-houston', label: 'Indian Matchmaking in Houston', description: 'Connect with Indian singles in Houston' },
        { href: '/indian-matchmaking-washington-dc', label: 'Indian Matchmaking in Washington DC', description: 'Meet Indian professionals in the DC area' },
        { href: '/indian-matchmaking-dallas', label: 'Indian Matchmaking in Dallas', description: 'Find matches in the Dallas-Fort Worth area' },
        { href: '/telugu-matrimony-usa', label: 'Telugu Matrimony USA', description: 'Matchmaking for Telugu-speaking singles' },
        { href: '/indian-matchmaking-usa', label: 'Indian Matchmaking in the USA', description: 'Nationwide Indian matchmaking' },
        { href: '/verified-indian-matrimony', label: 'Verified Indian Matrimony', description: 'Learn about our verification process' },
        { href: '/privacy-first-matchmaking', label: 'Privacy-First Matchmaking', description: 'How we protect your identity' },
      ]}
      ctaHeadline="Find your match in Atlanta"
      ctaSubtext="Join the growing community of Indian singles in metro Atlanta who trust VivaahReady for private, verified matchmaking."
    />
  )
}
