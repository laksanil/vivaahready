import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Indian Matchmaking vs Dating Apps: An Honest Comparison (2026)',
  description:
    'A side-by-side comparison of Indian matrimony platforms and dating apps for Indian Americans. Costs, success rates, family involvement, and what actually works for finding a life partner in the US.',
  keywords: [
    'Indian matchmaking vs dating apps',
    'Shaadi vs Hinge',
    'Indian matrimony vs Bumble',
    'Dil Mil vs Shaadi',
    'Indian dating app comparison',
    'best app for Indian marriage',
    'Indian matchmaking or dating app',
    'arranged marriage vs dating app',
    'Indian matrimony app USA',
    'Indian American dating comparison',
    'Shaadi.com review',
    'BharatMatrimony vs dating apps',
  ],
  openGraph: {
    title: 'Indian Matchmaking vs Dating Apps: An Honest Comparison (2026)',
    description:
      'A side-by-side comparison of matrimony platforms and dating apps for Indian Americans. What actually works for finding a life partner.',
    url: 'https://vivaahready.com/blog/indian-matchmaking-vs-dating-apps-honest-comparison',
    type: 'article',
    publishedTime: '2026-03-05T00:00:00Z',
  },
  alternates: {
    canonical: 'https://vivaahready.com/blog/indian-matchmaking-vs-dating-apps-honest-comparison',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: 'Indian Matchmaking vs Dating Apps: An Honest Comparison (2026)',
  description:
    'A side-by-side comparison of Indian matrimony platforms and dating apps for Indian Americans. Costs, success rates, family involvement, and what actually works for finding a life partner in the US.',
  datePublished: '2026-03-05T00:00:00Z',
  image: ['https://vivaahready.com/logo-banner.png'],
  dateModified: '2026-03-05T00:00:00Z',
  author: {
    '@type': 'Person',
    name: 'Lakshmi',
    jobTitle: 'Founder',
    url: 'https://vivaahready.com/about',
  },
  publisher: {
    '@type': 'Organization',
    name: 'VivaahReady',
    url: 'https://vivaahready.com',
    logo: {
      '@type': 'ImageObject',
      url: 'https://vivaahready.com/logo-banner.png',
    },
  },
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://vivaahready.com/blog/indian-matchmaking-vs-dating-apps-honest-comparison',
  },
}

const faqs = [
  {
    question: 'Is Shaadi.com better than Hinge for finding an Indian partner in the USA?',
    answer:
      'It depends on what you are looking for. Shaadi.com is built around marriage intent, so every profile signals readiness for a committed relationship. Hinge serves a broader range of intentions, from casual dating to serious relationships. If you already know you want marriage and value family involvement, a matrimony platform is more aligned with your goals. If you want a wider social experience first, a dating app may be a better fit.',
  },
  {
    question: 'Can you use both dating apps and matrimony sites at the same time?',
    answer:
      'Yes, many Indian Americans do. However, managing multiple platforms simultaneously can lead to burnout. A more effective approach is to choose one primary platform that matches your intent and use a secondary platform only if the first is not producing results after two to three months.',
  },
  {
    question: 'Why do Indian Americans feel stuck between dating apps and arranged marriage?',
    answer:
      'The frustration comes from a lack of options that fit the middle ground. Dating apps feel too casual and ambiguous for someone ready for marriage. Traditional arranged marriage feels too rigid for someone who values personal choice. Newer platforms that combine marriage intent with individual autonomy are filling this gap, but many Indian Americans are not yet aware they exist.',
  },
  {
    question: 'What is the success rate of Indian matchmaking platforms compared to dating apps?',
    answer:
      'Direct comparison is difficult because platforms measure success differently. Matrimony platforms like Shaadi.com and BharatMatrimony report millions of marriages facilitated over their lifetime. Dating apps typically measure in terms of relationships formed or dates arranged, not marriages. In general, platforms designed around marriage intent have higher conversion rates to marriage because both parties share the same goal from the start.',
  },
  {
    question: 'Are there matchmaking platforms built specifically for Indian Americans?',
    answer:
      'Yes. While large platforms like Shaadi.com and BharatMatrimony serve a global audience, newer platforms like VivaahReady are built specifically for the Indian American diaspora in the US. These platforms address the unique needs of Indian Americans: privacy concerns, family involvement preferences, and the cultural nuances of navigating matchmaking while living in America.',
  },
]

export default function BlogPost() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://vivaahready.com' },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://vivaahready.com/blog' },
            { '@type': 'ListItem', position: 3, name: 'Indian Matchmaking vs Dating Apps: An Honest Comparison (2026)', item: 'https://vivaahready.com/blog/indian-matchmaking-vs-dating-apps-honest-comparison' },
          ],
        }) }}
      />

      <article className="min-h-screen bg-white">
        {/* Navigation */}
        <nav className="border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              All Articles
            </Link>
          </div>
        </nav>

        {/* Hero Header */}
        <header className="bg-gradient-to-b from-gray-50 to-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 md:pt-16 md:pb-14">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-6">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary-600 text-white">
                  Comparison
                </span>
                <span className="text-sm text-gray-400">10 min read</span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-[1.15] tracking-tight">
                Indian Matchmaking vs Dating Apps: An Honest Comparison
              </h1>

              <p className="mt-4 text-2xl md:text-3xl font-display text-gray-500 leading-snug">
                What Actually Works for Finding a Life Partner in 2026
              </p>

              <p className="mt-6 text-xl text-gray-500 leading-relaxed">
                Shaadi or Hinge? BharatMatrimony or Bumble? If you have been going back and
                forth, here is an honest look at the trade-offs.
              </p>

              {/* Author */}
              <div className="mt-8 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-display text-lg font-bold">
                  L
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Lakshmi</p>
                  <p className="text-sm text-gray-500">
                    Founder, VivaahReady &middot;{' '}
                    <time dateTime="2026-03-05">March 5, 2026</time>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Image */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden">
            <Image
              src="https://images.pexels.com/photos/5638704/pexels-photo-5638704.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&fit=crop"
              alt="Multigenerational family enjoying a warm dinner together celebrating togetherness"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Article Body */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl py-10 md:py-14">
            <div className="prose prose-lg prose-gray max-w-none prose-headings:font-display prose-headings:tracking-tight prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-[1.8] prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline prose-blockquote:border-primary-400 prose-blockquote:text-gray-600 prose-blockquote:not-italic">
              {/* TL;DR Box */}
              <div className="not-prose mb-10 p-6 bg-gray-50 border border-gray-200 rounded-xl">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  TL;DR
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Indian matrimony platforms and dating apps serve fundamentally different purposes.
                  Matrimony platforms are built around marriage intent and family involvement.
                  Dating apps serve a broader spectrum from casual to serious. For Indian Americans
                  who know they want marriage, a matrimony platform removes the guesswork &mdash;
                  but the right choice depends on where you are in your journey.
                </p>
              </div>

              {/* Opening */}
              <p className="first-letter:text-6xl first-letter:font-display first-letter:font-bold first-letter:text-primary-600 first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-none">
                Every week, I hear some version of the same question from Indian Americans across
                the country: should I use a matrimony site or a dating app? The question sounds
                simple. The answer is not.
              </p>

              <p>
                Because the real question is not about which app to download. It is about what
                you actually want, how you want your family involved, and how much ambiguity
                you are willing to tolerate in the process.
              </p>

              <p>
                I have seen people find wonderful partners on Shaadi.com. I have seen people find
                them on Hinge. And I have seen people burn out on both because they chose a
                platform that did not match their intent. Here is an honest look at the
                differences, trade-offs, and what matters most.
              </p>

              {/* Transition */}
              <div className="my-8 flex items-center gap-4 not-prose">
                <div className="flex-1 border-t border-gray-200" />
                <span className="text-gray-300 text-lg">&bull; &bull; &bull;</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>

              <h2>What Is the Core Difference Between Matrimony Platforms and Dating Apps?</h2>

              <p>
                The fundamental difference is intent. Indian matrimony platforms &mdash; Shaadi.com,
                BharatMatrimony, Jeevansathi, and smaller platforms like{' '}
                <Link href="/indian-matchmaking-usa">VivaahReady</Link>
                {' '}&mdash; exist for one purpose: marriage. Every person on the platform has
                signaled they are looking for a life partner. Family involvement is expected and
                often built into the platform.
              </p>

              <p>
                Dating apps &mdash; Hinge, Bumble, Dil Mil, Coffee Meets Bagel &mdash; serve a
                wider range of intentions. Some users want marriage. Some want serious
                relationships. Some want casual dating. Some are not sure. You do not know which
                category someone falls into until you have invested time getting to know them.
              </p>

              <p>
                This difference in intent has cascading effects on every part of the experience.
              </p>

              {/* Comparison Table */}
              <div className="not-prose my-10 overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-4 font-semibold text-gray-900 border-b border-gray-200">Factor</th>
                      <th className="text-left p-4 font-semibold text-gray-900 border-b border-gray-200">Matrimony Platforms</th>
                      <th className="text-left p-4 font-semibold text-gray-900 border-b border-gray-200">Dating Apps</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-4 font-medium text-gray-900 border-b border-gray-100">Primary Intent</td>
                      <td className="p-4 text-gray-700 border-b border-gray-100">Marriage</td>
                      <td className="p-4 text-gray-700 border-b border-gray-100">Varies (casual to serious)</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-gray-900 border-b border-gray-100">Family Involvement</td>
                      <td className="p-4 text-gray-700 border-b border-gray-100">Built-in, expected</td>
                      <td className="p-4 text-gray-700 border-b border-gray-100">Not supported</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-gray-900 border-b border-gray-100">Profile Depth</td>
                      <td className="p-4 text-gray-700 border-b border-gray-100">Detailed (family, values, lifestyle)</td>
                      <td className="p-4 text-gray-700 border-b border-gray-100">Brief (photos, prompts)</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-gray-900 border-b border-gray-100">Verification</td>
                      <td className="p-4 text-gray-700 border-b border-gray-100">Varies (some verify IDs)</td>
                      <td className="p-4 text-gray-700 border-b border-gray-100">Minimal (photo verification)</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-gray-900 border-b border-gray-100">Cost</td>
                      <td className="p-4 text-gray-700 border-b border-gray-100">$50 - $300/year premium</td>
                      <td className="p-4 text-gray-700 border-b border-gray-100">Free - $50/month premium</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-gray-900 border-b border-gray-100">User Base (US)</td>
                      <td className="p-4 text-gray-700 border-b border-gray-100">Primarily Indian/South Asian</td>
                      <td className="p-4 text-gray-700 border-b border-gray-100">Mixed (Dil Mil is South Asian-focused)</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-gray-900 border-b border-gray-100">Conversation Style</td>
                      <td className="p-4 text-gray-700 border-b border-gray-100">Direct, goals-oriented</td>
                      <td className="p-4 text-gray-700 border-b border-gray-100">Casual, exploratory</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-gray-900 border-b border-gray-100">Privacy</td>
                      <td className="p-4 text-gray-700 border-b border-gray-100">Varies by platform</td>
                      <td className="p-4 text-gray-700 border-b border-gray-100">Generally low (profiles visible to all)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h2>What Are the Strengths of Indian Matrimony Platforms?</h2>

              <p>
                Matrimony platforms like Shaadi.com and BharatMatrimony have over 50 million active
                users combined, according to their published data. That scale is their biggest
                advantage. If you want the widest possible pool of marriage-minded Indian singles,
                these platforms deliver it.
              </p>

              <p>
                <strong>Clarity of intent.</strong> Everyone on a matrimony platform is looking for
                marriage. This eliminates the most exhausting part of dating apps: figuring out
                whether the other person wants the same thing you do. When both sides know why
                they are there, conversations move faster and with less emotional waste.
              </p>

              <p>
                <strong>Family-friendly design.</strong> Matrimony platforms were built for a culture
                where families participate in the search. Many allow parents to create or manage
                profiles, and detailed family information is part of the standard profile format.
              </p>

              <p>
                <strong>Detailed profiles.</strong> A typical matrimony profile includes education,
                profession, family background, religious and community details, lifestyle preferences,
                and partner expectations. This level of detail lets you filter more effectively
                before investing time in conversation.
              </p>

              <h2>What Are the Strengths of Dating Apps?</h2>

              <p>
                Dating apps have strengths that matrimony platforms often lack, particularly for
                younger Indian Americans who grew up with mobile-first experiences.
              </p>

              <p>
                <strong>Modern user experience.</strong> Apps like Hinge and Bumble are polished,
                intuitive, and designed for daily engagement. Many matrimony platforms feel dated
                by comparison, with interfaces that have not evolved significantly in years.
              </p>

              <p>
                <strong>Lower barrier to entry.</strong> Creating a Hinge profile takes five minutes.
                Creating a detailed matrimony profile can take an hour. For someone who is not yet
                certain about what they want, a dating app feels like a lighter commitment.
              </p>

              <p>
                <strong>Broader social experience.</strong> Dating apps let you meet people outside
                your immediate cultural bubble. For Indian Americans open to intercultural
                relationships, or who simply want to meet a wider range of people, dating apps
                provide that exposure.
              </p>

              <p>
                <strong>Less stigma.</strong> There is a generational perception that dating apps are
                normal while matrimony sites carry weight. For some Indian Americans,{' '}
                <Link href="/blog/shame-of-looking-indian-american-matrimony">
                  the stigma of being on a matrimony site
                </Link>
                {' '}is a real barrier. Dating apps do not carry the same emotional load.
              </p>

              {/* Transition */}
              <div className="my-8 flex items-center gap-4 not-prose">
                <div className="flex-1 border-t border-gray-200" />
                <span className="text-gray-300 text-lg">&bull; &bull; &bull;</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>

              <h2>What Are the Real Frustrations with Each?</h2>

              <p>
                Neither option is perfect. Here are the complaints I hear most often from Indian
                Americans who have used both.
              </p>

              <h3>Frustrations with Matrimony Platforms</h3>

              <p>
                <strong>&ldquo;Too many irrelevant profiles.&rdquo;</strong> Large platforms cast a
                wide net, which means you may see profiles from India, profiles that have been
                inactive for years, or profiles that do not match your stated preferences. The
                sheer volume can feel more exhausting than helpful.
              </p>

              <p>
                <strong>&ldquo;Outdated interfaces.&rdquo;</strong> Many Indian Americans in their
                twenties and thirties find the design of major matrimony platforms dated and clunky
                compared to the apps they use daily.
              </p>

              <p>
                <strong>&ldquo;Unverified profiles.&rdquo;</strong> Despite claims of verification,
                many large platforms still have a significant number of profiles that are fake,
                inactive, or misleading. This erodes trust in the entire experience.
              </p>

              <p>
                <strong>&ldquo;Feels transactional.&rdquo;</strong> The detailed, structured nature
                of matrimony profiles can make the process feel like a business negotiation rather
                than a human connection. Salary, height, and caste fields can dominate the
                experience in ways that feel reductive.
              </p>

              <h3>Frustrations with Dating Apps</h3>

              <p>
                <strong>&ldquo;Nobody knows what they want.&rdquo;</strong> The most common
                complaint by far. On dating apps, you might invest weeks getting to know someone
                only to discover they are not looking for anything serious. The ambiguity of intent
                is the biggest time sink.
              </p>

              <p>
                <strong>&ldquo;Where does family fit in?&rdquo;</strong> Dating apps have no
                mechanism for family involvement. For Indian Americans whose families want to be
                part of the process, there is no natural way to bridge that gap.
              </p>

              <p>
                <strong>&ldquo;Swipe fatigue.&rdquo;</strong> The swipe-based model rewards
                snap judgments based on photos and short prompts. This format works against the
                deeper compatibility factors &mdash; values, family dynamics, cultural alignment
                &mdash; that matter most for long-term partnership.
              </p>

              <p>
                <strong>&ldquo;I keep meeting the same type of person.&rdquo;</strong> Algorithm-driven
                dating apps tend to surface similar profiles, creating an echo chamber effect
                that makes the pool feel smaller than it actually is.
              </p>

              {/* Pull quote */}
              <figure className="my-10 md:my-14 py-8 px-6 md:px-10 bg-gray-50 rounded-2xl border-l-4 border-primary-500 not-prose">
                <blockquote className="text-xl md:text-2xl font-display text-gray-800 leading-relaxed">
                  &ldquo;The real frustration is not that either option is bad. It is that
                  neither one was designed for the specific experience of being an Indian
                  American looking for a life partner in the US.&rdquo;
                </blockquote>
              </figure>

              <h2>Is There a Third Option?</h2>

              <p>
                This is exactly the gap I built VivaahReady to fill. The frustration I heard
                from hundreds of families was consistent:{' '}
                <Link href="/blog/caught-between-dating-apps-and-arranged-marriage">
                  they felt caught between two imperfect choices
                </Link>
                .
              </p>

              <p>
                A newer category of platforms combines the best of both worlds: the marriage
                intent and family involvement of matrimony platforms with the modern experience
                and privacy standards of dating apps. These platforms are typically smaller,
                curated, and focused on quality over quantity.
              </p>

              <p>
                <Link href="/privacy-first-matchmaking">Privacy-first matchmaking</Link> means
                your profile is not publicly visible in a database. Verification means every
                person you interact with has been confirmed as genuine. Family involvement means
                the platform is designed so{' '}
                <Link href="/blog/what-indian-parents-should-know-about-matchmaking-usa">
                  parents can participate
                </Link>
                {' '}without taking over.
              </p>

              <h2>How Do You Choose What Is Right for You?</h2>

              <p>
                There is no universal right answer. But there are clear signals that point you
                in the right direction.
              </p>

              <p>
                <strong>Choose a matrimony platform if:</strong> You are certain you want marriage.
                Family involvement matters to you. You want to filter on detailed criteria like
                values, community, and family background. You are willing to invest time in a
                thorough profile and process.
              </p>

              <p>
                <strong>Choose a dating app if:</strong> You are still exploring what you want.
                You prefer a casual, low-pressure entry point. You are open to meeting people
                from different backgrounds. Family involvement is not a priority right now.
              </p>

              <p>
                <strong>Choose a curated, privacy-first platform if:</strong> You know you want
                marriage but are frustrated by the noise of large matrimony sites. Privacy matters.
                You want verified profiles and a smaller, more intentional community. You want
                family involvement but on your terms.
              </p>

              <p>
                The most important thing is alignment between your intent and the platform&rsquo;s
                design. Using a casual dating app when you want marriage leads to frustration.
                Using a matrimony platform when you are not sure what you want leads to pressure.
                Choose the tool that matches where you actually are, not where you think you
                should be.
              </p>

              <p>
                If you are ready to explore a{' '}
                <Link href="/blog/indian-american-marriage-arranged-dating-apps-middle-path-usa">
                  middle path
                </Link>
                , you are not alone. A growing number of Indian Americans are finding that the
                right answer is not matrimony or dating apps &mdash; it is something new
                altogether.
              </p>
            </div>

            {/* Author sign-off */}
            <div className="mt-10 flex items-center gap-4 p-6 bg-gray-50 rounded-xl not-prose">
              <div className="h-14 w-14 rounded-full bg-primary-600 flex items-center justify-center text-white font-display text-xl font-bold flex-shrink-0">
                L
              </div>
              <div>
                <p className="font-semibold text-gray-900">Lakshmi</p>
                <p className="text-sm text-gray-500">Founder, VivaahReady</p>
                <p className="text-sm text-gray-500 mt-1">
                  Building a private, values-first matchmaking space for Indian families in America.
                </p>
              </div>
            </div>

            {/* Divider */}
            <hr className="my-12 border-gray-200" />

            {/* FAQ Section */}
            <section>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900 mb-8">
                Frequently Asked Questions
              </h2>
              <div className="space-y-8">
                {faqs.map((faq, i) => (
                  <div key={i}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</h3>
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Divider */}
            <hr className="my-12 border-gray-200" />

            {/* CTA Section */}
            <section className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-8 md:p-12 text-center">
              <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-4">
                Try a Different Approach
              </h2>
              <p className="text-primary-100 mb-8 max-w-xl mx-auto leading-relaxed">
                VivaahReady combines the intentionality of matrimony platforms with the privacy
                and quality you deserve. Verified profiles. No public directory. Family-friendly
                by design.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-primary-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-lg"
                >
                  Create Your Profile
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-8 py-3.5 border-2 border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
                >
                  Sign In
                </Link>
              </div>

              <nav className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-primary-200">
                <Link href="/about" className="hover:text-white transition-colors">
                  About
                </Link>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact
                </Link>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy
                </Link>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms
                </Link>
              </nav>
            </section>
          </div>
        </div>
      </article>
    </>
  )
}
