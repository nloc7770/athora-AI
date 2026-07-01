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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden relative">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[200] focus:top-4 focus:left-4 focus:bg-[#8052ff] focus:text-white focus:px-4 focus:py-2 focus:rounded-full">Skip to main content</a>
      <LandingStructuredData />

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
