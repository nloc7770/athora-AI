'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const COOKIE_CONSENT_KEY = 'athora-cookie-consent'

/**
 * Consent bar, docked to the bottom edge of the viewport.
 *
 * It publishes its own height as `--consent-h` on <html> while it is visible.
 * Every surface that pins itself to the bottom edge subtracts that height
 * (see globals.css) instead of being covered: the bar takes a strip of the
 * page rather than sitting on top of the bottom navigation, the brain rail or
 * whatever CTA lives down there.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!consent) {
      setVisible(true)
    }
  }, [])

  // The height depends on how the copy wraps, so it has to be measured.
  useEffect(() => {
    const el = ref.current
    if (!visible || !el) return

    const root = document.documentElement
    const publish = () =>
      root.style.setProperty('--consent-h', `${el.offsetHeight}px`)
    publish()
    const observer = new ResizeObserver(publish)
    observer.observe(el)

    return () => {
      observer.disconnect()
      root.style.removeProperty('--consent-h')
    }
  }, [visible])

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
      ref={ref}
      role="dialog"
      aria-label="Cookie consent"
      // Surfaces and accent come from the brain theme (--br-*): this bar sits on
      // top of every page, and the app is dark + orange now, so a zinc bar with a
      // purple CTA read as a leftover from the old light/purple brand.
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#36364c] bg-[#181822]/95 backdrop-blur-md px-4 py-4 shadow-2xl sm:px-6"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p className="text-sm text-white/70 leading-relaxed">
          We use essential cookies for authentication and optional analytics cookies to improve
          Nrop-on. See our{' '}
          <Link href="/privacy" className="text-[#ffab81] underline hover:text-[#ffc9ab]">
            Privacy Policy
          </Link>{' '}
          for details.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button
            size="sm"
            onClick={accept}
            className="bg-[#ff7a3c] text-[#1a1400] hover:bg-[#ff8f5a] rounded-lg"
          >
            Accept all
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={decline}
            className="rounded-lg border-[#36364c] text-[#c0c0da] hover:bg-white/[0.06] hover:text-[#f3f3fb] bg-transparent"
          >
            Essential only
          </Button>
        </div>
      </div>
    </div>
  )
}
