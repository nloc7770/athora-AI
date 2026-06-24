"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import ExamPage from "@/components/exam/exam-page"

export default function Exam() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <ExamPage />
      </AppLayout>
    </ProtectedRoute>
  )
}
