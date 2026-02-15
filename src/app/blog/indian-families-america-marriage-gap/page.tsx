import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Raising Indian Children in America: The Marriage Conversation We Didn\u2019t Have',
  description:
    'A founder\u2019s story about tradition, the Y2K IT wave, and the quiet marriage gap many Indian families in the USA face \u2014 and why VivaahReady began.',
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
      'A founder\u2019s story about tradition, the Y2K IT wave, and the quiet marriage gap many Indian families in the USA face \u2014 and why VivaahReady began.',
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
    'A founder\u2019s story about tradition, the Y2K IT wave, and the quiet marriage gap many Indian families in the USA face \u2014 and why VivaahReady began.',
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

      <article className="bg-white">
        {/* Hero */}
        <header className="bg-gradient-to-br from-white via-silver-50 to-silver-100 py-16 md:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-primary-600 font-medium text-sm uppercase tracking-wider mb-4">
              Founder&apos;s Story
            </p>
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
              Raising Indian Children in America: The Marriage Conversation We Didn&rsquo;t Have
            </h1>
            <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
              A founder&rsquo;s story about tradition, the Y2K IT wave, and the quiet marriage gap
              many Indian families in the USA face.
            </p>
            <time
              dateTime="2026-02-14"
              className="mt-4 inline-block text-sm text-gray-500"
            >
              February 14, 2026
            </time>
          </div>
        </header>

        {/* Body */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="prose prose-lg prose-gray max-w-none">
            <p>
              When my husband and I came to the United States during the Y2K years, we carried more
              than degrees and job offers.
            </p>
            <p>We carried our habits with us.</p>
            <p>
              We grew up in Hyderabad and Kurnool in homes where culture was not something you
              displayed &mdash; it was something you practiced.
            </p>
            <p>In our homes, character wasn&rsquo;t loud.</p>
            <p>
              How many times did you do <em>sandhyavandanam</em>?
              <br />
              Did you bow to elders without being reminded?
              <br />
              Did you understand why certain rituals mattered?
            </p>
            <p>
              I still remember when my husband first came to meet my parents. He had already lived
              in America for four years.
            </p>
            <p>But during that visit, he barely spoke.</p>
            <p>
              Whenever someone asked him something, he would gently turn to his older brother and
              say, &ldquo;Anna, what do you think?&rdquo;
            </p>
            <p>He touched every elder&rsquo;s feet when he entered.</p>
            <p>
              Later, my father said, almost with relief, &ldquo;He is very cultured.&rdquo;
            </p>
            <p>Not because he worked in the U.S.</p>
            <p>But because America had not changed his grounding.</p>

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
            <p>
              We wanted our children to know why we lit the lamp. Why we fasted. Why certain days
              mattered. We didn&rsquo;t want culture to become something they saw only on YouTube.
            </p>
            <p>At the same time, our message was clear.</p>
            <p>
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
            <p>
              Today, many Indian families in the United States are quietly navigating this same
              space.
            </p>
            <p>Our children move comfortably between two worlds.</p>
            <p>They respect tradition.</p>
            <p>They value independence.</p>
            <p>But when it comes to marriage, there is hesitation.</p>
            <p>Some feel they are supposed to figure it out alone.</p>
            <p>Some feel involving parents might look like weakness.</p>
            <p>Some simply feel there is still time.</p>

            <h2>From Reflection to Action</h2>

            <p>
              We realized partnership needs the same thoughtfulness we gave to education.
            </p>
            <p>Not pressure.</p>
            <p>Not deadlines.</p>
            <p>Just conversation.</p>
            <p>
              We didn&rsquo;t have those conversations early enough with our own children.
            </p>
            <p>That realization stayed with us.</p>
            <p>
              And over time, it led us to build something we wished had existed earlier &mdash; a
              space where Indian-origin professionals in the U.S. and their families could approach
              marriage thoughtfully, privately, and without shame.
            </p>
            <p>That is how VivaahReady began.</p>
            <p>Not from urgency.</p>
            <p>But from reflection.</p>

            <p className="mt-8">
              <em>
                &mdash; Lakshmi
                <br />
                Founder, VivaahReady
              </em>
            </p>
          </div>

          {/* FAQ Section */}
          <section className="mt-16 border-t border-gray-200 pt-12">
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-8">
              Frequently Asked Questions
            </h2>
            <dl className="space-y-6">
              {faqs.map((faq, i) => (
                <div key={i} className="border-b border-gray-100 pb-6 last:border-b-0">
                  <dt className="text-lg font-semibold text-gray-900 mb-2">{faq.question}</dt>
                  <dd className="text-gray-600 leading-relaxed">{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* CTA Section */}
          <section className="mt-16 bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Ready to Start the Conversation?
            </h2>
            <p className="text-gray-600 mb-8 max-w-xl mx-auto">
              VivaahReady is a private, verified space for Indian-origin families and professionals
              in the US to explore marriage thoughtfully.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-6 py-3 border border-primary-600 text-primary-700 font-medium rounded-lg hover:bg-primary-50 transition-colors"
              >
                Sign in to continue
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Create your profile
              </Link>
            </div>

            {/* Trust links */}
            <nav className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
              <Link href="/about" className="hover:text-primary-600 transition-colors">
                About
              </Link>
              <Link href="/contact" className="hover:text-primary-600 transition-colors">
                Contact
              </Link>
              <Link href="/privacy" className="hover:text-primary-600 transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-primary-600 transition-colors">
                Terms
              </Link>
            </nav>
          </section>
        </div>
      </article>
    </>
  )
}
