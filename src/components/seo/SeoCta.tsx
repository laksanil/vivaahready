import Link from 'next/link'

interface SeoCtaProps {
  variant: 'hero' | 'bottom'
  headline?: string
  subtext?: string
  primaryHref?: string
  primaryLabel?: string
  secondaryHref?: string
  secondaryLabel?: string
}

export function SeoCta({
  variant,
  headline = 'Ready to find your match?',
  subtext = 'Free to start. Verified, privacy-first matchmaking for serious relationships.',
  primaryHref = '/register',
  primaryLabel = 'Create Free Profile',
  secondaryHref,
  secondaryLabel,
}: SeoCtaProps) {
  if (variant === 'hero') {
    return (
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <Link
          href={primaryHref}
          className="bg-primary-600 text-white px-8 py-3.5 rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors text-center shadow-lg shadow-primary-600/20"
        >
          {primaryLabel}
        </Link>
        {secondaryHref && secondaryLabel && (
          <Link
            href={secondaryHref}
            className="border-2 border-gray-300 text-gray-700 px-8 py-3.5 rounded-lg font-semibold text-lg hover:border-gray-400 hover:bg-gray-50 transition-all text-center"
          >
            {secondaryLabel}
          </Link>
        )}
      </div>
    )
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {headline}
        </h2>
        <p className="text-lg text-gray-600 mb-8">{subtext}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={primaryHref}
            className="bg-primary-600 text-white px-8 py-3.5 rounded-lg font-semibold text-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20"
          >
            {primaryLabel}
          </Link>
          {secondaryHref && secondaryLabel && (
            <Link
              href={secondaryHref}
              className="border-2 border-gray-300 text-gray-700 px-8 py-3.5 rounded-lg font-semibold text-lg hover:border-gray-400 hover:bg-gray-50 transition-all text-center"
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
