import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BookOpen, Clock } from 'lucide-react'

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
    slug: 'indian-families-america-marriage-gap',
    title: 'Raising Indian Children in America: The Marriage Conversation We Didn\u2019t Have',
    description:
      'A founder\u2019s story about tradition, the Y2K IT wave, and the quiet marriage gap many Indian families in the USA face \u2014 and why VivaahReady began.',
    date: '2026-02-14',
    dateFormatted: 'February 14, 2026',
    readTime: '6 min read',
    category: 'Founder\u2019s Story',
  },
]

export default function BlogIndex() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-white via-silver-50 to-silver-100 py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-primary-600" />
              <span className="text-primary-600 font-medium text-sm uppercase tracking-wider">
                VivaahReady Blog
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Stories & Insights
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Reflections on Indian matchmaking, family values, and finding the right partner in
              America.
            </p>
          </div>
        </div>
      </section>

      {/* Posts */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block group"
              >
                <article className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 hover:border-primary-300 hover:shadow-lg transition-all duration-300">
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                      {post.category}
                    </span>
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-xs">{post.readTime}</span>
                    </div>
                  </div>

                  <h2 className="font-display text-xl md:text-2xl font-bold text-gray-900 group-hover:text-primary-700 transition-colors leading-snug">
                    {post.title}
                  </h2>

                  <p className="mt-3 text-gray-600 leading-relaxed">
                    {post.description}
                  </p>

                  <div className="mt-5 flex items-center justify-between">
                    <time dateTime={post.date} className="text-sm text-gray-400">
                      {post.dateFormatted}
                    </time>
                    <span className="inline-flex items-center gap-1.5 text-primary-600 font-medium text-sm group-hover:gap-2.5 transition-all">
                      Read article
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </article>
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-2xl p-8 md:p-10 text-center">
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-3">
              Looking for the Right Match?
            </h2>
            <p className="text-gray-600 mb-6 max-w-lg mx-auto">
              VivaahReady is a private, verified space for Indian-origin families and professionals
              in the US to explore marriage thoughtfully.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Create your profile
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
