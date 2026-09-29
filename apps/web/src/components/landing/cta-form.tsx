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
        className="h-12 flex-1 border-[#36364c] bg-[#181822] text-[#f3f3fb] placeholder:text-[#9a9ab6] focus-visible:ring-[#ff7a3c] rounded-xl"
      />
      <Button type="submit" className="h-12 bg-[#ff7a3c] text-[#1a1400] px-6 font-semibold rounded-full whitespace-nowrap hover:bg-[#ff9256] hover:scale-105 transition-all shadow-lg shadow-[#ff7a3c]/20">
        Get started
      </Button>
    </form>
  )
}
