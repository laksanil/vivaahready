import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Clock, ChevronDown } from 'lucide-react'

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

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group border border-gray-200 rounded-xl overflow-hidden">
      <summary className="flex items-center justify-between cursor-pointer p-5 bg-gray-50 hover:bg-gray-100 transition-colors">
        <span className="text-base font-semibold text-gray-900 pr-4">{question}</span>
        <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0 group-open:rotate-180 transition-transform" />
      </summary>
      <div className="p-5 text-gray-600 leading-relaxed">{answer}</div>
    </details>
  )
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
        {/* Back link */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>
        </div>

        {/* Hero */}
        <header className="py-12 md:py-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700 mb-6">
              Founder&apos;s Story
            </span>
            <h1 className="font-display text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-gray-900 leading-tight">
              Raising Indian Children in America: The Marriage Conversation We Didn&rsquo;t Have
            </h1>
            <p className="mt-6 text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
              A founder&rsquo;s story about tradition, the Y2K IT wave, and the quiet marriage gap
              many Indian families in the USA face.
            </p>
            <div className="mt-6 flex items-center justify-center gap-4 text-sm text-gray-400">
              <time dateTime="2026-02-14">February 14, 2026</time>
              <span className="w-1 h-1 rounded-full bg-gray-300" />
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                6 min read
              </div>
            </div>
          </div>
        </header>

        {/* Divider */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-gray-200" />
        </div>

        {/* Body */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="prose prose-lg prose-gray max-w-none prose-headings:font-display prose-headings:text-gray-900 prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-primary-600 prose-a:no-underline hover:prose-a:underline prose-blockquote:border-primary-300 prose-blockquote:text-gray-600">
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

            <p className="mt-10 border-l-4 border-primary-200 pl-5 italic text-gray-600">
              &mdash; Lakshmi
              <br />
              Founder, VivaahReady
            </p>
          </div>

          {/* FAQ Section */}
          <section className="mt-16 pt-12 border-t border-gray-200">
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <FAQItem key={i} question={faq.question} answer={faq.answer} />
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="mt-16 bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Ready to Start the Conversation?
            </h2>
            <p className="text-gray-600 mb-8 max-w-xl mx-auto">
              VivaahReady is a private, verified space for Indian-origin families and professionals
              in the US to explore marriage thoughtfully.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
              >
                Create your profile
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Sign in to continue
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
