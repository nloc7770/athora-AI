import Image from 'next/image'
import { FadeUp } from './fade-up'

const IMAGES = [
  { src: '/images/hero-student.png', alt: 'Student studying at night with laptop and notes illuminated by screen light' },
  { src: '/images/ai-learning.png', alt: 'Organized study desk flat lay with textbooks, highlighters, and laptop' },
  { src: '/images/study-group.png', alt: 'Students collaborating together in a university library' },
  { src: '/images/exam-success.png', alt: 'Student celebrating after a successful exam result' },
]

export function StudentsSection() {
  return (
    <section className="px-6 py-20 md:py-32">
      <div className="mx-auto max-w-[1200px]">
        <FadeUp>
          <p className="text-xs font-semibold uppercase tracking-[0.05em] text-[#8052ff] mb-3">Real students. Real results.</p>
          <h2
            className="text-3xl font-extralight tracking-tight md:text-5xl lg:text-6xl text-balance text-white"
            style={{ letterSpacing: '-0.04em' }}
          >
            Built for how you <span className="text-[#9a9a9a]">actually study</span>
          </h2>
          <p className="mt-4 text-white/60 max-w-lg text-[15px] leading-relaxed tracking-[0.025em]">
            Late nights, group sessions, messy desks, and breakthroughs. Athora fits the way you already work.
          </p>
        </FadeUp>

        <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
          {IMAGES.map((image, i) => (
            <FadeUp key={image.src} delay={0.08 + i * 0.06}>
              <div
                className={`group relative overflow-hidden rounded-3xl border border-white/[0.18] ${i === 1 ? 'sm:-translate-y-4' : ''} ${i === 2 ? 'sm:translate-y-4' : ''}`}
              >
                <div className="aspect-[9/16] overflow-hidden relative">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-40 group-hover:opacity-60 transition-opacity duration-300" />
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  )
}
