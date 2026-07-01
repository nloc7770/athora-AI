'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { useAuthStore } from '@/stores/auth-store'
import { AuthForm } from '@/components/auth/auth-form'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleLogin(email: string, password: string) {
    setError(null)
    setSubmitting(true)

    try {
      await login(email, password)
      const params = new URLSearchParams(window.location.search)
      const returnTo = params.get('returnTo')
      router.push(returnTo ? decodeURIComponent(returnTo) : '/dashboard')
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
    <AuthForm
      mode="login"
      onSubmit={handleLogin}
      isLoading={submitting}
      error={error}
    />
  )
}
