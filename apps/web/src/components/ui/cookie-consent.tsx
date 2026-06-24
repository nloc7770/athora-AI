'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const COOKIE_CONSENT_KEY = 'athora-cookie-consent'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!consent) {
      setVisible(true)
    }
  }, [])

  function accept() {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted')
    setVisible(false)
  }

  function decline() {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'declined')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200 bg-white p-4 shadow-lg md:bottom-4 md:left-4 md:right-auto md:max-w-sm md:rounded-xl md:border"
    >
      <p className="text-sm text-stone-600 leading-relaxed">
        We use essential cookies for authentication and optional analytics cookies to improve
        Athora. See our{' '}
        <Link href="/privacy" className="text-amber-700 underline hover:text-amber-900">
          Privacy Policy
        </Link>{' '}
        for details.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <Button
          size="sm"
          onClick={accept}
          className="bg-amber-600 text-white hover:bg-amber-700 rounded-lg"
        >
          Accept all
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={decline}
          className="rounded-lg"
        >
          Essential only
        </Button>
      </div>
    </div>
  )
}
