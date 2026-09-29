'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'

export function NavAuthSection() {
  const { user, isAuthenticated } = useAuthStore()

  if (isAuthenticated) {
    return (
      <Link href="/dashboard" className="flex items-center gap-2 rounded-full border border-[#ffffff14] py-1 pl-1 pr-3 hover:bg-[#181822] transition-colors">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ff7a3c] text-[11px] font-semibold text-[#1a1400]">
          {(user?.name ?? user?.email)?.[0]?.toUpperCase() ?? 'U'}
        </div>
        <span className="text-sm font-medium text-[#f3f3fb]">{user?.name ?? user?.email?.split('@')[0]}</span>
      </Link>
    )
  }

  return (
    <>
      <Link href="/login" className="text-sm text-[#9a9ab6] hover:text-[#f3f3fb] transition-colors font-medium tracking-[0.021em]">Log in</Link>
      <Link href="/register">
        <Button size="sm" className="bg-[#ff7a3c] text-[#1a1400] hover:bg-[#ff9256] rounded-full px-5 text-xs font-semibold uppercase tracking-[0.05em]">
          Get Started <ArrowRight className="ml-1 h-3.5 w-3.5" />
        </Button>
      </Link>
    </>
  )
}

export function MobileNavAuthSection() {
  const { user, isAuthenticated } = useAuthStore()

  if (isAuthenticated) {
    return (
      <Link href="/dashboard" className="flex items-center gap-2 text-sm font-medium text-[#f3f3fb]">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#ff7a3c] text-[10px] font-semibold text-[#1a1400]">
          {(user?.name ?? user?.email)?.[0]?.toUpperCase() ?? 'U'}
        </div>
        Go to Dashboard
      </Link>
    )
  }

  return (
    <>
      <Link href="/login" className="text-sm text-[#c0c0da] font-medium">Log in</Link>
      <Link href="/register">
        <Button size="sm" className="flex-1 bg-[#ff7a3c] text-[#1a1400] rounded-full text-xs font-semibold uppercase tracking-[0.05em]">Get Started</Button>
      </Link>
    </>
  )
}
