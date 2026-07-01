'use client'

import { useRef } from 'react'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { FadeUp } from './fade-up'

const TESTIMONIALS = [
  {
    quote: 'I uploaded my 82-page forensics manual and had flashcards, a mind map, and practice exam ready in under 2 minutes. This is insane.',
    name: 'Alex Chen',
    school: 'MIT',
    role: 'Computer Science, Senior',
  },
  {
    quote: 'The AI tutor actually understands my documents. I asked about a specific chapter and it cited the exact paragraph. Way better than ChatGPT.',
    name: 'Sarah Williams',
    school: 'Harvard',
    role: 'Pre-Law, Junior',
  },
  {
    quote: 'Mind maps from Athora helped me see connections between topics I never noticed. My essay structure improved dramatically.',
    name: 'James Thompson',
    school: 'Oxford',
    role: 'Philosophy, Sophomore',
  },
  {
    quote: 'I used to spend 3 hours making Anki cards. Now I upload my lecture PDF and get better flashcards in 30 seconds. 10/10.',
    name: 'Minh Tran',
    school: 'RMIT',
    role: 'IT Major, Freshman',
  },
  {
    quote: 'The practice exams predicted 6 out of 8 questions on my actual midterm. My study group all switched to Athora after that.',
    name: 'Emily Rodriguez',
    school: 'Stanford',
    role: 'Biology, Junior',
  },
  {
    quote: 'Upload a DOCX, get a full summary with key takeaways in seconds. Saved my life during finals week when I had 5 exams in 3 days.',
    name: 'David Park',
    school: 'UCLA',
    role: 'Economics, Senior',
  },
]

export function TestimonialsSection() {
  const scrollRef = useRef<HTMLDivElement>(null)

  function scrollTestimonials(direction: 'left' | 'right') {
    if (!scrollRef.current) return
    const amount = direction === 'left' ? -320 : 320
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' })
  }

  return (
    <section id="testimonials" className="px-6 py-20 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex items-end justify-between mb-10">
          <div>
            <FadeUp>
              <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[#8052ff] mb-3">What students say</p>
            </FadeUp>
            <FadeUp delay={0.05}>
              <h2 className="text-3xl font-extralight tracking-tight md:text-4xl text-white" style={{ letterSpacing: '-0.04em' }}>
                Voices from campus
              </h2>
            </FadeUp>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => scrollTestimonials('left')}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.1] text-[#9a9a9a] hover:border-[#8052ff]/50 hover:text-[#8052ff] transition-colors"
              aria-label="Scroll testimonials left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scrollTestimonials('right')}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.1] text-[#9a9a9a] hover:border-[#8052ff]/50 hover:text-[#8052ff] transition-colors"
              aria-label="Scroll testimonials right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="-mx-6 px-6">
          <div
            ref={scrollRef}
            role="list"
            aria-label="Student testimonials"
            className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
          >
            {TESTIMONIALS.map((t, i) => (
              <FadeUp key={t.name} delay={0.1 + i * 0.05}>
                <Card role="listitem" className="flex-shrink-0 w-[320px] md:w-[380px] snap-center border-white/[0.12] bg-white/[0.04] p-6 rounded-3xl hover:border-[#8052ff]/40 hover:bg-white/[0.07] transition-all duration-300 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex gap-0.5 mb-4">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className="h-3.5 w-3.5 text-[#ffb829] fill-[#ffb829]" />
                      ))}
                    </div>
                    <p className="text-base leading-relaxed text-[#bdbdbd] font-medium">&ldquo;{t.quote}&rdquo;</p>
                  </div>
                  <div className="mt-6 flex items-center gap-3 pt-4 border-t border-white/[0.06]">
                    <img
                      src={`https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(t.name)}&backgroundColor=8052ff`}
                      alt={t.name}
                      width={36}
                      height={36}
                      loading="lazy"
                      decoding="async"
                      className="h-9 w-9 rounded-full bg-[#8052ff]/10"
                    />
                    <div>
                      <p className="text-sm font-semibold text-white">{t.name}</p>
                      <p className="text-xs text-[#9a9a9a]">{t.role} &middot; {t.school}</p>
                    </div>
                  </div>
                </Card>
              </FadeUp>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
