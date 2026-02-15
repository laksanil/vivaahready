import Link from 'next/link'

export interface RelatedPage {
  href: string
  label: string
  description?: string
}

interface SeoInternalLinksProps {
  heading?: string
  links: RelatedPage[]
  columns?: 2 | 3 | 4
}

export function SeoInternalLinks({
  heading = 'Explore More',
  links,
  columns = 3,
}: SeoInternalLinksProps) {
  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <section className="py-12 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl font-bold text-gray-900 mb-6 text-center">
          {heading}
        </h2>
        <div className={`grid grid-cols-1 ${gridCols[columns]} gap-4`}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-colors"
            >
              <span className="font-medium text-gray-900">{link.label}</span>
              {link.description && (
                <span className="block mt-1 text-sm text-gray-500">{link.description}</span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
