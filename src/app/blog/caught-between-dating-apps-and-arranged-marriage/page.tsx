import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Caught Between Dating Apps and Arranged Marriage: Why Indian Americans Feel Stuck',
  description:
    'Why Indian Americans feel caught between dating apps and arranged marriage. Real stories from families across the Bay Area, Dallas, New York, and Chicago.',
  keywords: [
    'Indian American dating',
    'arranged marriage vs dating apps',
    'Indian families marriage conversation',
    'Indian diaspora matchmaking',
    'Indian parents marriage pressure',
    'Indian American relationships',
    'Indian matrimony USA',
    'dating apps Indian Americans',
  ],
  openGraph: {
    title: 'Caught Between Dating Apps and Arranged Marriage: Why Indian Americans Feel Stuck',
    description:
      'Why Indian Americans feel caught between dating apps and arranged marriage. Real stories from families across the Bay Area, Dallas, New York, and Chicago.',
    url: 'https://vivaahready.com/blog/caught-between-dating-apps-and-arranged-marriage',
    type: 'article',
    publishedTime: '2026-02-16T00:00:00Z',
  },
  alternates: {
    canonical: 'https://vivaahready.com/blog/caught-between-dating-apps-and-arranged-marriage',
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: 'Caught Between Dating Apps and Arranged Marriage: Why Indian Americans Feel Stuck',
  description:
    'Why Indian Americans feel caught between dating apps and arranged marriage. Real stories from families across the Bay Area, Dallas, New York, and Chicago.',
  datePublished: '2026-02-16T00:00:00Z',
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
    '@id': 'https://vivaahready.com/blog/caught-between-dating-apps-and-arranged-marriage',
  },
}

const faqs = [
  {
    question: 'Why do Indian American families struggle with the marriage conversation?',
    answer:
      'Parents notice time passing and feel they should help, while children feel repeated attention and step back to protect their space. Both reactions make sense, yet they move in opposite directions \u2014 creating tension without discussion.',
  },
  {
    question: 'Why do dating apps feel exhausting for many Indian Americans?',
    answer:
      'The frustration isn\u2019t about meeting people \u2014 it\u2019s about restarting the same emotional conversation again and again without knowing early enough whether both people want the same outcome. Uncertainty, not rejection, is what drains energy.',
  },
  {
    question: 'How can Indian families bridge the gap between tradition and modern dating?',
    answer:
      'Structure doesn\u2019t take away choice \u2014 it takes away guessing. When expectations are clear early, conversations become calmer. When direction exists, families naturally step back. A healthier approach combines the intentionality of tradition with the personal ownership of modern relationships.',
  },
  {
    question: 'What do Indian American professionals actually want in a matchmaking process?',
    answer:
      'They\u2019re not looking for more options. They want a healthier way to meet \u2014 one where intentions are understood early, conversations stay comfortable, and families don\u2019t have to choose between involvement and distance.',
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
                  Perspectives
                </span>
                <span className="text-sm text-gray-400">8 min read</span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 leading-[1.15] tracking-tight">
                Caught Between Dating Apps and Arranged Marriage
              </h1>

              <p className="mt-4 text-2xl md:text-3xl font-display text-gray-500 leading-snug">
                Why Indian Americans Feel Stuck
              </p>

              <p className="mt-6 text-xl text-gray-500 leading-relaxed">
                Two families, two opposite situations &mdash; one daughter avoids the topic, another is
                actively trying but feels stuck. Yet both homes share the same quiet tension.
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
                    <time dateTime="2026-02-16">February 16, 2026</time>
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
              {/* Drop cap opening */}
              <p className="first-letter:text-6xl first-letter:font-display first-letter:font-bold first-letter:text-primary-600 first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:leading-none">
                A close friend told me recently, &ldquo;I&rsquo;m afraid to bring it up when my
                daughter comes home.&rdquo;
              </p>

              <p>I asked what she meant.</p>

              <p>
                &ldquo;Marriage,&rdquo; she said. &ldquo;She&rsquo;s 32 now. A doctor in San
                Francisco. Medical school in Boston, residency in Los Angeles, finally settled. Long
                hours, her own place&hellip; she built the life she worked so hard for.&rdquo;
              </p>

              <p>She paused before continuing.</p>

              <p>
                &ldquo;But if I ask about marriage, she says, &lsquo;I&rsquo;ll deal with it when I
                need to.&rsquo; After that she won&rsquo;t reply to my messages for days. The visits
                are becoming less frequent.&rdquo;
              </p>

              <p>They live in San Jose. Her daughter is barely an hour away.</p>

              <p>But lately, it feels much farther.</p>

              {/* Transition */}
              <div className="my-8 flex items-center gap-4 not-prose">
                <div className="flex-1 border-t border-gray-200" />
                <span className="text-gray-300 text-lg">&bull; &bull; &bull;</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>

              <p>
                A few weeks later, another parent shared something that sounded completely different.
              </p>

              <p>
                &ldquo;My daughter is 29. Berkeley graduate. Software engineer in Cupertino. She&rsquo;s
                meeting people constantly &mdash; dating apps, introductions, family connections. But
                nothing works. The ones she likes aren&rsquo;t serious. The ones who seem serious
                don&rsquo;t connect. She&rsquo;s exhausted&hellip; and honestly, so are we.&rdquo;
              </p>

              <p>
                They had always trusted her to figure things out. She&rsquo;d handled everything else
                in life with clarity. Now even asking about it felt delicate.
              </p>

              <p>Two opposite situations.</p>
              <p>One daughter avoids the topic.</p>
              <p>Another is actively trying but feels stuck.</p>

              <p>
                Yet both families have started walking carefully around the conversation. And in both
                homes, the feeling is the same &mdash; everyone is dealing with it alone.
              </p>

              {/* Pull quote */}
              <figure className="my-10 md:my-14 py-8 px-6 md:px-10 bg-gray-50 rounded-2xl border-l-4 border-primary-500 not-prose">
                <blockquote className="text-xl md:text-2xl font-display text-gray-800 leading-relaxed">
                  &ldquo;I don&rsquo;t mind meeting people. I mind restarting the same emotional
                  conversation again and again.&rdquo;
                </blockquote>
              </figure>

              <h2>It&rsquo;s Not Really About Marriage</h2>

              <p>Neither family disagrees about marriage itself.</p>

              <p>What they disagree about is how it&rsquo;s supposed to happen.</p>

              <p>
                In traditional arranged settings, families created direction but sometimes removed
                comfort. In modern dating culture, individuals have freedom but often lose clarity.
              </p>

              <p>Too much structure feels heavy. Too little structure feels endless.</p>

              <p>
                Many Indian families today aren&rsquo;t choosing between tradition and independence
                &mdash; they&rsquo;re trying to make both coexist.
              </p>

              <h2>The Real Frustration: Not Rejection, but Uncertainty</h2>

              <p>The second daughter explained this to me during a visit home.</p>

              <p>
                She met someone through a mutual friend. Easy conversation. Coffee became dinners,
                dinners became weekends. After three months he told her he wasn&rsquo;t ready for
                anything serious.
              </p>

              <p>She was surprised.</p>

              <p>
                &ldquo;We&rsquo;ve been seeing each other for three months. What did you think this
                was?&rdquo;
              </p>

              <p>
                Soon after, she tried again through an app. By the fourth date she asked directly
                whether they were working toward something or just meeting casually.
              </p>

              <p>He said, &ldquo;Let&rsquo;s see how it goes.&rdquo;</p>

              <p>Later she told me quietly,</p>

              <p className="text-gray-600 italic pl-6 border-l-2 border-gray-200">
                &ldquo;I don&rsquo;t mind meeting people. I mind restarting the same emotional
                conversation again and again.&rdquo;
              </p>

              <p>
                That weekend her parents asked gently how things were going. She said &ldquo;fine&rdquo;
                and went to her room.
              </p>

              <p>
                They wanted to help, but didn&rsquo;t know how. She didn&rsquo;t know what help would
                even look like.
              </p>

              <p>The problem wasn&rsquo;t effort.</p>

              <p>
                It was not knowing early enough whether both people wanted the same outcome.
              </p>

              <h2>The Other Side of Silence</h2>

              <p>The doctor in San Francisco had a different difficulty.</p>

              <p>She wasn&rsquo;t avoiding marriage. She was avoiding the conversation around it.</p>

              <p>
                Every visit home carried an unspoken question. So she visited less often. Her parents
                stopped asking, but the silence didn&rsquo;t make the worry disappear.
              </p>

              <p>
                She told a friend she loved her parents &mdash; she just didn&rsquo;t want every visit
                to revolve around one life decision she hadn&rsquo;t emotionally scheduled yet.
              </p>

              <p>No argument ever happened.</p>

              <p>Still, distance slowly grew.</p>

              {/* Pull quote */}
              <figure className="my-10 md:my-14 py-8 px-6 md:px-10 bg-primary-50 rounded-2xl not-prose">
                <blockquote className="text-xl md:text-2xl font-display text-gray-800 leading-relaxed">
                  &ldquo;Parents become more careful when clarity would help. Children become more
                  independent when guidance might actually ease things.&rdquo;
                </blockquote>
              </figure>

              <h2>Why Families Feel Stuck</h2>

              <p>Parents notice time passing and feel they should help.</p>

              <p>Children feel repeated attention and step back to protect their space.</p>

              <p>
                Both reactions make sense, yet they move in opposite directions.
              </p>

              <p>
                Parents become more careful when clarity would help. Children become more independent
                when guidance might actually ease things.
              </p>

              <p>The result isn&rsquo;t freedom or support. It&rsquo;s tension without discussion.</p>

              <p>
                This is where many Indian families today find themselves &mdash; somewhere between
                dating apps and arranged meetings, between autonomy and reassurance.
              </p>

              <h2>What Actually Helps</h2>

              <p>Pressure rarely comes from a single question.</p>

              <p>It comes from uncertainty lasting too long.</p>

              <p>When expectations are clear early, conversations become calmer.</p>

              <p>When direction exists, families naturally step back.</p>

              <p>When commitment is possible, honesty becomes easier.</p>

              <p className="text-xl font-display font-semibold text-gray-900">
                Structure doesn&rsquo;t take away choice. It takes away guessing.
              </p>

              <h2>A Quiet Realization</h2>

              <p>
                Across different homes, the situations look different but the feeling underneath is
                similar.
              </p>

              <p>Parents want stability. Children want ownership.</p>

              <p>Both are trying to protect the same future.</p>

              <p>
                And both are tired of investing emotion without knowing where it leads.
              </p>

              <p>
                So what people are searching for today isn&rsquo;t more options. It&rsquo;s a healthier
                way to meet &mdash; one where intentions are understood early, conversations stay
                comfortable, and families don&rsquo;t have to choose between involvement and distance.
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
