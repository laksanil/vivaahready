import type { MetadataRoute } from 'next'

const disallowedPaths = [
  '/api/',
  '/admin/',
  '/dashboard/',
  '/profile/',
  '/matches/',
  '/settings/',
  '/connections/',
  '/messages/',
  '/search/',
  '/reconsider/',
  '/verify',
  '/verify-email',
  '/feedback',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: disallowedPaths,
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: disallowedPaths,
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: disallowedPaths,
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: disallowedPaths,
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: disallowedPaths,
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: disallowedPaths,
      },
    ],
    sitemap: 'https://vivaahready.com/sitemap.xml',
  }
}
