import { MetadataRoute } from 'next'
import { SEO_LOCATIONS } from '@/data/seo-locations'
import { SEO_LANGUAGES } from '@/data/seo-languages'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://vivaahready.com'

  // Static pages - ordered by SEO priority
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date('2026-03-09'),
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date('2026-02-01'),
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date('2026-02-01'),
    },
    {
      url: `${baseUrl}/aprilevent`,
      lastModified: new Date('2026-03-09'),
    },
    {
      url: `${baseUrl}/get-verified`,
      lastModified: new Date('2026-02-01'),
    },
    {
      url: `${baseUrl}/community`,
      lastModified: new Date('2026-03-01'),
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date('2026-02-01'),
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date('2026-01-01'),
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date('2026-01-01'),
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date('2026-02-01'),
    },
    {
      url: `${baseUrl}/feedback`,
      lastModified: new Date('2026-02-01'),
    },
  ]

  // Blog pages
  const blogPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date('2026-03-12'),
    },
    {
      url: `${baseUrl}/blog/indianmatchmakingcostusa`,
      lastModified: new Date('2026-03-12'),
    },
    {
      url: `${baseUrl}/blog/datingappburnoutindianamericans`,
      lastModified: new Date('2026-03-12'),
    },
    {
      url: `${baseUrl}/blog/safetyguideindianmatchmaking`,
      lastModified: new Date('2026-03-12'),
    },
    {
      url: `${baseUrl}/blog/how-indian-matchmaking-works-in-america-2026`,
      lastModified: new Date('2026-03-05'),
    },
    {
      url: `${baseUrl}/blog/what-indian-parents-should-know-about-matchmaking-usa`,
      lastModified: new Date('2026-03-05'),
    },
    {
      url: `${baseUrl}/blog/indian-matchmaking-vs-dating-apps-honest-comparison`,
      lastModified: new Date('2026-03-05'),
    },
    {
      url: `${baseUrl}/blog/shame-of-looking-indian-american-matrimony`,
      lastModified: new Date('2026-03-04'),
    },
    {
      url: `${baseUrl}/blog/caught-between-dating-apps-and-arranged-marriage`,
      lastModified: new Date('2026-02-16'),
    },
    {
      url: `${baseUrl}/blog/indian-families-america-marriage-gap`,
      lastModified: new Date('2026-02-14'),
    },
    {
      url: `${baseUrl}/blog/indian-american-marriage-arranged-dating-apps-middle-path-usa`,
      lastModified: new Date('2026-02-10'),
    },
  ]

  // SEO money pages
  const moneyPages: MetadataRoute.Sitemap = [
    '/indian-matchmaking-usa',
    '/indian-matrimony-usa',
    '/verified-indian-matrimony',
    '/privacy-first-matchmaking',
    '/nri-matrimony-usa',
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date('2026-02-15'),
  }))

  // SEO hub page
  const hubPage: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/indian-matchmaking`,
      lastModified: new Date('2026-02-15'),
    },
  ]

  // SEO location pages
  const locationPages: MetadataRoute.Sitemap = SEO_LOCATIONS.map((loc) => ({
    url: `${baseUrl}/indian-matchmaking-${loc.slug}`,
    lastModified: new Date('2026-02-15'),
  }))

  // SEO language pages
  const languagePages: MetadataRoute.Sitemap = SEO_LANGUAGES.map((lang) => ({
    url: `${baseUrl}/${lang.slug}-matrimony-usa`,
    lastModified: new Date('2026-02-15'),
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
