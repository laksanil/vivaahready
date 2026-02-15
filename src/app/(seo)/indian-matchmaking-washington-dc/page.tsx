import type { Metadata } from 'next'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'

export const metadata: Metadata = {
  title: 'Indian Matchmaking in Washington DC',
  description:
    'Meet verified Indian singles in Washington DC, Northern Virginia, and Maryland. VivaahReady offers privacy-first matchmaking for government, policy, and consulting professionals.',
  alternates: { canonical: '/indian-matchmaking-washington-dc' },
  openGraph: {
    title: 'Indian Matchmaking in Washington DC | VivaahReady',
    description:
      'Privacy-first matchmaking for Indian singles in the DC metro. Verified profiles across DC, Northern Virginia, and Maryland.',
    url: 'https://vivaahready.com/indian-matchmaking-washington-dc',
  },
}

const faqs = [
  {
    question: 'How large is the Indian community in the Washington DC area?',
    answer:
      'The DC metropolitan area, including Northern Virginia and Maryland, is home to over 150,000 Indian Americans, making it one of the largest and most influential Indian communities in the United States. Fairfax County in Virginia alone has one of the highest concentrations of Indian Americans in the country. Communities in Ashburn, Chantilly, Herndon, Tysons, Rockville, and Gaithersburg are well established with temples, cultural organizations, and Indian businesses.',
  },
  {
    question: 'What types of professionals use VivaahReady in the DC area?',
    answer:
      'The DC metro attracts a distinctive mix of Indian professionals. Many work in government and public policy, at agencies like the World Bank, IMF, NIH, and various federal departments. The consulting industry, led by firms like Deloitte, Booz Allen Hamilton, and Accenture Federal Services, employs thousands of Indian professionals. The Northern Virginia tech corridor, anchored by AWS, Google, and Microsoft campuses, adds a significant technology contingent. VivaahReady helps connect these professionals with matches who understand the unique demands and rhythms of DC-area careers.',
  },
  {
    question: 'Does VivaahReady work across the DC, Virginia, and Maryland tri-state area?',
    answer:
      'Yes. VivaahReady connects Indian singles across the entire DC metropolitan area, including Washington DC proper, Northern Virginia cities like Ashburn, Reston, Fairfax, and Tysons, and Maryland suburbs like Rockville, Gaithersburg, Columbia, and Bethesda. The platform does not draw arbitrary boundaries. You can set your preferred geographic radius, and our matching system will surface compatible profiles across the entire region or beyond.',
  },
  {
    question: 'How is privacy handled on VivaahReady in a city where everyone seems connected?',
    answer:
      'Washington DC is a city of networks, and the Indian community here is exceptionally well connected through professional associations, temple communities, and cultural organizations. This makes privacy in matchmaking critically important. VivaahReady addresses this with a mutual-match model: your profile is visible only to individuals whose preferences align with yours and vice versa. There is no public directory, no open browsing, and no way for casual acquaintances to discover your profile. Photos and contact information remain private until both parties verify and express mutual interest.',
  },
  {
    question: 'Can families participate in the matchmaking process on VivaahReady?',
    answer:
      'Absolutely. Many Indian families in the DC area take an active role in their children\'s matchmaking journey, and VivaahReady is built to support this. You can share your profile with parents and family members so they can help evaluate matches. Our platform accommodates both self-driven and family-assisted matchmaking, recognizing that different families have different levels of involvement. This flexibility makes VivaahReady a natural fit for the DC community, where traditional family values and modern professional life coexist.',
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

export default function IndianMatchmakingWashingtonDcPage() {
  return (
    <SeoPageLayout
      heroTitle="Indian Matchmaking in Washington DC"
      heroHighlight="Washington DC"
      heroSubtitle="Connect with verified Indian professionals across DC, Northern Virginia, and Maryland. Privacy-first matchmaking designed for the capital region's accomplished Indian community."
      contentSections={[
        {
          heading: 'Washington DC: Where Indian Ambition Shapes the World',
          body: 'The Washington DC metropolitan area holds a special place in the Indian American landscape. Unlike cities defined primarily by one industry, the DC region attracts Indian professionals who work at the intersection of government, policy, technology, and international affairs. From Capitol Hill staffers to World Bank economists, from NIH researchers to defense contractors, the Indian community here is defined by its intellectual ambition and global perspective. With over 150,000 Indian Americans across DC, Northern Virginia, and Maryland, the community is both large enough to sustain rich cultural life and concentrated enough that personal reputations carry weight. VivaahReady provides a matchmaking platform that respects this dynamic, connecting accomplished singles through a private, verified process that values substance over spectacle.',
        },
        {
          heading: 'Northern Virginia: The Suburban Heart of DC Indian Life',
          body: 'Northern Virginia is where most of the DC area\'s Indian families have put down roots. Fairfax County, Loudoun County, and Prince William County collectively form one of the densest Indian American corridors in the country. Ashburn and Chantilly host major technology employers including AWS and Google\'s east coast operations. Herndon and Reston attract consulting professionals who commute to downtown DC or work at the many government contractor offices along the Dulles corridor. The ADAMS Center, the Durga Temple in Fairfax Station, and the BAPS Mandir in Chantilly anchor community life. For singles in these suburbs, VivaahReady offers a way to expand their matchmaking network beyond the circles they already know, while maintaining the discretion that matters in a community where social connections run deep.',
        },
        {
          heading: 'Government, Consulting, and the Policy World',
          body: 'One of the distinctive features of DC\'s Indian community is the prominence of government, policy, and consulting careers. Indian Americans serve at senior levels across federal agencies, think tanks, and international organizations. The consulting firms that ring the Beltway, from the Big Four to specialized defense and IT contractors, employ thousands of Indian professionals. These careers demand long hours, frequent travel, and a particular kind of partner who understands the pressures and rewards of public service and policy work. VivaahReady helps these professionals find matches who appreciate their career trajectory, share their values around public service and impact, and bring complementary ambitions to a partnership. Our detailed preference system accounts for career, education, lifestyle, and cultural factors so that every match has genuine depth.',
        },
        {
          heading: 'Maryland, DC Proper, and the Full Metro Area',
          body: 'While Northern Virginia captures much of the attention, the Indian community in Maryland suburbs and in DC itself is equally vibrant. Rockville, Gaithersburg, and Columbia in Maryland are home to thriving Indian populations, with proximity to NIH, the FDA, and the biotech corridor along I-270. Within DC, Indian professionals work in government, nonprofits, law firms, and embassies. VivaahReady connects singles across this entire tri-state metro without artificial geographic limits. Whether you live in a Tysons high-rise, a Bethesda townhouse, or a Silver Spring apartment, our platform surfaces matches based on genuine compatibility. Start with a free profile and discover what privacy-first, verified matchmaking means for your search.',
        },
      ]}
      faqs={faqs}
      jsonLd={jsonLd}
      relatedPages={[
        { href: '/indian-matchmaking-philadelphia', label: 'Indian Matchmaking in Philadelphia', description: 'Connect with Indian singles in Philadelphia' },
        { href: '/indian-matchmaking-new-jersey', label: 'Indian Matchmaking in New Jersey', description: 'Find matches across New Jersey' },
        { href: '/indian-matchmaking-new-york', label: 'Indian Matchmaking in New York', description: 'Meet Indian professionals in New York' },
        { href: '/indian-matchmaking-atlanta', label: 'Indian Matchmaking in Atlanta', description: 'Connect with Indian singles in Atlanta' },
        { href: '/hindi-matrimony-usa', label: 'Hindi Matrimony USA', description: 'Matchmaking for Hindi-speaking singles' },
        { href: '/telugu-matrimony-usa', label: 'Telugu Matrimony USA', description: 'Matchmaking for Telugu-speaking singles' },
        { href: '/indian-matchmaking-usa', label: 'Indian Matchmaking in the USA', description: 'Nationwide Indian matchmaking' },
        { href: '/verified-indian-matrimony', label: 'Verified Indian Matrimony', description: 'Learn about our verification process' },
      ]}
      ctaHeadline="Find your match in Washington DC"
      ctaSubtext="Join Indian professionals across the capital region who trust VivaahReady for private, verified matchmaking that respects your ambitions and your traditions."
    />
  )
}
