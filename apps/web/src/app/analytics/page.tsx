"use client"

import { BrainShell } from "@/components/brain/brain-shell"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AnalyticsPage } from "@/components/analytics/analytics-page"

export default function Analytics() {
  return (
    <ProtectedRoute>
      <BrainShell>
        <AnalyticsPage />
      </BrainShell>
    </ProtectedRoute>
  )
}
