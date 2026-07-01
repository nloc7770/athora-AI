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
      className="fixed bottom-4 right-4 left-4 z-50 border border-white/[0.15] bg-zinc-900/95 backdrop-blur-md p-4 shadow-2xl rounded-xl md:left-auto md:max-w-sm"
    >
      <p className="text-sm text-white/70 leading-relaxed">
        We use essential cookies for authentication and optional analytics cookies to improve
        Athora. See our{' '}
        <Link href="/privacy" className="text-[#8052ff] underline hover:text-[#9b72ff]">
          Privacy Policy
        </Link>{' '}
        for details.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <Button
          size="sm"
          onClick={accept}
          className="bg-[#8052ff] text-white hover:bg-[#6b3fe6] rounded-lg"
        >
          Accept all
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={decline}
          className="rounded-lg border-white/[0.2] text-white/70 hover:bg-white/[0.06] hover:text-white bg-transparent"
        >
          Essential only
        </Button>
      </div>
    </div>
  )
}
