"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ProtectedRoute } from "@/components/auth/protected-route"

export default function Dashboard() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/sessions')
  }, [router])

  return (
    <ProtectedRoute>
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-400">Redirecting...</p>
      </div>
    </ProtectedRoute>
  )
}
