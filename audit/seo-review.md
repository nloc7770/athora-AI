# Athora SEO Audit

**Date:** 2025-06-24  
**Auditor:** Senior SEO Specialist  
**Scope:** Landing page, root layout, next.config, static assets

---

## Executive Summary

Athora has a solid metadata foundation in the root layout but is missing several critical SEO assets (sitemap, robots.txt, structured data) and lacks per-page metadata for most routes. The landing page is a client component, which limits SSR-crawlable content without further configuration.

**Overall Score: 4/10** — Good security headers, basic OG tags present, but significant gaps.

---

## 1. Title Tags

| Issue | Severity | Detail |
|-------|----------|--------|
| Homepage title is generic | HIGH | Defaults to `"Athora"` with no keywords. Should be keyword-rich, e.g. "Athora — AI Study Assistant for Exam Prep, Flashcards & Quizzes" |
| Most pages have no metadata export | HIGH | Only `privacy/` and `terms/` export page-level metadata. Pages like `/login`, `/register`, `/dashboard`, `/flashcards`, `/exam`, `/tutor`, `/library`, `/sessions` inherit the default `"Athora"` title with no descriptive suffix. |

**Fix:**
```tsx
// apps/web/src/app/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Athora — AI Study Assistant | Flashcards, Quizzes & Exam Prep',
  description: 'Upload your lectures and textbooks. Get AI-generated flashcards, practice exams, and cited answers from your own materials. Start free.',
}
```

Add unique `metadata` exports to every public-facing page (login, register, flashcards, exam, tutor, library).

---

## 2. Meta Descriptions

| Issue | Severity | Detail |
|-------|----------|--------|
| Root description is acceptable but generic | MEDIUM | "AI-powered study assistant that helps students pass exams faster with flashcards, quizzes, and smart document processing." is 134 chars — within range but lacks differentiation and a CTA. |
| No per-page descriptions | HIGH | Most routes inherit the root description, diluting relevance signals for Google. |

**Fix:**
- Homepage: "Upload lectures & textbooks. Athora generates flashcards, practice exams, and cited answers from YOUR materials. Free to start — no card needed." (155 chars)
- Each feature page needs a unique description targeting its keyword cluster.

---

## 3. OpenGraph Tags

| Issue | Severity | Detail |
|-------|----------|--------|
| No `og:image` specified | CRITICAL | Without an OG image, social shares show blank previews. This kills click-through from Twitter/LinkedIn/Discord. |
| OG title matches page title (generic) | MEDIUM | Should be more engaging for social context. |
| No `og:url` set | LOW | Next.js can handle this via `metadataBase`, which is set, but explicitly declaring helps. |

**Fix:**
```tsx
openGraph: {
  title: 'Athora — Study Less, Remember Everything',
  description: 'AI study assistant that turns your lectures into flashcards, quizzes, and cited answers.',
  type: 'website',
  locale: 'en_US',
  siteName: 'Athora',
  images: [
    {
      url: '/og-image.png',  // Create a 1200x630 branded OG image
      width: 1200,
      height: 630,
      alt: 'Athora — AI-powered study assistant',
    },
  ],
},
```

---

## 4. Heading Hierarchy

| Issue | Severity | Detail |
|-------|----------|--------|
| H1 is present and strong | OK | `"Study less. Remember everything."` — good, compelling, keyword-adjacent. |
| Multiple H2s with logical sections | OK | Features, Pricing, How it works, Testimonials — all use H2. |
| H3 used for feature cards | OK | Proper hierarchy maintained. |
| No keyword in H1 | MEDIUM | H1 is brand-messaging focused. Consider adding a visually hidden keyword-rich H1 or adjusting to include "AI study" somewhere. |

**Verdict:** Hierarchy is clean. Minor keyword opportunity in H1.

---

## 5. Schema / Structured Data

| Issue | Severity | Detail |
|-------|----------|--------|
| No JSON-LD structured data anywhere | CRITICAL | No Organization, WebSite, SoftwareApplication, FAQ, or Review schema. This is a major missed opportunity for rich snippets. |

**Fix:** Add to root layout or homepage:
```tsx
// apps/web/src/app/page.tsx or a <Script> in layout
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Athora',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Web',
  offers: [
    { '@type': 'Offer', price: '0', priceCurrency: 'USD', name: 'Free' },
    { '@type': 'Offer', price: '12', priceCurrency: 'USD', name: 'Pro', billingPeriod: 'month' },
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '5',
    reviewCount: '5',
  },
}
```

Also add `FAQPage` schema for common questions and `Organization` schema for brand signals.

---

## 6. Sitemap

| Issue | Severity | Detail |
|-------|----------|--------|
| No sitemap.xml exists | CRITICAL | Neither a static file in `public/` nor a Next.js route handler (`app/sitemap.ts`). Search engines cannot discover all pages efficiently. |

**Fix:** Create `apps/web/src/app/sitemap.ts`:
```tsx
import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://athora.app'
  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]
}
```

---

## 7. Robots.txt

| Issue | Severity | Detail |
|-------|----------|--------|
| No robots.txt exists | CRITICAL | Without it, crawlers have no guidance. Authenticated pages (dashboard, settings, sessions) could be indexed, leaking URL structure. |

**Fix:** Create `apps/web/src/app/robots.ts`:
```tsx
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/settings', '/library', '/flashcards', '/exam', '/tutor', '/sessions', '/api/'],
      },
    ],
    sitemap: 'https://athora.app/sitemap.xml',
  }
}
```

---

## 8. Internal Linking

| Issue | Severity | Detail |
|-------|----------|--------|
| Footer links are minimal | MEDIUM | Only links to #features, #pricing, /privacy, /terms. No links to blog, help center, or feature-specific pages. |
| No breadcrumbs | LOW | App pages lack structured breadcrumbs for crawlability. |
| Anchor links (#features, #pricing) don't create separate indexable URLs | LOW | Fine for UX, but separate `/features` and `/pricing` pages would capture long-tail keywords. |

**Fix:**
- Add a blog/resources section (even placeholder) for content marketing SEO.
- Consider creating standalone `/features`, `/pricing` pages for dedicated keyword targeting.
- Add breadcrumb navigation on app pages.

---

## 9. Image Alt Texts

| Issue | Severity | Detail |
|-------|----------|--------|
| Hero image alt is generic | MEDIUM | `"Athora AI workspace"` — could be more descriptive for accessibility and SEO: "Athora AI study workspace showing document chat and flashcard generation" |
| Feature card alts use only the feature title | MEDIUM | `"Document Chat"`, `"AI Flashcards"`, etc. — not descriptive enough. Should describe what's visually shown. |
| Student gallery alts are good | OK | Descriptive and contextual. |
| Images use `<img>` not Next.js `<Image>` | HIGH | Missing automatic optimization, lazy loading, width/height, srcset, and AVIF/WebP conversion. Hurts LCP and CLS. |

**Fix:**
- Replace `<img>` tags with `next/image` `<Image>` component for all static images.
- Improve alt texts to be descriptive sentences.

---

## 10. URL Structure

| Issue | Severity | Detail |
|-------|----------|--------|
| URLs are clean and semantic | OK | `/login`, `/register`, `/flashcards`, `/exam`, `/privacy`, `/terms` — all good. |
| Dynamic route `/sessions/[id]` is fine | OK | Standard pattern. |
| No trailing slashes (Next.js default) | OK | Consistent. |

**Verdict:** URL structure is solid. No issues.

---

## 11. Core Web Vitals Hints

| Issue | Severity | Detail |
|-------|----------|--------|
| Font loading is optimized | OK | Using `next/font/google` with `display: "swap"` and CSS variable injection. Good. |
| Landing page is `'use client'` | HIGH | The entire landing page renders client-side. While Next.js still SSRs it, all interactivity ships in the JS bundle. Consider splitting into a server component wrapper with client islands for interactive parts (testimonial scroll, mobile menu). |
| No image preloading for LCP | HIGH | Hero image `/images/hero-product.png` has no `priority` or `fetchpriority="high"`. It's also a raw `<img>`, missing Next.js optimizations. |
| No `<link rel="preload">` for hero assets | MEDIUM | Critical hero image should be preloaded in `<head>`. |
| Framer Motion dependency | MEDIUM | `useInView` from framer-motion adds JS weight. For simple fade-up animations, CSS `@starting-style` or IntersectionObserver would be lighter. |

**Fix:**
```tsx
// For hero image — switch to next/image
import Image from 'next/image'

<Image
  src="/images/hero-product.png"
  alt="Athora AI study workspace showing document chat and AI-generated flashcards"
  width={800}
  height={600}
  priority
  className="w-full rounded-2xl"
/>
```

---

## Priority Action Items

| Priority | Action | Impact |
|----------|--------|--------|
| 1 | Create `robots.ts` route handler | Prevents indexing of authenticated pages |
| 2 | Create `sitemap.ts` route handler | Enables full crawl discovery |
| 3 | Add OG image (1200x630) | Fixes broken social sharing previews |
| 4 | Add JSON-LD structured data | Enables rich snippets in SERPs |
| 5 | Add per-page metadata to all public routes | Unique titles/descriptions for each page |
| 6 | Replace `<img>` with `next/image` | LCP improvement, CLS prevention, auto-optimization |
| 7 | Create standalone /features and /pricing pages | Long-tail keyword capture |
| 8 | Add blog/content section | Organic traffic growth channel |
| 9 | Improve homepage title with keywords | Better SERP click-through rate |
| 10 | Split landing page into server/client components | Reduce JS bundle, improve TTI |

---

## Keyword Opportunities (Not Currently Targeted)

Based on the product offering, these high-intent keywords have no dedicated pages:
- "AI flashcard generator"
- "AI study assistant"
- "AI exam prep"
- "upload PDF study tool"
- "AI quiz generator from notes"
- "spaced repetition app for students"

Each should have a dedicated landing page or blog post targeting it.
