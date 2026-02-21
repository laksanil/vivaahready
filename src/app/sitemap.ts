import { MetadataRoute } from 'next'
import { SEO_LOCATIONS } from '@/data/seo-locations'
import { SEO_LANGUAGES } from '@/data/seo-languages'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://vivaahready.com'

  // Static pages - ordered by SEO priority
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/community`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/marchevent`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // Blog pages (priority 0.8)
  const blogPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/caught-between-dating-apps-and-arranged-marriage`,
      lastModified: new Date('2026-02-16'),
      changeFrequency: 'yearly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/indian-families-america-marriage-gap`,
      lastModified: new Date('2026-02-14'),
      changeFrequency: 'yearly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog/indian-american-marriage-arranged-dating-apps-middle-path-usa`,
      lastModified: new Date('2026-02-19'),
      changeFrequency: 'yearly',
      priority: 0.8,
    },
  ]

  // SEO money pages (priority 0.85)
  const moneyPages: MetadataRoute.Sitemap = [
    '/indian-matchmaking-usa',
    '/indian-matrimony-usa',
    '/verified-indian-matrimony',
    '/privacy-first-matchmaking',
    '/nri-matrimony-usa',
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.85,
  }))

  // SEO hub page (priority 0.8)
  const hubPage: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/indian-matchmaking`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ]

  // SEO location pages (priority 0.7)
  const locationPages: MetadataRoute.Sitemap = SEO_LOCATIONS.map((loc) => ({
    url: `${baseUrl}/indian-matchmaking-${loc.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // SEO language pages (priority 0.7)
  const languagePages: MetadataRoute.Sitemap = SEO_LANGUAGES.map((lang) => ({
    url: `${baseUrl}/${lang.slug}-matrimony-usa`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [
    ...staticPages,
    ...blogPages,
    ...moneyPages,
    ...hubPage,
    ...locationPages,
    ...languagePages,
  ]
}
