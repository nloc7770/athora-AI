'use client'

import { useState, useRef } from 'react'
import {
  Check,
  ArrowRight,
  BookOpen,
  AlarmClock,
  Star,
  Menu,
  X,
  Headphones,
  FileText,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

function FadeUp({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <div className={className}>
      {children}
    </div>
  )
}

const PAIN_STEPS = [
  { num: '01', label: 'Re-reading', detail: 'Retention drops to 20% after 24h of passive reading.', icon: FileText },
  { num: '02', label: 'Passive lectures', detail: 'Copying slides is transcription, not learning.', icon: Headphones },
  { num: '03', label: 'Cramming', detail: 'Last-minute panic overloads short-term memory.', icon: AlarmClock },
]

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
    quote: "I uploaded 6 weeks of lecture slides the night before my midterm. Got an A. This thing is unfair.",
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

const FREE_FEATURES = ['5 document uploads', 'Basic AI chat', '10 flashcard sets', 'Community support']
const PRO_FEATURES = ['Unlimited documents', 'Advanced AI chat & summaries', 'Unlimited flashcards & quizzes', 'Audio lessons', 'Progress tracking & analytics', 'Exam generation', 'Priority support']

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  function scrollTestimonials(direction: 'left' | 'right') {
    if (!scrollRef.current) return
    const amount = direction === 'left' ? -320 : 320
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 overflow-x-hidden relative">
      {/* Grain texture overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-[100] opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-stone-200/60 bg-stone-50/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-stone-900">Athora</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">Pricing</a>
            <a href="#testimonials" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">Reviews</a>
          </div>
          <div className="hidden items-center gap-4 md:flex">
            <a href="/login" className="text-sm text-stone-600 hover:text-stone-900 transition-colors font-medium">Log in</a>
            <Button size="sm" className="bg-amber-600 text-white hover:bg-amber-700 rounded-full px-5">
              Get Started <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="border-t border-stone-200/60 bg-stone-50 px-6 py-4 md:hidden">
            <div className="space-y-3">
              <a href="#features" className="block text-sm text-stone-700">Features</a>
              <a href="#pricing" className="block text-sm text-stone-700">Pricing</a>
              <div className="flex items-center gap-3 pt-2">
                <a href="/login" className="text-sm text-stone-600 font-medium">Log in</a>
                <Button size="sm" className="flex-1 bg-amber-600 text-white rounded-full">Get Started</Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative px-6 pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        {/* Subtle dot pattern background */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="absolute top-0 right-0 w-[60%] h-[80%] bg-gradient-to-bl from-amber-100/40 via-orange-50/20 to-transparent rounded-bl-[120px]" />

        <div className="relative mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:gap-20 items-start">
            <div className="pt-4 lg:pt-8">
              <FadeUp>
                <p className="text-sm font-medium text-amber-700 tracking-wide mb-5">
                  Helping 12,000+ students learn faster
                </p>
              </FadeUp>
              <FadeUp delay={0.05}>
                <h1
                  className="text-5xl font-bold leading-[0.95] md:text-7xl lg:text-[clamp(5rem,8vw,9rem)] text-stone-900"
                  style={{ letterSpacing: '-0.05em' }}
                >
                  Study less.<br />
                  <span className="text-stone-400">Remember</span>{' '}
                  <span className="relative inline-block text-amber-600">
                    everything.
                    <span className="absolute -bottom-2 left-0 right-0 h-3 bg-amber-200/60 -z-10 rounded-sm" />
                  </span>
                </h1>
              </FadeUp>
              <FadeUp delay={0.1}>
                <p className="mt-7 max-w-md text-lg text-stone-500 leading-relaxed">
                  Drop your lectures, textbooks, or notes. Ask anything. Get answers grounded in <span className="font-semibold text-stone-900">your</span> materials — not internet hallucinations.
                </p>
              </FadeUp>
              <FadeUp delay={0.15}>
                <div className="mt-9">
                  <Button size="lg" className="bg-amber-600 text-white h-13 px-8 text-base rounded-full hover:bg-amber-700 hover:scale-105 transition-all duration-300 shadow-lg shadow-amber-600/20">
                    Start free — no card needed <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </FadeUp>
            </div>

            {/* Right — Floating UI snippet */}
            <FadeUp delay={0.2}>
              <div className="relative lg:mt-6">
                <div className="rounded-3xl border border-stone-200 bg-white p-3 shadow-xl rotate-2 hover:rotate-0 transition-transform duration-500">
                  <img src="/images/hero-product.png" alt="Athora AI workspace" className="w-full rounded-2xl" />
                </div>
                <div
                  className="absolute -bottom-6 -left-6 rounded-xl border border-stone-200 bg-white p-3 shadow-lg max-w-[200px]"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-xs font-semibold text-stone-900">AI Generated</span>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-snug">12 flashcards created from Chapter 4: Cell Biology</p>
                </div>
                <div
                  className="absolute -top-4 -right-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 shadow-md"
                >
                  <p className="text-[11px] font-bold text-amber-700">+23% <span className="font-normal text-amber-600">this week</span></p>
                </div>
                <div
                  className="absolute top-1/2 -left-10 flex -space-x-2"
                >
                  {['bg-amber-500', 'bg-orange-400', 'bg-amber-700'].map((color, i) => (
                    <div key={i} className={`h-6 w-6 rounded-full ${color} ring-2 ring-white flex items-center justify-center`}>
                      <span className="text-[8px] font-bold text-white">{['S', 'M', 'E'][i]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-7xl px-6">
        <div className="h-px bg-stone-200/60" />
      </div>

      {/* Problem */}
      <section className="px-6 py-20 md:py-28 bg-stone-50">
        <div className="mx-auto max-w-5xl">
          <FadeUp>
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">The problem</p>
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl leading-[1.1] text-stone-900" style={{ letterSpacing: '-0.03em' }}>
              Traditional studying<br className="hidden md:block" /> is <span className="line-through decoration-red-400 decoration-2">broken</span>.
            </h2>
          </FadeUp>

          {/* Horizontal scroll on mobile, row on desktop */}
          <div className="mt-14 -mx-6 px-6 md:mx-0 md:px-0">
            <div className="flex gap-4 overflow-x-auto pb-4 md:pb-0 md:overflow-visible snap-x snap-mandatory md:snap-none scrollbar-hide relative">
              {/* Connecting line (desktop only) */}
              <div className="hidden md:block absolute top-8 left-8 right-8 h-px bg-stone-200 z-0" />

              {PAIN_STEPS.map((step, i) => (
                <FadeUp key={step.num} delay={i * 0.1}>
                  <div className="group relative flex-shrink-0 w-[280px] md:w-auto md:flex-1 snap-center bg-white border border-stone-200 rounded-2xl p-6 hover:border-amber-300 hover:shadow-md transition-all duration-300">
                    <div className="relative z-10 flex items-center gap-3 mb-4">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-700 ring-4 ring-white">{step.num}</span>
                      <step.icon className="h-4 w-4 text-stone-400 group-hover:text-amber-600 transition-colors" />
                    </div>
                    <p className="text-base font-semibold text-stone-900">{step.label}</p>
                    <p className="mt-2 text-sm text-stone-500 leading-relaxed">{step.detail}</p>
                  </div>
                </FadeUp>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it Works — 3 Steps */}
      <section className="px-6 py-24 md:py-32 bg-stone-50 border-y border-stone-200">
        <div className="mx-auto max-w-5xl">
          <FadeUp className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 mb-3">How it works</p>
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl" style={{ letterSpacing: '-0.03em' }}>
              3 steps to better grades
            </h2>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300" />

            {/* Step 1 */}
            <FadeUp className="text-center relative">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 text-xl font-bold border-2 border-amber-200 relative z-10">
                1
              </div>
              <h3 className="text-lg font-bold text-stone-900 mb-2">Upload your materials</h3>
              <p className="text-sm text-stone-500 leading-relaxed max-w-xs mx-auto">
                Drop PDFs, lecture slides, textbooks, or notes. Any format, any subject, any language.
              </p>
              <div className="mt-4 rounded-xl bg-white border border-stone-200 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-medium text-stone-700">Chapter_5_Biology.pdf</p>
                    <p className="text-xs text-stone-400">2.4 MB • Uploaded</p>
                  </div>
                  <Check className="h-4 w-4 text-green-500 ml-auto" />
                </div>
              </div>
            </FadeUp>

            {/* Step 2 */}
            <FadeUp delay={0.1} className="text-center relative">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 text-xl font-bold border-2 border-amber-200 relative z-10">
                2
              </div>
              <h3 className="text-lg font-bold text-stone-900 mb-2">AI reads & understands</h3>
              <p className="text-sm text-stone-500 leading-relaxed max-w-xs mx-auto">
                Athora parses, chunks, and indexes your content. Creates a personal knowledge base in seconds.
              </p>
              <div className="mt-4 rounded-xl bg-white border border-stone-200 p-4 shadow-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-400" />
                    <span className="text-xs text-stone-600">Summary generated</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-400" />
                    <span className="text-xs text-stone-600">24 flashcards created</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-400" />
                    <span className="text-xs text-stone-600">Exam questions ready</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-400" />
                    <span className="text-xs text-stone-600">Mind map built</span>
                  </div>
                </div>
              </div>
            </FadeUp>

            {/* Step 3 */}
            <FadeUp delay={0.2} className="text-center relative">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 text-xl font-bold border-2 border-amber-200 relative z-10">
                3
              </div>
              <h3 className="text-lg font-bold text-stone-900 mb-2">Study & ace your exam</h3>
              <p className="text-sm text-stone-500 leading-relaxed max-w-xs mx-auto">
                Chat with your docs, review flashcards, take practice exams. All grounded in YOUR materials.
              </p>
              <div className="mt-4 rounded-xl bg-white border border-stone-200 p-4 shadow-sm">
                <div className="space-y-2">
                  <div className="rounded-lg bg-amber-50 px-3 py-2">
                    <p className="text-xs font-medium text-stone-700">"Explain mitosis in simple terms"</p>
                  </div>
                  <div className="rounded-lg bg-stone-50 px-3 py-2">
                    <p className="text-xs text-stone-600">Based on your Chapter 5 notes: Mitosis is cell division in 4 phases...</p>
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* Features — Bento Grid */}
      <section id="features" className="px-6 py-24 md:py-32 bg-stone-900">
        <div className="mx-auto max-w-7xl">
          <FadeUp>
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-500 mb-3">Features</p>
            <h2
              className="text-3xl font-bold tracking-tight md:text-5xl lg:text-6xl text-balance text-white"
              style={{ letterSpacing: '-0.03em' }}
            >
              Everything you need to{' '}
              <span className="text-amber-400">study smarter.</span>
            </h2>
            <p className="mt-4 text-stone-400 max-w-lg text-base leading-relaxed">
              One platform. All your materials. AI that actually helps you learn — not just generates content.
            </p>
          </FadeUp>

          <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-12 md:auto-rows-[minmax(220px,auto)]">
            {/* Large card — Chat (spans 7 cols, 2 rows) */}
            <FadeUp delay={0.05} className="md:col-span-7 md:row-span-2">
              <Card className="border-stone-700/50 bg-stone-800 p-0 overflow-hidden group h-full">
                <div className="p-7 pb-0">
                  <span className="inline-block rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 mb-4">
                    Core
                  </span>
                  <h3 className="text-xl font-bold text-white mb-2">Chat with your documents</h3>
                  <p className="text-sm text-stone-400 leading-relaxed max-w-sm">
                    Upload any lecture, textbook, or notes. Ask questions and get cited answers from <span className="text-stone-200 font-medium">your</span> materials — never hallucinated.
                  </p>
                </div>
                <div className="mt-6 px-4">
                  <div className="overflow-hidden rounded-t-xl border border-b-0 border-stone-700/50">
                    <img src="/images/feature-chat.png" alt="Chat with documents" className="w-full" />
                  </div>
                </div>
              </Card>
            </FadeUp>

            {/* Flashcards card (spans 5 cols) */}
            <FadeUp delay={0.1} className="md:col-span-5">
              <Card className="border-stone-700/50 bg-stone-800 p-6 flex flex-col justify-between h-full">
                <div>
                  <span className="inline-block rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300 mb-4">
                    Popular
                  </span>
                  <h3 className="text-lg font-bold text-white mb-2">AI flashcards</h3>
                  <p className="text-sm text-stone-400 leading-relaxed">
                    One click turns any page into spaced-repetition flashcards. Review at the optimal time.
                  </p>
                </div>
                <div className="mt-5 rounded-lg border border-stone-700/50 overflow-hidden">
                  <img src="/images/feature-flashcards.png" alt="AI flashcards" className="w-full" />
                </div>
              </Card>
            </FadeUp>

            {/* Exam card (spans 5 cols) */}
            <FadeUp delay={0.15} className="md:col-span-5">
              <Card className="border-stone-700/50 bg-stone-800 p-6 flex flex-col justify-between h-full">
                <div>
                  <span className="inline-block rounded-full bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-400 mb-4">
                    New
                  </span>
                  <h3 className="text-lg font-bold text-white mb-2">Exam generator</h3>
                  <p className="text-sm text-stone-400 leading-relaxed">
                    Practice tests that mirror your exam format. AI zeroes in on your weak spots.
                  </p>
                </div>
                <div className="mt-5 rounded-lg border border-stone-700/50 overflow-hidden">
                  <img src="/images/feature-exam.png" alt="Exam generator" className="w-full" />
                </div>
              </Card>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-14 md:py-20 bg-stone-50">
        <div className="mx-auto max-w-7xl px-6">
          <div className="h-px bg-stone-200/60 mb-14" />
        </div>
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-8">
          {[
            { value: '2.4x', label: 'faster comprehension' },
            { value: '89%', label: 'report higher grades' },
            { value: '1M+', label: 'flashcards created' },
          ].map((stat, i) => (
            <FadeUp key={stat.label} delay={i * 0.08}>
              <div className="text-center md:text-left">
                <div className="text-4xl font-bold tracking-tight tabular-nums md:text-5xl text-stone-900">{stat.value}</div>
                <p className="mt-1 text-sm text-stone-500">{stat.label}</p>
              </div>
            </FadeUp>
          ))}
        </div>
        <div className="mx-auto max-w-7xl px-6">
          <div className="h-px bg-stone-200/60 mt-14" />
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="px-6 py-20 md:py-32 bg-white">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between mb-10">
            <div>
              <FadeUp>
                <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">What students say</p>
              </FadeUp>
              <FadeUp delay={0.05}>
                <h2 className="text-3xl font-bold tracking-tight md:text-4xl text-stone-900" style={{ letterSpacing: '-0.03em' }}>
                  Voices from campus
                </h2>
              </FadeUp>
            </div>
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
          </div>

          {/* Horizontal scroll carousel */}
          <div className="-mx-6 px-6">
            <div
              ref={scrollRef}
              className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
            >
              {TESTIMONIALS.map((t, i) => (
                <FadeUp key={t.name} delay={0.1 + i * 0.05}>
                  <Card className="flex-shrink-0 w-[320px] md:w-[380px] snap-center border-stone-200 bg-stone-50 p-6 rounded-2xl hover:border-amber-200 hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full">
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
                </FadeUp>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-24 md:py-32 bg-amber-50/30">
        <div className="mx-auto max-w-5xl">
          <FadeUp>
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">Pricing</p>
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl text-stone-900" style={{ letterSpacing: '-0.03em' }}>
              Start free. Upgrade when it clicks.
            </h2>
          </FadeUp>

          <div className="mt-14 grid gap-6 md:grid-cols-[1fr_1.4fr] items-start">
            {/* Free */}
            <FadeUp delay={0.05}>
              <Card className="border-stone-200 bg-white p-6 rounded-2xl">
                <h3 className="text-base font-semibold text-stone-500">Free</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-stone-900">$0</span>
                  <span className="text-sm text-stone-400">/mo</span>
                </div>
                <ul className="mt-5 space-y-2.5">
                  {FREE_FEATURES.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-stone-600">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-400" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full mt-6 h-10 rounded-lg border-stone-200 text-stone-900 hover:bg-stone-50">Get started</Button>
              </Card>
            </FadeUp>

            {/* Pro */}
            <FadeUp delay={0.1}>
              <Card className="relative border-2 border-amber-600 bg-white p-8 rounded-3xl overflow-hidden shadow-lg shadow-amber-100">
                <div className="absolute top-0 right-0">
                  <div className="bg-amber-600 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-bl-lg">
                    Recommended
                  </div>
                </div>
                <h3 className="text-lg font-bold text-stone-900">Pro</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-stone-900">$12</span>
                  <span className="text-sm text-stone-500">/month</span>
                </div>
                <p className="mt-1 text-xs text-amber-700 font-medium">$96/year — save 33%</p>
                <p className="mt-3 text-sm text-stone-500">For students who mean business.</p>
                <ul className="mt-6 space-y-2.5">
                  {PRO_FEATURES.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-stone-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-8 h-12 bg-amber-600 text-white border-0 rounded-full text-base hover:bg-amber-700 hover:scale-[1.02] transition-all duration-300 shadow-md shadow-amber-600/20">
                  Start 14-day free trial
                </Button>
              </Card>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* Student Gallery */}
      <section className="px-6 py-20 md:py-32 bg-stone-50">
        <div className="mx-auto max-w-7xl">
          <FadeUp>
            <p className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-3">Real students. Real results.</p>
            <h2
              className="text-3xl font-bold tracking-tight md:text-5xl lg:text-6xl text-balance text-stone-900"
              style={{ letterSpacing: '-0.03em' }}
            >
              Built for how you <span className="text-stone-400">actually study</span>
            </h2>
            <p className="mt-4 text-stone-500 max-w-lg text-base leading-relaxed">
              Late nights, group sessions, messy desks, and breakthroughs. Athora fits the way you already work.
            </p>
          </FadeUp>

          <div className="mt-14 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-4">
            {[
              { src: '/images/hero-student.png', alt: 'Student studying at night with laptop and notes illuminated by screen light' },
              { src: '/images/ai-learning.png', alt: 'Organized study desk flat lay with textbooks, highlighters, and laptop' },
              { src: '/images/study-group.png', alt: 'Students collaborating together in a university library' },
              { src: '/images/exam-success.png', alt: 'Student celebrating after a successful exam result' },
            ].map((image, i) => (
              <FadeUp key={image.src} delay={0.08 + i * 0.06}>
                <div
                  className={`group relative overflow-hidden rounded-2xl border border-stone-200 ${i === 1 ? 'sm:-translate-y-4' : ''} ${i === 2 ? 'sm:translate-y-4' : ''}`}
                >
                  <div className="aspect-[9/16] overflow-hidden">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent opacity-20 group-hover:opacity-40 transition-opacity duration-300" />
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative px-6 py-24 md:py-36 overflow-hidden bg-stone-900">
        {/* Warm gradient accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-amber-600/10 rounded-full blur-3xl" />
        <div className="relative mx-auto max-w-5xl">
          <FadeUp>
            <h2
              className="text-4xl font-bold tracking-tight text-white md:text-6xl lg:text-7xl leading-[0.95] text-balance"
              style={{ letterSpacing: '-0.04em' }}
            >
              Your next exam is closer<br className="hidden md:block" /> than you think.
            </h2>
          </FadeUp>
          <FadeUp delay={0.08}>
            <p className="mt-6 text-stone-400 text-lg max-w-md">
              30 seconds to set up. 14 days free. Join the students who stopped grinding and started learning.
            </p>
          </FadeUp>
          <FadeUp delay={0.12}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center max-w-md">
              <Input
                type="email"
                placeholder="you@university.edu"
                className="h-12 flex-1 border-stone-700 bg-stone-800 text-white placeholder:text-stone-500 focus-visible:ring-amber-500 rounded-xl"
              />
              <Button className="h-12 bg-amber-600 text-white px-6 font-semibold rounded-full whitespace-nowrap hover:bg-amber-700 hover:scale-105 transition-all shadow-lg shadow-amber-600/20">
                Get started
              </Button>
            </div>
            <p className="mt-3 text-xs text-stone-500">No credit card required</p>
          </FadeUp>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-stone-200/60 bg-stone-50">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-600">
                  <BookOpen className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="font-bold text-stone-900">Athora</span>
              </div>
              <p className="mt-3 text-sm text-stone-500">Made for students, by students.</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400">Product</h4>
              <ul className="mt-3 space-y-2">
                {['Features', 'Pricing', 'Changelog', 'Roadmap'].map((item) => (
                  <li key={item}><a href="#" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400">Company</h4>
              <ul className="mt-3 space-y-2">
                {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
                  <li key={item}><a href="#" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400">Legal</h4>
              <ul className="mt-3 space-y-2">
                {['Privacy', 'Terms', 'Security'].map((item) => (
                  <li key={item}><a href="#" className="text-sm text-stone-500 hover:text-stone-900 transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-stone-200/60 pt-6 text-center">
            <p className="text-xs text-stone-400">&copy; 2024 Athora. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
