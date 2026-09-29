import { LandingStructuredData } from '@/components/seo/landing-structured-data'
import { HeaderNav } from './header-nav'
import { HeroSection } from './hero-section'
import { ProblemSection } from './problem-section'
import { HowItWorksSection } from './how-it-works-section'
import { FeaturesSection } from './features-section'
import { StatsSection } from './stats-section'
import { TestimonialsSection } from './testimonials-section'
import { PricingSection } from './pricing-section'
import { StudentsSection } from './students-section'
import { MobileAppSection } from './mobile-app-section'
import { CtaSection } from './cta-section'
import { FooterSection } from './footer-section'

/**
 * `nonce` comes from middleware's per-request CSP nonce (x-nonce) and is only
 * needed by LandingStructuredData, whose JsonLd children are inline <script>
 * tags. script-src is `'self' 'nonce-…'`, so without it the browser drops the
 * JSON-LD and the page ships no structured data at all — silently, since
 * nothing else on the page is an inline script.
 */
export default function LandingPage({ nonce }: { nonce?: string }) {
  return (
    <div className="landing-dark min-h-screen bg-[#0e0e16] text-[#f3f3fb] overflow-x-hidden relative">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[200] focus:top-4 focus:left-4 focus:bg-[#ff7a3c] focus:text-[#1a1400] focus:px-4 focus:py-2 focus:rounded-full">Skip to main content</a>
      <LandingStructuredData nonce={nonce} />

      <HeaderNav />

      <main id="main-content">
        <HeroSection />
        <ProblemSection />
        <HowItWorksSection />
        <FeaturesSection />
        <StatsSection />
        <TestimonialsSection />
        <PricingSection />
        <StudentsSection />
        <MobileAppSection />
        <CtaSection />
      </main>

      <FooterSection />
    </div>
  )
}
