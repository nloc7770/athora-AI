"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import LibraryPage from "@/components/documents/library-page"

export default function Library() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <LibraryPage />
      </AppLayout>
    </ProtectedRoute>
  )
}
