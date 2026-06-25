# Performance Audit — Athora Web (apps/web)

**Date:** 2026-06-25  
**Auditor:** Performance Engineering  
**Stack:** Next.js 16, React 19, Tailwind CSS 4, Framer Motion 12

---

## Executive Summary

The landing page has **3 critical performance issues** that directly impact Core Web Vitals: unoptimized images (LCP), entire landing page as a client component (TBT/FCP), and no code-splitting of framer-motion (bundle size). Estimated LCP is **4–6s on 4G** due to 1.6MB uncompressed hero PNG served without `next/image`.

---

## 1. Font Loading Strategy

**Status: GOOD**

```tsx
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});
```

- `display: "swap"` prevents FOIT (Flash of Invisible Text)
- `next/font/google` auto-preloads and self-hosts — no Google Fonts render-blocking request
- Single font family (Inter) keeps font budget lean
- Subset limited to `latin` — correct for English-only product

**No action needed.**

---

## 2. Image Optimization

**Status: CRITICAL**

### Problems

| Issue | Impact |
|-------|--------|
| `next/image` is **never used** — 0 imports across the entire codebase | No automatic WebP/AVIF, no responsive `srcset`, no lazy loading |
| Hero image (`hero-product.png`) is **1.6 MB** raw PNG | Directly inflates LCP by 2–4s on mobile |
| Student gallery images are **1.9 MB** each, no `width`/`height` attributes | CLS risk + wasted bytes below the fold |
| All 29 images total **29 MB** in `/public/images/` | Cold-cache page weight is catastrophic |
| No images use modern formats (WebP/AVIF) | 40–70% size reduction left on the table |
| No `loading="lazy"` on below-fold images | All images load eagerly by default |

### Recommendations

1. **Replace all `<img>` tags with `next/image`** — this single change provides automatic:
   - WebP/AVIF conversion
   - Responsive `srcset` with `sizes` prop
   - Lazy loading (default for non-priority images)
   - Width/height enforcement (prevents CLS)
   - On-demand optimization via the Next.js image loader

2. **Mark hero image as `priority`:**
   ```tsx
   <Image
     src="/images/hero-product.png"
     alt="Athora AI workspace"
     width={800}
     height={600}
     priority
     sizes="(max-width: 768px) 100vw, 50vw"
   />
   ```

3. **Convert source images to WebP** as a build step — even with `next/image`, smaller source files reduce server CPU on first optimization.

4. **Add explicit `sizes` prop** to each `<Image>` to prevent Next.js from generating unnecessary large variants.

**Estimated LCP improvement: 2–4 seconds on mobile.**

---

## 3. Bundle Size Analysis

**Status: WARNING**

### Dependency Review

| Package | Gzipped Size | Notes |
|---------|-------------|-------|
| `framer-motion` | ~45 KB | Heavy; only `useInView` used on landing |
| `lucide-react` | Tree-shakes well | 10 files import — fine if bundler shakes |
| `@base-ui/react` | ~15 KB | Headless — acceptable |
| `shadcn` | Meta-package | Should only be a devDep (CLI tool) |
| `zustand` | ~2 KB | Excellent |
| `class-variance-authority` | ~2 KB | Fine |
| `tailwind-merge` | ~5 KB | Fine |
| `tw-animate-css` | ~1 KB | Fine |

### Issues

1. **`framer-motion` is imported in 11 files** but the landing page only uses `useInView`. The entire library (~150 KB uncompressed) ships to the client on first load because the landing is `'use client'`.

2. **`shadcn` is listed as a production dependency** — it's a CLI scaffolding tool and should be in `devDependencies`. It won't affect the runtime bundle (Next.js tree-shakes it), but it's a packaging hygiene issue.

### Recommendations

- Replace `useInView` from framer-motion with the native `IntersectionObserver` (5 lines of code) on the landing page, or dynamically import framer-motion only for pages that use `<motion.*>`.
- Move `shadcn` to `devDependencies`.

---

## 4. Code Splitting & Dynamic Imports

**Status: CRITICAL**

### Problems

- **Zero `dynamic()` or `next/dynamic` usage** anywhere in the codebase.
- The landing page (`landing-page.tsx`, 685 lines) is a **single `'use client'` component** — the entire thing ships as one JS chunk including framer-motion, all Lucide icons, and all UI components.
- The root `page.tsx` simply renders `<LandingPage />` — no server-side rendering benefit; the entire page hydrates client-side.

### Recommendations

1. **Split the landing page into Server + Client parts:**
   - Nav, Hero text, static sections → Server Components (zero JS)
   - Testimonial carousel, mobile menu toggle, CTA form → small Client Components

2. **Dynamically import heavy sections:**
   ```tsx
   const TestimonialsCarousel = dynamic(
     () => import('@/components/landing/testimonials-carousel'),
     { loading: () => <TestimonialsSkeleton /> }
   )
   ```

3. **Lazy-load framer-motion animations** below the fold:
   ```tsx
   const FadeUp = dynamic(() => import('./fade-up'), { ssr: false })
   ```

**Estimated FCP improvement: 30–50% faster (less JS to parse before first paint).**

---

## 5. CSS

**Status: GOOD**

- Tailwind CSS 4 with PostCSS — tree-shakes unused utilities at build time.
- `globals.css` is 209 lines of design tokens — no bloat.
- No external CSS files or render-blocking stylesheets.
- `tw-animate-css` adds minimal animation utilities.

**No action needed.**

---

## 6. Third-Party Scripts

**Status: GOOD**

- No external analytics, tracking, or third-party script tags detected.
- Google Fonts self-hosted via `next/font` — no external request.
- CSP configured to restrict script sources.

**No action needed.** When analytics are added, load them via `next/script` with `strategy="afterInteractive"` or `"lazyOnload"`.

---

## 7. Server Components vs Client Components

**Status: CRITICAL**

### Current State

The landing page (`/`) renders entirely client-side:
```
page.tsx (Server) → <LandingPage /> (Client — 'use client')
```

This means:
- ~685 lines of JSX are serialized as JavaScript, not HTML
- First paint is blocked until the JS bundle downloads and hydrates
- SEO crawlers that don't execute JS see nothing (though most modern crawlers do)

### Correct Architecture

```
page.tsx (Server)
├── <Nav />                  (Server — static HTML, zero JS)
├── <HeroSection />          (Server — static HTML, hero text)
│   └── <HeroImage />       (Server — next/image with priority)
├── <ProblemSection />       (Server — static)
├── <HowItWorks />          (Server — static)
├── <FeaturesGrid />        (Server — static)
├── <StatsSection />        (Server — static)
├── <TestimonialsCarousel /> (Client — scroll interaction)
├── <PricingSection />      (Server — static)
├── <StudentGallery />      (Server — static images)
├── <CtaSection />          (Client — form state)
└── <Footer />              (Server — static)
```

Only 2 out of ~10 sections actually need client interactivity.

---

## 8. Caching Headers

**Status: WARNING**

### Current

- Security headers are set for all routes (good).
- **No `Cache-Control` headers** configured for static assets or pages.
- No `s-maxage` or `stale-while-revalidate` directives anywhere.

### Recommendations

Add to `next.config.ts`:

```ts
async headers() {
  return [
    {
      source: "/(.*)",
      headers: securityHeaders,
    },
    {
      source: "/images/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
    {
      source: "/_next/static/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
  ];
},
```

Note: Next.js handles `/_next/static` caching automatically in production, but explicit headers help CDN/edge caching.

---

## 9. Largest Contentful Paint (LCP)

**Status: CRITICAL**

### LCP Element

The LCP element is **`/images/hero-product.png`** (1.6 MB PNG, unoptimized, no preload, no priority, no responsive sizing).

### Current Load Sequence (Mobile 4G)

1. HTML downloads (~5 KB) — fast
2. JS bundle downloads (~200+ KB) — blocks rendering since landing is `'use client'`
3. JS executes, React hydrates
4. Browser discovers `<img src="/images/hero-product.png">` (no preload hint)
5. Image downloads (1.6 MB over 4G ≈ 3–5s)
6. LCP fires — **estimated 5–7s total**

### Target Load Sequence

1. HTML downloads — contains `<img>` as static HTML (Server Component)
2. Browser sees `<link rel="preload">` for hero image (from `next/image priority`)
3. Image starts loading in parallel with JS
4. WebP version loads (~400 KB) — **LCP fires at ~2s**
5. JS hydrates interactive sections afterward

**Expected improvement: LCP from ~6s → ~2s on mobile.**

---

## 10. Cumulative Layout Shift (CLS)

**Status: WARNING**

### CLS Risks

| Element | Risk | Cause |
|---------|------|-------|
| Hero image | HIGH | No `width`/`height` — browser can't reserve space |
| Feature card images | MEDIUM | `aspect-[4/3]` class helps, but no intrinsic size |
| Student gallery images | HIGH | `aspect-[9/16]` helps, but raw `<img>` has no dimensions |
| Mobile menu toggle | LOW | Pushes content down when opened |

### Recommendations

- Using `next/image` with explicit `width`/`height` eliminates CLS for all images.
- The `aspect-*` Tailwind classes partially mitigate CLS but are not a substitute for intrinsic dimensions.
- For the mobile menu, use `position: fixed` or `absolute` overlay instead of pushing content.

---

## Priority Action Plan

| Priority | Fix | Impact | Effort |
|----------|-----|--------|--------|
| P0 | Replace `<img>` with `next/image` + priority on hero | LCP -3s, CLS -0.1 | 2h |
| P0 | Split landing page into Server/Client components | FCP -50%, TBT -60% | 4h |
| P1 | Dynamic import framer-motion (or replace `useInView`) | Bundle -45 KB | 1h |
| P1 | Add Cache-Control headers for static assets | Repeat visit speed | 15min |
| P2 | Convert images to WebP source files | Further LCP reduction | 1h |
| P2 | Move `shadcn` to devDependencies | Hygiene | 1min |
| P3 | Add `sizes` prop to all `<Image>` components | Bandwidth savings | 30min |

---

## Estimated Core Web Vitals After Fixes

| Metric | Current (est.) | After Fixes | Target |
|--------|---------------|-------------|--------|
| LCP | ~6s | ~2s | < 2.5s |
| FCP | ~3s | ~1.2s | < 1.5s |
| CLS | ~0.15 | ~0.02 | < 0.1 |
| TBT | ~400ms | ~120ms | < 200ms |
| INP | ~150ms | ~100ms | < 200ms |

---

## CSP Note

The current CSP includes `'unsafe-inline' 'unsafe-eval'` for `script-src`. This is a security concern but does not impact performance. When tightening CSP, use nonce-based scripts to avoid `'unsafe-inline'`.
