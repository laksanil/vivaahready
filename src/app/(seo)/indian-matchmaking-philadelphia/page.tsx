import type { Metadata } from 'next'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'

export const metadata: Metadata = {
  title: 'Indian Matchmaking in Philadelphia',
  description:
    'Find verified Indian singles in Philadelphia and the Greater Philly area. Privacy-first matchmaking for professionals in healthcare, pharma, and academia.',
  alternates: { canonical: '/indian-matchmaking-philadelphia' },
  openGraph: {
    title: 'Indian Matchmaking in Philadelphia | VivaahReady',
    description:
      'Verified profiles and mutual-match matchmaking for Indian singles in Greater Philadelphia. Free to start.',
    url: 'https://vivaahready.com/indian-matchmaking-philadelphia',
  },
}

const faqs = [
  {
    question: 'How large is the Indian community in the Philadelphia area?',
    answer:
      'The Greater Philadelphia area is home to over 100,000 Indian Americans, with significant populations in King of Prussia, Cherry Hill (across the border in NJ), Exton, and the Main Line suburbs. The community includes a strong mix of healthcare professionals, pharmaceutical researchers, academics, and IT workers drawn to the region\'s hospitals, universities, and corporate campuses. VivaahReady connects Indian singles across this entire metro area.',
  },
  {
    question: 'Does VivaahReady work for Indian professionals in Philadelphia\'s healthcare sector?',
    answer:
      'Yes, many of our Philadelphia-area members work in healthcare, pharmaceuticals, and biotech — industries that define the region. Whether you are a physician at Penn Medicine, a researcher at a pharma company in King of Prussia, or a healthcare administrator, VivaahReady\'s detailed profile system lets you find matches who understand the demands and values of your professional life.',
  },
  {
    question: 'Can I find matches from Cherry Hill, King of Prussia, and the suburbs?',
    answer:
      'Absolutely. VivaahReady serves the entire Greater Philadelphia region, including suburban hubs like King of Prussia, Cherry Hill, Exton, Malvern, Collegeville, and the Main Line. Many Indian families in the Philadelphia area live in these suburban communities, and our platform connects singles across the metro regardless of which side of the city — or state line — they call home.',
  },
  {
    question: 'What Indian communities are represented in the Philadelphia area?',
    answer:
      'Philadelphia\'s Indian population is diverse, including strong Telugu, Tamil, Gujarati, Hindi-speaking, and Punjabi communities. The area has active cultural organizations, temples including the Hindu Temple of Delaware Valley, and community events throughout the year. VivaahReady lets you filter by language, community, and cultural preferences so you can find matches within or across these communities.',
  },
  {
    question: 'How does VivaahReady compare to traditional matchmaking in the Philly area?',
    answer:
      'Traditional matchmaking in the Philadelphia area often relies on family connections, temple networks, and community events. While these channels work, they are limited by geography and social circles. VivaahReady expands your reach across the entire metro area and beyond, while maintaining the privacy and intentionality that families expect. Every profile is verified, and matches are shown only when preferences align on both sides.',
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

export default function IndianMatchmakingPhiladelphiaPage() {
  return (
    <SeoPageLayout
      heroTitle="Indian Matchmaking in Philadelphia"
      heroHighlight="Philadelphia"
      heroSubtitle="From Center City to King of Prussia and Cherry Hill, connect with verified Indian singles across Greater Philadelphia. Privacy-first matchmaking built for professionals and families."
      contentSections={[
        {
          heading: 'A Growing Indian Community in the City of Brotherly Love',
          body: 'Philadelphia has quietly become one of the East Coast\'s most important hubs for Indian Americans. Over 100,000 people of Indian origin call the Greater Philly area home, drawn by world-class hospitals, leading pharmaceutical companies, top-tier universities like Penn and Drexel, and a cost of living that competes favorably with New York and Washington DC. The Indian community here is professional, family-oriented, and spread across a metro area that stretches from Center City to the western suburbs and into South Jersey. VivaahReady helps singles navigate this sprawling landscape with a matchmaking platform designed for intentional, privacy-first connections.',
        },
        {
          heading: 'Where Philadelphia\'s Indian Community Thrives',
          body: 'King of Prussia and the surrounding towns of Exton, Malvern, and Collegeville form a corridor of Indian families drawn by pharmaceutical and tech employers. Cherry Hill and Voorhees across the Delaware River in New Jersey add another substantial cluster. University City around Penn and Drexel attracts students and young professionals, while the Main Line suburbs are home to established Indian families. Each of these areas has its own character, but they share a common need — a trusted way to find compatible life partners. VivaahReady bridges these pockets of community into one connected matchmaking experience.',
        },
        {
          heading: 'Healthcare, Pharma, and Academia',
          body: 'Philadelphia\'s Indian professionals are disproportionately represented in healthcare and the life sciences. The city is home to some of the country\'s largest hospital systems, pharmaceutical headquarters, and research institutions. Indian doctors, scientists, engineers, and academics form a professional community with demanding schedules and high standards. VivaahReady is built for people like them — busy professionals who want meaningful matches without spending hours scrolling through irrelevant profiles. Our mutual-match system surfaces only the connections where both sides\' preferences align, saving you time and protecting your privacy.',
        },
        {
          heading: 'Connecting Philly to the Northeast Corridor',
          body: 'One of Philadelphia\'s unique advantages is its central position between New York and Washington DC. Many Indian professionals in the area have connections — personal and professional — to both cities. VivaahReady reflects this reality by connecting you with matches across the entire Northeast corridor. Whether your ideal partner lives in Center City, commutes from Cherry Hill, or works in nearby Wilmington, our platform ensures you see every compatible match in the region without sacrificing privacy or profile quality.',
        },
      ]}
      faqs={faqs}
      jsonLd={jsonLd}
      relatedPages={[
        { href: '/indian-matchmaking-new-jersey', label: 'Indian Matchmaking in New Jersey', description: 'NJ\'s 400,000+ Indian American community' },
        { href: '/indian-matchmaking-new-york', label: 'Indian Matchmaking in New York', description: 'The largest Indian community on the East Coast' },
        { href: '/indian-matchmaking-washington-dc', label: 'Indian Matchmaking in Washington DC', description: 'Matches in the DC metro area' },
        { href: '/verified-indian-matrimony', label: 'Verified Indian Matrimony', description: 'Learn about our verification process' },
        { href: '/privacy-first-matchmaking', label: 'Privacy-First Matchmaking', description: 'How we protect your identity' },
        { href: '/telugu-matrimony-usa', label: 'Telugu Matrimony USA' },
        { href: '/tamil-matrimony-usa', label: 'Tamil Matrimony USA' },
        { href: '/gujarati-matrimony-usa', label: 'Gujarati Matrimony USA' },
      ]}
      ctaHeadline="Find your match in Philadelphia"
      ctaSubtext="Join Indian professionals and families across Greater Philly. Create your free profile and discover compatible matches today."
    />
  )
}
