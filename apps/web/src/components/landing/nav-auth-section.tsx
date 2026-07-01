'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/auth-store'

export function NavAuthSection() {
  const { user, isAuthenticated } = useAuthStore()

  if (isAuthenticated) {
    return (
      <Link href="/dashboard" className="flex items-center gap-2 rounded-full border border-white/[0.1] py-1 pl-1 pr-3 hover:bg-white/[0.05] transition-colors">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#8052ff] text-[11px] font-semibold text-white">
          {(user?.name ?? user?.email)?.[0]?.toUpperCase() ?? 'U'}
        </div>
        <span className="text-sm font-medium text-white">{user?.name ?? user?.email?.split('@')[0]}</span>
      </Link>
    )
  }

  return (
    <>
      <Link href="/login" className="text-sm text-[#9a9a9a] hover:text-white transition-colors font-medium tracking-[0.021em]">Log in</Link>
      <Link href="/register">
        <Button size="sm" className="bg-[#8052ff] text-white hover:bg-[#6b3fe6] rounded-full px-5 text-xs font-semibold uppercase tracking-[0.05em]">
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
      <Link href="/dashboard" className="flex items-center gap-2 text-sm font-medium text-white">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#8052ff] text-[10px] font-semibold text-white">
          {(user?.name ?? user?.email)?.[0]?.toUpperCase() ?? 'U'}
        </div>
        Go to Dashboard
      </Link>
    )
  }

  return (
    <>
      <Link href="/login" className="text-sm text-[#bdbdbd] font-medium">Log in</Link>
      <Link href="/register">
        <Button size="sm" className="flex-1 bg-[#8052ff] text-white rounded-full text-xs font-semibold uppercase tracking-[0.05em]">Get Started</Button>
      </Link>
    </>
  )
}
