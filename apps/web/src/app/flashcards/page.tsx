"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import FlashcardsPage from "@/components/flashcards/flashcards-page"

export default function Flashcards() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <FlashcardsPage />
      </AppLayout>
    </ProtectedRoute>
  )
}
