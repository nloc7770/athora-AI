'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  MessageSquareText,
  BrainCircuit,
  ClipboardCheck,
  Check,
  ArrowRight,
  BookOpen,
  AlarmClock,
  Layers,
  Star,
  Menu,
  X,
  Headphones,
  FileText,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

function FadeUp({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      className={className}
    >
      {children}
    </motion.div>
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

  return (
    <div className="min-h-screen bg-white text-zinc-900 overflow-x-hidden">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-zinc-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Athora</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">Pricing</a>
            <a href="#testimonials" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">Reviews</a>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <Button variant="ghost" size="sm">Log in</Button>
            <Button size="sm" className="bg-zinc-900 text-white hover:bg-zinc-800">
              Start free <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="border-t border-zinc-100 bg-white px-6 py-4 md:hidden">
            <div className="space-y-3">
              <a href="#features" className="block text-sm">Features</a>
              <a href="#pricing" className="block text-sm">Pricing</a>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">Log in</Button>
                <Button size="sm" className="flex-1 bg-zinc-900 text-white">Start free</Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative px-6 pt-20 pb-12 md:pt-32 md:pb-20 lg:pt-40 lg:pb-28 bg-gradient-to-b from-amber-50/50 to-white">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 items-center">
            <div>
              <FadeUp>
                <p className="text-sm font-medium text-amber-600 tracking-wide mb-5">
                  Helping 12,000+ students learn faster
                </p>
              </FadeUp>
              <FadeUp delay={0.05}>
                <h1
                  className="text-5xl font-bold leading-[0.95] md:text-7xl lg:text-[clamp(5rem,8vw,9rem)] text-balance text-zinc-900"
                  style={{ letterSpacing: '-0.05em' }}
                >
                  Study less.<br />
                  <span className="text-zinc-400">Remember</span>{' '}
                  <span className="relative inline-block text-amber-600">
                    everything.
                    <span className="absolute -bottom-2 left-0 right-0 h-3 bg-amber-200/60 -z-10 rounded-sm" />
                  </span>
                </h1>
              </FadeUp>
              <FadeUp delay={0.1}>
                <p className="mt-7 max-w-md text-lg text-zinc-500 leading-relaxed">
                  Drop your lectures, textbooks, or notes. Ask anything. Get answers grounded in <span className="font-semibold text-zinc-900">your</span> materials — not internet hallucinations.
                </p>
              </FadeUp>
              <FadeUp delay={0.15}>
                <div className="mt-9">
                  <Button size="lg" className="bg-zinc-900 text-white h-13 px-8 text-base rounded-full hover:bg-zinc-800 hover:scale-105 transition-all duration-300">
                    Start free — no card needed <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </FadeUp>
            </div>

            {/* Right — Floating UI snippet */}
            <FadeUp delay={0.2}>
              <div className="relative">
                <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-3 shadow-xl rotate-1 hover:rotate-0 transition-transform duration-500">
                  <img src="/images/hero-product.png" alt="Athora AI workspace" className="w-full rounded-2xl" />
                </div>
                <motion.div
                  className="absolute -bottom-6 -left-6 rounded-xl border border-zinc-200 bg-white p-3 shadow-lg max-w-[200px]"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    <span className="text-xs font-semibold text-zinc-900">AI Generated</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 leading-snug">12 flashcards created from Chapter 4: Cell Biology</p>
                </motion.div>
                <motion.div
                  className="absolute -top-4 -right-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 shadow-md"
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                >
                  <p className="text-[11px] font-bold text-emerald-600">+23% <span className="font-normal text-emerald-500">this week</span></p>
                </motion.div>
                <motion.div
                  className="absolute top-1/2 -left-10 flex -space-x-2"
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                >
                  {['bg-indigo-500', 'bg-amber-500', 'bg-emerald-500'].map((color, i) => (
                    <div key={i} className={`h-6 w-6 rounded-full ${color} ring-2 ring-white flex items-center justify-center`}>
                      <span className="text-[8px] font-bold text-white">{['S', 'M', 'E'][i]}</span>
                    </div>
                  ))}
                </motion.div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-7xl px-6">
        <div className="h-px bg-zinc-100" />
      </div>

      {/* Problem */}
      <section className="px-6 py-20 md:py-28 bg-white">
        <div className="mx-auto max-w-5xl">
          <FadeUp>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">The problem</p>
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl leading-[1.1] text-zinc-900" style={{ letterSpacing: '-0.03em' }}>
              Traditional studying<br className="hidden md:block" /> is <span className="line-through decoration-red-400 decoration-2">broken</span>.
            </h2>
          </FadeUp>
          <div className="mt-14 space-y-0">
            {PAIN_STEPS.map((step, i) => (
              <FadeUp key={step.num} delay={i * 0.1}>
                <div className="group relative flex gap-6 py-6 border-b border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors -mx-4 px-4 rounded-lg">
                  <span className="text-2xl font-bold text-zinc-200 tabular-nums pt-0.5">{step.num}</span>
                  <div className="flex-1">
                    <p className="text-base font-semibold text-zinc-900">{step.label}</p>
                    <p className="mt-1 text-sm text-zinc-500">{step.detail}</p>
                  </div>
                  <step.icon className="h-5 w-5 text-zinc-300 group-hover:text-red-400 transition-colors mt-1" />
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Features — Bento Grid */}
      <section id="features" className="px-6 py-24 md:py-32 bg-zinc-950">
        <div className="mx-auto max-w-7xl">
          <FadeUp>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">How it works</p>
            <h2
              className="text-3xl font-bold tracking-tight md:text-5xl lg:text-6xl text-balance text-white"
              style={{ letterSpacing: '-0.03em' }}
            >
              Upload. Ask.{' '}
              <span className="text-amber-400">Master.</span>
            </h2>
            <p className="mt-4 text-zinc-400 max-w-lg text-base leading-relaxed">
              Drop in your lectures, notes, or textbooks. Athora does the rest — from understanding to exam-ready.
            </p>
          </FadeUp>

          <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-5 md:grid-rows-2">
            {/* Large card — Chat */}
            <FadeUp delay={0.05}>
              <Card className="md:col-span-3 md:row-span-2 border-zinc-800 bg-zinc-900 p-0 overflow-hidden group">
                <div className="p-7 pb-0">
                  <span className="inline-block rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400 mb-4">
                    Core
                  </span>
                  <h3 className="text-xl font-bold text-white mb-2">Chat with your documents</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed max-w-sm">
                    Upload any lecture, textbook, or notes. Ask questions and get cited answers from <span className="text-zinc-200 font-medium">your</span> materials — never hallucinated.
                  </p>
                </div>
                <div className="mt-6 px-4">
                  <div className="overflow-hidden rounded-t-xl border border-b-0 border-zinc-700/50">
                    <img src="/images/feature-chat.png" alt="Chat with documents" className="w-full" />
                  </div>
                </div>
              </Card>
            </FadeUp>

            {/* Flashcards card */}
            <FadeUp delay={0.1}>
              <Card className="md:col-span-2 border-zinc-800 bg-zinc-900 p-6 flex flex-col justify-between">
                <div>
                  <span className="inline-block rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-400 mb-4">
                    Popular
                  </span>
                  <h3 className="text-lg font-bold text-white mb-2">AI flashcards</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    One click turns any page into spaced-repetition flashcards. Review at the optimal time.
                  </p>
                </div>
                <div className="mt-5 rounded-lg border border-zinc-700/50 overflow-hidden">
                  <img src="/images/feature-flashcards.png" alt="AI flashcards" className="w-full" />
                </div>
              </Card>
            </FadeUp>

            {/* Exam card */}
            <FadeUp delay={0.15}>
              <Card className="md:col-span-2 border-zinc-800 bg-zinc-900 p-6 flex flex-col justify-between">
                <div>
                  <span className="inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 mb-4">
                    New
                  </span>
                  <h3 className="text-lg font-bold text-white mb-2">Exam generator</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    Practice tests that mirror your exam format. AI zeroes in on your weak spots.
                  </p>
                </div>
                <div className="mt-5 rounded-lg border border-zinc-700/50 overflow-hidden">
                  <img src="/images/feature-exam.png" alt="Exam generator" className="w-full" />
                </div>
              </Card>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-14 md:py-20 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="h-px bg-zinc-100 mb-14" />
        </div>
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-8">
          {[
            { value: '2.4x', label: 'faster comprehension' },
            { value: '89%', label: 'report higher grades' },
            { value: '1M+', label: 'flashcards created' },
          ].map((stat, i) => (
            <FadeUp key={stat.label} delay={i * 0.08}>
              <div className="text-center md:text-left">
                <div className="text-4xl font-bold tracking-tight tabular-nums md:text-5xl text-zinc-900">{stat.value}</div>
                <p className="mt-1 text-sm text-zinc-500">{stat.label}</p>
              </div>
            </FadeUp>
          ))}
        </div>
        <div className="mx-auto max-w-7xl px-6">
          <div className="h-px bg-zinc-100 mt-14" />
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="px-6 py-20 md:py-32 bg-white">
        <div className="mx-auto max-w-6xl">
          <FadeUp>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">What students say</p>
          </FadeUp>

          {/* Featured quote */}
          <FadeUp delay={0.05}>
            <blockquote className="mt-6 border-l-4 border-amber-500 pl-6 md:pl-10">
              <p className="text-2xl font-medium leading-snug text-zinc-900 md:text-3xl lg:text-4xl text-balance" style={{ letterSpacing: '-0.02em' }}>
                &ldquo;{TESTIMONIALS[0].quote}&rdquo;
              </p>
              <footer className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
                  {TESTIMONIALS[0].name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{TESTIMONIALS[0].name}</p>
                  <p className="text-xs text-zinc-500">{TESTIMONIALS[0].role} &middot; {TESTIMONIALS[0].school}</p>
                </div>
              </footer>
            </blockquote>
          </FadeUp>

          {/* Smaller quotes */}
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TESTIMONIALS.slice(1).map((t, i) => (
              <FadeUp key={t.name} delay={0.15 + i * 0.06}>
                <Card className="border-zinc-200 bg-white p-5 rounded-2xl hover:border-zinc-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className="h-3 w-3 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-[13px] leading-relaxed text-zinc-600">&ldquo;{t.quote}&rdquo;</p>
                  </div>
                  <div className="mt-4 flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-[9px] font-bold text-zinc-500">
                      {t.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-zinc-900">{t.name}</p>
                      <p className="text-[10px] text-zinc-400">{t.school}</p>
                    </div>
                  </div>
                </Card>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-24 md:py-32 bg-zinc-50">
        <div className="mx-auto max-w-5xl">
          <FadeUp>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">Pricing</p>
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl text-zinc-900" style={{ letterSpacing: '-0.03em' }}>
              Start free. Upgrade when it clicks.
            </h2>
          </FadeUp>

          <div className="mt-14 grid gap-6 md:grid-cols-[1fr_1.4fr] items-start">
            {/* Free */}
            <FadeUp delay={0.05}>
              <Card className="border-zinc-200 bg-white p-6 rounded-2xl">
                <h3 className="text-base font-semibold text-zinc-500">Free</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-zinc-900">$0</span>
                  <span className="text-sm text-zinc-400">/mo</span>
                </div>
                <ul className="mt-5 space-y-2.5">
                  {FREE_FEATURES.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-zinc-600">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button variant="outline" className="w-full mt-6 h-10 rounded-lg border-zinc-200 text-zinc-900 hover:bg-zinc-50">Get started</Button>
              </Card>
            </FadeUp>

            {/* Pro */}
            <FadeUp delay={0.1}>
              <Card className="relative border-2 border-zinc-900 bg-white p-8 rounded-3xl overflow-hidden">
                <div className="absolute top-0 right-0">
                  <div className="bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-bl-lg">
                    Recommended
                  </div>
                </div>
                <h3 className="text-lg font-bold text-zinc-900">Pro</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-zinc-900">$12</span>
                  <span className="text-sm text-zinc-500">/month</span>
                </div>
                <p className="mt-1 text-xs text-amber-600 font-medium">$96/year — save 33%</p>
                <p className="mt-3 text-sm text-zinc-500">For students who mean business.</p>
                <ul className="mt-6 space-y-2.5">
                  {PRO_FEATURES.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-zinc-600">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-8 h-12 bg-zinc-900 text-white border-0 rounded-xl text-base hover:bg-zinc-800 hover:scale-[1.02] transition-all duration-300">
                  Start 14-day free trial
                </Button>
              </Card>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* Student Gallery */}
      <section className="px-6 py-20 md:py-32 bg-white">
        <div className="mx-auto max-w-7xl">
          <FadeUp>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">Real students. Real results.</p>
            <h2
              className="text-3xl font-bold tracking-tight md:text-5xl lg:text-6xl text-balance text-zinc-900"
              style={{ letterSpacing: '-0.03em' }}
            >
              Built for how you <span className="text-zinc-400">actually study</span>
            </h2>
            <p className="mt-4 text-zinc-500 max-w-lg text-base leading-relaxed">
              Late nights, group sessions, messy desks, and breakthroughs. Athora fits the way you already work.
            </p>
          </FadeUp>

          <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { src: '/images/hero-student.png', alt: 'Student studying at night with laptop and notes illuminated by screen light' },
              { src: '/images/ai-learning.png', alt: 'Organized study desk flat lay with textbooks, highlighters, and laptop' },
              { src: '/images/study-group.png', alt: 'Students collaborating together in a university library' },
              { src: '/images/exam-success.png', alt: 'Student celebrating after a successful exam result' },
            ].map((image, i) => (
              <FadeUp key={image.src} delay={0.08 + i * 0.06}>
                <motion.div
                  className="group relative overflow-hidden rounded-2xl border border-zinc-200"
                  whileHover={{ scale: 1.02, y: -4 }}
                  transition={{ duration: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
                >
                  <div className="aspect-[9/16] overflow-hidden">
                    <img
                      src={image.src}
                      alt={image.alt}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-20 group-hover:opacity-40 transition-opacity duration-300" />
                </motion.div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative px-6 py-24 md:py-36 overflow-hidden bg-zinc-900">
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
            <p className="mt-6 text-zinc-400 text-lg max-w-md">
              30 seconds to set up. 14 days free. Join the students who stopped grinding and started learning.
            </p>
          </FadeUp>
          <FadeUp delay={0.12}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center max-w-md">
              <Input
                type="email"
                placeholder="you@university.edu"
                className="h-12 flex-1 border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500 focus-visible:ring-amber-500 rounded-xl"
              />
              <Button className="h-12 bg-white text-zinc-900 px-6 font-semibold rounded-xl whitespace-nowrap hover:bg-zinc-100 hover:scale-105 transition-all">
                Get started
              </Button>
            </div>
            <p className="mt-3 text-xs text-zinc-500">No credit card required</p>
          </FadeUp>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-zinc-100 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900">
                  <BookOpen className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="font-bold text-zinc-900">Athora</span>
              </div>
              <p className="mt-3 text-sm text-zinc-500">Made for students, by students.</p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Product</h4>
              <ul className="mt-3 space-y-2">
                {['Features', 'Pricing', 'Changelog', 'Roadmap'].map((item) => (
                  <li key={item}><a href="#" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Company</h4>
              <ul className="mt-3 space-y-2">
                {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
                  <li key={item}><a href="#" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Legal</h4>
              <ul className="mt-3 space-y-2">
                {['Privacy', 'Terms', 'Security'].map((item) => (
                  <li key={item}><a href="#" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-zinc-100 pt-6 text-center">
            <p className="text-xs text-zinc-400">&copy; 2024 Athora. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
