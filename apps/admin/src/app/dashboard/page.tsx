'use client'

import { useState, useEffect } from 'react'
import { Users, FileText, Brain, Layers, Activity } from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { StatCard } from '@/components/ui/stat-card'
import { apiClient } from '@/lib/api'

interface DashboardOverview {
  totalUsers: number
  totalDocuments: number
  totalSessions: number
  totalGenerations: number
  activeToday: number
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardOverview | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiClient.get<DashboardOverview>('/admin/dashboard/overview')
      .then(setData)
      .catch((e) => setError(e?.message ?? 'Failed to load dashboard data'))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-1">Overview of your platform</p>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard
            title="Total Users"
            value={isLoading ? '—' : data?.totalUsers ?? 0}
            icon={Users}
            description="Registered accounts"
          />
          <StatCard
            title="Active Today"
            value={isLoading ? '—' : data?.activeToday ?? 0}
            icon={Activity}
            description="Users online today"
          />
          <StatCard
            title="Documents"
            value={isLoading ? '—' : data?.totalDocuments ?? 0}
            icon={FileText}
            description="Uploaded files"
          />
          <StatCard
            title="Study Sessions"
            value={isLoading ? '—' : data?.totalSessions ?? 0}
            icon={Layers}
            description="Created sessions"
          />
          <StatCard
            title="AI Generations"
            value={isLoading ? '—' : data?.totalGenerations ?? 0}
            icon={Brain}
            description="Summary, exam, flashcards, mindmap"
          />
        </div>

        {/* Placeholder for charts */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-zinc-700 mb-4">User Growth</h3>
            <div className="flex h-48 items-center justify-center text-zinc-300 text-sm">
              Chart coming soon
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-zinc-700 mb-4">AI Usage</h3>
            <div className="flex h-48 items-center justify-center text-zinc-300 text-sm">
              Chart coming soon
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
