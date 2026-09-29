"use client"

import { BrainShell } from "@/components/brain/brain-shell"
import { ProtectedRoute } from "@/components/auth/protected-route"
import FlashcardsPage from "@/components/flashcards/flashcards-page"

export default function Flashcards() {
  return (
    <ProtectedRoute>
      <BrainShell>
        <FlashcardsPage />
      </BrainShell>
    </ProtectedRoute>
  )
}
