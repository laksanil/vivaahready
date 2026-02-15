import { Shield, CheckCircle, Users, Heart } from 'lucide-react'
import { FaqSection, type FAQ } from './FaqSection'
import { SeoCta } from './SeoCta'
import { SeoInternalLinks, type RelatedPage } from './SeoInternalLinks'

interface ContentSection {
  heading?: string
  body: string
}

interface SeoPageLayoutProps {
  heroTitle: string
  heroHighlight?: string
  heroSubtitle: string
  contentSections: ContentSection[]
  faqs: FAQ[]
  relatedPages?: RelatedPage[]
  jsonLd: object
  ctaHeadline?: string
  ctaSubtext?: string
}

export function SeoPageLayout({
  heroTitle,
  heroHighlight,
  heroSubtitle,
  contentSections,
  faqs,
  relatedPages,
  jsonLd,
  ctaHeadline,
  ctaSubtext,
}: SeoPageLayoutProps) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-white via-silver-50 to-silver-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {heroHighlight ? (
                <>
                  {heroTitle.split(heroHighlight)[0]}
                  <span className="gradient-text">{heroHighlight}</span>
                  {heroTitle.split(heroHighlight)[1]}
                </>
              ) : (
                heroTitle
              )}
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">{heroSubtitle}</p>
            <SeoCta
              variant="hero"
              secondaryHref="/#how-it-works"
              secondaryLabel="How it Works"
            />
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-6 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-green-500 mr-1.5" />
            Free to start
          </div>
          <div className="flex items-center">
            <Shield className="h-4 w-4 text-green-500 mr-1.5" />
            Verified profiles
          </div>
          <div className="flex items-center">
            <Users className="h-4 w-4 text-green-500 mr-1.5" />
            Mutual matches only
          </div>
          <div className="flex items-center">
            <Heart className="h-4 w-4 text-green-500 mr-1.5" />
            Privacy-first
          </div>
        </div>
      </section>

      {/* Content Body */}
      <section className="py-12 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {contentSections.map((section, i) => (
            <div key={i} className={i > 0 ? 'mt-8' : ''}>
              {section.heading && (
                <h2 className="font-display text-2xl font-bold text-gray-900 mb-4">
                  {section.heading}
                </h2>
              )}
              <p className="text-gray-600 leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <FaqSection faqs={faqs} />

      {/* Internal Links */}
      {relatedPages && relatedPages.length > 0 && (
        <SeoInternalLinks links={relatedPages} />
      )}

      {/* Bottom CTA */}
      <SeoCta variant="bottom" headline={ctaHeadline} subtext={ctaSubtext} />
    </>
  )
}
