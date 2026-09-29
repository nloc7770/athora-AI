"use client"

import { BrainShell } from "@/components/brain/brain-shell"
import { ProtectedRoute } from "@/components/auth/protected-route"
import ExamPage from "@/components/exam/exam-page"

export default function Exam() {
  return (
    <ProtectedRoute>
      <BrainShell>
        <ExamPage />
      </BrainShell>
    </ProtectedRoute>
  )
}
