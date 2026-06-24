"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import TutorPage from "@/components/tutor/tutor-page"

export default function Tutor() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <TutorPage />
      </AppLayout>
    </ProtectedRoute>
  )
}
