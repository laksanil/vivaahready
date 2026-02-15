import type { Metadata } from 'next'
import Link from 'next/link'

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
  },
]

export default function BlogIndex() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-white via-silver-50 to-silver-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Blog
            </h1>
            <p className="text-lg text-gray-600">
              Stories and reflections on Indian matchmaking, family, and finding the right partner in
              America.
            </p>
          </div>
        </div>
      </section>

      {/* Posts */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="space-y-8">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="block group bg-white border border-gray-200 rounded-xl p-6 md:p-8 hover:border-primary-300 hover:shadow-md transition-all duration-200"
                >
                  <time dateTime={post.date} className="text-sm text-gray-500">
                    {post.dateFormatted}
                  </time>
                  <h2 className="mt-2 font-display text-xl md:text-2xl font-bold text-gray-900 group-hover:text-primary-700 transition-colors">
                    {post.title}
                  </h2>
                  <p className="mt-3 text-gray-600 leading-relaxed">{post.description}</p>
                  <span className="mt-4 inline-block text-primary-600 font-medium text-sm group-hover:underline">
                    Read more &rarr;
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
