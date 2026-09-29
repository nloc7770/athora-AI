"use client"

import { ProtectedRoute } from "@/components/auth/protected-route"
import DashboardPage from "@/components/dashboard/dashboard-page"

/**
 * The dashboard IS the brain HUD, full-screen — so it deliberately does not
 * wrap in AppLayout. Everything AppLayout used to provide for this route now
 * lives inside the HUD: navigation (its own rail, a bottom dock on mobile),
 * the account menu and sign-out (HUD top bar), and the notification bell.
 * Notably NOT lost this time — an earlier attempt at this dropped them.
 */
export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardPage />
    </ProtectedRoute>
  )
}
