import { FileText, Headphones, AlarmClock } from 'lucide-react'
import { FadeUp } from './fade-up'

const PAIN_STEPS = [
  { num: '01', label: 'Re-reading', detail: 'Retention drops to 20% after 24h of passive reading.', icon: FileText },
  { num: '02', label: 'Passive lectures', detail: 'Copying slides is transcription, not learning.', icon: Headphones },
  { num: '03', label: 'Cramming', detail: 'Last-minute panic overloads short-term memory.', icon: AlarmClock },
]

export function ProblemSection() {
  return (
    <section className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-[1200px]">
        <FadeUp>
          <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[#8052ff] mb-3">The problem</p>
          <h2 className="text-3xl font-extralight tracking-tight md:text-5xl leading-[1.1] text-white" style={{ letterSpacing: '-0.04em' }}>
            Traditional studying<br className="hidden md:block" /> is <span className="line-through decoration-[#8052ff] decoration-2">broken</span>.
          </h2>
        </FadeUp>

        <div className="mt-14 -mx-6 px-6 md:mx-0 md:px-0">
          <div className="flex gap-4 overflow-x-auto pb-4 md:pb-0 md:overflow-visible snap-x snap-mandatory md:snap-none scrollbar-hide relative">
            {/* Connecting line (desktop only) */}
            <div className="hidden md:block absolute top-8 left-8 right-8 h-px bg-white/[0.06] z-0" />

            {PAIN_STEPS.map((step, i) => (
              <FadeUp key={step.num} delay={i * 0.1}>
                <div className="group relative flex-shrink-0 w-[280px] md:w-auto md:flex-1 snap-center border border-white/[0.15] bg-white/[0.04] rounded-3xl p-6 hover:border-[#8052ff]/50 hover:bg-white/[0.07] transition-all duration-300">
                  <div className="relative z-10 flex items-center gap-3 mb-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#8052ff]/10 text-sm font-bold text-[#8052ff]">{step.num}</span>
                    <step.icon className="h-4 w-4 text-[#9a9a9a] group-hover:text-[#8052ff] transition-colors" />
                  </div>
                  <p className="text-base font-semibold text-white">{step.label}</p>
                  <p className="mt-2 text-sm text-[#9a9a9a] leading-relaxed">{step.detail}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
