'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/layout/admin-layout'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { apiClient } from '@/lib/api'

export default function SubscriptionsPage() {
  const [data, setData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoading(true)
    apiClient.get<any>(`/admin/billing/subscriptions?page=${page}&limit=20`)
      .then((res) => { setData(res.data); setTotalPages(res.totalPages) })
      .catch((e) => setError(e?.message ?? 'Failed to load'))
      .finally(() => setIsLoading(false))
  }, [page])

  const columns = [
    { key: 'user', header: 'User', render: (d: any) => <span className="text-sm">{d.profiles?.email ?? '—'}</span> },
    { key: 'plan', header: 'Plan', render: (d: any) => <Badge>{d.plans?.name ?? '—'}</Badge> },
    { key: 'status', header: 'Status', render: (d: any) => <Badge variant={d.status === 'active' ? 'success' : d.status === 'canceled' ? 'destructive' : 'warning'}>{d.status}</Badge> },
    { key: 'period', header: 'Period End', render: (d: any) => <span className="text-xs text-zinc-500">{d.current_period_end ? new Date(d.current_period_end).toLocaleDateString() : '—'}</span> },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Subscriptions</h1>
        {error && <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}
        <DataTable columns={columns} data={data} isLoading={isLoading} page={page} totalPages={totalPages} onPageChange={setPage} emptyMessage="No subscriptions" />
      </div>
    </AdminLayout>
  )
}
