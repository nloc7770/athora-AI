'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { Card } from '@/components/ui/card'

const TESTIMONIALS = [
  {
    quote: 'Athora turned my 200-page biology textbook into something I could actually learn from. My GPA went from 3.1 to 3.7 in one semester.',
    name: 'Sarah Chen',
    school: 'UC Berkeley',
    role: 'Pre-med, Junior',
  },
  {
    quote: 'The flashcard generation alone saved me 10+ hours per week. I used to spend entire evenings making Anki cards manually.',
    name: 'Marcus Johnson',
    school: 'Georgia Tech',
    role: 'CS Major, Senior',
  },
  {
    quote: "Being able to ask questions about my lecture recordings is a game-changer. It's like having office hours available 24/7.",
    name: 'Emily Rodriguez',
    school: 'NYU',
    role: 'Economics, Sophomore',
  },
  {
    quote: "Athora helped me build a consistent review habit. Spreading my study sessions across the semester made exams feel manageable instead of stressful.",
    name: 'David Park',
    school: 'UCLA',
    role: 'CS Major, Freshman',
  },
  {
    quote: "Finally something that actually works the way my brain does. The spaced repetition is chef's kiss.",
    name: 'Aisha Patel',
    school: 'Stanford',
    role: 'Neuroscience, Junior',
  },
]

export function TestimonialsCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null)

  function scrollTestimonials(direction: 'left' | 'right') {
    if (!scrollRef.current) return
    const amount = direction === 'left' ? -320 : 320
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' })
  }

  return (
    <>
      <div className="hidden md:flex items-center gap-2">
        <button
          onClick={() => scrollTestimonials('left')}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-stone-500 hover:border-amber-300 hover:text-amber-600 transition-colors"
          aria-label="Scroll testimonials left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => scrollTestimonials('right')}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-stone-500 hover:border-amber-300 hover:text-amber-600 transition-colors"
          aria-label="Scroll testimonials right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Horizontal scroll carousel */}
      <div className="-mx-6 px-6 mt-10">
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
        >
          {TESTIMONIALS.map((t) => (
            <Card key={t.name} className="flex-shrink-0 w-[320px] md:w-[380px] snap-center border-stone-200 bg-stone-50 p-6 rounded-2xl hover:border-amber-200 hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full">
              <div>
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-base leading-relaxed text-stone-700 font-medium">&ldquo;{t.quote}&rdquo;</p>
              </div>
              <div className="mt-6 flex items-center gap-3 pt-4 border-t border-stone-200/60">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                  {t.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-900">{t.name}</p>
                  <p className="text-xs text-stone-500">{t.role} &middot; {t.school}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </>
  )
}
