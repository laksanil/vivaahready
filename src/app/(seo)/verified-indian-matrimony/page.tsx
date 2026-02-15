import type { Metadata } from 'next'
import { SeoPageLayout } from '@/components/seo/SeoPageLayout'

export const metadata: Metadata = {
  title: 'Verified Indian Matrimony — Trusted Profiles',
  description:
    'Every profile on VivaahReady is manually verified. No fake profiles, no casual browsers — just genuine Indian singles seeking marriage. Free to start.',
  alternates: { canonical: '/verified-indian-matrimony' },
  openGraph: {
    title: 'Verified Indian Matrimony | VivaahReady',
    description:
      'Every profile is manually verified. Genuine Indian singles seeking marriage in the US.',
    url: 'https://vivaahready.com/verified-indian-matrimony',
  },
}

const faqs = [
  {
    question: 'How does VivaahReady verify profiles?',
    answer:
      'Our team manually reviews every profile submitted to VivaahReady. We verify the identity of each member to ensure they are a real person with genuine matrimonial intent. Profiles that do not meet our standards are not approved. This process keeps the platform safe, trustworthy, and focused on serious connections.',
  },
  {
    question: 'Why is verification important in Indian matrimony?',
    answer:
      'Fake profiles and misrepresentation are major problems on traditional matrimony sites. Verification ensures that every person you interact with on VivaahReady is who they say they are. This protects your time, your privacy, and your emotional investment. For families involved in the matchmaking process, verified profiles provide the confidence that they are engaging with genuine prospects.',
  },
  {
    question: 'Is there a cost for verification?',
    answer:
      'Creating a profile, viewing matches, and expressing interest are completely free. A one-time verification fee is required to unlock premium features like messaging and contact sharing. There are no recurring subscriptions or hidden fees. The verification fee also ensures that only serious, committed individuals are part of the community.',
  },
  {
    question: 'What happens after my profile is verified?',
    answer:
      'Once verified, you can message your mutual matches and share contact details. Photos and names are visible to your mutual matches, and you can proceed to meaningful conversations with confidence that both parties are genuine and serious about finding a life partner.',
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

export default function VerifiedIndianMatrimonyPage() {
  return (
    <SeoPageLayout
      heroTitle="Verified Indian Matrimony — Profiles You Can Trust"
      heroHighlight="Trust"
      heroSubtitle="Every profile on VivaahReady is manually reviewed and verified. No fake accounts, no casual browsers — just genuine Indian singles ready for marriage."
      contentSections={[
        {
          heading: 'The Problem with Unverified Matrimony Sites',
          body: 'Anyone who has used a traditional Indian matrimony site knows the frustration — fake profiles, outdated photos, people who are not serious about marriage, and unsolicited messages from strangers. Without verification, these platforms become a breeding ground for misrepresentation and wasted time. Families who rely on these platforms to find suitable matches for their children often feel uneasy about the lack of accountability. VivaahReady was built to solve exactly this problem.',
        },
        {
          heading: 'How VivaahReady Keeps Profiles Genuine',
          body: 'Every profile submitted to VivaahReady goes through a manual review process before it becomes visible to other members. We verify identity and evaluate whether the profile represents a genuine individual with serious matrimonial intent. Profiles that appear incomplete, misleading, or not aligned with the platform\'s purpose are not approved. This means when you see a match on VivaahReady, you can be confident that the person behind the profile is real, verified, and looking for the same thing you are.',
        },
        {
          heading: 'Verification Builds Trust for Families',
          body: 'In Indian matchmaking, trust is everything. Parents and families play an active role in evaluating prospective matches, and they need to know that the profiles they see are authentic. VivaahReady\'s verification process gives families the confidence to engage meaningfully. The one-time verification fee also serves as a commitment filter — it ensures that only those who are serious about finding a life partner join the verified community.',
        },
        {
          heading: 'A Safer, More Intentional Experience',
          body: 'Verification is just one layer of VivaahReady\'s approach to safe matchmaking. Combined with our mutual-match-only model (where you only see profiles that match your criteria and vice versa), privacy-gated photos and contact details, and manual profile review, VivaahReady creates an environment where every interaction is intentional and every connection has potential.',
        },
      ]}
      faqs={faqs}
      jsonLd={jsonLd}
      relatedPages={[
        { href: '/indian-matchmaking-usa', label: 'Indian Matchmaking in the USA', description: 'Overview of matchmaking for US diaspora' },
        { href: '/privacy-first-matchmaking', label: 'Privacy-First Matchmaking', description: 'How we protect your identity' },
        { href: '/nri-matrimony-usa', label: 'NRI Matrimony in the USA', description: 'Made for the Indian diaspora' },
        { href: '/indian-matchmaking', label: 'Browse All Locations', description: 'Find matchmaking near you' },
      ]}
      ctaHeadline="Join a verified matchmaking community"
      ctaSubtext="Create your free profile. Verification ensures every match is genuine."
    />
  )
}
