'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function CtaForm() {
  const [ctaEmail, setCtaEmail] = useState('')

  return (
    <form
      className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center max-w-md"
      action="/register"
      method="GET"
    >
      <Input
        type="email"
        name="email"
        placeholder="you@university.edu"
        value={ctaEmail}
        onChange={(e) => setCtaEmail(e.target.value)}
        aria-label="Email address"
        className="h-12 flex-1 border-stone-700 bg-stone-800 text-white placeholder:text-stone-500 focus-visible:ring-amber-500 rounded-xl"
      />
      <Button type="submit" className="h-12 bg-amber-600 text-white px-6 font-semibold rounded-full whitespace-nowrap hover:bg-amber-700 hover:scale-105 transition-all shadow-lg shadow-amber-600/20">
        Get started
      </Button>
    </form>
  )
}
