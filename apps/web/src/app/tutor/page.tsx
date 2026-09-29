"use client"

import { Suspense } from "react"
import { BrainShell } from "@/components/brain/brain-shell"
import { ProtectedRoute } from "@/components/auth/protected-route"
import TutorPage from "@/components/tutor/tutor-page"

export default function Tutor() {
  return (
    <ProtectedRoute>
      {/* TutorPage renders BrainShell itself, rather than being wrapped in one
          here. The shell's right column has to be fed the chat-history list, and
          that list's state (sessions, the active id, the delete dialog) lives
          inside TutorPage — a parent cannot pass down what only the child knows.
          Same shape the dashboard already uses: DashboardPage → BrainHud →
          BrainShell.

          TutorPage reads ?docs / ?q via useSearchParams, which Next 15 requires
          to sit under a Suspense boundary. */}
      <Suspense fallback={null}>
        <TutorPage />
      </Suspense>
    </ProtectedRoute>
  )
}
