'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Check,
  Shield,
  Sparkles,
  Zap,
  Crown,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

type PricingTier = 'weekly' | 'monthly' | 'yearly'

interface PlanFeature {
  text: string
  highlighted?: boolean
}

const PLANS: Record<PricingTier, { price: string; period: string; badge?: string; perMonth: string; features: PlanFeature[] }> = {
  weekly: {
    price: '$2.99',
    period: '/week',
    badge: 'Most Popular',
    perMonth: '~$12.99/mo',
    features: [
      { text: 'Unlimited document uploads' },
      { text: 'Unlimited AI flashcards & exams' },
      { text: 'AI tutor chat — unlimited' },
      { text: 'Smart summaries & mind maps' },
      { text: 'Priority processing', highlighted: true },
      { text: 'Cancel anytime' },
    ],
  },
  monthly: {
    price: '$9.99',
    period: '/month',
    perMonth: '$9.99/mo',
    features: [
      { text: 'Unlimited document uploads' },
      { text: 'Unlimited AI flashcards & exams' },
      { text: 'AI tutor chat — unlimited' },
      { text: 'Smart summaries & mind maps' },
      { text: 'Priority processing' },
      { text: 'Cancel anytime' },
    ],
  },
  yearly: {
    price: '$49.99',
    period: '/year',
    badge: 'Best Value',
    perMonth: '~$4.17/mo',
    features: [
      { text: 'Everything in weekly plan' },
      { text: 'Progress analytics dashboard', highlighted: true },
      { text: 'Study streak & gamification', highlighted: true },
      { text: 'Priority support' },
      { text: 'Save 68% vs weekly', highlighted: true },
      { text: 'Cancel anytime' },
    ],
  },
}

export default function PaywallPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<PricingTier>('weekly')
  const [timeLeft, setTimeLeft] = useState(15 * 60) // 15 minutes
  const [onboardingData, setOnboardingData] = useState<Record<string, string>>({})

  useEffect(() => {
    const stored = localStorage.getItem('athora-onboarding-data')
    if (stored) {
      try { setOnboardingData(JSON.parse(stored)) } catch { /* ignore */ }
    }
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  const handleSubscribe = () => {
    // TODO: integrate payment provider (Stripe/RevenueCat)
    // For now, redirect to dashboard with the plan selection stored
    localStorage.setItem('athora-selected-plan', selected)
    localStorage.setItem('athora-onboarded', 'true')
    const lastSession = localStorage.getItem('athora-last-session')
    router.push(lastSession ? `/sessions/${lastSession}` : '/dashboard')
  }

  const handleSkip = () => {
    localStorage.setItem('athora-onboarded', 'true')
    localStorage.setItem('athora-selected-plan', 'free')
    const lastSession = localStorage.getItem('athora-last-session')
    router.push(lastSession ? `/sessions/${lastSession}` : '/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-lg"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-1.5 mb-4">
              <Sparkles className="h-3.5 w-3.5 text-purple-600" />
              <span className="text-xs font-semibold text-purple-700">
                {onboardingData.subject ? `Plan ready for ${onboardingData.subject}` : 'Your plan is ready'}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-stone-900 tracking-tight">
              Unlock your full potential
            </h1>
            <p className="mt-2 text-stone-500">
              Students who use Athora daily score 32% higher on exams.
            </p>
          </div>

          {/* Urgency timer */}
          {timeLeft > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 rounded-xl bg-amber-50 border border-amber-200 p-3 text-center"
            >
              <p className="text-sm text-amber-800">
                🔥 Special offer expires in{' '}
                <span className="font-bold font-mono">
                  {minutes}:{seconds.toString().padStart(2, '0')}
                </span>
              </p>
            </motion.div>
          )}

          {/* Plan selector */}
          <div className="grid grid-cols-3 gap-2 mb-6 rounded-xl bg-stone-100 p-1.5">
            {(['weekly', 'monthly', 'yearly'] as PricingTier[]).map((tier) => (
              <button
                key={tier}
                onClick={() => setSelected(tier)}
                className={`relative rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  selected === tier
                    ? 'bg-white text-stone-900 shadow-sm'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                {PLANS[tier].badge && selected === tier && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-purple-600 px-2 py-0.5 text-[10px] font-bold text-white whitespace-nowrap">
                    {PLANS[tier].badge}
                  </span>
                )}
                <span className="capitalize">{tier}</span>
              </button>
            ))}
          </div>

          {/* Selected plan card */}
          <motion.div
            key={selected}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-2xl border-2 border-purple-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <span className="text-4xl font-bold text-stone-900">{PLANS[selected].price}</span>
                <span className="text-stone-500 ml-1">{PLANS[selected].period}</span>
              </div>
              <span className="text-sm text-stone-400">{PLANS[selected].perMonth}</span>
            </div>

            <ul className="space-y-3 mb-6">
              {PLANS[selected].features.map((feature) => (
                <li key={feature.text} className="flex items-start gap-3">
                  <Check className={`h-4 w-4 mt-0.5 shrink-0 ${feature.highlighted ? 'text-purple-600' : 'text-green-500'}`} />
                  <span className={`text-sm ${feature.highlighted ? 'font-medium text-stone-900' : 'text-stone-600'}`}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>

            <Button
              onClick={handleSubscribe}
              size="lg"
              className="w-full bg-purple-600 hover:bg-purple-700 text-base gap-2"
            >
              {selected === 'yearly' && <Crown className="h-4 w-4" />}
              {selected === 'weekly' && <Zap className="h-4 w-4" />}
              Start {selected} plan
              <ArrowRight className="h-4 w-4" />
            </Button>

            {/* Trust badges */}
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-stone-400">
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                7-day money back
              </span>
              <span>•</span>
              <span>Cancel anytime</span>
              <span>•</span>
              <span>Secure payment</span>
            </div>
          </motion.div>

          {/* Testimonial */}
          <div className="mt-6 rounded-xl bg-stone-50 border border-stone-200 p-4 text-center">
            <p className="text-sm text-stone-600 italic">
              &ldquo;Paid for itself after one exam. My GPA went from 2.8 to 3.5 in one semester.&rdquo;
            </p>
            <p className="mt-2 text-xs text-stone-400">— Alex R., University of Melbourne</p>
          </div>

          {/* Skip option */}
          <div className="mt-6 text-center">
            <button
              onClick={handleSkip}
              className="text-xs text-stone-400 hover:text-stone-500 underline-offset-2 hover:underline transition-colors"
            >
              Continue with limited free access (5 documents, 10 msgs/day)
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
