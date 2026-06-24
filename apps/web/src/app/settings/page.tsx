"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { useAuthStore } from "@/stores/auth-store"
import { Settings } from "lucide-react"

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <SettingsContent />
      </AppLayout>
    </ProtectedRoute>
  )
}

function SettingsContent() {
  const { user } = useAuthStore()

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100">
          <Settings className="h-5 w-5 text-zinc-600" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Settings</h1>
          <p className="text-sm text-zinc-500">Manage your account preferences</p>
        </div>
      </div>

      {/* Profile section */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-sm font-medium text-zinc-900">Profile</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-sm font-medium text-white">
              {user?.email?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-zinc-900">
                {user?.name ?? 'Student'}
              </p>
              <p className="truncate text-sm text-zinc-500">
                {user?.email ?? '—'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Placeholder for future settings */}
      <section className="mt-6 rounded-xl border border-dashed border-zinc-200 p-6">
        <p className="text-center text-sm text-zinc-400">
          More settings coming soon — notifications, study preferences, and integrations.
        </p>
      </section>
    </div>
  )
}
