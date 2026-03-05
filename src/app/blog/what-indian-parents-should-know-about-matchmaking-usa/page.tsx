import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'What Indian Parents Should Know About Modern Matchmaking in the US | VivaahReady',
  description:
    'A practical guide for Indian parents in America navigating the matchmaking process for their children. How to help without overstepping, what has changed, and where to start in 2026.',
  keywords: [
    'Indian parents matchmaking USA',
    'Indian matchmaking for parents',
    'how to find match for daughter USA',
    'how to find match for son USA',
    'Indian parents marriage help',
    'Indian family matchmaking America',
    'NRI parents matchmaking',
    'Indian matrimony parents guide',
    'arranged marriage parents role USA',
    'Indian matchmaking family involvement',
  ],
  openGraph: {
    title: 'What Indian Parents Should Know About Modern Matchmaking in the US',
    description:
      'A practical guide for Indian parents navigating the matchmaking process for their children in America. How to help without overstepping.',
    url: 'https://vivaahready.com/blog/what-indian-parents-should-know-about-matchmaking-usa',
    type: 'article',
    publishedTime: '2026-03-05T00:00:00Z',
  },
  alternates: {
    canonical: 'https://vivaahready.com/blog/what-indian-parents-should-know-about-matchmaking-usa',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: 'What Indian Parents Should Know About Modern Matchmaking in the US',
  description:
    'A practical guide for Indian parents in America navigating the matchmaking process for their children. How to help without overstepping, what has changed, and where to start in 2026.',
  datePublished: '2026-03-05T00:00:00Z',
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
  },
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://vivaahready.com/blog/what-indian-parents-should-know-about-matchmaking-usa',
  },
}

const faqs = [
  {
    question: 'How can Indian parents help with matchmaking without being pushy?',
    answer:
      'The most effective approach is to ask your child what kind of support they want, rather than assuming. Some children want help identifying potential matches. Others want emotional support but prefer to manage the search themselves. A 2025 Jeevansathi report found that 77% of profiles on matrimony platforms are now self-managed, meaning most young people want to drive their own search with family support available when needed.',
  },
  {
    question: 'Should Indian parents create matrimony profiles for their children?',
    answer:
      'Only with your child\u2019s knowledge and consent. Creating a profile without telling them can damage trust and create the exact distance you are trying to close. If your child is open to it, offer to help them create their own profile together. This makes the process collaborative rather than secretive.',
  },
  {
    question: 'What if my child does not want to discuss marriage?',
    answer:
      'Resistance often comes from feeling pressured, not from lacking interest. Try approaching the topic without urgency. Share your own experience with finding a partner, ask open-ended questions about what they value in relationships, and make it clear that you are offering support, not issuing a deadline. When the conversation feels safe, most children are more open than parents expect.',
  },
  {
    question: 'How important is caste and community in modern Indian matchmaking?',
    answer:
      'The importance of caste in matchmaking has declined significantly. According to Jeevansathi\u2019s 2025 data, caste-based preferences dropped from 91% in 2016 to 54% in 2025, and to just 49% in major metros. Many Indian American families prioritize shared values, education level, and cultural compatibility over strict caste or community matching.',
  },
  {
    question: 'What are the best Indian matchmaking platforms for parents in the USA?',
    answer:
      'Large platforms like Shaadi.com and BharatMatrimony have the widest reach. For a more curated, privacy-first experience, VivaahReady is built specifically for Indian families in the US, with verified profiles and family-friendly features. The best platform depends on whether you prioritize volume of options or quality of each match.',
  },
]

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
}

export default function BlogPost() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
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
                  Guide
                </span>
                <span className="text-sm text-gray-400">10 min read</span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-[1.15] tracking-tight">
                What Indian Parents Should Know About Modern Matchmaking in the US
              </h1>

              <p className="mt-4 text-2xl md:text-3xl font-display text-gray-500 leading-snug">
                A Practical Guide for Families
              </p>

              <p className="mt-6 text-xl text-gray-500 leading-relaxed">
                You want to help your son or daughter find the right partner. But the process
                you grew up with does not quite work the same way in America. Here is what has
                changed and how you can be genuinely helpful.
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
                  Modern Indian matchmaking in America is driven by the individual with family
                  support, not the other way around. A 2025 Jeevansathi report found that 77%
                  of matrimony profiles are now self-managed. Parents who approach the process
                  as partners rather than directors have the best outcomes &mdash; and the
                  strongest relationships with their children through the journey.
                </p>
              </div>

              {/* Opening */}
              <p className="first-letter:text-6xl first-letter:font-display first-letter:font-bold first-letter:text-primary-600 first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-none">
                I am a parent. I have been exactly where you are. Wanting to help. Not knowing
                how. Watching your child build a career, a life, a circle of friends &mdash; and
                wondering when the conversation about marriage will happen. Or if it already
                should have happened years ago.
              </p>

              <p>
                When my husband and I came to America during the Y2K wave, we assumed the marriage
                conversation would happen naturally when the time was right. We raised our children
                to be independent, to focus on education, to build careers. We did not realize we
                were also teaching them that marriage is something they should figure out alone.
              </p>

              <p>
                If you are reading this, you are already doing something important: you are trying
                to understand. That matters more than you think. Because the matchmaking process
                has changed, and the parents who adapt are the ones whose children feel supported
                rather than pressured.
              </p>

              {/* Transition */}
              <div className="my-8 flex items-center gap-4 not-prose">
                <div className="flex-1 border-t border-gray-200" />
                <span className="text-gray-300 text-lg">&bull; &bull; &bull;</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>

              <h2>Why Does the Process Feel So Different in America?</h2>

              <p>
                In India, matchmaking is supported by an entire ecosystem: extended family,
                community elders, family friends, neighborhood connections, and cultural events
                where families naturally meet. According to a 2025 Outlook Business survey,
                arranged marriages in India have declined from 68% in 2020 to 44% in 2023,
                but even that reduced number relies on networks that simply do not exist in the
                same way in America.
              </p>

              <p>
                In the US, your network is likely limited to your immediate circle &mdash; friends
                from work, a handful of families from the temple or community association, maybe
                a WhatsApp group. The support system that made matchmaking feel natural in India
                is fragmented here.
              </p>

              <p>
                This is not a failure. It is a reality of diaspora life. And the sooner families
                acknowledge it, the sooner they can find approaches that actually work in this
                context.
              </p>

              <h2>What Has Changed About How Young Indian Americans Think About Marriage?</h2>

              <p>
                The Jeevansathi 2025 Annual Marriage Trends Report, covered by Business Standard
                and The Tribune, revealed several shifts that every parent should understand.
                The median age for starting a partner search has moved from 27 to 29. Among
                users, 90% prioritize finding the &ldquo;right person&rdquo; over meeting age
                or financial benchmarks.
              </p>

              <p>
                Your child probably does want to get married. But they want to do it on their
                own terms, at their own pace, with a partner they genuinely connect with. The
                gap between what parents see (delay) and what children feel (intentionality) is
                where most family friction lives.
              </p>

              <p>
                What looks like avoidance to a parent often looks like thoughtfulness to the
                child. They are not rejecting the idea of marriage. They are rejecting the idea
                of rushing into it.
              </p>

              {/* Pull quote */}
              <figure className="my-10 md:my-14 py-8 px-6 md:px-10 bg-gray-50 rounded-2xl border-l-4 border-primary-500 not-prose">
                <blockquote className="text-xl md:text-2xl font-display text-gray-800 leading-relaxed">
                  &ldquo;What looks like avoidance to a parent often looks like thoughtfulness
                  to the child. They are not rejecting marriage. They are rejecting the idea
                  of rushing into it.&rdquo;
                </blockquote>
              </figure>

              <h2>How Can Parents Actually Help?</h2>

              <p>
                The most helpful parents I have met through VivaahReady share a few things in
                common. None of them involve taking over the process. All of them involve making
                the process easier for their child.
              </p>

              <h3>Start with a Conversation, Not a Search</h3>

              <p>
                Before creating profiles or calling matchmakers, talk to your child. Ask them:
                What kind of partner are you looking for? What matters most to you? How would
                you like me to be involved?
              </p>

              <p>
                Many parents skip this step because they assume they know the answers. But
                what you think your child wants and what they actually want can be very different.
                A mother in Chicago told me she spent six months looking for matches with a
                specific professional background, only to learn her daughter cared far more about
                emotional intelligence and shared values than about job titles.
              </p>

              <h3>Respect Their Timeline</h3>

              <p>
                Yes, the median marriage age has moved to 29. Yes, biology is a factor. But
                repeatedly bringing up timelines creates pressure that pushes your child away
                from the conversation, not toward it.
              </p>

              <p>
                The parents whose children are most open with them are the ones who made it clear
                that support is available without a deadline attached. Your child knows their age.
                They do not need to be reminded. What they need is a parent who will be a partner
                in the process whenever they are ready.
              </p>

              <h3>Understand the Platforms</h3>

              <p>
                If your child is using a{' '}
                <Link href="/blog/how-indian-matchmaking-works-in-america-2026">
                  matchmaking platform
                </Link>
                , take the time to understand how it works. Ask them to show you. Some platforms
                like VivaahReady are designed to include family involvement from the start. Others
                are individual-only.
              </p>

              <p>
                The worst thing a parent can do is dismiss a platform they have never seen. The
                best thing is to say: &ldquo;Show me how it works. I want to understand.&rdquo;
              </p>

              <h3>Widen Your Criteria</h3>

              <p>
                Caste-based preferences in Indian matchmaking have dropped from 91% in 2016 to
                54% in 2025, according to Jeevansathi. In major US metros, that number is 49%.
                If your criteria for a match are narrower than your child&rsquo;s, it will create
                friction.
              </p>

              <p>
                This does not mean values do not matter. It means the definition of compatibility
                has expanded. A good match in 2026 is someone who shares your child&rsquo;s core
                values, communicates well, and wants the same kind of life &mdash; not necessarily
                someone from the same sub-community or with the same degree.
              </p>

              <h3>Be Honest About Your Own Fears</h3>

              <p>
                Many parents push for urgency not because they are controlling, but because they
                are afraid. Afraid their child will be alone. Afraid they will miss the window.
                Afraid of what extended family will say.
              </p>

              <p>
                Naming those fears honestly &mdash; &ldquo;I worry because I love you and I want
                you to have a partner in life&rdquo; &mdash; is far more effective than converting
                those fears into pressure. Children respond to vulnerability. They resist demands.
              </p>

              {/* Transition */}
              <div className="my-8 flex items-center gap-4 not-prose">
                <div className="flex-1 border-t border-gray-200" />
                <span className="text-gray-300 text-lg">&bull; &bull; &bull;</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>

              <h2>What Should Parents Avoid?</h2>

              <p>
                I have seen well-meaning parents make these mistakes repeatedly. Each one pushes
                their child further from the conversation, not closer to it.
              </p>

              <p>
                <strong>Comparing to other families.</strong> &ldquo;Sharma uncle&rsquo;s son
                got married last year at 27.&rdquo; Your child is not Sharma uncle&rsquo;s son.
                Comparisons create shame, and shame drives secrecy. If you want to understand
                why this dynamic is so damaging, read about{' '}
                <Link href="/blog/shame-of-looking-indian-american-matrimony">
                  the shame of looking
                </Link>
                .
              </p>

              <p>
                <strong>Creating profiles without permission.</strong> A parent who creates a
                matrimony profile for their child without telling them is not helping. They are
                making a unilateral decision about something deeply personal. Even if the intention
                is good, the impact is a breach of trust.
              </p>

              <p>
                <strong>Treating every family gathering as a marriage discussion.</strong> When
                marriage comes up every time your child visits home, they stop wanting to visit.
                Keep the topic to designated, calm conversations &mdash; not ambient pressure.
              </p>

              <p>
                <strong>Dismissing their preferences.</strong> If your child says they care about
                emotional compatibility more than profession, listen. If they say they are open
                to someone from a different community, respect it. The fastest way to lose
                influence is to dismiss what your child tells you they need.
              </p>

              <h2>What Does a Healthy Family Matchmaking Process Look Like?</h2>

              <p>
                The families that navigate this process well share a simple dynamic: the child
                leads, and the parents support. Here is what that looks like in practice.
              </p>

              <p>
                <strong>The child decides when to start</strong> and what platforms or approaches
                to use. The parents make it clear they are available to help whenever asked.
              </p>

              <p>
                <strong>Both sides share their criteria openly.</strong> The child shares what
                they are looking for. The parents share what they hope for. Where there is
                overlap, great. Where there is not, they have an honest conversation about what
                is a dealbreaker and what is a preference.
              </p>

              <p>
                <strong>The family meets potential matches together</strong> when both the child
                and the match are comfortable. Not on the first call. Not after one message. At
                a point that feels natural and appropriate to both individuals.
              </p>

              <p>
                <strong>The parents provide perspective, not decisions.</strong> &ldquo;I noticed
                they seemed a little hesitant about relocating &mdash; did you discuss that?&rdquo;
                is helpful. &ldquo;I do not think they are right for you&rdquo; without explanation
                is not.
              </p>

              <p>
                This kind of process does not happen by accident. It requires parents who are
                willing to adjust their expectations and children who are willing to include their
                families. When both sides show up with honesty, the process becomes something
                that{' '}
                <Link href="/blog/indian-families-america-marriage-gap">
                  strengthens the family
                </Link>
                {' '}rather than straining it.
              </p>

              {/* Pull quote */}
              <figure className="my-10 md:my-14 py-8 px-6 md:px-10 bg-primary-50 rounded-2xl not-prose">
                <blockquote className="text-xl md:text-2xl font-display text-gray-800 leading-relaxed">
                  &ldquo;The families that navigate matchmaking well share a simple dynamic:
                  the child leads, and the parents support.&rdquo;
                </blockquote>
              </figure>

              <h2>Where Should Parents Start Today?</h2>

              <p>
                If you have read this far, you are already ahead. Most parents never seek
                guidance on this. They rely on what they know from their own experience or what
                their friends suggest. But the landscape has changed, and your willingness to
                learn is the single most important thing you bring to this process.
              </p>

              <p>
                Here is what I would suggest.
              </p>

              <p>
                <strong>Have one calm, open conversation with your child.</strong> Not about
                timelines. Not about specific matches. Just about how they are feeling about
                partnership and what kind of support, if any, they would welcome from you.
              </p>

              <p>
                <strong>Educate yourself on the options.</strong> Read about{' '}
                <Link href="/blog/how-indian-matchmaking-works-in-america-2026">
                  how Indian matchmaking works in America today
                </Link>
                . Understand the difference between large platforms, dating apps, matchmakers,
                and curated platforms. Know what is available so you can have an informed conversation.
              </p>

              <p>
                <strong>If your child is open to it, explore a platform together.</strong>{' '}
                <Link href="/indian-matchmaking-usa">
                  VivaahReady
                </Link>{' '}
                was built for exactly this kind of family-involved, individual-driven matchmaking.
                Every profile is verified. Privacy is built in. And the process is designed so
                families can participate without taking over.
              </p>

              <p>
                The goal is not to find a match tomorrow. The goal is to build a process your
                child trusts, so that when the right person appears, everyone is ready.
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
                A Space Built for Families
              </h2>
              <p className="text-primary-100 mb-8 max-w-xl mx-auto leading-relaxed">
                VivaahReady is designed for Indian families in the US who want a thoughtful,
                verified, and private matchmaking experience. Start together.
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
