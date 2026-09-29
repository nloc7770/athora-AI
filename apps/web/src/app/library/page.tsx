"use client"

import { BrainShell } from "@/components/brain/brain-shell"
import { ProtectedRoute } from "@/components/auth/protected-route"
import LibraryPage from "@/components/documents/library-page"

export default function Library() {
  return (
    <ProtectedRoute>
      <BrainShell>
        <LibraryPage />
      </BrainShell>
    </ProtectedRoute>
  )
}
