'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { initPostHog, trackEvent } from '@/lib/posthog'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Idempotent; re-checked per navigation so consent given mid-session applies.
    initPostHog()

    if (pathname) {
      let url = window.origin + pathname
      if (searchParams.toString()) {
        url = url + '?' + searchParams.toString()
      }
      // No-op until posthog has loaded; the first page is covered by
      // capture_pageview in init, so it is not counted twice.
      trackEvent('$pageview', { $current_url: url })
    }
  }, [pathname, searchParams])

  return <>{children}</>
}
