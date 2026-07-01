'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api'

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiClient.get<any[]>('/admin/system/feature-flags')
      .then(setFlags)
      .catch(() => setError('Failed to load feature flags'))
      .finally(() => setIsLoading(false))
  }, [])

  async function toggleFlag(id: string, current: boolean) {
    const prevFlags = [...flags]
    setFlags(flags.map((f) => f.id === id ? { ...f, is_enabled: !current } : f))
    setError(null)
    try {
      await apiClient.patch(`/admin/system/feature-flags/${id}`, { is_enabled: !current })
    } catch {
      setFlags(prevFlags)
      setError('Failed to update feature flag')
    }
  }

  const columns = [
    { key: 'key', header: 'Key', render: (d: any) => <span className="text-sm font-mono">{d.key}</span> },
    { key: 'description', header: 'Description', render: (d: any) => <span className="text-xs text-zinc-500">{d.description ?? '—'}</span> },
    { key: 'rollout', header: 'Rollout', render: (d: any) => <span className="text-xs">{d.rollout_percentage}%</span> },
    { key: 'status', header: 'Status', render: (d: any) => (
      <button onClick={() => toggleFlag(d.id, d.is_enabled)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${d.is_enabled ? 'bg-emerald-500' : 'bg-zinc-300'}`}>
        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${d.is_enabled ? 'translate-x-5' : 'translate-x-1'}`} />
      </button>
    )},
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Feature Flags</h1>
        {error && (
          <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <DataTable columns={columns} data={flags} isLoading={isLoading} emptyMessage="No feature flags" />
      </div>
    </AdminLayout>
  )
}
