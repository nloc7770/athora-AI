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
import { apiClient } from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await apiClient.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center px-4 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mb-2 text-2xl font-bold tracking-tight text-foreground">
            Athora
          </div>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>
            {sent
              ? 'Check your email for a reset link'
              : "Enter your email and we'll send you a reset link"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {sent ? (
            <p className="text-center text-sm text-muted-foreground">
              If an account exists for <strong>{email}</strong>, you will
              receive a password reset email shortly.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
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
                  disabled={submitting}
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="mt-2 w-full"
                disabled={submitting}
              >
                {submitting && <Loader2 className="animate-spin" />}
                Send reset link
              </Button>
            </form>
          )}
        </CardContent>

        <CardFooter className="justify-center gap-1 text-sm text-muted-foreground">
          Remember your password?
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
