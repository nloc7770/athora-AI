'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

import { apiClient } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'

/**
 * Landing point for Supabase's OAuth redirect. Supabase uses the implicit flow
 * here, so the tokens arrive in the URL fragment (never sent to any server).
 * We hand the refresh token to /auth/refresh, which is what sets the httpOnly
 * cookies the rest of the app authenticates with.
 */
export default function AuthCallbackPage() {
  const router = useRouter()
  const initialize = useAuthStore((s) => s.initialize)
  const [error, setError] = useState<string | null>(null)
  const started = useRef(false)

  useEffect(() => {
    // Strict Mode double-invokes effects; the token is single-use
    if (started.current) return
    started.current = true

    const hash = new URLSearchParams(window.location.hash.slice(1))
    const query = new URLSearchParams(window.location.search)
    const refreshToken = hash.get('refresh_token')

    // Drop the tokens from the URL before anything can log or leak them
    window.history.replaceState(null, '', window.location.pathname)

    if (!refreshToken) {
      setError(
        hash.get('error_description') ??
          query.get('error_description') ??
          'Sign-in was cancelled or failed.',
      )
      return
    }

    apiClient
      .post('/auth/refresh', { refresh_token: refreshToken })
      .then(() => initialize())
      .then(() => router.replace('/dashboard'))
      .catch(() => setError('Could not complete sign-in. Please try again.'))
  }, [initialize, router])

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
      {error ? (
        <>
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
          <Link href="/login" className="text-sm font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </>
      ) : (
        <>
          <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Signing you in…</p>
        </>
      )}
    </div>
  )
}
