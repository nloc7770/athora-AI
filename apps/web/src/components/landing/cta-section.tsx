'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FadeUp } from './fade-up'

export function CtaSection() {
  const [ctaEmail, setCtaEmail] = useState('')

  return (
    <section className="relative px-6 py-24 md:py-36 overflow-hidden">
      {/* Glow accent */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#8052ff]/15 rounded-full blur-[120px]" />
      <div className="relative mx-auto max-w-[1200px]">
        <FadeUp>
          <h2
            className="text-4xl font-extralight tracking-tight text-white md:text-6xl lg:text-7xl leading-[0.9] text-balance"
            style={{ letterSpacing: '-0.04em' }}
          >
            Your next exam is closer<br className="hidden md:block" /> than you think.
          </h2>
        </FadeUp>
        <FadeUp delay={0.08}>
          <p className="mt-6 text-white/60 text-lg max-w-md tracking-[0.025em]">
            30 seconds to set up. 14 days free. Join the students who stopped grinding and started learning.
          </p>
        </FadeUp>
        <FadeUp delay={0.12}>
          <form
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center max-w-md"
            action="/register"
            method="GET"
          >
            <Input
              type="email"
              name="email"
              placeholder="you@university.edu"
              value={ctaEmail}
              onChange={(e) => setCtaEmail(e.target.value)}
              aria-label="Email address"
              className="h-12 flex-1 border-white/[0.2] bg-white/[0.06] text-white placeholder:text-white/40 focus-visible:ring-[#8052ff] rounded-full px-5"
            />
            <Button type="submit" className="h-12 bg-[#8052ff] text-white px-7 font-semibold text-xs uppercase tracking-[0.05em] rounded-full whitespace-nowrap hover:bg-[#6b3fe6] transition-all shadow-[0_4px_20px_rgba(128,82,255,0.4)]">
              Get started
            </Button>
          </form>
          <p className="mt-3 text-xs text-white/30">No credit card required</p>
        </FadeUp>
      </div>
    </section>
  )
}
