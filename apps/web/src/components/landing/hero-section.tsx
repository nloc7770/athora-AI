import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FadeUp } from './fade-up'
import { ParticleField } from './particle-field'

export function HeroSection() {
  return (
    <section className="relative px-6 pt-28 pb-16 md:pt-40 md:pb-24 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Particle constellation background */}
      <ParticleField />

      <div className="relative mx-auto max-w-[1200px]">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-16 items-center">
          <div>
            <FadeUp>
              <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[#8052ff] mb-5">
                Pass exams faster with AI
              </p>
            </FadeUp>
            <FadeUp delay={0.05}>
              <h1
                className="text-5xl font-extralight leading-[0.9] md:text-7xl lg:text-[clamp(5rem,8vw,7rem)] text-white"
                style={{ letterSpacing: '-0.04em' }}
              >
                Study less.<br />
                <span className="text-[#9a9a9a]">Remember</span>{' '}
                <span className="text-[#8052ff]">
                  everything.
                </span>
              </h1>
            </FadeUp>
            <FadeUp delay={0.1}>
              <p className="mt-7 max-w-md text-[15px] text-[#bdbdbd] leading-relaxed tracking-[0.025em]">
                Drop your lectures, textbooks, or notes. Get AI-generated flashcards, practice exams, and smart summaries in seconds — grounded in <span className="font-semibold text-white">your</span> materials.
              </p>
            </FadeUp>
            <FadeUp delay={0.15}>
              <div className="mt-9 flex items-center gap-4">
                <Link href="/register">
                  <Button className="bg-[#8052ff] text-white h-12 px-7 text-xs font-semibold uppercase tracking-[0.05em] rounded-full hover:bg-[#6b3fe6] transition-all duration-300">
                    Start free — no card needed <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </FadeUp>
          </div>

          {/* Right — Product visual */}
          <FadeUp delay={0.2}>
            <div className="relative hidden lg:block">
              <div className="rounded-3xl border border-white/[0.08] bg-white/[0.03] p-3 backdrop-blur-sm">
                <img src="/images/hero-product.png" alt="Athora AI workspace" width={800} height={600} className="w-full rounded-2xl opacity-90" />
              </div>
              {/* Floating card */}
              <div className="absolute -bottom-6 -left-6 rounded-2xl border border-white/[0.1] bg-black/80 backdrop-blur-md p-3.5 max-w-[200px]">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#8052ff]" />
                  <span className="text-xs font-semibold text-white tracking-[0.021em]">AI Generated</span>
                </div>
                <p className="text-[11px] text-[#9a9a9a] leading-snug">12 flashcards created from Chapter 4: Cell Biology</p>
              </div>
              <div className="absolute -top-4 -right-4 rounded-full border border-[#8052ff]/30 bg-black/80 backdrop-blur-md px-4 py-2">
                <p className="text-[11px] font-bold text-[#8052ff]">+23% <span className="font-normal text-[#bdbdbd]">this week</span></p>
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  )
}
