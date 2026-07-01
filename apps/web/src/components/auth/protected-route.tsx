'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'

import { useAuthStore } from '@/stores/auth-store'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const search = typeof window !== 'undefined' ? window.location.search : ''
      const currentPath = pathname + search
      const returnTo = encodeURIComponent(currentPath)
      router.replace(`/login?returnTo=${returnTo}`)
    }
  }, [isLoading, isAuthenticated, router, pathname])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-svh w-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    )
  }

  return <>{children}</>
}
