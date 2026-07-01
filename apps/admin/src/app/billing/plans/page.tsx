'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/api'

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiClient.get<any[]>('/admin/billing/plans')
      .then(setPlans)
      .catch((e) => setError(e?.message ?? 'Failed to load'))
      .finally(() => setIsLoading(false))
  }, [])

  const columns = [
    { key: 'name', header: 'Plan', render: (d: any) => <span className="text-sm font-semibold capitalize">{d.name}</span> },
    { key: 'price', header: 'Price/mo', render: (d: any) => <span className="text-sm">${d.price_monthly}</span> },
    { key: 'credits', header: 'Credits/mo', render: (d: any) => <span className="text-sm font-medium">{d.credits_monthly}</span> },
    { key: 'storage', header: 'Storage', render: (d: any) => <span className="text-xs text-zinc-500">{d.storage_limit_mb} MB</span> },
    { key: 'docs', header: 'Max Docs', render: (d: any) => <span className="text-xs">{d.max_documents === -1 ? 'Unlimited' : d.max_documents}</span> },
    { key: 'status', header: 'Status', render: (d: any) => <Badge variant={d.is_active ? 'success' : 'secondary'}>{d.is_active ? 'Active' : 'Inactive'}</Badge> },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900">Plans</h1>
        </div>
        {error && <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}
        <DataTable columns={columns} data={plans} isLoading={isLoading} emptyMessage="No plans configured" />
      </div>
    </AdminLayout>
  )
}
