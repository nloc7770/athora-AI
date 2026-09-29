import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { FadeUp } from './fade-up'

const FEATURES = [
  { img: '/images/feature-chat.png', badge: 'Core', badgeColor: 'bg-[#ff692d1f] text-[#ffab81]', title: 'AI Chat', desc: 'Ask questions, get cited answers from your materials.' },
  { img: '/images/feature-flashcards.png', badge: 'Popular', badgeColor: 'bg-[#ff692d1f] text-[#ffab81]', title: 'AI Flashcards', desc: 'Auto-generate spaced-repetition cards from any doc.' },
  { img: '/images/feature-exam.png', badge: 'New', badgeColor: 'bg-[#ff692d1f] text-[#ffab81]', title: 'Exam Generator', desc: 'Practice tests that target your weak spots.' },
  { img: '/images/feature-summary.png', badge: 'Auto', badgeColor: 'bg-[#3fdc9a]/10 text-[#3fdc9a]', title: 'Smart Summary', desc: 'Chapter breakdown with key takeaways.' },
  { img: '/images/feature-mindmap.png', badge: 'Visual', badgeColor: 'bg-[#f0c853]/10 text-[#f0c853]', title: 'Mind Map', desc: 'Visual concept maps from your content.' },
  { img: '/images/feature-tutor.png', badge: 'AI', badgeColor: 'bg-[#ff692d1f] text-[#ffab81]', title: 'AI Tutor', desc: 'Personal study companion that answers and quizzes you.' },
]

export function FeaturesSection() {
  return (
    <section id="features" className="px-6 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        <FadeUp>
          <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[#ff7a3c] mb-3">Features</p>
          <h2
            className="text-3xl font-extralight tracking-tight md:text-5xl lg:text-6xl text-balance text-[#f3f3fb]"
            style={{ letterSpacing: '-0.04em' }}
          >
            Everything you need to{' '}
            <span className="text-[#ff7a3c]">study smarter.</span>
          </h2>
          <p className="mt-4 text-[#9a9ab6] max-w-lg text-[15px] leading-relaxed tracking-[0.025em]">
            One platform. All your materials. AI that actually helps you learn — not just generates content.
          </p>
        </FadeUp>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <FadeUp key={i} delay={i * 0.05}>
              <Card className="border-[#ffffff14] bg-[#181822] p-0 overflow-hidden h-full hover:border-[#ff7a3c]/40 hover:bg-[#22222e] transition-all duration-300 group rounded-3xl">
                <div className="p-5 pb-3">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold mb-2.5 ${feature.badgeColor}`}>
                    {feature.badge}
                  </span>
                  <h3 className="text-sm font-semibold text-[#f3f3fb] mb-1">{feature.title}</h3>
                  <p className="text-xs text-[#9a9ab6] leading-relaxed">{feature.desc}</p>
                </div>
                <div className="aspect-[16/10] overflow-hidden border-t border-[#ffffff14] relative">
                  <Image src={feature.img} alt={feature.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover object-top group-hover:scale-105 transition duration-500" />
                </div>
              </Card>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  )
}
