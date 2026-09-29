import Link from 'next/link'
import { Check } from 'lucide-react'
import { FadeUp } from './fade-up'

/**
 * Everything is free right now, so this section states that plainly instead of
 * showing tiers.
 *
 * It used to render Free / Basic / Paid columns. Keeping a priced grid while
 * nothing is actually charged for is the worst of both: it suppresses sign-ups
 * that would have happened, and it makes the first paid bill feel like a
 * bait-and-switch. A single card with the full feature list and one CTA says the
 * true thing in less space.
 *
 * The `id="pricing"` anchor stays — the header and footer both link to #pricing,
 * and those links are what the nav's "Pricing" item scrolls to.
 */

// One list, not a tier split: with nothing gated, a second column would have to
// invent a distinction that does not exist.
const INCLUDED = [
  'Unlimited document uploads',
  'Unlimited AI chat',
  'Flashcards, quizzes and mind maps',
  'Practice exam generation',
  'Smart summaries',
  'AI Tutor',
  'Progress analytics',
]

export function PricingSection() {
  return (
    <section id="pricing" className="px-6 py-32 md:py-44">
      <div className="mx-auto max-w-[1200px]">
        <FadeUp>
          <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[#ff7a3c] mb-3">
            Pricing
          </p>
          <h2
            className="text-3xl font-extralight tracking-tight md:text-5xl text-[#f3f3fb]"
            style={{ letterSpacing: '-0.04em' }}
          >
            Free while we&apos;re building.
          </h2>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed tracking-[0.025em] text-[#9a9ab6]">
            Every feature is available to every student, at no cost. No card, no
            trial timer, no locked tabs.
          </p>
        </FadeUp>

        <FadeUp delay={0.08}>
          {/* Centred single card. max-w keeps the measure readable — a feature
              list stretched across 1200px is hard to scan. */}
          <div className="mt-16 md:mt-20 mx-auto max-w-2xl">
            <div className="relative overflow-hidden rounded-3xl border border-[#ff7a3c]/70 bg-gradient-to-b from-[#ff7a3c]/[0.14] to-[#ff7a3c]/[0.05] p-8 md:p-12 shadow-[0_0_50px_rgba(255,122,60,0.2)]">
              <div className="absolute top-0 right-0">
                <div className="rounded-bl-2xl bg-[#ff7a3c] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#1a1400]">
                  Everything included
                </div>
              </div>

              <h3 className="text-base font-semibold text-[#f3f3fb]">Nrop-on</h3>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-5xl font-bold text-[#f3f3fb]">Free</span>
                <span className="text-sm text-[#9a9ab6]">for now</span>
              </div>
              <p className="mt-3 text-sm text-[#9a9ab6]">
                We&apos;ll give plenty of notice before anything changes, and
                you&apos;ll keep what you&apos;ve made.
              </p>

              <ul className="mt-10 grid gap-4 sm:grid-cols-2">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[#f3f3fb]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#ffab81]" />
                    {item}
                  </li>
                ))}
              </ul>

              <Link href="/register" className="mt-10 block">
                <button className="h-12 w-full rounded-full bg-[#ff7a3c] text-sm font-semibold uppercase tracking-[0.05em] text-[#1a1400] shadow-[0_4px_20px_rgba(255,122,60,0.4)] transition-all hover:bg-[#ff9256]">
                  Start studying — it&apos;s free
                </button>
              </Link>
              <p className="mt-4 text-center text-xs text-[#9a9ab6]">
                No credit card required.
              </p>
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  )
}
