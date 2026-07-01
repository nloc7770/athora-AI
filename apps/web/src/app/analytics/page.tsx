"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { AnalyticsPage } from "@/components/analytics/analytics-page"

export default function Analytics() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <AnalyticsPage />
      </AppLayout>
    </ProtectedRoute>
  )
}
