import type { PostHog } from 'posthog-js'

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY ?? ''
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'

// Mirrors COOKIE_CONSENT_KEY in components/ui/cookie-consent.tsx. Analytics
// cookies are optional, so nothing loads until the user picks "Accept all".
const COOKIE_CONSENT_KEY = 'athora-cookie-consent'

let client: PostHog | null = null
let started = false

function hasConsent(): boolean {
  try {
    return localStorage.getItem(COOKIE_CONSENT_KEY) === 'accepted'
  } catch {
    return false
  }
}

/**
 * Loads posthog-js off the critical path: its chunk is fetched with a dynamic
 * import once the browser is idle, and only after analytics consent. Safe to
 * call repeatedly — the provider calls it on every navigation so a consent
 * given mid-session starts analytics without a reload.
 */
export function initPostHog(): void {
  if (typeof window === 'undefined' || !POSTHOG_KEY || started || !hasConsent()) return
  started = true

  const load = () => {
    import('posthog-js')
      .then(({ default: posthog }) => {
        posthog.init(POSTHOG_KEY, {
          api_host: POSTHOG_HOST,
          person_profiles: 'identified_only',
          capture_pageview: true,
          capture_pageleave: true,
          autocapture: false,
          persistence: 'localStorage+cookie',
        })
        client = posthog
      })
      // Blocked by an ad blocker or a flaky network: let the next call retry.
      .catch(() => {
        started = false
      })
  }

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(load, { timeout: 5000 })
  } else {
    setTimeout(load, 1)
  }
}

// Calls made before posthog has loaded are dropped, same as when no key is set.
export function identifyUser(userId: string, properties?: Record<string, unknown>): void {
  client?.identify(userId, properties)
}

export function resetUser(): void {
  client?.reset()
}

export function trackEvent(event: string, properties?: Record<string, unknown>): void {
  client?.capture(event, properties)
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
