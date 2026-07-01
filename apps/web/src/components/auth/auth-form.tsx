'use client'

import { useState } from 'react'
import Image from 'next/image'
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
    <div className="flex min-h-svh w-full">
      {/* Left panel — illustration (hidden on mobile) */}
      <div className="relative hidden w-1/2 lg:block">
        <Image
          src="/images/auth/auth-study-nook.webp"
          alt=""
          fill
          className="object-cover"
          priority
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-12 left-8 right-8 text-white">
          <p className="text-lg font-medium leading-relaxed">
            &ldquo;Athora helped me pass my exams in half the study time.&rdquo;
          </p>
          <p className="mt-2 text-sm text-white/70">— 10,000+ students worldwide</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full items-center justify-center px-4 py-12 lg:w-1/2">
        <Card className="w-full max-w-sm border-0 shadow-none lg:border lg:shadow-sm">
          <CardHeader className="text-center">
            <Link href="/" className="mb-2 inline-flex items-center justify-center gap-2 hover:opacity-80 transition-opacity">
              <img src="/images/logo.png" alt="Athora" className="h-8 w-8 rounded-lg" />
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
                    className="mt-1 h-4 w-4 rounded border-stone-300 text-primary focus:ring-primary"
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
                disabled={isLoading || (!isLogin && !termsAccepted)}
              >
                {isLoading && <Loader2 className="animate-spin" />}
                {submitLabel}
              </Button>
            </form>
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
