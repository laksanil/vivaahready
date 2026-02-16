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
