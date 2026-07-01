import posthog from 'posthog-js'

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? ''
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'

export function initPostHog(): void {
  if (typeof window === 'undefined' || !POSTHOG_KEY) return

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    person_profiles: 'identified_only',
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false,
    persistence: 'localStorage+cookie',
  })
}

export function identifyUser(userId: string, properties?: Record<string, unknown>): void {
  if (!POSTHOG_KEY) return
  posthog.identify(userId, properties)
}

export function resetUser(): void {
  if (!POSTHOG_KEY) return
  posthog.reset()
}

export function trackEvent(event: string, properties?: Record<string, unknown>): void {
  if (!POSTHOG_KEY) return
  posthog.capture(event, properties)
}

// Predefined event helpers
export const analytics = {
  onboardingStepCompleted(step: number, answer: string) {
    trackEvent('onboarding_step_completed', { step, answer })
  },

  onboardingCompleted(totalTimeMs: number, stepsCompleted: number) {
    trackEvent('onboarding_completed', { total_time_ms: totalTimeMs, steps_completed: stepsCompleted })
  },

  paywallViewed(source: string) {
    trackEvent('paywall_viewed', { source })
  },

  paywallPlanSelected(tier: string, price: string) {
    trackEvent('paywall_plan_selected', { tier, price })
  },

  paywallConverted(tier: string, price: string, timeOnPaywallMs: number) {
    trackEvent('paywall_converted', { tier, price, time_on_paywall_ms: timeOnPaywallMs })
  },

  paywallDismissed(timeOnPaywallMs: number) {
    trackEvent('paywall_dismissed', { time_on_paywall_ms: timeOnPaywallMs })
  },

  documentUploaded(type: string, sizeBytes: number) {
    trackEvent('document_uploaded', { type, size_bytes: sizeBytes })
  },

  generationStarted(type: string) {
    trackEvent('generation_started', { type })
  },

  flashcardReviewed(difficulty: string, streak: number) {
    trackEvent('flashcard_reviewed', { difficulty, streak })
  },

  examCompleted(score: number, timeSpentSeconds: number) {
    trackEvent('exam_completed', { score, time_spent_seconds: timeSpentSeconds })
  },
}

export { posthog }
