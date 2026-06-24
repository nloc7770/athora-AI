'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { useAuthStore } from '@/stores/auth-store'
import { AuthForm } from '@/components/auth/auth-form'

export default function RegisterPage() {
  const router = useRouter()
  const { register } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleRegister(email: string, password: string) {
    setError(null)
    setSubmitting(true)

    try {
      await register(email, password)
      router.push('/dashboard')
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
      mode="register"
      onSubmit={handleRegister}
      isLoading={submitting}
      error={error}
    />
  )
}
