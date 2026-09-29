import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ParticleField } from './particle-field'

export function HeroSection() {
  return (
    <section className="relative px-6 pt-28 pb-16 md:pt-40 md:pb-24 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Particle constellation background */}
      <ParticleField />

      <div className="relative mx-auto max-w-[1200px]">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16 items-center">
          <div>
            <div className="landing-rise">
              <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[#ff7a3c] mb-5">
                Pass exams faster with AI
              </p>
            </div>
            <div className="landing-rise" style={{ animationDelay: '0.05s' }}>
              <h1
                className="text-5xl font-extralight leading-[0.9] md:text-7xl lg:text-[clamp(5rem,8vw,7rem)] text-[#f3f3fb]"
                style={{ letterSpacing: '-0.04em' }}
              >
                Study less.<br />
                <span className="text-[#9a9ab6]">Remember</span>{' '}
                <span className="text-[#ff7a3c]">
                  everything.
                </span>
              </h1>
            </div>
            <div className="landing-rise" style={{ animationDelay: '0.1s' }}>
              <p className="mt-7 max-w-md text-[15px] text-[#c0c0da] leading-relaxed tracking-[0.025em]">
                Drop your lectures, textbooks, or notes. Get AI-generated flashcards, practice exams, and smart summaries in seconds — grounded in <span className="font-semibold text-[#f3f3fb]">your</span> materials.
              </p>
            </div>
            <div className="landing-rise" style={{ animationDelay: '0.15s' }}>
              <div className="mt-9 flex items-center gap-4">
                <Link href="/register">
                  <Button className="bg-[#ff7a3c] text-[#1a1400] h-12 px-7 text-xs font-semibold uppercase tracking-[0.05em] rounded-full hover:bg-[#ff9256] transition-all duration-300">
                    Start free — no card needed <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Right — Product visual */}
          <div className="landing-rise" style={{ animationDelay: '0.2s' }}>
            <div className="relative hidden lg:block">
              <div className="rounded-3xl border border-[#ffffff14] bg-[#181822] p-3 backdrop-blur-sm">
                {/* next/image, not a raw <img>: this is the LCP element on the
                    landing page and the source PNG is ~700KB straight off a
                    retina screenshot. A raw tag ships that byte-for-byte to
                    every phone; next/image serves a width-appropriate,
                    re-encoded variant. `priority` because it is above the fold —
                    lazy-loading the LCP image delays it. */}
                <Image
                  src="/images/hero-product.png"
                  alt="Nrop-on AI workspace"
                  width={1440}
                  height={900}
                  sizes="(min-width: 1024px) 45vw, 100vw"
                  priority
                  className="h-auto w-full rounded-2xl opacity-90"
                />
              </div>
              {/* Floating card */}
              <div className="absolute -bottom-6 -left-6 rounded-2xl border border-[#ff7a3c]/50 bg-[#181822]/80 backdrop-blur-[10px] p-3.5 max-w-[200px]">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#ff7a3c]" />
                  <span className="text-xs font-semibold text-[#f3f3fb] tracking-[0.021em]">AI Generated</span>
                </div>
                <p className="text-[11px] text-[#9a9ab6] leading-snug">12 flashcards created from Chapter 4: Cell Biology</p>
              </div>
              <div className="absolute -top-4 -right-4 rounded-full border border-[#ff7a3c]/50 bg-[#181822]/80 backdrop-blur-[10px] px-4 py-2">
                <p className="text-[11px] font-bold text-[#ffab81]">+23% <span className="font-normal text-[#c0c0da]">this week</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
