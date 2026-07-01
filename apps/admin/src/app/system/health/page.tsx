'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Activity } from 'lucide-react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { apiClient } from '@/lib/api'

interface HealthStatus {
  api: boolean
  database: boolean
  redis: boolean
  timestamp: string
}

export default function HealthPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null)

  useEffect(() => {
    apiClient.get<HealthStatus>('/admin/system/health')
      .then(setHealth)
      .catch(() => {})
  }, [])

  const services = health ? [
    { name: 'API Server', ok: health.api },
    { name: 'Database (Supabase)', ok: health.database },
    { name: 'Redis (Queue)', ok: health.redis },
  ] : []

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-zinc-900">System Health</h1>
        <div className="grid gap-3 max-w-lg">
          {!health ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center text-sm text-zinc-400">
              Loading...
            </div>
          ) : (
            services.map((s) => (
              <div key={s.name} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4">
                <div className="flex items-center gap-3">
                  <Activity className="h-4 w-4 text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-700">{s.name}</span>
                </div>
                {s.ok ? (
                  <div className="flex items-center gap-1.5 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-xs font-medium">Healthy</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">Down</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        {health && (
          <p className="text-xs text-zinc-400">Last checked: {new Date(health.timestamp).toLocaleString()}</p>
        )}
      </div>
    </AdminLayout>
  )
}
