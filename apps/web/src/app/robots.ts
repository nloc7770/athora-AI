import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard',
          '/settings',
          '/sessions',
          '/api/',
          '/auth',
          '/onboarding',
          '/paywall',
        ],
      },
    ],
    sitemap: 'https://athora.app/sitemap.xml',
  }
}
