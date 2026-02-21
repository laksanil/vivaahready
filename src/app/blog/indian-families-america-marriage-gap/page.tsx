import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Raising Indian Children in America: The Marriage Conversation We Didn\u2019t Have',
  description:
    'A Bay Area mother shares how she raised Indian children in America between two worlds and the marriage conversation her family never had. Founder of VivaahReady.',
  keywords: [
    'Indian families in the USA',
    'raising Indian children in America',
    'Indian diaspora marriage',
    'Indian matrimony in the USA',
    'Indian parents in the US',
    'arranged marriage vs dating',
    'private Indian matrimony',
    'compatibility and family values',
  ],
  openGraph: {
    title: 'Raising Indian Children in America: The Marriage Conversation We Didn\u2019t Have',
    description:
      'A Bay Area mother shares how she raised Indian children in America between two worlds and the marriage conversation her family never had. Founder of VivaahReady.',
    url: 'https://vivaahready.com/blog/indian-families-america-marriage-gap',
    type: 'article',
    publishedTime: '2026-02-14T00:00:00Z',
  },
  alternates: {
    canonical: 'https://vivaahready.com/blog/indian-families-america-marriage-gap',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: 'Raising Indian Children in America: The Marriage Conversation We Didn\u2019t Have',
  description:
    'A Bay Area mother shares how she raised Indian children in America between two worlds and the marriage conversation her family never had. Founder of VivaahReady.',
  datePublished: '2026-02-14T00:00:00Z',
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
    '@id': 'https://vivaahready.com/blog/indian-families-america-marriage-gap',
  },
}

const faqs = [
  {
    question: 'How do Indian families in the USA typically approach marriage conversations?',
    answer:
      'Many Indian families in the USA prioritize academics and career-building during their children\u2019s formative years, often deferring marriage conversations until later. This can create a gap where children feel unprepared or hesitant to discuss partnership openly with their parents.',
  },
  {
    question: 'What challenges do Indian parents face when helping their children find a partner in America?',
    answer:
      'Indian parents in the US often navigate a balance between respecting their children\u2019s independence and offering guidance rooted in tradition. The lack of extended family networks, community gatherings, and familiar social structures makes the process more isolating compared to India.',
  },
  {
    question: 'Why is privacy important in Indian matrimony for families in the US?',
    answer:
      'Many Indian-origin professionals and families prefer discretion when exploring marriage options. Unlike large matrimonial portals where profiles are broadly visible, a privacy-first approach ensures that personal information is shared only with genuinely compatible and verified individuals.',
  },
  {
    question: 'How can Indian families start healthy marriage conversations with their children?',
    answer:
      'The key is to begin with open, pressure-free dialogue \u2014 treating partnership as a natural part of life planning, much like education or career. Families who approach marriage as a shared conversation, rather than a directive, tend to find that their children are more receptive and engaged.',
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
                  Founder&apos;s Story
                </span>
                <span className="text-sm text-gray-400">6 min read</span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-[1.15] tracking-tight">
                Raising Indian Children in America: The Marriage Conversation We Didn&rsquo;t Have
              </h1>

              <p className="mt-6 text-xl text-gray-500 leading-relaxed">
                A founder&rsquo;s story about tradition, the Y2K IT wave, and the quiet marriage gap
                many Indian families in the USA face.
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
                    <time dateTime="2026-02-14">February 14, 2026</time>
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
              {/* Drop cap first paragraph */}
              <p className="first-letter:text-6xl first-letter:font-display first-letter:font-bold first-letter:text-primary-600 first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-none">
                When my husband and I came to the United States during the Y2K years, we carried more
                than degrees and job offers. We carried our habits with us.
              </p>

              <p>
                We grew up in Hyderabad and Kurnool in homes where culture was not something you
                displayed &mdash; it was something you practiced.
              </p>

              <p>In our homes, character wasn&rsquo;t loud.</p>

              <p className="text-gray-600 italic pl-6 border-l-2 border-gray-200">
                How many times did you do <em>sandhyavandanam</em>?
                <br />
                Did you bow to elders without being reminded?
                <br />
                Did you understand why certain rituals mattered?
              </p>

              <p>
                I still remember when my husband first came to meet my parents. He had already lived
                in America for four years. But during that visit, he barely spoke.
              </p>

              <p>
                Whenever someone asked him something, he would gently turn to his older brother and
                say, &ldquo;Anna, what do you think?&rdquo;
              </p>

              <p>He touched every elder&rsquo;s feet when he entered.</p>

              <p>
                Later, my father said, almost with relief, &ldquo;He is very cultured.&rdquo;
              </p>

              <p>Not because he worked in the U.S. But because America had not changed his grounding.</p>

              {/* Pull quote */}
              <figure className="my-10 md:my-14 py-8 px-6 md:px-10 bg-gray-50 rounded-2xl border-l-4 border-primary-500 not-prose">
                <blockquote className="text-xl md:text-2xl font-display text-gray-800 leading-relaxed">
                  &ldquo;We wanted our children to know why we lit the lamp. Why we fasted. Why certain days mattered. We didn&rsquo;t want culture to become something they saw only on YouTube.&rdquo;
                </blockquote>
                <figcaption className="mt-4 text-sm text-gray-500 font-medium">
                  &mdash; Lakshmi, Founder of VivaahReady
                </figcaption>
              </figure>

              <h2>Building a Life During the Y2K Wave</h2>

              <p>
                When we moved to the U.S., it was the height of the Y2K IT wave. Everything was moving
                fast. There was opportunity everywhere, but also pressure.
              </p>

              <p>We were fortunate to receive our green card in less than two years.</p>

              <p>
                Both of us worked full-time in the IT industry. I started as an IT analyst. Long
                hours. Deadlines. Learning systems. Building stability from scratch.
              </p>

              <p>Doing every festival at home was not easy.</p>

              <p>
                Some evenings we were exhausted. There were days we questioned whether we were
                overdoing it. But we still tried.
              </p>

              <p>At the same time, our message was clear:</p>

              <p className="text-gray-600 italic pl-6 border-l-2 border-gray-200">
                &ldquo;Focus on academics.&rdquo;
                <br />
                &ldquo;Build your foundation.&rdquo;
                <br />
                &ldquo;Everything else will come later.&rdquo;
              </p>

              <p>And they listened.</p>

              <p>
                They worked hard. They grew confident. They learned to move comfortably between Indian
                traditions at home and American independence outside.
              </p>

              <h2>The Conversation We Missed</h2>

              <p>What we did not talk about clearly was partnership.</p>

              <p>
                Looking back, I sometimes wonder if we focused so much on stability that we forgot to
                talk about companionship. We prepared them for exams, internships, and promotions. But
                we never really prepared them for marriage.
              </p>

              {/* Pull quote */}
              <figure className="my-10 md:my-14 py-8 px-6 md:px-10 bg-primary-50 rounded-2xl not-prose">
                <blockquote className="text-xl md:text-2xl font-display text-gray-800 leading-relaxed">
                  &ldquo;We prepared them for exams, internships, and promotions. But we never really prepared them for marriage.&rdquo;
                </blockquote>
              </figure>

              <p>
                Today, many Indian families in the United States are quietly navigating this same
                space. Our children move comfortably between two worlds. They respect tradition. They value independence.
              </p>

              <p>But when it comes to marriage, there is hesitation.</p>

              <p>Some feel they are supposed to figure it out alone. Some feel involving parents might look like weakness. Some simply feel there is still time.</p>

              <h2>From Reflection to Action</h2>

              <p>
                We realized partnership needs the same thoughtfulness we gave to education.
                Not pressure. Not deadlines. Just conversation.
              </p>

              <p>
                We didn&rsquo;t have those conversations early enough with our own children.
                That realization stayed with us.
              </p>

              <p>
                And over time, it led us to build something we wished had existed earlier &mdash; a
                space where Indian-origin professionals in the U.S. and their families could approach
                marriage thoughtfully, privately, and without shame.
              </p>

              <p className="text-xl font-display font-semibold text-gray-900">
                That is how VivaahReady began. Not from urgency. But from reflection.
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

            {/* FAQ Section — all visible, no accordion */}
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
                Ready to Start the Conversation?
              </h2>
              <p className="text-primary-100 mb-8 max-w-xl mx-auto leading-relaxed">
                VivaahReady is a private, verified space for Indian-origin families and professionals
                in the US to explore marriage thoughtfully.
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
