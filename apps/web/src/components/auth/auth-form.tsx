'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.27-4.74 3.27-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.05l3.66 2.84c.87-2.6 3.3-4.51 6.16-4.51Z"
      />
    </svg>
  )
}

/** Proof points on the left panel. Static copy — no request on the auth path. */
const STAGE_STATS = [
  { value: '2 min', label: 'Notes to flashcards' },
  { value: '10k+', label: 'Students studying' },
  { value: '4.8/5', label: 'Average rating' },
] as const

interface AuthFormProps {
  mode: 'login' | 'register'
  onSubmit: (email: string, password: string) => Promise<void>
  isLoading: boolean
  error: string | null
}

export function AuthForm({ mode, onSubmit, isLoading, error }: AuthFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)

  const isLogin = mode === 'login'

  const title = isLogin ? 'Welcome back' : 'Create an account'
  const description = isLogin
    ? 'Sign in to continue your learning journey'
    : 'Start your exam prep with Athora'
  const submitLabel = isLogin ? 'Sign in' : 'Create account'
  const switchText = isLogin
    ? "Don't have an account?"
    : 'Already have an account?'
  const switchHref = isLogin ? '/register' : '/login'
  const switchLabel = isLogin ? 'Sign up' : 'Sign in'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    await onSubmit(email, password)
  }

  return (
    <div className="auth-dark flex min-h-[calc(100svh_-_var(--consent-h))] w-full">
      {/* Left panel — aurora gradient mesh (hidden on mobile). Replaces the
          stock study-nook photo: on a #0e0e16 panel a photograph reads as a crop
          no matter how it is graded, and cost 78KB to say nothing. Three blurred
          blobs drifting on long offset cycles, so the field never repeats
          visibly. Pure CSS — no canvas, no JS, composited on the GPU. */}
      <div className="auth-aurora relative hidden w-1/2 border-r border-[#36364c] lg:block">
        <span className="auth-aurora-field" aria-hidden="true" />
        <span className="auth-aurora-field-2" aria-hidden="true" />
        <span className="auth-aurora-grain" aria-hidden="true" />
        <span className="auth-aurora-vignette" aria-hidden="true" />

        {/* Copy sits above every decorative layer. */}
        <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#9a9ab6]">
            Athora · Study Intelligence
          </p>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-[#ffab81]">
              Pass your exams faster
            </p>
            <p className="mt-5 max-w-md text-xl font-medium leading-relaxed text-[#f3f3fb]">
              &ldquo;Athora helped me pass my exams in half the study time.&rdquo;
            </p>
            <p className="mt-2.5 text-sm text-[#9a9ab6]">
              — Mai Anh, final-year medical student
            </p>

            <dl className="mt-9 grid max-w-md grid-cols-3 gap-3">
              {STAGE_STATS.map(({ value, label }) => (
                <div
                  key={label}
                  className="rounded-xl border border-[#ffffff14] bg-[#14141ecc] px-3.5 py-3 backdrop-blur-sm"
                >
                  <dt className="text-lg font-semibold tabular-nums text-[#f3f3fb]">
                    {value}
                  </dt>
                  <dd className="mt-0.5 text-[11px] leading-tight text-[#9a9ab6]">
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full items-center justify-center px-4 py-12 lg:w-1/2">
        <Card className="w-full max-w-sm border-0 shadow-none lg:border lg:shadow-sm">
          <CardHeader className="text-center">
            <Link href="/" className="mb-2 inline-flex items-center justify-center gap-2 hover:opacity-80 transition-opacity">
              {/* Inline mark rather than /images/logo.png: that file is violet,
                  and a violet tile sitting directly above the orange submit
                  button is the one tonal clash on an otherwise all-accent page.
                  Drawn here so it follows the accent token and needs no asset. */}
              <svg viewBox="0 0 32 32" className="size-8" role="img" aria-label="Athora">
                <defs>
                  <linearGradient id="athora-mark" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ff7a3c" />
                    <stop offset="100%" stopColor="#ff692d" />
                  </linearGradient>
                </defs>
                <rect width="32" height="32" rx="9" fill="url(#athora-mark)" />
                <path
                  d="M16 7.5 23 24h-3.6l-1.3-3.3h-4.2L12.6 24H9l7-16.5Zm0 5.6-1.4 4.4h2.8L16 13.1Z"
                  fill="#1a1400"
                />
              </svg>
              <span className="text-2xl font-bold tracking-tight text-foreground">Athora</span>
            </Link>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={isLoading}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  disabled={isLoading}
                />
                {!isLogin && (
                  <p className="text-xs text-muted-foreground">
                    Minimum 8 characters
                  </p>
                )}
                {isLogin && (
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary hover:underline self-end"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>

              {!isLogin && (
                <div className="flex items-start gap-2">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 shrink-0 appearance-none rounded border border-[#36364c] bg-[#14141e]"
                    required
                    disabled={isLoading}
                  />
                  <label htmlFor="terms" className="text-sm text-muted-foreground leading-snug">
                    I agree to the{' '}
                    <Link href="/terms" className="text-primary underline hover:no-underline">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-primary underline hover:no-underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="mt-2 w-full"
                // Marks the busy state apart from the unavailable one — both are
                // `disabled`, but only this one keeps the accent. See .auth-dark
                // button[data-loading] in globals.css.
                data-loading={isLoading || undefined}
                disabled={isLoading || (!isLogin && !termsAccepted)}
              >
                {isLoading && <Loader2 className="animate-spin" />}
                {submitLabel}
              </Button>
            </form>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              disabled={isLoading}
              onClick={() => {
                const apiUrl =
                  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'
                window.location.href = `${apiUrl}/auth/google`
              }}
            >
              <GoogleIcon />
              Continue with Google
            </Button>
          </CardContent>

          <CardFooter className="justify-center gap-1 text-sm text-muted-foreground">
            {switchText}
            <Link
              href={switchHref}
              className="font-medium text-primary hover:underline"
            >
              {switchLabel}
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
