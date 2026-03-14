import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Stories, reflections, and insights on Indian matchmaking, family values, and building meaningful connections in the US diaspora.',
  openGraph: {
    title: 'Blog | VivaahReady',
    description:
      'Stories, reflections, and insights on Indian matchmaking, family values, and building meaningful connections in the US diaspora.',
    url: 'https://vivaahready.com/blog',
  },
  alternates: {
    canonical: 'https://vivaahready.com/blog',
  },
}

const posts = [
  {
    slug: 'safetyguideindianmatchmaking',
    title: 'How to Stay Safe on Indian Matchmaking Platforms',
    description:
      'Matrimonial cyber fraud surged 206% in 2025. A practical safety guide covering fake profiles, verification tricks, red flags, and how to protect yourself on Indian matchmaking platforms.',
    excerpt:
      'A woman I know got a message from a man claiming to be a cardiologist in London. His profile was polished. His photos looked professional. He wanted to talk about marriage within the first week. Something felt off, but she couldn\u2019t say exactly what.',
    date: '2026-03-12',
    dateFormatted: 'March 12, 2026',
    readTime: '12 min read',
    category: 'Safety',
    author: 'Lakshmi',
  },
  {
    slug: 'datingappburnoutindianamericans',
    title: 'Why Indian Americans Are Burned Out on Dating Apps',
    description:
      '78% of dating app users report emotional exhaustion. For Indian Americans, cultural gaps in matching algorithms make it worse. The data on why the swipe model is failing.',
    excerpt:
      'I\u2019ve lost count of how many times I\u2019ve heard this. A smart, accomplished Indian American professional sitting across from me at a coffee shop or on a video call, saying some version of the same thing: I\u2019m so tired of these apps.',
    date: '2026-03-12',
    dateFormatted: 'March 12, 2026',
    readTime: '12 min read',
    category: 'Perspectives',
    author: 'Lakshmi',
  },
  {
    slug: 'indianmatchmakingcostusa',
    title: 'What Does Indian Matchmaking Cost in the USA?',
    description:
      'Indian matchmaking costs range from $15/mo on apps to $300,000+ for luxury services. A full pricing breakdown of BharatMatrimony, Shaadi, Dil Mil, and private matchmakers.',
    excerpt:
      'Last month, a friend called me from Dallas. She\u2019d just gotten off the phone with a matchmaking service and was in mild shock. They wanted $5,000 for three months. Five thousand dollars. For introductions.',
    date: '2026-03-12',
    dateFormatted: 'March 12, 2026',
    readTime: '10 min read',
    category: 'Guide',
    author: 'Lakshmi',
  },
  {
    slug: 'how-indian-matchmaking-works-in-america-2026',
    title: 'How Indian Matchmaking Actually Works in America in 2026',
    description:
      'A clear, honest guide to how Indian matchmaking works in the USA today. From family-led searches to AI-powered platforms, here is what the process actually looks like for Indian Americans.',
    excerpt:
      'There is no single version of Indian matchmaking in America. There is no rulebook, no standard process, no instruction manual that families pass around. And yet, millions of Indian Americans navigate some version of it every year.',
    date: '2026-03-05',
    dateFormatted: 'March 5, 2026',
    readTime: '12 min read',
    category: 'Guide',
    author: 'Lakshmi',
  },
  {
    slug: 'what-indian-parents-should-know-about-matchmaking-usa',
    title: 'What Indian Parents Should Know About Modern Matchmaking in the US',
    description:
      'A practical guide for Indian parents in America navigating the matchmaking process for their children. How to help without overstepping, what has changed, and where to start.',
    excerpt:
      'I am a parent. I have been exactly where you are. Wanting to help. Not knowing how. Watching your child build a career, a life, a circle of friends \u2014 and wondering when the conversation about marriage will happen.',
    date: '2026-03-05',
    dateFormatted: 'March 5, 2026',
    readTime: '10 min read',
    category: 'Guide',
    author: 'Lakshmi',
  },
  {
    slug: 'indian-matchmaking-vs-dating-apps-honest-comparison',
    title: 'Indian Matchmaking vs Dating Apps: An Honest Comparison',
    description:
      'A side-by-side comparison of Indian matrimony platforms and dating apps for Indian Americans. Costs, family involvement, and what actually works for finding a life partner.',
    excerpt:
      'Every week, I hear some version of the same question from Indian Americans across the country: should I use a matrimony site or a dating app? The question sounds simple. The answer is not.',
    date: '2026-03-05',
    dateFormatted: 'March 5, 2026',
    readTime: '10 min read',
    category: 'Comparison',
    author: 'Lakshmi',
  },
  {
    slug: 'shame-of-looking-indian-american-matrimony',
    title: 'Nobody Talks About the Shame of Looking',
    description:
      'Why Indian Americans hide that they are searching for a life partner and what it costs them. An honest look at matrimony, shame, and finding clarity.',
    excerpt:
      'He is 34. An engineer at a well-known company in the Bay Area. He has not told his friends he created a profile on a matrimony site six months ago. He logs in late at night, scrolls through profiles, and closes the tab before bed.',
    date: '2026-03-04',
    dateFormatted: 'March 4, 2026',
    readTime: '10 min read',
    category: 'Perspectives',
    author: 'Lakshmi',
  },
  {
    slug: 'indian-american-marriage-arranged-dating-apps-middle-path-usa',
    title: 'Is There a Middle Path? How Indian Americans Are Rethinking Arranged Marriage, Dating Apps, and Finding a Life Partner in the USA',
    description:
      'Why Indian Americans feel stuck between arranged marriage and dating apps, and what a better, commitment-focused process looks like for families across the Bay Area, New York, Chicago, Dallas, Austin, and Houston.',
    excerpt:
      'If you are an Indian American professional, an NRI family settled in the US, or a parent quietly searching through every Indian matrimony site in the USA hoping to find the right match for your son or daughter, this is written for you.',
    date: '2026-02-19',
    dateFormatted: 'February 19, 2026',
    readTime: '12 min read',
    category: 'Perspectives',
    author: 'Lakshmi',
  },
  {
    slug: 'caught-between-dating-apps-and-arranged-marriage',
    title: 'Caught Between Dating Apps and Arranged Marriage: Why Indian Americans Feel Stuck',
    description:
      'Two families, two opposite situations \u2014 one daughter avoids the topic, another is actively trying but feels stuck. Why many Indian Americans feel trapped between dating apps and arranged marriage.',
    excerpt:
      'A close friend told me recently, \u201cI\u2019m afraid to bring it up when my daughter comes home.\u201d I asked what she meant. \u201cMarriage,\u201d she said. \u201cShe\u2019s 32 now. A doctor in San Francisco.\u201d',
    date: '2026-02-16',
    dateFormatted: 'February 16, 2026',
    readTime: '8 min read',
    category: 'Perspectives',
    author: 'Lakshmi',
  },
  {
    slug: 'indian-families-america-marriage-gap',
    title: 'Raising Indian Children in America: The Marriage Conversation We Didn\u2019t Have',
    description:
      'A founder\u2019s story about tradition, the Y2K IT wave, and the quiet marriage gap many Indian families in the USA face \u2014 and why VivaahReady began.',
    excerpt:
      'When my husband and I came to the United States during the Y2K years, we carried more than degrees and job offers. We carried our habits with us. We grew up in Hyderabad and Kurnool in homes where culture was not something you displayed \u2014 it was something you practiced.',
    date: '2026-02-14',
    dateFormatted: 'February 14, 2026',
    readTime: '6 min read',
    category: 'Founder\u2019s Story',
    author: 'Lakshmi',
  },
]

export default function BlogIndex() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-b from-gray-50 to-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="max-w-2xl">
            <p className="text-primary-600 font-semibold text-sm uppercase tracking-wider mb-3">
              VivaahReady Blog
            </p>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
              Stories &amp; Insights
            </h1>
            <p className="mt-4 text-lg text-gray-500 leading-relaxed">
              Reflections on Indian matchmaking, family values, and finding the right partner in
              America.
            </p>
          </div>
        </div>
      </section>

      {/* Posts */}
      <section className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-10">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block group"
              >
                <article className="bg-white border border-gray-200 rounded-2xl p-8 md:p-10 hover:border-primary-300 hover:shadow-xl transition-all duration-300">
                  {/* Category & Meta */}
                  <div className="flex flex-wrap items-center gap-3 mb-5">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary-600 text-white">
                      {post.category}
                    </span>
                    <span className="text-sm text-gray-400">{post.readTime}</span>
                    <span className="text-sm text-gray-300">&middot;</span>
                    <time dateTime={post.date} className="text-sm text-gray-400">
                      {post.dateFormatted}
                    </time>
                  </div>

                  {/* Title */}
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900 group-hover:text-primary-700 transition-colors leading-tight tracking-tight">
                    {post.title}
                  </h2>

                  {/* Description */}
                  <p className="mt-4 text-gray-600 leading-relaxed">
                    {post.description}
                  </p>

                  {/* Excerpt preview */}
                  <p className="mt-4 text-gray-500 leading-relaxed text-sm line-clamp-3 italic">
                    &ldquo;{post.excerpt}&rdquo;
                  </p>

                  {/* Footer */}
                  <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-between">
                    {/* Author */}
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary-600 flex items-center justify-center text-white font-display text-sm font-bold">
                        {post.author[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{post.author}</p>
                        <p className="text-xs text-gray-400">Founder, VivaahReady</p>
                      </div>
                    </div>

                    {/* Read link */}
                    <span className="inline-flex items-center gap-2 text-primary-600 font-semibold text-sm group-hover:gap-3 transition-all">
                      Read article
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-white mb-3">
              Looking for the Right Match?
            </h2>
            <p className="text-primary-100 mb-8 max-w-lg mx-auto leading-relaxed">
              VivaahReady is a private, verified space for Indian-origin families and professionals
              in the US to explore marriage thoughtfully.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-primary-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-lg"
            >
              Create Your Profile
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
