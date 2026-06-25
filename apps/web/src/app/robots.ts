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
          '/library',
          '/flashcards',
          '/exam',
          '/tutor',
          '/sessions',
          '/api/',
        ],
      },
    ],
    sitemap: 'https://athora.app/sitemap.xml',
  }
}
