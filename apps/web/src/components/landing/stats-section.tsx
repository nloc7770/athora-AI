import { FadeUp } from './fade-up'

const STATS = [
  { value: '2.4x', label: 'faster comprehension*' },
  { value: '89%', label: 'report higher grades*' },
  { value: '1M+', label: 'flashcards created' },
]

export function StatsSection() {
  return (
    <section className="px-6 py-14 md:py-20">
      <div className="mx-auto max-w-[1200px]">
        <div className="h-px bg-white/[0.12] mb-14" />
      </div>
      <div className="mx-auto max-w-[1200px] flex flex-col md:flex-row items-center justify-between gap-8">
        {STATS.map((stat, i) => (
          <FadeUp key={stat.label} delay={i * 0.08}>
            <div className="text-center md:text-left">
              <div className="text-4xl font-extralight tabular-nums md:text-5xl text-white" style={{ letterSpacing: '-0.04em' }}>{stat.value}</div>
              <p className="mt-1 text-sm text-white/50">{stat.label}</p>
            </div>
          </FadeUp>
        ))}
      </div>
      <p className="mx-auto max-w-[1200px] mt-4 text-xs text-white/30">*Based on early user surveys</p>
      <div className="mx-auto max-w-[1200px]">
        <div className="h-px bg-white/[0.12] mt-14" />
      </div>
    </section>
  )
}
