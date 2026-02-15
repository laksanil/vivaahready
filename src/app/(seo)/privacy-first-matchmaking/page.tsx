import type { Metadata } from 'next'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'

export const metadata: Metadata = {
  title: 'Privacy-First Indian Matchmaking',
  description:
    'Your identity stays hidden until mutual interest. VivaahReady offers privacy-first Indian matchmaking with no public browsing. Free to start.',
  alternates: { canonical: '/privacy-first-matchmaking' },
  openGraph: {
    title: 'Privacy-First Indian Matchmaking | VivaahReady',
    description:
      'Your identity stays hidden until mutual interest. No public browsing, no unsolicited messages.',
    url: 'https://vivaahready.com/privacy-first-matchmaking',
  },
}

const faqs = [
  {
    question: 'Can anyone browse my profile on VivaahReady?',
    answer:
      'No. VivaahReady does not have a public directory. Your profile is only visible to people whose preferences match yours and whose preferences you also match. This mutual-match model means no strangers can browse your profile, and no one outside the platform can see your information.',
  },
  {
    question: 'When are my photos and contact details shared?',
    answer:
      'Your photos and full name become visible to your mutual matches only after profile verification. Contact details like phone numbers are shared only after both parties express mutual interest. This layered approach ensures your privacy is protected at every step.',
  },
  {
    question: 'Does VivaahReady use tracking cookies?',
    answer:
      'No. VivaahReady uses only essential cookies required for the website to function — like keeping you logged in. We do not use tracking cookies, third-party analytics cookies, or advertising cookies. Your browsing behavior on our platform is not tracked or sold.',
  },
  {
    question: 'How is VivaahReady different from traditional matrimony sites on privacy?',
    answer:
      'Traditional matrimony sites often make profiles publicly searchable, allow anyone to view photos, and send unsolicited messages. VivaahReady takes the opposite approach — no public search, no public browsing, no unsolicited contact. Everything is gated behind mutual preferences and mutual interest.',
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

export default function PrivacyFirstMatchmakingPage() {
  return (
    <SeoPageLayout
      heroTitle="Privacy-First Indian Matchmaking"
      heroHighlight="Privacy-First"
      heroSubtitle="Your identity stays hidden until you choose to share it. No public browsing, no unsolicited messages — matchmaking that respects your boundaries."
      contentSections={[
        {
          heading: 'Why Privacy Matters in Matchmaking',
          body: 'Searching for a life partner is deeply personal. Yet most Indian matrimony sites treat your profile like a public listing — anyone can search, browse, and message you without your consent. For many professionals, this lack of privacy is a dealbreaker. You don\'t want colleagues, clients, or casual acquaintances stumbling upon your matrimony profile. VivaahReady was designed from the ground up to protect your privacy while helping you find meaningful connections.',
        },
        {
          heading: 'How VivaahReady Protects Your Identity',
          body: 'VivaahReady uses a mutual-match-only model. This means your profile is visible only to people whose preferences align with yours and whose preferences you also match. There is no public directory, no search bar where anyone can look you up, and no way for non-matches to see your profile. Your photos remain hidden until profile verification, and your contact details are shared only after both you and your match express mutual interest. Every layer of the platform is designed to ensure your information is shared only when you\'re ready.',
        },
        {
          heading: 'No Tracking, No Ads, No Data Selling',
          body: 'Beyond profile privacy, VivaahReady respects your digital privacy too. We use only essential cookies required for the site to function — login sessions and basic security. There are no tracking cookies, no behavioral analytics sold to advertisers, and no third-party data sharing. When you use VivaahReady, your activity stays between you and the platform.',
        },
        {
          heading: 'Privacy That Families Appreciate',
          body: 'For Indian families, the matchmaking process often involves multiple family members reviewing profiles and evaluating compatibility. VivaahReady\'s privacy model ensures that only serious, compatible prospects are visible. Families can engage in the process knowing that their child\'s profile is not exposed to the general public and that every match they see has been filtered for mutual compatibility.',
        },
      ]}
      faqs={faqs}
      jsonLd={jsonLd}
      relatedPages={[
        { href: '/indian-matchmaking-usa', label: 'Indian Matchmaking in the USA', description: 'Overview of matchmaking for US diaspora' },
        { href: '/verified-indian-matrimony', label: 'Verified Indian Matrimony', description: 'Learn about our verification process' },
        { href: '/nri-matrimony-usa', label: 'NRI Matrimony in the USA', description: 'Made for the Indian diaspora' },
        { href: '/indian-matchmaking', label: 'Browse All Locations', description: 'Find matchmaking near you' },
      ]}
      ctaHeadline="Experience matchmaking that respects your privacy"
      ctaSubtext="Create your free profile. Your identity stays hidden until you're ready."
    />
  )
}
