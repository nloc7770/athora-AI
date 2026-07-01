import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { FadeUp } from './fade-up'

export function PricingSection() {
  return (
    <section id="pricing" className="px-6 py-32 md:py-44 overflow-visible">
      <div className="mx-auto max-w-[1200px] overflow-visible">
        <FadeUp>
          <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[#8052ff] mb-3">Pricing</p>
          <h2 className="text-3xl font-extralight tracking-tight md:text-5xl text-white" style={{ letterSpacing: '-0.04em' }}>
            Start free. Upgrade when it clicks.
          </h2>
        </FadeUp>

        <div className="mt-20 md:mt-24 grid gap-5 md:grid-cols-3 md:gap-8 items-start">
          {/* Free */}
          <FadeUp delay={0.05}>
            <div className="border border-white/[0.15] bg-white/[0.05] p-8 md:p-10 rounded-3xl h-full">
              <h3 className="text-base font-semibold text-white/70">Free</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">$0</span>
                <span className="text-sm text-white/50">forever</span>
              </div>
              <p className="mt-3 text-sm text-white/60">Explore everything, no card needed.</p>
              <ul className="mt-8 space-y-4">
                {['10 document uploads', 'AI chat (10 messages/day)', 'Unlimited flashcard sets', 'Smart summaries', 'Community support'].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white/80">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-white/50" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block mt-10">
                <button className="w-full h-12 rounded-full border border-white/30 text-white text-sm font-medium hover:bg-white/10 hover:border-white/50 transition-all">
                  Start free
                </button>
              </Link>
            </div>
          </FadeUp>

          {/* Basic */}
          <FadeUp delay={0.1}>
            <div className="border border-white/[0.2] bg-white/[0.07] p-8 md:p-10 rounded-3xl h-full">
              <h3 className="text-base font-semibold text-white">Basic</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">$7</span>
                <span className="text-sm text-white/60">/mo</span>
              </div>
              <p className="mt-1.5 text-xs text-[#8052ff] font-semibold">$48/year — save 43%</p>
              <p className="mt-3 text-sm text-white/70">For regular study sessions.</p>
              <ul className="mt-8 space-y-4">
                {['50 document uploads', 'Unlimited AI chat', 'Unlimited flashcards & quizzes', 'Exam generation', 'Mind maps', 'Email support'].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white/90">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#8052ff]" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block mt-10">
                <button className="w-full h-12 rounded-full border border-[#8052ff]/60 text-[#8052ff] text-sm font-medium hover:bg-[#8052ff]/15 hover:border-[#8052ff] transition-all">
                  Get Basic
                </button>
              </Link>
            </div>
          </FadeUp>

          {/* Pro */}
          <FadeUp delay={0.15}>
            <div className="relative border border-[#8052ff]/70 bg-gradient-to-b from-[#8052ff]/[0.14] to-[#8052ff]/[0.05] p-8 md:p-10 rounded-3xl overflow-hidden h-full shadow-[0_0_50px_rgba(128,82,255,0.2)]">
              <div className="absolute top-0 right-0">
                <div className="bg-[#8052ff] text-white text-[10px] font-bold uppercase tracking-[0.08em] px-4 py-1.5 rounded-bl-2xl">
                  Most popular
                </div>
              </div>
              <h3 className="text-base font-semibold text-white">Pro</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">$15</span>
                <span className="text-sm text-white/60">/mo</span>
              </div>
              <p className="mt-1.5 text-xs text-[#8052ff] font-semibold">$108/year — save 40%</p>
              <p className="mt-3 text-sm text-white/70">For students who mean business.</p>
              <ul className="mt-8 space-y-4">
                {['Unlimited everything', 'AI Tutor (unlimited)', 'Priority processing', 'Exam simulations', 'Advanced analytics', 'Priority support'].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-white">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#8052ff]" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block mt-10">
                <button className="w-full h-12 rounded-full bg-[#8052ff] text-white text-sm font-semibold uppercase tracking-[0.05em] hover:bg-[#6b3fe6] transition-all shadow-[0_4px_20px_rgba(128,82,255,0.4)]">
                  Get Pro
                </button>
              </Link>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  )
}
